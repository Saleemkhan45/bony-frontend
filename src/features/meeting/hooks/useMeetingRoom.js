import { useEffect, useRef, useState } from 'react';
import useAdminControls from './useAdminControls';
import useActiveSpeaker from './useActiveSpeaker';
import useMeetingAuth from './useMeetingAuth';
import useMeetingRoomData from './useMeetingRoomData';
import useRecording from './useRecording';
import useScreenShare from './useScreenShare';
import {
  describeMediaError,
  getBrowserMediaDiagnostics,
  isPermissionMediaError,
  isRecoverableMediaError,
  requestUserMedia,
  summarizeMediaConstraints,
  supportsGetUserMedia,
} from '../utils/media';
import {
  isRecordingDownloadUrlSupported,
  openRecordingInNewTab,
  triggerRecordingDownload,
} from '../utils/recordingDownload';
import { createMeetingRoomMessage } from '../services/messageApi';
import { uploadMeetingRecording } from '../services/recordingApi';
import { createMeetingSocketClient } from '../services/meetingSocketClient';
import { MEETING_SOCKET_EVENTS } from '../services/meetingSocketEvents';
import {
  createPeerLink,
  describeMediaStream,
  describeMediaTrack,
  getPeerConnectionSenderByKind,
  logMediaStreamDetails,
  replacePeerConnectionTrack,
} from '../services/webrtcMesh';
import {
  buildInviteUrl,
  createSystemMessage,
  createMeetingPreviewState,
  formatElapsedTime,
  getMeetingPreferences,
  getOrCreateMeetingProfile,
  normalizeRoomId,
  saveMeetingPreferences,
  sortParticipants,
} from '../utils/meetingRoom';

const PARTICIPANT_ACCENTS = [
  'from-[#dbe4ff] via-[#c7d2fe] to-[#bfdbfe]',
  'from-[#dcfce7] via-[#bfdbfe] to-[#ccfbf1]',
  'from-[#ffe4d6] via-[#ffd6e5] to-[#fde7b2]',
  'from-[#e0f2fe] via-[#d9ddff] to-[#d1fae5]',
];

function stopStream(stream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function updateParticipant(participants, userId, updater) {
  return sortParticipants(
    participants.map((participant) =>
      participant.userId === userId ? updater(participant) : participant,
    ),
  );
}

function removeParticipant(participants, userId) {
  return sortParticipants(participants.filter((participant) => participant.userId !== userId));
}

function selectParticipantAccent(userId) {
  const seed = String(userId ?? '')
    .split('')
    .reduce((total, character) => total + character.charCodeAt(0), 0);

  return PARTICIPANT_ACCENTS[seed % PARTICIPANT_ACCENTS.length];
}

function toTimestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildRecordingDownloadName(roomCode) {
  const safeRoomCode = String(roomCode ?? 'meeting').trim().toUpperCase() || 'MEETING';
  return `meeting-${safeRoomCode}-${Date.now()}.webm`;
}

function pickLatestUploadedRecording(recordings, savedRecording) {
  const candidates = [
    ...(isRecordingDownloadUrlSupported(savedRecording?.fileUrl) ? [savedRecording] : []),
    ...((recordings ?? []).filter((recording) => isRecordingDownloadUrlSupported(recording?.fileUrl))),
  ];

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort((firstRecording, secondRecording) => {
    const secondTimestamp = toTimestamp(secondRecording?.createdAt);
    const firstTimestamp = toTimestamp(firstRecording?.createdAt);

    if (secondTimestamp !== firstTimestamp) {
      return secondTimestamp - firstTimestamp;
    }

    return String(secondRecording?.id ?? '').localeCompare(String(firstRecording?.id ?? ''));
  })[0];
}

function mergeRecordingsByRecency(...recordingSources) {
  const recordingsByIdentity = new Map();

  recordingSources.flat().forEach((recording) => {
    if (!recording) {
      return;
    }

    const identityKey = recording.id
      ? `id:${recording.id}`
      : recording.fileUrl
        ? `url:${recording.fileUrl}`
        : `fallback:${recording.fileName ?? 'recording'}:${recording.createdAt ?? ''}`;

    const currentRecording = recordingsByIdentity.get(identityKey);

    if (!currentRecording) {
      recordingsByIdentity.set(identityKey, recording);
      return;
    }

    if (toTimestamp(recording.createdAt) > toTimestamp(currentRecording.createdAt)) {
      recordingsByIdentity.set(identityKey, recording);
    }
  });

  return Array.from(recordingsByIdentity.values()).sort((firstRecording, secondRecording) => {
    const secondTimestamp = toTimestamp(secondRecording?.createdAt);
    const firstTimestamp = toTimestamp(firstRecording?.createdAt);

    if (secondTimestamp !== firstTimestamp) {
      return secondTimestamp - firstTimestamp;
    }

    return String(secondRecording?.id ?? '').localeCompare(String(firstRecording?.id ?? ''));
  });
}

function mergeMeetingEventsByRecency(...eventSources) {
  const eventsByIdentity = new Map();

  eventSources.flat().forEach((event) => {
    if (!event) {
      return;
    }

    const identityKey = event.id
      ? `id:${event.id}`
      : `fallback:${event.eventType ?? 'event'}:${event.createdAt ?? ''}:${event.actorUserId ?? ''}:${event.targetUserId ?? ''}`;

    const currentEvent = eventsByIdentity.get(identityKey);

    if (!currentEvent) {
      eventsByIdentity.set(identityKey, event);
      return;
    }

    if (toTimestamp(event.createdAt) > toTimestamp(currentEvent.createdAt)) {
      eventsByIdentity.set(identityKey, event);
    }
  });

  return Array.from(eventsByIdentity.values()).sort((firstEvent, secondEvent) => {
    const secondTimestamp = toTimestamp(secondEvent?.createdAt);
    const firstTimestamp = toTimestamp(firstEvent?.createdAt);

    if (secondTimestamp !== firstTimestamp) {
      return secondTimestamp - firstTimestamp;
    }

    return String(secondEvent?.id ?? '').localeCompare(String(firstEvent?.id ?? ''));
  });
}

function buildPreferredMediaConstraints(preferences, { audioEnabled, ignoreSavedDevices = false, videoEnabled }) {
  return {
    audio: audioEnabled
      ? ignoreSavedDevices || !preferences.microphoneId
        ? true
        : { deviceId: { exact: preferences.microphoneId } }
      : false,
    video: videoEnabled
      ? ignoreSavedDevices || !preferences.cameraId
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            deviceId: { exact: preferences.cameraId },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
      : false,
  };
}

function buildSimpleMediaConstraints({ audioEnabled, videoEnabled }) {
  return {
    audio: audioEnabled ? true : false,
    video: videoEnabled ? true : false,
  };
}

async function requestPreferredMediaStream({ audioEnabled, logContext = {}, videoEnabled }) {
  const preferences = getMeetingPreferences();
  const browserDiagnostics = getBrowserMediaDiagnostics();

  console.info('[meeting] Starting local media bootstrap request.', {
    ...logContext,
    browser: {
      hasGetUserMedia: browserDiagnostics.hasGetUserMedia,
      hasMediaDevices: browserDiagnostics.hasMediaDevices,
      isEdge: browserDiagnostics.isEdge,
      isSecureContext: browserDiagnostics.isSecureContext,
      userAgent: browserDiagnostics.userAgent,
      userAgentBrands: browserDiagnostics.userAgentBrands,
    },
    requestedTracks: {
      audioEnabled,
      videoEnabled,
    },
    savedDevicePreference: {
      hasCameraId: Boolean(preferences.cameraId),
      hasMicrophoneId: Boolean(preferences.microphoneId),
    },
  });

  async function requestStream({
    requestAudioEnabled,
    requestVideoEnabled,
    requestLabel,
    ignoreSavedDevices = false,
    useSimpleConstraints = false,
  }) {
    const constraints = useSimpleConstraints
      ? buildSimpleMediaConstraints({
          audioEnabled: requestAudioEnabled,
          videoEnabled: requestVideoEnabled,
        })
      : buildPreferredMediaConstraints(preferences, {
          audioEnabled: requestAudioEnabled,
          ignoreSavedDevices,
          videoEnabled: requestVideoEnabled,
        });

    console.info('[meeting] Local media request attempt.', {
      ...logContext,
      constraints: summarizeMediaConstraints(constraints),
      ignoreSavedDevices,
      requestLabel,
      requestTracks: {
        requestAudioEnabled,
        requestVideoEnabled,
      },
      useSimpleConstraints,
    });

    try {
      const stream = await requestUserMedia(constraints);

      console.info('[meeting] Local media request succeeded.', {
        ...logContext,
        audioTrackCount: stream.getAudioTracks().length,
        requestLabel,
        videoTrackCount: stream.getVideoTracks().length,
      });

      return stream;
    } catch (error) {
      console.warn('[meeting] Local media request failed.', {
        ...logContext,
        error: describeMediaError(error),
        requestLabel,
      });
      throw error;
    }
  }

  async function requestStreamWithDeviceFallback(requestAudioEnabled, requestVideoEnabled) {
    let lastError = null;

    try {
      return await requestStream({
        requestAudioEnabled,
        requestVideoEnabled,
        requestLabel: 'preferred',
      });
    } catch (error) {
      lastError = error;
      const hasSavedMicrophone = requestAudioEnabled && Boolean(preferences.microphoneId);
      const hasSavedCamera = requestVideoEnabled && Boolean(preferences.cameraId);

      if (
        isRecoverableMediaError(error) &&
        (hasSavedMicrophone || hasSavedCamera)
      ) {
        try {
          const fallbackStream = await requestStream({
            requestAudioEnabled,
            requestVideoEnabled,
            requestLabel: 'fallback-ignore-saved-devices',
            ignoreSavedDevices: true,
          });

          saveMeetingPreferences({
            ...(hasSavedMicrophone ? { microphoneId: '' } : {}),
            ...(hasSavedCamera ? { cameraId: '' } : {}),
          });
          console.info('[meeting] Saved media device IDs were cleared after fallback success.', {
            ...logContext,
            clearedCameraId: hasSavedCamera,
            clearedMicrophoneId: hasSavedMicrophone,
          });

          return fallbackStream;
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }

      if (requestVideoEnabled && isRecoverableMediaError(lastError)) {
        try {
          return await requestStream({
            requestAudioEnabled,
            requestVideoEnabled,
            requestLabel: 'fallback-simple-constraints',
            ignoreSavedDevices: true,
            useSimpleConstraints: true,
          });
        } catch (simpleFallbackError) {
          lastError = simpleFallbackError;
        }
      }

      throw lastError;
    }
  }

  if (!audioEnabled && !videoEnabled) {
    return new MediaStream();
  }

  try {
    return await requestStreamWithDeviceFallback(audioEnabled, videoEnabled);
  } catch (combinedError) {
    console.warn('[meeting] Combined media bootstrap failed. Retrying with split requests.', {
      ...logContext,
      error: describeMediaError(combinedError),
    });

    if (!audioEnabled || !videoEnabled) {
      throw combinedError;
    }

    let audioOnlyStream = null;
    let videoOnlyStream = null;

    try {
      audioOnlyStream = await requestStreamWithDeviceFallback(true, false);
    } catch {
      audioOnlyStream = null;
    }

    try {
      videoOnlyStream = await requestStreamWithDeviceFallback(false, true);
    } catch {
      videoOnlyStream = null;
    }

    if (!audioOnlyStream && !videoOnlyStream) {
      throw combinedError;
    }

    const mergedStream = new MediaStream();

    audioOnlyStream?.getAudioTracks().forEach((track) => {
      mergedStream.addTrack(track);
    });
    videoOnlyStream?.getVideoTracks().forEach((track) => {
      mergedStream.addTrack(track);
    });

    console.info('[meeting] Local media bootstrap recovered with split-track fallback.', {
      ...logContext,
      audioTrackCount: mergedStream.getAudioTracks().length,
      videoTrackCount: mergedStream.getVideoTracks().length,
    });

    return mergedStream;
  }
}

function mapServerParticipant(participant, currentParticipant, hostUserId, localUserId) {
  const isLocal = participant.userId === localUserId;
  const isHost = participant.userId === hostUserId || participant.isHost;
  const resolvedRole = participant.role ?? currentParticipant?.role ?? (isHost ? 'host' : 'participant');
  const hasExplicitHandRaised = typeof participant.handRaised === 'boolean';
  const hasExplicitHandRaisedAt = Object.prototype.hasOwnProperty.call(participant, 'handRaisedAt');

  return {
    ...currentParticipant,
    ...participant,
    isLocal,
    isHost,
    role: resolvedRole,
    roleLabel:
      resolvedRole === 'host'
        ? 'Host'
        : resolvedRole === 'cohost'
          ? 'Co-host'
          : 'Participant',
    admissionStatus: participant.admissionStatus ?? currentParticipant?.admissionStatus ?? 'admitted',
    handRaised: hasExplicitHandRaised
      ? participant.handRaised
      : currentParticipant?.handRaised ?? false,
    handRaisedAt: hasExplicitHandRaisedAt
      ? participant.handRaisedAt ?? null
      : currentParticipant?.handRaisedAt ?? null,
    accentClassName:
      currentParticipant?.accentClassName ?? participant.accentClassName ?? selectParticipantAccent(participant.userId),
  };
}

function useMeetingRoom(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const [preferredProfile] = useState(() => getOrCreateMeetingProfile());
  const meetingAuth = useMeetingAuth(preferredProfile);
  const profile = meetingAuth.user
    ? {
        userId: meetingAuth.user.userId,
        userName: meetingAuth.user.userName,
        email: meetingAuth.user.email ?? null,
        avatarUrl: meetingAuth.user.avatarUrl ?? null,
      }
    : preferredProfile;
  const [previewState] = useState(() =>
    createMeetingPreviewState({
      profile: preferredProfile,
      roomId: normalizedRoomId,
    }),
  );
  const roomData = useMeetingRoomData(normalizedRoomId, {
    enabled: meetingAuth.status === 'ready',
  });
  const [participants, setParticipants] = useState(previewState.participants);
  const [messages, setMessages] = useState(previewState.messages);
  const [draftMessage, setDraftMessage] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState('chat');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState('grid');
  const [pinnedUserId, setPinnedUserId] = useState(null);
  const [socketMode, setSocketMode] = useState('live');
  const [connectionState, setConnectionState] = useState('connecting');
  const [reconnectAttemptCount, setReconnectAttemptCount] = useState(0);
  const [mediaBootstrapStatus, setMediaBootstrapStatus] = useState('requesting');
  const [mediaError, setMediaError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hasLiveTransport, setHasLiveTransport] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [exitState, setExitState] = useState(null);
  const [statusNotice, setStatusNotice] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [roomRecordingSession, setRoomRecordingSession] = useState(null);
  const [meetingEvents, setMeetingEvents] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [waitingParticipants, setWaitingParticipants] = useState([]);
  const [currentRole, setCurrentRole] = useState('participant');
  const [admissionStatus, setAdmissionStatus] = useState(null);
  const [localMediaStream, setLocalMediaStream] = useState(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const participantsRef = useRef(previewState.participants);
  const activeSidebarTabRef = useRef('chat');
  const isSidebarOpenRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const hasDetachedRef = useRef(false);
  const hasConnectedOnceRef = useRef(false);
  const noticeTimeoutRef = useRef(null);
  const screenShareStateRef = useRef({
    isScreenSharing: false,
    screenStream: null,
    stopScreenShare: null,
  });
  const screenShareToggleInFlightRef = useRef(false);
  const screenShareSessionRef = useRef({
    restoreVideoEnabled: false,
  });
  const [isScreenShareTransitioning, setIsScreenShareTransitioning] = useState(false);

  const localParticipant =
    participants.find((participant) => participant.userId === profile.userId) ?? null;
  const isHost = currentRole === 'host' || Boolean(localParticipant?.isHost);
  const isModerator = currentRole === 'host' || currentRole === 'cohost';
  const authStatus = meetingAuth.status;
  const authError = meetingAuth.errorMessage;
  const roomDataStatus = roomData.status;
  const roomDataError = roomData.errorMessage;

  function isChatCurrentlyVisible() {
    if (typeof window === 'undefined') {
      return activeSidebarTabRef.current === 'chat';
    }

    const isDesktopSidebarVisible = window.matchMedia('(min-width: 1280px)').matches;

    if (isDesktopSidebarVisible) {
      return activeSidebarTabRef.current === 'chat';
    }

    return isSidebarOpenRef.current && activeSidebarTabRef.current === 'chat';
  }

  function pushMessage(message, options = {}) {
    const { markUnread = false } = options;

    setMessages((currentMessages) => [...currentMessages, message]);

    if (markUnread && !isChatCurrentlyVisible()) {
      setUnreadChatCount((currentCount) => currentCount + 1);
    }
  }

  function appendSystemMessage(text) {
    pushMessage(createSystemMessage(text));
  }

  function showStatusNotice(message, tone = 'info') {
    if (!message) {
      return;
    }

    if (noticeTimeoutRef.current) {
      window.clearTimeout(noticeTimeoutRef.current);
    }

    setStatusNotice({
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      message,
      tone,
    });

    noticeTimeoutRef.current = window.setTimeout(() => {
      setStatusNotice(null);
    }, 3200);
  }

  function mergeRoomInfo(nextRoomInfo) {
    if (!nextRoomInfo) {
      return;
    }

    setRoomInfo((currentRoomInfo) => ({
      ...(currentRoomInfo ?? {}),
      ...nextRoomInfo,
    }));
  }

  function setParticipantMediaStream(userId, mediaStream) {
    if (!userId) {
      return;
    }

    setParticipants((currentParticipants) => {
      const existingParticipant = currentParticipants.find(
        (participant) => participant.userId === userId,
      );

      if (existingParticipant) {
        return updateParticipant(currentParticipants, userId, (participant) => ({
          ...participant,
          mediaStream: mediaStream ?? null,
        }));
      }

      if (!mediaStream) {
        return currentParticipants;
      }

      return sortParticipants([
        ...currentParticipants,
        {
          accentClassName: selectParticipantAccent(userId),
          audioEnabled: mediaStream.getAudioTracks().length > 0,
          handRaised: false,
          handRaisedAt: null,
          isHost: false,
          isLocal: false,
          mediaStream,
          roleLabel: 'Participant',
          userId,
          userName: 'Participant',
          videoEnabled: mediaStream.getVideoTracks().length > 0,
        },
      ]);
    });
  }

  function closePeerLink(remoteUserId, { clearRemoteStream = true } = {}) {
    const peerLink = peerConnectionsRef.current.get(remoteUserId);

    if (!peerLink) {
      return;
    }

    peerConnectionsRef.current.delete(remoteUserId);

    try {
      peerLink.close();
    } catch (error) {
      console.warn('[meeting] Failed to close peer connection cleanly.', {
        remoteUserId,
        error,
      });
    }

    if (clearRemoteStream) {
      setParticipantMediaStream(remoteUserId, null);
    }
  }

  function closeAllPeerLinks(options) {
    Array.from(peerConnectionsRef.current.keys()).forEach((remoteUserId) => {
      closePeerLink(remoteUserId, options);
    });
  }

  function getPeerDiagnosticsTargets() {
    return Array.from(peerConnectionsRef.current.entries()).map(([remoteUserId, peerLink]) => ({
      userId: remoteUserId,
      peerConnection: peerLink.peerConnection,
    }));
  }

  function buildOutboundLocalStream() {
    const outboundLocalStream = new MediaStream();
    const localAudioTracks = localStreamRef.current?.getAudioTracks?.() ?? [];
    const localVideoTrack = localStreamRef.current?.getVideoTracks?.()[0] ?? null;
    const activeScreenTrack = screenShareStateRef.current.screenStream?.getVideoTracks?.()[0] ?? null;
    const stageVideoTrack = screenShareStateRef.current.isScreenSharing ? activeScreenTrack : localVideoTrack;

    localAudioTracks.forEach((track) => {
      outboundLocalStream.addTrack(track);
    });

    if (stageVideoTrack) {
      outboundLocalStream.addTrack(stageVideoTrack);
    }

    return outboundLocalStream;
  }

  function getOrCreatePeerLink(remoteUserId) {
    const normalizedRemoteUserId = String(remoteUserId ?? '').trim();

    if (!normalizedRemoteUserId || normalizedRemoteUserId === profile.userId) {
      return null;
    }

    const existingPeerLink = peerConnectionsRef.current.get(normalizedRemoteUserId);

    if (existingPeerLink) {
      return existingPeerLink;
    }

    const outboundLocalStream = buildOutboundLocalStream();

    console.info('[meeting] Creating peer connection.', {
      roomId: normalizedRoomId,
      localUserId: profile.userId,
      remoteUserId: normalizedRemoteUserId,
      localStream: describeMediaStream(outboundLocalStream),
    });

    const peerLink = createPeerLink({
      roomId: normalizedRoomId,
      localUserId: profile.userId,
      remoteUserId: normalizedRemoteUserId,
      localStream: outboundLocalStream,
      onSignal: (eventName, payload) => {
        console.info('[meeting] Signaling event emitted.', {
          eventName,
          roomId: normalizedRoomId,
          senderUserId: profile.userId,
          targetUserId: normalizedRemoteUserId,
        });

        socketRef.current?.emit(eventName, payload);
      },
      onRemoteStream: (mediaStream) => {
        console.info('[meeting] Remote stream received.', {
          remoteUserId: normalizedRemoteUserId,
          mediaStream: describeMediaStream(mediaStream),
        });
        setParticipantMediaStream(normalizedRemoteUserId, mediaStream);
      },
      onConnectionStateChange: (connectionState) => {
        console.info('[meeting] Peer connection state changed.', {
          remoteUserId: normalizedRemoteUserId,
          connectionState,
        });

        if (connectionState === 'closed') {
          setParticipantMediaStream(normalizedRemoteUserId, null);
        }
      },
    });

    peerConnectionsRef.current.set(normalizedRemoteUserId, peerLink);
    return peerLink;
  }

  async function createPeerOffer(remoteUserId) {
    const peerLink = getOrCreatePeerLink(remoteUserId);

    if (!peerLink) {
      return;
    }

    try {
      await peerLink.createAndSendOffer();
    } catch (error) {
      console.error('[meeting] Failed to create WebRTC offer.', {
        remoteUserId,
        error,
      });
      showStatusNotice('Live media negotiation is retrying for one participant.', 'warning');
    }
  }

  function attachLocalTrackToPeerConnections(track) {
    if (!track || !localStreamRef.current) {
      return;
    }

    peerConnectionsRef.current.forEach((peerLink, remoteUserId) => {
      const existingSender = peerLink.peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === track.kind);

      if (existingSender) {
        return;
      }

      peerLink.peerConnection.addTrack(track, localStreamRef.current);
      void createPeerOffer(remoteUserId);
    });
  }

  async function publishStageVideoTrack(nextTrack, nextStream) {
    const renegotiationTargets = [];

    for (const [remoteUserId, peerLink] of peerConnectionsRef.current.entries()) {
      const existingVideoSender = getPeerConnectionSenderByKind(peerLink.peerConnection, 'video');

      if (nextTrack) {
        if (existingVideoSender) {
          await replacePeerConnectionTrack(peerLink.peerConnection, 'video', nextTrack);
        } else {
          peerLink.peerConnection.addTrack(nextTrack, nextStream);
        }
      } else if (existingVideoSender) {
        peerLink.peerConnection.removeTrack(existingVideoSender);
      }

      renegotiationTargets.push(remoteUserId);
    }

    renegotiationTargets.forEach((remoteUserId) => {
      void createPeerOffer(remoteUserId);
    });
  }

  async function ensureRequestedLocalTracks({ audioEnabled = false, videoEnabled = false }) {
    if (!audioEnabled && !videoEnabled) {
      return true;
    }

    if (!supportsGetUserMedia()) {
      setMediaBootstrapStatus('unsupported');
      setMediaError(
        'Camera and microphone APIs are unavailable in this browser. Try a supported browser to turn devices back on.',
      );
      return false;
    }

    const currentStream = localStreamRef.current;
    const hasAudioTrack = Boolean(currentStream?.getAudioTracks().length);
    const hasVideoTrack = Boolean(currentStream?.getVideoTracks().length);
    const needsAudioTrack = audioEnabled && !hasAudioTrack;
    const needsVideoTrack = videoEnabled && !hasVideoTrack;

    if (!needsAudioTrack && !needsVideoTrack) {
      return true;
    }

    try {
      const requestedStream = await requestPreferredMediaStream({
        audioEnabled: needsAudioTrack,
        logContext: {
          flow: 'restore-requested-tracks',
          roomId: normalizedRoomId,
          userId: profile.userId,
        },
        videoEnabled: needsVideoTrack,
      });
      const nextLocalStream = currentStream ?? new MediaStream();

      requestedStream.getTracks().forEach((track) => {
        nextLocalStream.addTrack(track);
        attachLocalTrackToPeerConnections(track);
      });

      localStreamRef.current = nextLocalStream;
      setLocalMediaStream(nextLocalStream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = nextLocalStream;
      }
      setMediaBootstrapStatus('ready');
      setMediaError('');
      logMediaStreamDetails('Local media stream updated', nextLocalStream);

      return true;
    } catch (error) {
      const browserDiagnostics = getBrowserMediaDiagnostics();
      const isPermissionError = isPermissionMediaError(error);
      console.error('[meeting] Failed to restore requested local media track.', {
        browser: {
          isEdge: browserDiagnostics.isEdge,
          isSecureContext: browserDiagnostics.isSecureContext,
          userAgent: browserDiagnostics.userAgent,
        },
        roomId: normalizedRoomId,
        userId: profile.userId,
        error,
      });

      const nextMessage =
        isPermissionError
          ? browserDiagnostics.isSecureContext
            ? 'Browser permissions are blocking this device. Re-enable access and try again.'
            : 'Camera and microphone access requires a secure origin (HTTPS or localhost).'
          : 'Unable to turn on the selected camera or microphone right now.';

      setMediaBootstrapStatus(isPermissionError ? 'blocked' : 'ready');
      setMediaError(nextMessage);
      showStatusNotice(nextMessage, 'warning');
      return false;
    }
  }

  function cleanupRoomTransport({ notifyLeave = false } = {}) {
    if (hasDetachedRef.current) {
      return;
    }

    hasDetachedRef.current = true;

    if (notifyLeave) {
      socketRef.current?.emit(MEETING_SOCKET_EVENTS.CLIENT.LEAVE_ROOM, {
        roomId: normalizedRoomId,
        userId: profile.userId,
      });
    }

    closeAllPeerLinks({ clearRemoteStream: false });
    socketRef.current?.disconnect();
    stopStream(screenShareStateRef.current.screenStream);
    stopStream(localStreamRef.current);
    localStreamRef.current = null;
    setLocalMediaStream(null);
  }

  function handleForcedExit({ description, reason, title }) {
    setIsSidebarOpen(false);
    setExitState({
      description,
      reason,
      title,
    });
    cleanupRoomTransport();
  }

  function getCurrentLocalMediaState() {
    const audioTracks = localStreamRef.current?.getAudioTracks() ?? [];
    const videoTracks = localStreamRef.current?.getVideoTracks() ?? [];
    const hasAudioTrack = audioTracks.length > 0;
    const hasVideoTrack = videoTracks.length > 0;
    const audioTrackEnabled = audioTracks.some((track) => track.enabled);
    const videoTrackEnabled = videoTracks.some((track) => track.enabled);

    return {
      audioEnabled: hasAudioTrack ? audioTrackEnabled : false,
      videoEnabled: hasVideoTrack ? videoTrackEnabled : false,
    };
  }

  function applyLocalParticipantMediaState(participantList) {
    const localMediaState = getCurrentLocalMediaState();

    return participantList.map((participant) =>
      participant.userId === profile.userId
        ? {
            ...participant,
            audioEnabled: localMediaState.audioEnabled,
            videoEnabled: localMediaState.videoEnabled,
          }
        : participant,
    );
  }

  async function commitLocalMediaState(
    updates,
    { notice, noticeTone = 'warning', systemMessage, broadcast = true } = {},
  ) {
    const currentState = getCurrentLocalMediaState();
    const nextAudioEnabled =
      typeof updates.audioEnabled === 'boolean' ? updates.audioEnabled : currentState.audioEnabled;
    const nextVideoEnabled =
      typeof updates.videoEnabled === 'boolean' ? updates.videoEnabled : currentState.videoEnabled;

    const requestedTracksReady = await ensureRequestedLocalTracks({
      audioEnabled: nextAudioEnabled,
      videoEnabled: nextVideoEnabled,
    });

    if (
      !requestedTracksReady &&
      ((typeof updates.audioEnabled === 'boolean' && updates.audioEnabled) ||
        (typeof updates.videoEnabled === 'boolean' && updates.videoEnabled))
    ) {
      return currentState;
    }

    const hasMediaStateChanged =
      currentState.audioEnabled !== nextAudioEnabled ||
      currentState.videoEnabled !== nextVideoEnabled;

    if (!hasMediaStateChanged) {
      if (systemMessage) {
        appendSystemMessage(systemMessage);
      }

      if (notice) {
        showStatusNotice(notice, noticeTone);
      }

      return currentState;
    }

    if (typeof updates.audioEnabled === 'boolean') {
      localStreamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = updates.audioEnabled;
      });
    }

    if (typeof updates.videoEnabled === 'boolean') {
      localStreamRef.current?.getVideoTracks().forEach((track) => {
        track.enabled = updates.videoEnabled;
      });
    }

    setParticipants((currentParticipants) =>
      updateParticipant(currentParticipants, profile.userId, (participant) => ({
        ...participant,
        audioEnabled: nextAudioEnabled,
        videoEnabled: nextVideoEnabled,
      })),
    );

    if (broadcast) {
      socketRef.current?.emit(MEETING_SOCKET_EVENTS.CLIENT.PARTICIPANT_MEDIA_UPDATED, {
        roomId: normalizedRoomId,
        userId: profile.userId,
        audioEnabled: nextAudioEnabled,
        videoEnabled: nextVideoEnabled,
      });
    }

    if (systemMessage) {
      appendSystemMessage(systemMessage);
    }

    if (notice) {
      showStatusNotice(notice, noticeTone);
    }

    return {
      audioEnabled: nextAudioEnabled,
      videoEnabled: nextVideoEnabled,
    };
  }

  const recording = useRecording({
    onNotice: showStatusNotice,
    onStatusMessage: appendSystemMessage,
    roomId: normalizedRoomId,
    streamRef: localStreamRef,
    uploadRecording: ({ file, roomCode, fileName, mimeType }) =>
      uploadMeetingRecording({
        file,
        roomCode,
        userId: profile.userId,
        fileName,
        mimeType,
      }),
  });
  const hasPersistedRecording = recordings.some((currentRecording) =>
    isRecordingDownloadUrlSupported(currentRecording?.fileUrl),
  );
  const hasUploadedRecording = recording.hasUploadedRecording || hasPersistedRecording;

  const adminControls = useAdminControls({
    appendSystemMessage,
    currentRole,
    currentUserId: profile.userId,
    onRefreshRoomData: roomData.refresh,
    participants,
    roomId: normalizedRoomId,
    roomSettings: roomInfo?.roomSettings ?? roomData.roomSettings ?? null,
    socketRef,
  });

  const presenterUserId = roomInfo?.presenterUserId ?? null;
  const spotlightUserId = roomInfo?.spotlightUserId ?? null;
  const activeSpeakerUserId = useActiveSpeaker({
    localStream: localMediaStream,
    localUserId: profile.userId,
    participants,
  });

  const screenShare = useScreenShare({
    onError: (error) => {
      if (error?.name !== 'AbortError') {
        console.error('[meeting] Failed to start screen share.', {
          roomId: normalizedRoomId,
          userId: profile.userId,
          error,
        });
        showStatusNotice(error.message || 'Unable to start screen sharing.', 'warning');
      }
    },
    onStart: async (screenStream) => {
      const presentationTrack = screenStream.getVideoTracks()[0] ?? null;
      const localMediaStateBeforeShare = getCurrentLocalMediaState();

      if (!presentationTrack) {
        throw new Error('No screen track was available to publish.');
      }

      screenShareSessionRef.current = {
        restoreVideoEnabled: localMediaStateBeforeShare.videoEnabled,
      };

      await publishStageVideoTrack(presentationTrack, screenStream);
      screenShareStateRef.current = {
        ...screenShareStateRef.current,
        isScreenSharing: true,
        screenStream,
      };
      socketRef.current?.emit(MEETING_SOCKET_EVENTS.CLIENT.START_SCREEN_SHARE, {
        roomId: normalizedRoomId,
        userId: profile.userId,
      });
      setParticipants((currentParticipants) =>
        updateParticipant(currentParticipants, profile.userId, (participant) => ({
          ...participant,
          isPresenting: true,
          presentationStream: screenStream,
        })),
      );
      mergeRoomInfo({
        presenterUserId: profile.userId,
      });
      appendSystemMessage('You started presenting your screen.');
      showStatusNotice('Screen sharing is live for the room.', 'success');
      setLayoutMode('speaker');
    },
    onStop: async (_screenStream, options = {}) => {
      const shouldRestoreCamera = screenShareSessionRef.current.restoreVideoEnabled;

      if (shouldRestoreCamera) {
        await ensureRequestedLocalTracks({
          videoEnabled: true,
        });
      }

      const cameraTrack = shouldRestoreCamera
        ? localStreamRef.current?.getVideoTracks()[0] ?? null
        : null;

      if (cameraTrack) {
        cameraTrack.enabled = true;
      }

      await publishStageVideoTrack(cameraTrack, localStreamRef.current);
      const nextLocalMediaState = getCurrentLocalMediaState();
      screenShareStateRef.current = {
        ...screenShareStateRef.current,
        isScreenSharing: false,
        screenStream: null,
      };

      if (options.source !== 'remote-stage-update') {
        socketRef.current?.emit(MEETING_SOCKET_EVENTS.CLIENT.STOP_SCREEN_SHARE, {
          roomId: normalizedRoomId,
          userId: profile.userId,
        });
      }

      socketRef.current?.emit(MEETING_SOCKET_EVENTS.CLIENT.PARTICIPANT_MEDIA_UPDATED, {
        roomId: normalizedRoomId,
        userId: profile.userId,
        audioEnabled: nextLocalMediaState.audioEnabled,
        videoEnabled: nextLocalMediaState.videoEnabled,
      });

      setParticipants((currentParticipants) =>
        updateParticipant(currentParticipants, profile.userId, (participant) => ({
          ...participant,
          audioEnabled: nextLocalMediaState.audioEnabled,
          videoEnabled: nextLocalMediaState.videoEnabled,
          isPresenting: false,
          presentationStream: null,
        })),
      );
      if (options.source !== 'remote-stage-update') {
        mergeRoomInfo({
          presenterUserId: null,
          ...(spotlightUserId === profile.userId ? { spotlightUserId: null } : {}),
        });
        appendSystemMessage('You stopped sharing your screen.');
        showStatusNotice('Screen sharing stopped.', 'info');
      } else {
        appendSystemMessage('Another participant took over the stage, so your screen share was restored to camera.');
      }
    },
  });

  useEffect(() => {
    screenShareStateRef.current = {
      isScreenSharing: screenShare.isScreenSharing,
      screenStream: screenShare.screenStream,
      stopScreenShare: screenShare.stopScreenShare,
    };
  }, [screenShare.isScreenSharing, screenShare.screenStream, screenShare.stopScreenShare]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    activeSidebarTabRef.current = activeSidebarTab;
    isSidebarOpenRef.current = isSidebarOpen;
  }, [activeSidebarTab, isSidebarOpen]);

  useEffect(() => {
    setRecordings([]);
    setMeetingEvents([]);
  }, [normalizedRoomId]);

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        window.clearTimeout(noticeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const durationTimerId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);

    return () => {
      window.clearInterval(durationTimerId);
    };
  }, []);

  useEffect(() => {
    const browserDiagnostics = getBrowserMediaDiagnostics();
    console.info('[meeting] Browser media capabilities detected.', {
      browser: {
        hasGetUserMedia: browserDiagnostics.hasGetUserMedia,
        hasMediaDevices: browserDiagnostics.hasMediaDevices,
        isEdge: browserDiagnostics.isEdge,
        isSecureContext: browserDiagnostics.isSecureContext,
        userAgent: browserDiagnostics.userAgent,
        userAgentBrands: browserDiagnostics.userAgentBrands,
      },
      roomId: normalizedRoomId,
      userId: profile.userId,
    });
  }, [normalizedRoomId, profile.userId]);

  useEffect(() => {
    let isMounted = true;
    let streamInstance = null;

    async function enableLocalMedia() {
      const preferredMediaState = getMeetingPreferences();
      const wantsAudio = preferredMediaState.audioEnabled !== false;
      const wantsVideo = preferredMediaState.videoEnabled !== false;

      if (!supportsGetUserMedia()) {
        setMediaBootstrapStatus('unsupported');
        setMediaError(
          'Camera and microphone APIs are unavailable in this browser. The room stays available for signaling, but local media controls need a supported browser.',
        );
        setParticipants((currentParticipants) =>
          updateParticipant(currentParticipants, profile.userId, (participant) => ({
            ...participant,
            audioEnabled: false,
            videoEnabled: false,
          })),
        );
        return;
      }

      if (!wantsAudio && !wantsVideo) {
        setMediaBootstrapStatus('ready');
        setMediaError('');
        setParticipants((currentParticipants) =>
          updateParticipant(currentParticipants, profile.userId, (participant) => ({
            ...participant,
            audioEnabled: false,
            videoEnabled: false,
          })),
        );
        return;
      }

      try {
        streamInstance = await requestPreferredMediaStream({
          audioEnabled: wantsAudio,
          logContext: {
            flow: 'initial-room-bootstrap',
            roomId: normalizedRoomId,
            userId: profile.userId,
          },
          videoEnabled: wantsVideo,
        });

        if (!isMounted) {
          stopStream(streamInstance);
          return;
        }

        localStreamRef.current = streamInstance;
        setLocalMediaStream(streamInstance);
        setMediaBootstrapStatus('ready');
        logMediaStreamDetails('Local media stream ready', streamInstance);
        console.info('[meeting] Local audio tracks ready.', {
          roomId: normalizedRoomId,
          userId: profile.userId,
          audioTrackCount: streamInstance.getAudioTracks().length,
          audioTracks: streamInstance.getAudioTracks().map(describeMediaTrack),
          videoTrackCount: streamInstance.getVideoTracks().length,
          videoTracks: streamInstance.getVideoTracks().map(describeMediaTrack),
        });

        setParticipants((currentParticipants) =>
          updateParticipant(currentParticipants, profile.userId, (participant) => ({
            ...participant,
            audioEnabled: streamInstance.getAudioTracks().length > 0,
            videoEnabled: streamInstance.getVideoTracks().length > 0,
          })),
        );
      } catch (error) {
        const browserDiagnostics = getBrowserMediaDiagnostics();
        const isPermissionError = isPermissionMediaError(error);
        console.error('[meeting] Failed to access local media devices.', {
          browser: {
            isEdge: browserDiagnostics.isEdge,
            isSecureContext: browserDiagnostics.isSecureContext,
            userAgent: browserDiagnostics.userAgent,
          },
          roomId: normalizedRoomId,
          userId: profile.userId,
          error,
        });
        if (isMounted) {
          setMediaBootstrapStatus(isPermissionError ? 'blocked' : 'ready');
          setMediaError(
            isPermissionError
              ? browserDiagnostics.isSecureContext
                ? 'Camera or microphone permission was blocked. You can still join the room, but media toggles and local recording need device access.'
                : 'Camera and microphone access requires a secure origin (HTTPS or localhost). You can still join and retry once access is available.'
              : 'The preferred camera or microphone could not start. You can still join and retry your devices from the room.',
          );
          setParticipants((currentParticipants) =>
            updateParticipant(currentParticipants, profile.userId, (participant) => ({
              ...participant,
              audioEnabled: false,
              videoEnabled: false,
            })),
          );
        }
      }
    }

    enableLocalMedia();

    return () => {
      isMounted = false;

      if (streamInstance) {
        stopStream(streamInstance);
      }
    };
  }, [normalizedRoomId, profile.userId]);

  useEffect(() => {
    if (!localVideoRef.current) {
      return;
    }

    localVideoRef.current.srcObject = localStreamRef.current;
  }, [participants]);

  useEffect(() => {
    if (roomDataStatus !== 'ready') {
      return;
    }

    const existingParticipantsById = new Map(
      participantsRef.current.map((participant) => [participant.userId, participant]),
    );
    const nextParticipants = (roomData.participants ?? []).map((participant) =>
      mapServerParticipant(
        participant,
        existingParticipantsById.get(participant.userId),
        roomData.hostUserId,
        profile.userId,
      ),
    );
    const hasLocalParticipant = nextParticipants.some(
      (participant) => participant.userId === profile.userId,
    );

    if (!hasLocalParticipant) {
      const localFallbackParticipant =
        existingParticipantsById.get(profile.userId) ?? previewState.participants[0];

      nextParticipants.unshift(
        mapServerParticipant(
          {
            ...localFallbackParticipant,
            userId: profile.userId,
            userName: profile.userName,
            isHost: roomData.hostUserId === profile.userId,
          },
          localFallbackParticipant,
          roomData.hostUserId,
          profile.userId,
        ),
      );
    }

    setRoomInfo(roomData.room);
    setParticipants(sortParticipants(applyLocalParticipantMediaState(nextParticipants)));
    setMessages(Array.isArray(roomData.messages) ? roomData.messages : []);
    setRecordings((currentRecordings) =>
      mergeRecordingsByRecency(Array.isArray(roomData.recordings) ? roomData.recordings : [], currentRecordings),
    );
    setWaitingParticipants(Array.isArray(roomData.waitingParticipants) ? roomData.waitingParticipants : []);
    setMeetingEvents((currentMeetingEvents) =>
      mergeMeetingEventsByRecency(
        Array.isArray(roomData.meetingEvents) ? roomData.meetingEvents : [],
        currentMeetingEvents,
      ),
    );
    setRoomRecordingSession(roomData.roomRecordingSession ?? null);
    setCurrentRole(roomData.currentRole ?? 'participant');
    setAdmissionStatus(roomData.admissionStatus ?? null);
  }, [
    roomData.admissionStatus,
    roomData.currentRole,
    roomData.meetingEvents,
    previewState.participants,
    profile.userId,
    profile.userName,
    roomData.hostUserId,
    roomData.messages,
    roomData.participants,
    roomData.recordings,
    roomData.roomRecordingSession,
    roomData.room,
    roomData.waitingParticipants,
    roomDataStatus,
  ]);

  useEffect(() => {
    if (authStatus === 'error' && authError) {
      showStatusNotice(authError, 'error');
    }
  }, [authError, authStatus]);

  useEffect(() => {
    if (roomDataStatus !== 'ready') {
      return undefined;
    }

    const refreshIntervalId = window.setInterval(() => {
      roomData.refresh?.();
    }, 20000);

    return () => {
      window.clearInterval(refreshIntervalId);
    };
  }, [roomData.refresh, roomDataStatus]);

  useEffect(() => {
    if (roomDataStatus !== 'not-found' && roomDataStatus !== 'error') {
      return;
    }

    if (roomDataStatus === 'not-found') {
      handleForcedExit({
        reason: 'room-missing',
        title: 'Meeting not found',
        description:
          roomDataError ||
          'This meeting does not exist or has already ended. Please check the meeting ID and try again.',
      });
      return;
    }

    if (roomDataError) {
      showStatusNotice(roomDataError, 'error');
    }
  }, [roomDataError, roomDataStatus]);

  useEffect(() => {
    if (
      authStatus !== 'ready' ||
      roomDataStatus !== 'ready' ||
      mediaBootstrapStatus === 'requesting' ||
      exitState
    ) {
      return undefined;
    }

    const socketClient = createMeetingSocketClient({
      url: import.meta.env.VITE_MEETING_SOCKET_URL ?? 'http://localhost:5000',
      auth: {
        token: meetingAuth.token,
      },
    });

    hasDetachedRef.current = false;
    hasConnectedOnceRef.current = false;
    socketRef.current = socketClient;
    setSocketMode(socketClient.mode);
    setHasLiveTransport(false);
    setConnectionState('connecting');
    setReconnectAttemptCount(0);

    const syncLocalTracksToServer = () => {
      const currentMediaState = getCurrentLocalMediaState();

      socketClient.emit(MEETING_SOCKET_EVENTS.CLIENT.PARTICIPANT_MEDIA_UPDATED, {
        roomId: normalizedRoomId,
        userId: profile.userId,
        audioEnabled: currentMediaState.audioEnabled,
        videoEnabled: currentMediaState.videoEnabled,
      });
    };

    const joinRoom = () => {
      socketClient.emit(MEETING_SOCKET_EVENTS.CLIENT.JOIN_ROOM, {
        roomId: normalizedRoomId,
        userId: profile.userId,
        userName: profile.userName,
      });
    };

    const unsubscribeHandlers = [
      socketClient.on('transport:connected', () => {
        const isReconnect = hasConnectedOnceRef.current;

        hasConnectedOnceRef.current = true;
        setHasLiveTransport(true);
        setConnectionState('connected');
        setReconnectAttemptCount(0);

        if (isReconnect) {
          closeAllPeerLinks();
          appendSystemMessage('Live meeting sync reconnected. Rebuilding room presence and media routes.');
          showStatusNotice('Reconnected to live meeting sync.', 'success');
        }

        joinRoom();
      }),
      socketClient.on('transport:reconnecting', (payload) => {
        setHasLiveTransport(false);
        setConnectionState('reconnecting');
        setReconnectAttemptCount(payload?.attemptCount ?? 0);
      }),
      socketClient.on('transport:reconnected', (payload) => {
        setConnectionState('connecting');
        setReconnectAttemptCount(payload?.attemptCount ?? 0);
      }),
      socketClient.on('transport:disconnected', (payload) => {
        setHasLiveTransport(false);

        if (payload?.reason !== 'io client disconnect') {
          setConnectionState(hasConnectedOnceRef.current ? 'degraded' : 'connecting');
        }
      }),
      socketClient.on('transport:error', (payload) => {
        setHasLiveTransport(false);
        setConnectionState(hasConnectedOnceRef.current ? 'reconnecting' : 'failed');

        if (payload?.message) {
          showStatusNotice(payload.message, 'warning');
        }
      }),
      socketClient.on('transport:reconnect-failed', () => {
        setHasLiveTransport(false);
        setConnectionState('failed');
        showStatusNotice('Unable to restore live meeting sync. Refresh the room to try again.', 'error');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ROOM_JOINED, (payload) => {
        if (!payload?.participant) {
          return;
        }

        const existingParticipantsById = new Map(
          participantsRef.current.map((participant) => [participant.userId, participant]),
        );

        const nextParticipants = [
          mapServerParticipant(
            payload.participant,
            existingParticipantsById.get(payload.participant.userId),
            payload.hostUserId,
            profile.userId,
          ),
          ...(payload.participants ?? []).map((participant) =>
            mapServerParticipant(
              participant,
              existingParticipantsById.get(participant.userId),
              payload.hostUserId,
              profile.userId,
            ),
          ),
        ];

        setParticipants(sortParticipants(applyLocalParticipantMediaState(nextParticipants)));
        mergeRoomInfo(payload.room);
        setWaitingParticipants(Array.isArray(payload.waitingParticipants) ? payload.waitingParticipants : []);
        setCurrentRole(payload.currentRole ?? payload.role ?? 'participant');
        setAdmissionStatus(payload.admissionStatus ?? 'admitted');
        appendSystemMessage(
          (payload.currentRole ?? payload.role) === 'host'
            ? 'Connected to the room as host. Room history and moderation controls are live.'
            : (payload.currentRole ?? payload.role) === 'cohost'
              ? 'Connected to the room as co-host. Moderation controls are available.'
              : 'Connected to the room. Persistent room history and live moderation are ready.',
        );
        syncLocalTracksToServer();

        if (payload.roomSettings) {
          mergeRoomInfo({
            roomSettings: payload.roomSettings,
          });
        }

        const remoteParticipants = (payload.participants ?? []).filter(
          (participant) => participant.userId && participant.userId !== profile.userId,
        );

        console.info('[meeting] Room joined. Preparing WebRTC offers for existing participants.', {
          roomId: normalizedRoomId,
          remoteUserIds: remoteParticipants.map((participant) => participant.userId),
        });

        remoteParticipants.forEach((participant) => {
          void createPeerOffer(participant.userId);
        });

        // Refresh persisted room artifacts right after live join so history and recordings
        // appear immediately instead of waiting for the interval poll.
        roomData.refresh?.();
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ROOM_PARTICIPANTS, (payload) => {
        if (!Array.isArray(payload?.participants)) {
          return;
        }

        const existingParticipantsById = new Map(
          participantsRef.current.map((participant) => [participant.userId, participant]),
        );

        const currentLocalParticipant = participantsRef.current.find(
          (participant) => participant.userId === profile.userId,
        );
        const nextParticipants = payload.participants.map((participant) =>
          mapServerParticipant(
            participant,
            existingParticipantsById.get(participant.userId),
            payload.hostUserId,
            profile.userId,
          ),
        );

        if (currentLocalParticipant) {
          nextParticipants.unshift(
            mapServerParticipant(
              currentLocalParticipant,
              currentLocalParticipant,
              payload.hostUserId,
              profile.userId,
            ),
          );
        }

        setParticipants(sortParticipants(applyLocalParticipantMediaState(nextParticipants)));
        mergeRoomInfo(payload.room);
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.USER_JOINED, (payload) => {
        if (!payload?.participant) {
          return;
        }

        setParticipants((currentParticipants) => {
          const nextParticipant = mapServerParticipant(
            payload.participant,
            currentParticipants.find(
              (participant) => participant.userId === payload.participant.userId,
            ),
            payload.hostUserId,
            profile.userId,
          );

          return sortParticipants([
            ...currentParticipants.filter(
              (participant) => participant.userId !== payload.participant.userId,
            ),
            nextParticipant,
          ]);
        });

        mergeRoomInfo(payload.room);

        appendSystemMessage(`${payload.participant.userName} joined the room.`);
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.OFFER, (payload) => {
        if (!payload?.senderUserId || !payload?.offer) {
          return;
        }

        console.info('[meeting] Offer received.', {
          roomId: normalizedRoomId,
          senderUserId: payload.senderUserId,
        });

        const peerLink = getOrCreatePeerLink(payload.senderUserId);

        if (!peerLink) {
          return;
        }

        void peerLink.handleOffer(payload.offer).catch((error) => {
          console.error('[meeting] Failed to handle incoming offer.', {
            roomId: normalizedRoomId,
            senderUserId: payload.senderUserId,
            error,
          });
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ANSWER, (payload) => {
        if (!payload?.senderUserId || !payload?.answer) {
          return;
        }

        console.info('[meeting] Answer received.', {
          roomId: normalizedRoomId,
          senderUserId: payload.senderUserId,
        });

        const peerLink = getOrCreatePeerLink(payload.senderUserId);

        if (!peerLink) {
          return;
        }

        void peerLink.handleAnswer(payload.answer).catch((error) => {
          console.error('[meeting] Failed to apply remote answer.', {
            roomId: normalizedRoomId,
            senderUserId: payload.senderUserId,
            error,
          });
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ICE_CANDIDATE, (payload) => {
        if (!payload?.senderUserId || !payload?.candidate) {
          return;
        }

        console.info('[meeting] ICE candidate received.', {
          roomId: normalizedRoomId,
          senderUserId: payload.senderUserId,
        });

        const peerLink = getOrCreatePeerLink(payload.senderUserId);

        if (!peerLink) {
          return;
        }

        void peerLink.handleIceCandidate(payload.candidate).catch((error) => {
          console.error('[meeting] Failed to apply ICE candidate.', {
            roomId: normalizedRoomId,
            senderUserId: payload.senderUserId,
            error,
          });
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.PARTICIPANT_MEDIA_UPDATED, (payload) => {
        if (!payload?.userId) {
          return;
        }

        setParticipants((currentParticipants) => {
          const existingParticipant = currentParticipants.find(
            (participant) => participant.userId === payload.userId,
          );

          if (!existingParticipant && !payload.participant) {
            return currentParticipants;
          }

          const nextParticipant = mapServerParticipant(
            payload.participant ?? {
              ...existingParticipant,
              userId: payload.userId,
              audioEnabled: payload.audioEnabled,
              videoEnabled: payload.videoEnabled,
            },
            existingParticipant,
            payload.hostUserId,
            profile.userId,
          );

          return sortParticipants(
            applyLocalParticipantMediaState([
              ...currentParticipants.filter((participant) => participant.userId !== payload.userId),
              nextParticipant,
            ]),
          );
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.SCREEN_SHARE_UPDATED, (payload) => {
        if (!payload?.presenterUserId && !payload?.room) {
          return;
        }

        console.info('[meeting] Screen share stage updated.', {
          roomId: normalizedRoomId,
          presenterUserId: payload.presenterUserId ?? null,
        });

        if (
          screenShareStateRef.current.isScreenSharing &&
          payload.presenterUserId !== profile.userId
        ) {
          void screenShareStateRef.current.stopScreenShare?.({
            source: 'remote-stage-update',
          });
        }

        mergeRoomInfo(payload.room ?? {
          presenterUserId: payload.presenterUserId ?? null,
          spotlightUserId: payload.spotlightUserId ?? null,
        });
        setParticipants((currentParticipants) =>
          sortParticipants(
            applyLocalParticipantMediaState(
              currentParticipants.map((participant) => ({
                ...participant,
                isPresenting:
                  participant.userId === (payload.presenterUserId ?? payload.room?.presenterUserId ?? null),
                presentationStream:
                  participant.userId === profile.userId &&
                  participant.userId === (payload.presenterUserId ?? payload.room?.presenterUserId ?? null)
                    ? participant.presentationStream ?? screenShareStateRef.current.screenStream ?? null
                    : null,
              })),
            ),
          ),
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.CHAT_MESSAGE, (payload) => {
        if (!payload?.message) {
          return;
        }

        pushMessage(payload.message, {
          markUnread: payload.message.senderId !== profile.userId,
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.HAND_RAISED, (payload) => {
        if (!payload?.userId) {
          return;
        }

        console.info('[meeting] Hand raised event received.', {
          roomId: normalizedRoomId,
          userId: payload.userId,
          raisedAt: payload.raisedAt ?? null,
        });

        setParticipants((currentParticipants) => {
          const existingParticipant = currentParticipants.find(
            (participant) => participant.userId === payload.userId,
          );

          if (!existingParticipant && !payload.participant) {
            return currentParticipants;
          }

          const nextParticipant = mapServerParticipant(
            payload.participant ?? {
              ...existingParticipant,
              userId: payload.userId,
              handRaised: true,
            },
            existingParticipant,
            payload.hostUserId,
            profile.userId,
          );

          return sortParticipants(
            applyLocalParticipantMediaState([
              ...currentParticipants.filter((participant) => participant.userId !== payload.userId),
              {
                ...nextParticipant,
                handRaised: true,
                handRaisedAt: payload.raisedAt ?? new Date().toISOString(),
              },
            ]),
          );
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.HAND_LOWERED, (payload) => {
        if (!payload?.userId) {
          return;
        }

        console.info('[meeting] Hand lowered event received.', {
          roomId: normalizedRoomId,
          userId: payload.userId,
        });

        setParticipants((currentParticipants) => {
          const existingParticipant = currentParticipants.find(
            (participant) => participant.userId === payload.userId,
          );

          if (!existingParticipant && !payload.participant) {
            return currentParticipants;
          }

          const nextParticipant = mapServerParticipant(
            payload.participant ?? {
              ...existingParticipant,
              userId: payload.userId,
              handRaised: false,
            },
            existingParticipant,
            payload.hostUserId,
            profile.userId,
          );

          return sortParticipants(
            applyLocalParticipantMediaState([
              ...currentParticipants.filter((participant) => participant.userId !== payload.userId),
              {
                ...nextParticipant,
                handRaised: false,
                handRaisedAt: null,
              },
            ]),
          );
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.LOWER_HAND_FOR_USER, (payload) => {
        if (!payload?.targetUserId) {
          return;
        }

        appendSystemMessage(
          payload.targetUserId === profile.userId
            ? 'The host lowered your hand.'
            : 'The host lowered one participant from the raised-hand queue.',
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.LOWER_ALL_HANDS, (payload) => {
        if (!Array.isArray(payload?.targetUserIds) || payload.targetUserIds.length === 0) {
          return;
        }

        appendSystemMessage('The host cleared the raised-hand queue.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.SPOTLIGHT_USER, (payload) => {
        mergeRoomInfo(payload.room ?? {
          presenterUserId: payload.presenterUserId ?? null,
          spotlightUserId: payload.spotlightUserId ?? null,
        });
        appendSystemMessage('The host updated the shared spotlight for the room.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.CLEAR_SPOTLIGHT, (payload) => {
        mergeRoomInfo(payload.room ?? {
          presenterUserId: payload.presenterUserId ?? null,
          spotlightUserId: null,
        });
        appendSystemMessage('The host cleared the shared spotlight.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.WAITING_ROOM_UPDATED, () => {
        roomData.refresh?.();
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.PARTICIPANT_ADMITTED, () => {
        roomData.refresh?.();
        appendSystemMessage('A waiting participant was admitted to the meeting.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.PARTICIPANT_DENIED, (payload) => {
        roomData.refresh?.();

        if (payload?.participant?.userId === profile.userId) {
          handleForcedExit({
            reason: 'waiting-room-denied',
            title: 'Join request not admitted',
            description:
              'The host or co-host denied this waiting-room request. You can safely return home and try again later.',
          });
          return;
        }

        appendSystemMessage('A waiting participant was denied entry.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ROOM_SETTINGS_UPDATED, (payload) => {
        mergeRoomInfo(payload.room ?? {
          roomSettings: payload.roomSettings ?? null,
          isLocked: payload.isRoomLocked ?? false,
        });
        roomData.refresh?.();
        appendSystemMessage('Room permissions were updated.');
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.PARTICIPANT_ROLE_UPDATED, (payload) => {
        if (!payload?.participant?.userId) {
          return;
        }

        setParticipants((currentParticipants) => {
          const existingParticipant = currentParticipants.find(
            (participant) => participant.userId === payload.participant.userId,
          );

          if (!existingParticipant) {
            return currentParticipants;
          }

          const nextParticipant = mapServerParticipant(
            payload.participant,
            existingParticipant,
            roomInfo?.hostUserId ?? null,
            profile.userId,
          );

          return sortParticipants(
            applyLocalParticipantMediaState([
              ...currentParticipants.filter(
                (participant) => participant.userId !== payload.participant.userId,
              ),
              nextParticipant,
            ]),
          );
        });

        if (payload.participant.userId === profile.userId) {
          setCurrentRole(payload.participant.role ?? 'participant');
        }

        appendSystemMessage('Participant role access was updated.');
        roomData.refresh?.();
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ROOM_RECORDING_SESSION_UPDATED, (payload) => {
        setRoomRecordingSession(payload?.recordingSession ?? null);
        roomData.refresh?.();
        appendSystemMessage(
          payload?.recordingSession?.status === 'active'
            ? 'Shared room recording is now active.'
            : 'Shared room recording has stopped.',
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ADMIN_FORCE_MUTE, (payload) => {
        if (payload?.targetUserId !== profile.userId) {
          return;
        }

        commitLocalMediaState(
          { audioEnabled: false },
          {
            notice: 'Host turned off your microphone.',
            systemMessage: 'Host turned off your microphone.',
          },
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ADMIN_FORCE_CAMERA_OFF, (payload) => {
        if (payload?.targetUserId !== profile.userId) {
          return;
        }

        commitLocalMediaState(
          { videoEnabled: false },
          {
            notice: 'Host turned off your camera.',
            systemMessage: 'Host turned off your camera.',
          },
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ADMIN_MUTE_ALL, () => {
        if (participantsRef.current.find((participant) => participant.userId === profile.userId)?.isHost) {
          return;
        }

        commitLocalMediaState(
          { audioEnabled: false },
          {
            notice: 'Host muted all participant microphones.',
            systemMessage: 'Host muted all participant microphones.',
          },
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ADMIN_CAMERA_OFF_ALL, () => {
        if (participantsRef.current.find((participant) => participant.userId === profile.userId)?.isHost) {
          return;
        }

        commitLocalMediaState(
          { videoEnabled: false },
          {
            notice: 'Host turned off all participant cameras.',
            systemMessage: 'Host turned off all participant cameras.',
          },
        );
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.USER_LEFT, (payload) => {
        if (!payload?.participant?.userId) {
          return;
        }

        closePeerLink(payload.participant.userId);
        mergeRoomInfo(payload.room);
        setParticipants((currentParticipants) =>
          removeParticipant(currentParticipants, payload.participant.userId),
        );
        appendSystemMessage(`${payload.participant.userName} left the room.`);
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.KICK_USER, (payload) => {
        if (!payload?.userId) {
          return;
        }

        if (payload.userId === profile.userId) {
          handleForcedExit({
            reason: 'kicked',
            title: 'You were removed from the meeting',
            description:
              payload.message ??
              'The host removed you from this room. You can safely return to the homepage and start or join another meeting.',
          });
          return;
        }

        closePeerLink(payload.userId);
        setParticipants((currentParticipants) => removeParticipant(currentParticipants, payload.userId));
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.ROOM_FULL, (payload) => {
        handleForcedExit({
          reason: 'room-full',
          title: 'This meeting is full',
          description:
            payload?.message ??
            'The room reached its participant limit before you could join. Return safely and try another room or create a new one.',
        });
      }),
      socketClient.on(MEETING_SOCKET_EVENTS.SERVER.MEETING_ERROR, (payload) => {
        if (!payload?.message) {
          return;
        }

        if (payload.code === 'ROOM_NOT_FOUND') {
          handleForcedExit({
            reason: 'room-missing',
            title: 'Meeting not found',
            description: payload.message,
          });
          return;
        }

        if (payload.code === 'TARGET_NOT_CONNECTED') {
          console.warn('[meeting] Signaling target is no longer connected.', payload);
          return;
        }

        setMediaError(payload.message);
        appendSystemMessage(payload.message);
        showStatusNotice(payload.message, 'error');
      }),
    ];

    socketClient.connect();

    return () => {
      unsubscribeHandlers.forEach((unsubscribe) => unsubscribe());
      cleanupRoomTransport({
        notifyLeave: socketClient.isConnected(),
      });
    };
  }, [
    authStatus,
    exitState,
    mediaBootstrapStatus,
    meetingAuth.token,
    normalizedRoomId,
    profile.userId,
    profile.userName,
    roomDataStatus,
  ]);

  useEffect(() => {
    if (isChatCurrentlyVisible()) {
      setUnreadChatCount(0);
    }
  }, [activeSidebarTab, isSidebarOpen]);

  useEffect(() => {
    if (!recording.savedRecording) {
      return;
    }

    setRecordings((currentRecordings) =>
      mergeRecordingsByRecency(recording.savedRecording, currentRecordings),
    );
    roomData.refresh?.();
  }, [recording.savedRecording]);

  function openSidebar(tab) {
    setActiveSidebarTab(tab);
    setIsSidebarOpen(true);
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function cycleLayoutMode() {
    setLayoutMode((currentLayoutMode) => (currentLayoutMode === 'grid' ? 'speaker' : 'grid'));
  }

  function togglePinnedParticipant(targetUserId) {
    setPinnedUserId((currentPinnedUserId) =>
      currentPinnedUserId === targetUserId ? null : targetUserId,
    );
  }

  async function toggleScreenShare(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (screenShareToggleInFlightRef.current) {
      return;
    }

    if (!screenShare.isSupported) {
      showStatusNotice('Screen sharing is not supported in this browser.', 'warning');
      return;
    }

    if (roomInfo?.roomSettings?.screenShareEnabled === false) {
      showStatusNotice('The host has disabled screen sharing for this meeting.', 'warning');
      return;
    }

    screenShareToggleInFlightRef.current = true;
    setIsScreenShareTransitioning(true);

    try {
      if (screenShare.isScreenSharing) {
        await screenShare.stopScreenShare({
          source: 'toggle',
        });
        return;
      }

      await screenShare.startScreenShare();
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('[meeting] Screen share toggle failed.', {
          roomId: normalizedRoomId,
          userId: profile.userId,
          error,
        });
      }
    } finally {
      screenShareToggleInFlightRef.current = false;
      setIsScreenShareTransitioning(false);
    }
  }

  function toggleMicrophone() {
    const { audioEnabled } = getCurrentLocalMediaState();
    void commitLocalMediaState({ audioEnabled: !audioEnabled });
  }

  function toggleCamera() {
    const { videoEnabled } = getCurrentLocalMediaState();
    void commitLocalMediaState({ videoEnabled: !videoEnabled });
  }

  function toggleRaiseHand() {
    if (roomInfo?.roomSettings?.raiseHandEnabled === false) {
      showStatusNotice('The host has disabled raised hands for this meeting.', 'warning');
      return;
    }

    const nextHandRaised = !localParticipant?.handRaised;

    console.info('[meeting] Toggling hand state.', {
      roomId: normalizedRoomId,
      userId: profile.userId,
      handRaised: nextHandRaised,
    });

    setParticipants((currentParticipants) =>
      updateParticipant(currentParticipants, profile.userId, (participant) => ({
        ...participant,
        handRaised: nextHandRaised,
        handRaisedAt: nextHandRaised ? new Date().toISOString() : null,
      })),
    );

    socketRef.current?.emit(
      nextHandRaised
        ? MEETING_SOCKET_EVENTS.CLIENT.RAISE_HAND
        : MEETING_SOCKET_EVENTS.CLIENT.LOWER_HAND,
      {
        roomId: normalizedRoomId,
        userId: profile.userId,
      },
    );
  }

  async function sendMessage(customMessage) {
    if (roomInfo?.roomSettings?.chatEnabled === false) {
      showStatusNotice('Chat is disabled for this meeting right now.', 'warning');
      return false;
    }

    const nextText = String(customMessage ?? draftMessage).trim();

    if (!nextText) {
      return false;
    }

    setDraftMessage('');

    if (socketRef.current?.isConnected?.()) {
      socketRef.current.emit(MEETING_SOCKET_EVENTS.CLIENT.CHAT_MESSAGE, {
        roomId: normalizedRoomId,
        message: {
          senderId: profile.userId,
          senderName: profile.userName,
          text: nextText,
        },
      });

      return true;
    }

    try {
      const response = await createMeetingRoomMessage({
        roomCode: normalizedRoomId,
        userId: profile.userId,
        content: nextText,
      });

      if (response?.message) {
        pushMessage(response.message);
      }

      showStatusNotice('Live sync is reconnecting, so the message was saved through the API.', 'warning');
      return true;
    } catch (error) {
      setDraftMessage(nextText);
      showStatusNotice(error.message, 'error');
      return false;
    }
  }

  function toggleRecording() {
    if (recording.isRecording) {
      return recording.stopRecording();
    }

    return recording.startRecording();
  }

  function downloadUploadedRecording() {
    const latestUploadedRecording = pickLatestUploadedRecording(recordings, recording.savedRecording);

    if (!latestUploadedRecording?.fileUrl) {
      return false;
    }

    const fileName = latestUploadedRecording.fileName || buildRecordingDownloadName(normalizedRoomId);
    const didStartDownload = triggerRecordingDownload(latestUploadedRecording.fileUrl, fileName);

    if (didStartDownload) {
      showStatusNotice('Uploaded recording download started.', 'success');
      return true;
    }

    if (openRecordingInNewTab(latestUploadedRecording.fileUrl)) {
      showStatusNotice('Uploaded recording opened in a new tab.', 'success');
      return true;
    }

    return false;
  }

  function downloadRecording() {
    const didDownloadLocalRecording = recording.downloadRecording();

    if (didDownloadLocalRecording) {
      return true;
    }

    const didDownloadUploadedRecording = downloadUploadedRecording();

    if (didDownloadUploadedRecording) {
      return true;
    }

    showStatusNotice('No recording is available to download yet.', 'warning');
    return false;
  }

  function leaveMeeting() {
    cleanupRoomTransport({
      notifyLeave: socketRef.current?.isConnected?.(),
    });
  }

  const roomTitle = roomInfo?.title ?? 'This meeting room';
  const presenterParticipant =
    participants.find((participant) => participant.userId === presenterUserId) ?? null;
  const spotlightParticipant =
    participants.find((participant) => participant.userId === spotlightUserId) ?? null;
  const presenterLabel = presenterParticipant
    ? `${presenterParticipant.userName} is presenting`
    : 'No one is presenting';
  const spotlightLabel = spotlightParticipant
    ? `${spotlightParticipant.userName} is spotlighted`
    : 'No spotlight';
  const connectionLabel =
    connectionState === 'connected'
      ? 'Live sync'
      : connectionState === 'reconnecting'
        ? reconnectAttemptCount > 0
          ? `Reconnecting (${reconnectAttemptCount})`
          : 'Reconnecting'
        : connectionState === 'degraded'
          ? 'Media degraded'
          : connectionState === 'failed'
            ? 'Connection failed'
            : 'Connecting';
  const connectionTone =
    connectionState === 'connected'
      ? 'success'
      : connectionState === 'failed'
        ? 'error'
        : connectionState === 'reconnecting' || connectionState === 'degraded'
          ? 'warning'
          : 'info';
  const connectionSummary =
    connectionState === 'connected'
      ? `${roomTitle} is connected and syncing chat, participant updates, and media recovery in real time.`
      : connectionState === 'reconnecting'
        ? `${roomTitle} is trying to restore live sync now. The page will rejoin the room and rebuild media routes automatically when the socket returns.`
        : connectionState === 'degraded'
          ? `${roomTitle} is still open, but live sync dropped for a moment. Existing peer media may continue while chat and participant updates reconnect.`
          : connectionState === 'failed'
        ? `${roomTitle} could not restore live sync. Refresh the meeting to reconnect the room cleanly.`
            : `Connecting ${roomTitle} to live meeting sync and room services now.`;
  const roomSettings = roomInfo?.roomSettings ?? roomData.roomSettings ?? null;
  const isRoomRecordingActive = roomRecordingSession?.status === 'active';
  const currentLocalMediaState = getCurrentLocalMediaState();

  return {
    activeSidebarTab,
    activeSpeakerUserId,
    admissionStatus,
    adminActionNames: adminControls.actionNames,
    currentRole,
    appendSystemMessage,
    admitParticipant: adminControls.admitParticipant,
    cameraOffAllParticipants: adminControls.cameraOffAllParticipants,
    cameraOffParticipant: adminControls.cameraOffParticipant,
    clearSpotlight: adminControls.clearSpotlight,
    closeSidebar,
    connectionLabel,
    connectionState,
    connectionSummary,
    connectionTone,
    cycleLayoutMode,
    draftMessage,
    downloadRecording,
    denyParticipant: adminControls.denyParticipant,
    elapsedTimeLabel: formatElapsedTime(elapsedSeconds),
    exitState,
    inviteLink: buildInviteUrl(normalizedRoomId),
    isHost,
    isModerator,
    isInitializing:
      authStatus === 'loading' ||
      mediaBootstrapStatus === 'requesting' ||
      roomDataStatus === 'loading' ||
      roomDataStatus === 'idle',
    isRoomRecordingActive,
    isRecording: recording.isRecording,
    isRecordingReady: recording.hasRecording,
    isAdminActionPending: adminControls.isActionPending,
    isLocalCameraEnabled: currentLocalMediaState.videoEnabled,
    isLocalMicrophoneEnabled: currentLocalMediaState.audioEnabled,
    isScreenShareSupported: screenShare.isSupported,
    isScreenSharing: screenShare.isScreenSharing,
    isScreenShareTransitioning,
    isSidebarOpen,
    isSocketConnected: hasLiveTransport,
    kickParticipant: adminControls.kickParticipant,
    layoutMode,
    leaveMeeting,
    localParticipant,
    localVideoRef,
    lowerAllHands: adminControls.lowerAllHands,
    lowerParticipantHand: adminControls.lowerParticipantHand,
    mediaError,
    mediaBootstrapStatus,
    messages,
    meetingEvents,
    makeCohost: adminControls.makeCohost,
    muteAllParticipants: adminControls.muteAllParticipants,
    muteParticipant: adminControls.muteParticipant,
    openSidebar,
    participants,
    pinnedUserId,
    presenterLabel,
    presenterUserId,
    room: roomInfo,
    authError,
    authStatus,
    roomDataError,
    roomDataStatus,
    roomRecordingSession,
    roomSettings,
    recordingError: recording.error || recording.uploadError,
    recordings,
    recordingStatus: recording.recordingStatus,
    recordingPhase: recording.recordingPhase,
    recordingTime: recording.recordingTime,
    recordingTimeLabel: recording.elapsedTimeLabel,
    hasUploadedRecording,
    savedRecording: recording.savedRecording,
    recordedFileUrl: recording.recordedFileUrl,
    downloadUploadedRecording,
    roomId: normalizedRoomId,
    sendMessage,
    setActiveSidebarTab,
    setDraftMessage,
    showStatusNotice,
    socketMode,
    spotlightLabel,
    spotlightParticipant: adminControls.spotlightParticipant,
    spotlightUserId,
    startRoomRecording: adminControls.startRoomRecording,
    statusNotice,
    stopRoomRecording: adminControls.stopRoomRecording,
    toggleCamera,
    toggleMicrophone,
    togglePinnedParticipant,
    toggleRaiseHand,
    toggleRecording,
    toggleScreenShare,
    unreadChatCount,
    updateRoomPermission: adminControls.updateRoomPermission,
    waitingParticipants,
    removeCohost: adminControls.removeCohost,
    getPeerDiagnosticsTargets,
  };
}

export default useMeetingRoom;
