import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMeetingRoomMessages } from '../services/messageApi';
import {
  getMeetingRoomRecordings,
  mergeMeetingRecordings,
} from '../services/recordingApi';
import {
  getMeetingRoomBootstrap,
  getMeetingRoomDetails,
  getMeetingRoomHistory,
} from '../services/roomApi';

function createEmptyRoomData() {
  return {
    admissionStatus: null,
    currentRole: 'participant',
    isRoomLocked: false,
    meetingEvents: [],
    room: null,
    roomRecordingSession: null,
    roomSettings: null,
    hostUserId: null,
    participants: [],
    messages: [],
    recordings: [],
    waitingParticipants: [],
  };
}

function toRoomData({
  roomPayload,
  bootstrapPayload,
  messagePayload,
  recordingPayload,
  historyPayload,
}) {
  return {
    admissionStatus: bootstrapPayload?.admissionStatus ?? roomPayload?.admissionStatus ?? null,
    currentRole: bootstrapPayload?.currentRole ?? roomPayload?.currentRole ?? 'participant',
    isRoomLocked:
      bootstrapPayload?.isRoomLocked ?? roomPayload?.isRoomLocked ?? roomPayload?.room?.isLocked ?? false,
    meetingEvents: Array.isArray(historyPayload?.meetingEvents)
      ? historyPayload.meetingEvents
      : Array.isArray(bootstrapPayload?.meetingEvents)
        ? bootstrapPayload.meetingEvents
        : [],
    room: roomPayload?.room ?? bootstrapPayload?.room ?? null,
    roomRecordingSession: bootstrapPayload?.roomRecordingSession ?? null,
    roomSettings:
      bootstrapPayload?.roomSettings ?? roomPayload?.roomSettings ?? roomPayload?.room?.roomSettings ?? null,
    hostUserId: roomPayload?.hostUserId ?? bootstrapPayload?.hostUserId ?? null,
    participants: Array.isArray(bootstrapPayload?.participants)
      ? bootstrapPayload.participants
      : [],
    messages: Array.isArray(messagePayload?.messages)
      ? messagePayload.messages
      : Array.isArray(bootstrapPayload?.messages)
        ? bootstrapPayload.messages
        : [],
    recordings: mergeMeetingRecordings(
      recordingPayload?.recordings,
      recordingPayload?.data?.recordings,
      bootstrapPayload?.recordings,
    ),
    waitingParticipants: Array.isArray(bootstrapPayload?.waitingParticipants)
      ? bootstrapPayload.waitingParticipants
      : [],
  };
}

function useMeetingRoomData(roomCode, { enabled = true } = {}) {
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [data, setData] = useState(() => createEmptyRoomData());
  const [refreshToken, setRefreshToken] = useState(0);
  const refreshTimerRef = useRef(null);
  const hasQueuedRefreshRef = useRef(false);
  const lastRefreshRequestAtRef = useRef(0);

  const requestRefresh = useCallback((baseDelayMs = 140) => {
    hasQueuedRefreshRef.current = true;

    if (refreshTimerRef.current) {
      return;
    }

    const elapsedSinceLastRequestMs = Date.now() - lastRefreshRequestAtRef.current;
    const minRefreshGapMs = 900;
    const resolvedDelayMs = Math.max(baseDelayMs, minRefreshGapMs - elapsedSinceLastRequestMs, 0);

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;

      if (!hasQueuedRefreshRef.current) {
        return;
      }

      hasQueuedRefreshRef.current = false;
      lastRefreshRequestAtRef.current = Date.now();
      setRefreshToken((currentValue) => currentValue + 1);
    }, resolvedDelayMs);
  }, []);

  useEffect(
    () => () => {
      if (!refreshTimerRef.current) {
        return;
      }

      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadMeetingRoomData() {
      if (!enabled) {
        setStatus('idle');
        return;
      }

      if (!roomCode) {
        setData(createEmptyRoomData());
        setStatus('error');
        setError(new Error('Meeting ID is required.'));
        return;
      }

      setStatus((currentStatus) => (currentStatus === 'ready' ? 'ready' : 'loading'));
      setError(null);

      try {
        const roomPayload = await getMeetingRoomDetails(roomCode);
        const [messageResult, bootstrapResult, historyResult, recordingResult] = await Promise.allSettled([
          getMeetingRoomMessages(roomCode),
          getMeetingRoomBootstrap(roomCode),
          getMeetingRoomHistory(roomCode),
          getMeetingRoomRecordings(roomCode),
        ]);
        const bootstrapPayload =
          bootstrapResult.status === 'fulfilled' ? bootstrapResult.value : {};
        const messagePayload =
          messageResult.status === 'fulfilled'
            ? messageResult.value
            : {
                messages: Array.isArray(bootstrapPayload?.messages)
                  ? bootstrapPayload.messages
                  : [],
              };
        const historyPayload =
          historyResult.status === 'fulfilled'
            ? historyResult.value
            : {
                meetingEvents: Array.isArray(bootstrapPayload?.meetingEvents)
                  ? bootstrapPayload.meetingEvents
                  : [],
              };
        const recordingPayload =
          recordingResult.status === 'fulfilled'
            ? recordingResult.value
            : {
                recordings: Array.isArray(bootstrapPayload?.recordings)
                  ? bootstrapPayload.recordings
                  : [],
              };

        if (!isMounted) {
          return;
        }

        setData(
          toRoomData({
            roomPayload,
            bootstrapPayload,
            messagePayload,
            recordingPayload,
            historyPayload,
          }),
        );
        setStatus('ready');
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setData(createEmptyRoomData());
        setError(loadError);
        setStatus(loadError?.status === 404 ? 'not-found' : 'error');
      }
    }

    void loadMeetingRoomData();

    return () => {
      isMounted = false;
    };
  }, [enabled, refreshToken, roomCode]);

  return useMemo(
    () => ({
      ...data,
      status,
      error,
      errorMessage: error?.message ?? '',
      refresh: requestRefresh,
    }),
    [data, error, requestRefresh, status],
  );
}

export default useMeetingRoomData;
