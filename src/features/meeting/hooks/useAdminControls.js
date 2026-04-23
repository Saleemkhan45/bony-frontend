import { useCallback, useEffect, useRef, useState } from 'react';
import { MEETING_SOCKET_EVENTS } from '../services/meetingSocketEvents';
import {
  admitMeetingParticipant,
  demoteMeetingParticipant,
  denyMeetingParticipant,
  promoteMeetingParticipant,
  updateMeetingRoomSettings,
} from '../services/roomApi';
import {
  startMeetingRoomRecordingSession,
  stopMeetingRoomRecordingSession,
} from '../services/recordingApi';

const ACTION_NAMES = Object.freeze({
  ADMIT_PARTICIPANT: 'admit-participant',
  CAMERA_OFF_ALL: 'camera-off-all',
  CAMERA_OFF_PARTICIPANT: 'camera-off-participant',
  CLEAR_SPOTLIGHT: 'clear-spotlight',
  DENY_PARTICIPANT: 'deny-participant',
  KICK_PARTICIPANT: 'kick-participant',
  LOWER_ALL_HANDS: 'lower-all-hands',
  LOWER_PARTICIPANT_HAND: 'lower-participant-hand',
  MAKE_COHOST: 'make-cohost',
  MUTE_ALL: 'mute-all',
  MUTE_PARTICIPANT: 'mute-participant',
  REMOVE_COHOST: 'remove-cohost',
  SPOTLIGHT_PARTICIPANT: 'spotlight-participant',
  START_ROOM_RECORDING: 'start-room-recording',
  STOP_ROOM_RECORDING: 'stop-room-recording',
  UPDATE_ROOM_PERMISSION: 'update-room-permission',
});

function buildActionPendingKey(actionName, targetUserId = null) {
  const normalizedActionName = String(actionName ?? '').trim() || 'unknown-action';
  const normalizedTarget = String(targetUserId ?? '').trim();

  return normalizedTarget
    ? `${normalizedActionName}:${normalizedTarget}`
    : normalizedActionName;
}

function useAdminControls({
  appendSystemMessage,
  currentRole = 'participant',
  currentUserId,
  onRefreshRoomData,
  participants,
  roomId,
  roomSettings = null,
  socketRef,
}) {
  const participantsRef = useRef(participants);
  const [pendingActionsByKey, setPendingActionsByKey] = useState({});

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  const isHost = currentRole === 'host';
  const isModerator = currentRole === 'host' || currentRole === 'cohost';

  const setActionPending = useCallback((actionName, targetUserId, isPending) => {
    const pendingKey = buildActionPendingKey(actionName, targetUserId);

    setPendingActionsByKey((currentValue) => {
      if (isPending) {
        if (currentValue[pendingKey]) {
          return currentValue;
        }

        return {
          ...currentValue,
          [pendingKey]: true,
        };
      }

      if (!currentValue[pendingKey]) {
        return currentValue;
      }

      const { [pendingKey]: _removed, ...nextValue } = currentValue;
      return nextValue;
    });
  }, []);

  const runActionWithPending = useCallback(
    async ({
      actionName,
      minimumMs = 260,
      onErrorMessage = 'Unable to complete this moderator action right now.',
      targetUserId = null,
      task,
    }) => {
      const startedAtMs = Date.now();
      setActionPending(actionName, targetUserId, true);

      try {
        return await task();
      } catch (error) {
        appendSystemMessage(error?.message || onErrorMessage);
        return false;
      } finally {
        const elapsedMs = Date.now() - startedAtMs;
        const remainingMs = Math.max(0, minimumMs - elapsedMs);

        if (remainingMs > 0) {
          await new Promise((resolve) => {
            window.setTimeout(resolve, remainingMs);
          });
        }

        setActionPending(actionName, targetUserId, false);
      }
    },
    [appendSystemMessage, setActionPending],
  );

  const isActionPending = useCallback(
    (actionName, targetUserId = null) =>
      Boolean(pendingActionsByKey[buildActionPendingKey(actionName, targetUserId)]),
    [pendingActionsByKey],
  );

  function ensureModeratorAccess() {
    if (isModerator) {
      return true;
    }

    appendSystemMessage('Only the host or a co-host can use moderation controls.');
    return false;
  }

  function ensureHostAccess() {
    if (isHost) {
      return true;
    }

    appendSystemMessage('Only the host can change co-host access.');
    return false;
  }

  function getTargetParticipant(targetUserId) {
    return participantsRef.current.find((participant) => participant.userId === targetUserId) ?? null;
  }

  function emitHostAction(eventName, payload) {
    socketRef.current?.emit(eventName, payload);
  }

  function muteParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipant = getTargetParticipant(targetUserId);

    if (!targetParticipant || targetParticipant.isHost || targetParticipant.userId === currentUserId) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.MUTE_PARTICIPANT,
      targetUserId,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.ADMIN_FORCE_MUTE, {
          roomId,
          targetUserId,
          actorUserId: currentUserId,
        });

        appendSystemMessage(`Sent a mute request to ${targetParticipant.userName}.`);
        return true;
      },
    });
  }

  function cameraOffParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipant = getTargetParticipant(targetUserId);

    if (!targetParticipant || targetParticipant.isHost || targetParticipant.userId === currentUserId) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.CAMERA_OFF_PARTICIPANT,
      targetUserId,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.ADMIN_FORCE_CAMERA_OFF, {
          roomId,
          targetUserId,
          actorUserId: currentUserId,
        });

        appendSystemMessage(`Sent a camera-off request to ${targetParticipant.userName}.`);
        return true;
      },
    });
  }

  function muteAllParticipants() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipants = participantsRef.current.filter(
      (participant) => !participant.isHost && participant.userId !== currentUserId,
    );

    if (targetParticipants.length === 0) {
      appendSystemMessage('There are no participant microphones left to mute.');
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.MUTE_ALL,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.ADMIN_MUTE_ALL, {
          roomId,
          actorUserId: currentUserId,
        });

        appendSystemMessage('Sent a mute-all request to the room.');
        return true;
      },
    });
  }

  function cameraOffAllParticipants() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipants = participantsRef.current.filter(
      (participant) => !participant.isHost && participant.userId !== currentUserId,
    );

    if (targetParticipants.length === 0) {
      appendSystemMessage('There are no participant cameras left to stop.');
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.CAMERA_OFF_ALL,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.ADMIN_CAMERA_OFF_ALL, {
          roomId,
          actorUserId: currentUserId,
        });

        appendSystemMessage('Sent a camera-off-all request to the room.');
        return true;
      },
    });
  }

  function kickParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipant = getTargetParticipant(targetUserId);

    if (!targetParticipant || targetParticipant.isHost || targetParticipant.userId === currentUserId) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.KICK_PARTICIPANT,
      targetUserId,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.KICK_USER, {
          roomId,
          targetUserId,
          actorUserId: currentUserId,
          message: `${targetParticipant.userName} was removed by a moderator.`,
        });

        appendSystemMessage(`Sent a removal request for ${targetParticipant.userName}.`);
        return true;
      },
    });
  }

  function lowerParticipantHand(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipant = getTargetParticipant(targetUserId);

    if (!targetParticipant || !targetParticipant.handRaised || targetParticipant.userId === currentUserId) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.LOWER_PARTICIPANT_HAND,
      targetUserId,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.LOWER_HAND_FOR_USER, {
          roomId,
          actorUserId: currentUserId,
          targetUserId,
        });

        appendSystemMessage(`Lowered ${targetParticipant.userName}'s hand from the host queue.`);
        return true;
      },
    });
  }

  function lowerAllHands() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const raisedHands = participantsRef.current.filter(
      (participant) => participant.handRaised && participant.userId !== currentUserId,
    );

    if (raisedHands.length === 0) {
      appendSystemMessage('There are no raised hands to clear right now.');
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.LOWER_ALL_HANDS,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.LOWER_ALL_HANDS, {
          roomId,
          actorUserId: currentUserId,
        });

        appendSystemMessage('Cleared the raised-hand queue for the room.');
        return true;
      },
    });
  }

  function spotlightParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    const targetParticipant = getTargetParticipant(targetUserId);

    if (!targetParticipant || targetParticipant.userId === currentUserId) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.SPOTLIGHT_PARTICIPANT,
      targetUserId,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.SPOTLIGHT_USER, {
          roomId,
          actorUserId: currentUserId,
          targetUserId,
        });

        appendSystemMessage(`Spotlighted ${targetParticipant.userName} for everyone in the room.`);
        return true;
      },
    });
  }

  function clearSpotlight() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.CLEAR_SPOTLIGHT,
      task: async () => {
        emitHostAction(MEETING_SOCKET_EVENTS.CLIENT.CLEAR_SPOTLIGHT, {
          roomId,
          actorUserId: currentUserId,
        });

        appendSystemMessage('Cleared the shared spotlight from the room.');
        return true;
      },
    });
  }

  async function admitParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.ADMIT_PARTICIPANT,
      targetUserId,
      task: async () => {
        const payload = await admitMeetingParticipant(roomId, targetUserId);
        appendSystemMessage(`${payload.participant?.userName ?? 'Participant'} was admitted to the meeting.`);
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to admit this participant right now.',
    });
  }

  async function denyParticipant(targetUserId) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.DENY_PARTICIPANT,
      targetUserId,
      task: async () => {
        const payload = await denyMeetingParticipant(roomId, targetUserId);
        appendSystemMessage(`${payload.participant?.userName ?? 'Participant'} was denied entry.`);
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to deny this participant right now.',
    });
  }

  async function makeCohost(targetUserId) {
    if (!ensureHostAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.MAKE_COHOST,
      targetUserId,
      task: async () => {
        const payload = await promoteMeetingParticipant(roomId, targetUserId);
        appendSystemMessage(`${payload.participant?.userName ?? 'Participant'} is now a co-host.`);
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to grant co-host access right now.',
    });
  }

  async function removeCohost(targetUserId) {
    if (!ensureHostAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.REMOVE_COHOST,
      targetUserId,
      task: async () => {
        const payload = await demoteMeetingParticipant(roomId, targetUserId);
        appendSystemMessage(`${payload.participant?.userName ?? 'Participant'} is now a participant again.`);
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to remove co-host access right now.',
    });
  }

  async function updateRoomPermission(nextSettings) {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.UPDATE_ROOM_PERMISSION,
      targetUserId: Object.keys(nextSettings ?? {})[0] ?? 'room',
      task: async () => {
        const payload = await updateMeetingRoomSettings(roomId, nextSettings);
        appendSystemMessage('Room permissions were updated.');
        onRefreshRoomData?.();
        return payload.roomSettings ?? roomSettings;
      },
      onErrorMessage: 'Unable to update room permissions right now.',
    });
  }

  async function startRoomRecording() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.START_ROOM_RECORDING,
      task: async () => {
        await startMeetingRoomRecordingSession(roomId);
        appendSystemMessage('Started the shared room recording session.');
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to start shared room recording right now.',
    });
  }

  async function stopRoomRecording() {
    if (!ensureModeratorAccess()) {
      return false;
    }

    return runActionWithPending({
      actionName: ACTION_NAMES.STOP_ROOM_RECORDING,
      task: async () => {
        await stopMeetingRoomRecordingSession(roomId);
        appendSystemMessage('Stopped the shared room recording session.');
        onRefreshRoomData?.();
        return true;
      },
      onErrorMessage: 'Unable to stop shared room recording right now.',
    });
  }

  return {
    actionNames: ACTION_NAMES,
    admitParticipant,
    cameraOffAllParticipants,
    cameraOffParticipant,
    clearSpotlight,
    denyParticipant,
    isActionPending,
    kickParticipant,
    lowerAllHands,
    lowerParticipantHand,
    makeCohost,
    muteAllParticipants,
    muteParticipant,
    removeCohost,
    spotlightParticipant,
    startRoomRecording,
    stopRoomRecording,
    updateRoomPermission,
  };
}

export default useAdminControls;
