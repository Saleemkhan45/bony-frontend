import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMeetingSummary } from '../services/roomApi';
import {
  appendMeetingTranscriptSegment,
  exportMeetingTranscript,
  getMeetingTranscript,
} from '../services/transcriptApi';

function createEmptyState() {
  return {
    meetingSummary: null,
    transcriptSegments: [],
    transcriptStatus: 'pending',
  };
}

function toTimestamp(value) {
  const parsedValue = Date.parse(value ?? '');
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function normalizeTranscriptSegment(segment) {
  if (!segment || typeof segment.content !== 'string') {
    return null;
  }

  const normalizedContent = segment.content.trim();

  if (!normalizedContent) {
    return null;
  }

  return {
    ...segment,
    content: normalizedContent,
    isFinal: Boolean(segment.isFinal),
  };
}

function mergeTranscriptSegmentsByTime(...segmentSources) {
  const transcriptSegmentByIdentity = new Map();

  segmentSources.flat().forEach((segment) => {
    const normalizedSegment = normalizeTranscriptSegment(segment);

    if (!normalizedSegment) {
      return;
    }

    const startedAtValue = normalizedSegment.startedAt ?? normalizedSegment.createdAt ?? '';
    const fallbackIdentity = `fallback:${normalizedSegment.speakerUserId ?? normalizedSegment.speakerLabel ?? normalizedSegment.speakerUserName ?? ''}:${startedAtValue}:${normalizedSegment.content}`;
    const segmentIdentity = normalizedSegment.id ? `id:${normalizedSegment.id}` : fallbackIdentity;
    const currentSegment = transcriptSegmentByIdentity.get(segmentIdentity);

    if (!currentSegment) {
      transcriptSegmentByIdentity.set(segmentIdentity, normalizedSegment);
      return;
    }

    const currentTimestamp = toTimestamp(currentSegment.endedAt ?? currentSegment.createdAt ?? currentSegment.startedAt);
    const nextTimestamp = toTimestamp(
      normalizedSegment.endedAt ?? normalizedSegment.createdAt ?? normalizedSegment.startedAt,
    );

    if (
      nextTimestamp > currentTimestamp ||
      (normalizedSegment.isFinal && !currentSegment.isFinal)
    ) {
      transcriptSegmentByIdentity.set(segmentIdentity, normalizedSegment);
    }
  });

  return Array.from(transcriptSegmentByIdentity.values()).sort((firstSegment, secondSegment) => {
    const firstStartedAt = toTimestamp(firstSegment.startedAt ?? firstSegment.createdAt);
    const secondStartedAt = toTimestamp(secondSegment.startedAt ?? secondSegment.createdAt);

    if (firstStartedAt !== secondStartedAt) {
      return firstStartedAt - secondStartedAt;
    }

    return String(firstSegment.id ?? '').localeCompare(String(secondSegment.id ?? ''));
  });
}

function buildTranscriptSignature(transcriptStatus, transcriptSegments) {
  const normalizedSegments = Array.isArray(transcriptSegments) ? transcriptSegments : [];
  const lastSegment = normalizedSegments[normalizedSegments.length - 1] ?? null;
  const tailMarker =
    lastSegment?.id ??
    `${lastSegment?.startedAt ?? lastSegment?.createdAt ?? ''}:${lastSegment?.content ?? ''}`;

  return `${transcriptStatus ?? 'pending'}:${normalizedSegments.length}:${tailMarker}`;
}

function triggerTextDownload(fileName, fileContents) {
  const blob = new Blob([fileContents], { type: 'text/plain;charset=utf-8' });
  const objectUrl = window.URL.createObjectURL(blob);
  const anchorElement = document.createElement('a');

  anchorElement.href = objectUrl;
  anchorElement.download = fileName;
  anchorElement.click();
  window.URL.revokeObjectURL(objectUrl);
}

function useMeetingHistory(roomCode, { activeTab = '', enabled = true } = {}) {
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [persistedHistory, setPersistedHistory] = useState(() => createEmptyState());
  const [sessionTranscriptSegments, setSessionTranscriptSegments] = useState([]);
  const [liveTranscriptState, setLiveTranscriptState] = useState({
    status: 'idle',
    message: '',
  });
  const [transcriptExportState, setTranscriptExportState] = useState({
    status: 'idle',
    message: '',
  });
  const [refreshToken, setRefreshToken] = useState(0);
  const localSegmentCounterRef = useRef(0);
  const transcriptExportTimerRef = useRef(null);
  const historyLoadInFlightRef = useRef(false);
  const transcriptSyncInFlightRef = useRef(false);
  const transcriptSignatureRef = useRef('');
  const isTranscriptTabActive = activeTab === 'transcript';

  const clearTranscriptExportTimer = useCallback(() => {
    if (!transcriptExportTimerRef.current) {
      return;
    }

    window.clearTimeout(transcriptExportTimerRef.current);
    transcriptExportTimerRef.current = null;
  }, []);

  const scheduleTranscriptExportReset = useCallback(
    (delayMs = 3200) => {
      clearTranscriptExportTimer();
      transcriptExportTimerRef.current = window.setTimeout(() => {
        setTranscriptExportState({
          status: 'idle',
          message: '',
        });
        transcriptExportTimerRef.current = null;
      }, delayMs);
    },
    [clearTranscriptExportTimer],
  );

  useEffect(() => {
    clearTranscriptExportTimer();
    setPersistedHistory(createEmptyState());
    setSessionTranscriptSegments([]);
    transcriptSignatureRef.current = '';
    historyLoadInFlightRef.current = false;
    transcriptSyncInFlightRef.current = false;
    setLiveTranscriptState({
      status: 'idle',
      message: '',
    });
    setTranscriptExportState({
      status: 'idle',
      message: '',
    });
    setError(null);
    setStatus(enabled ? 'loading' : 'idle');
  }, [clearTranscriptExportTimer, enabled, roomCode]);

  useEffect(
    () => () => {
      clearTranscriptExportTimer();
    },
    [clearTranscriptExportTimer],
  );

  const loadHistory = useCallback(async () => {
    if (!enabled || !roomCode) {
      setStatus('idle');
      setPersistedHistory(createEmptyState());
      return;
    }

    if (historyLoadInFlightRef.current) {
      return;
    }

    historyLoadInFlightRef.current = true;
    setStatus((currentStatus) => (currentStatus === 'ready' ? 'ready' : 'loading'));
    setError(null);

    try {
      const [summaryPayload, transcriptPayload] = await Promise.all([
        getMeetingSummary(roomCode),
        getMeetingTranscript(roomCode),
      ]);
      const nextTranscriptSegments = Array.isArray(transcriptPayload.transcriptSegments)
        ? transcriptPayload.transcriptSegments
        : [];
      const nextTranscriptStatus = transcriptPayload.transcriptStatus ?? 'pending';

      transcriptSignatureRef.current = buildTranscriptSignature(
        nextTranscriptStatus,
        nextTranscriptSegments,
      );

      setPersistedHistory({
        meetingSummary: summaryPayload.meetingSummary ?? null,
        transcriptSegments: nextTranscriptSegments,
        transcriptStatus: nextTranscriptStatus,
      });
      setStatus('ready');
    } catch (nextError) {
      setError(nextError);
      setStatus('error');
    } finally {
      historyLoadInFlightRef.current = false;
    }
  }, [enabled, roomCode]);

  useEffect(() => {
    let isMounted = true;

    async function syncHistory() {
      if (!isMounted) {
        return;
      }

      await loadHistory();
    }

    void syncHistory();

    if (!enabled || !roomCode) {
      return () => {
        isMounted = false;
      };
    }

    const intervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return;
      }

      void syncHistory();
    }, 20000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [enabled, loadHistory, refreshToken, roomCode]);

  useEffect(() => {
    if (!enabled || !roomCode) {
      return undefined;
    }

    let isCancelled = false;
    const intervalMs = isTranscriptTabActive ? 1800 : 6500;

    async function syncTranscriptOnly() {
      if (transcriptSyncInFlightRef.current) {
        return;
      }

      if (
        !isTranscriptTabActive &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      transcriptSyncInFlightRef.current = true;

      try {
        const transcriptPayload = await getMeetingTranscript(roomCode);

        if (isCancelled) {
          return;
        }

        const nextTranscriptSegments = Array.isArray(transcriptPayload.transcriptSegments)
          ? transcriptPayload.transcriptSegments
          : [];
        const nextTranscriptStatus = transcriptPayload.transcriptStatus ?? persistedHistory.transcriptStatus;
        const nextTranscriptSignature = buildTranscriptSignature(
          nextTranscriptStatus,
          nextTranscriptSegments,
        );

        if (nextTranscriptSignature === transcriptSignatureRef.current) {
          return;
        }

        transcriptSignatureRef.current = nextTranscriptSignature;
        setPersistedHistory((currentHistory) => ({
          ...currentHistory,
          transcriptSegments: nextTranscriptSegments,
          transcriptStatus: nextTranscriptStatus,
        }));
      } catch (syncError) {
        if (isCancelled) {
          return;
        }

        console.warn('[transcript] Transcript polling failed.', {
          roomCode,
          error: syncError,
        });
      } finally {
        transcriptSyncInFlightRef.current = false;
      }
    }

    void syncTranscriptOnly();

    const intervalId = window.setInterval(() => {
      void syncTranscriptOnly();
    }, intervalMs);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    enabled,
    isTranscriptTabActive,
    persistedHistory.transcriptStatus,
    roomCode,
  ]);

  const mergedTranscriptSegments = useMemo(
    () =>
      mergeTranscriptSegmentsByTime(
        persistedHistory.transcriptSegments,
        sessionTranscriptSegments,
      ),
    [persistedHistory.transcriptSegments, sessionTranscriptSegments],
  );

  const transcriptStatus = useMemo(() => {
    if (liveTranscriptState.status === 'unsupported') {
      return 'unsupported';
    }

    if (liveTranscriptState.status === 'error') {
      return 'error';
    }

    if (
      liveTranscriptState.status === 'starting' ||
      liveTranscriptState.status === 'listening'
    ) {
      return 'live';
    }

    if (
      persistedHistory.transcriptStatus === 'ready' ||
      mergedTranscriptSegments.some((segment) => segment.isFinal)
    ) {
      return 'ready';
    }

    return persistedHistory.transcriptStatus ?? 'pending';
  }, [liveTranscriptState.status, mergedTranscriptSegments, persistedHistory.transcriptStatus]);

  const transcriptMessage = useMemo(() => {
    if (liveTranscriptState.message) {
      return liveTranscriptState.message;
    }

    if (transcriptStatus === 'pending' && mergedTranscriptSegments.length === 0) {
      return 'No transcript segments have been captured in this meeting yet.';
    }

    return '';
  }, [liveTranscriptState.message, mergedTranscriptSegments.length, transcriptStatus]);

  const appendTranscriptSegment = useCallback(
    async (segmentPayload) => {
      if (!enabled || !roomCode) {
        return null;
      }

      const normalizedContent = String(segmentPayload?.content ?? '').trim();

      if (!normalizedContent) {
        return null;
      }

      localSegmentCounterRef.current += 1;
      const optimisticSegmentId = `local-${Date.now()}-${localSegmentCounterRef.current}`;
      const nowIsoTimestamp = new Date().toISOString();
      const optimisticSegment = {
        id: optimisticSegmentId,
        roomId: roomCode,
        speakerUserId: segmentPayload?.speakerUserId ?? null,
        speakerUserName: segmentPayload?.speakerUserName ?? segmentPayload?.speakerLabel ?? null,
        speakerLabel: segmentPayload?.speakerLabel ?? segmentPayload?.speakerUserName ?? 'Speaker',
        content: normalizedContent,
        isFinal: Boolean(segmentPayload?.isFinal),
        startedAt: segmentPayload?.startedAt ?? nowIsoTimestamp,
        endedAt: segmentPayload?.endedAt ?? nowIsoTimestamp,
        createdAt: nowIsoTimestamp,
      };

      console.info('[transcript] Transcript segment received from live source.', {
        roomCode,
        segmentId: optimisticSegment.id,
        isFinal: optimisticSegment.isFinal,
      });

      setSessionTranscriptSegments((currentSegments) =>
        mergeTranscriptSegmentsByTime(currentSegments, [optimisticSegment]),
      );

      try {
        const response = await appendMeetingTranscriptSegment(roomCode, {
          content: optimisticSegment.content,
          speakerLabel: optimisticSegment.speakerLabel,
          isFinal: optimisticSegment.isFinal,
          startedAt: optimisticSegment.startedAt,
          endedAt: optimisticSegment.endedAt,
        });
        const savedSegment = response?.transcriptSegment ?? null;

        if (!savedSegment) {
          throw new Error('Transcript segment response did not include the saved segment.');
        }

        setSessionTranscriptSegments((currentSegments) =>
          mergeTranscriptSegmentsByTime(
            currentSegments.filter((segment) => segment.id !== optimisticSegmentId),
            [savedSegment],
          ),
        );
        setPersistedHistory((currentHistory) => ({
          ...currentHistory,
          transcriptSegments: mergeTranscriptSegmentsByTime(
            currentHistory.transcriptSegments,
            [savedSegment],
          ),
          transcriptStatus: savedSegment.isFinal
            ? 'ready'
            : currentHistory.transcriptStatus,
        }));

        console.info('[transcript] Transcript segment persisted successfully.', {
          roomCode,
          segmentId: savedSegment.id,
          isFinal: savedSegment.isFinal,
        });

        return savedSegment;
      } catch (appendError) {
        setError(appendError);
        console.error('[transcript] Failed to persist transcript segment.', {
          roomCode,
          segmentId: optimisticSegmentId,
          error: appendError,
        });
        return optimisticSegment;
      }
    },
    [enabled, roomCode],
  );

  const updateLiveTranscriptState = useCallback((nextState = {}) => {
    setLiveTranscriptState((currentState) => {
      const resolvedStatus =
        typeof nextState.status === 'string' && nextState.status.trim()
          ? nextState.status
          : currentState.status;
      const resolvedMessage =
        typeof nextState.message === 'string'
          ? nextState.message
          : currentState.message;

      return {
        status: resolvedStatus,
        message: resolvedMessage,
      };
    });
  }, []);

  const downloadTranscript = useCallback(async () => {
    if (!roomCode) {
      return false;
    }

    clearTranscriptExportTimer();
    setTranscriptExportState({
      status: 'exporting',
      message: 'Saving meeting file...',
    });

    try {
      const exportPayload = await exportMeetingTranscript(roomCode);
      triggerTextDownload(
        exportPayload.fileName ?? `${roomCode}-transcript.txt`,
        exportPayload.transcriptText ?? '',
      );
      setTranscriptExportState({
        status: 'success',
        message: 'Transcript export started.',
      });
      scheduleTranscriptExportReset(2800);
      return true;
    } catch (exportError) {
      setTranscriptExportState({
        status: 'error',
        message: exportError?.message || 'Unable to export the transcript right now.',
      });
      scheduleTranscriptExportReset(4200);
      return false;
    }
  }, [clearTranscriptExportTimer, roomCode, scheduleTranscriptExportReset]);

  return useMemo(
    () => ({
      meetingSummary: persistedHistory.meetingSummary,
      transcriptSegments: mergedTranscriptSegments,
      transcriptStatus,
      transcriptMessage,
      liveTranscriptState,
      isExportingTranscript: transcriptExportState.status === 'exporting',
      status,
      error,
      errorMessage: error?.message ?? '',
      appendTranscriptSegment,
      setLiveTranscriptState: updateLiveTranscriptState,
      transcriptExportMessage: transcriptExportState.message,
      transcriptExportStatus: transcriptExportState.status,
      downloadTranscript,
      refresh() {
        setRefreshToken((currentValue) => currentValue + 1);
      },
    }),
    [
      appendTranscriptSegment,
      downloadTranscript,
      error,
      liveTranscriptState,
      mergedTranscriptSegments,
      persistedHistory.meetingSummary,
      transcriptExportState.message,
      transcriptExportState.status,
      transcriptMessage,
      transcriptStatus,
      status,
      updateLiveTranscriptState,
    ],
  );
}

export default useMeetingHistory;
