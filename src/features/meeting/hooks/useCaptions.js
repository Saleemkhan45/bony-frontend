import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function mergeLiveCaptionSegments(...segmentSources) {
  const segmentsByIdentity = new Map();

  segmentSources.flat().forEach((segment) => {
    if (!segment || typeof segment.content !== 'string' || !segment.content.trim()) {
      return;
    }

    const identity = segment.id
      ? `id:${segment.id}`
      : `fallback:${segment.speakerLabel ?? segment.speakerUserName ?? 'Speaker'}:${segment.startedAt ?? segment.createdAt ?? ''}:${segment.content.trim()}`;

    segmentsByIdentity.set(identity, {
      ...segment,
      content: segment.content.trim(),
    });
  });

  return Array.from(segmentsByIdentity.values()).sort((firstSegment, secondSegment) => {
    const firstStartedAt = Date.parse(firstSegment.startedAt ?? firstSegment.createdAt ?? '') || 0;
    const secondStartedAt = Date.parse(secondSegment.startedAt ?? secondSegment.createdAt ?? '') || 0;

    if (firstStartedAt !== secondStartedAt) {
      return firstStartedAt - secondStartedAt;
    }

    return String(firstSegment.id ?? '').localeCompare(String(secondSegment.id ?? ''));
  });
}

function mapRecognitionErrorToMessage(errorCode) {
  if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
    return 'Microphone permission is blocked, so live captions cannot start.';
  }

  if (errorCode === 'aborted') {
    return 'Live captions are restarting.';
  }

  if (errorCode === 'audio-capture') {
    return 'No microphone input was available for live captions.';
  }

  if (errorCode === 'network') {
    return 'Speech recognition hit a network issue. Live captions will retry automatically.';
  }

  if (errorCode === 'no-speech') {
    return 'No speech was detected. Live captions are still listening.';
  }

  return 'Live captions encountered an error.';
}

function detachRecognitionHandlers(recognition) {
  if (!recognition) {
    return;
  }

  recognition.onstart = null;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
}

function useCaptions({
  transcriptSegments = [],
  speakerLabel = 'You',
  language = 'en-US',
  onAppendTranscriptSegment = null,
  onUpdateTranscriptState = null,
  onNotice = null,
} = {}) {
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionsRuntimeStatus, setCaptionsRuntimeStatus] = useState('idle');
  const [captionsStatusMessage, setCaptionsStatusMessage] = useState('');
  const [livePreviewSegments, setLivePreviewSegments] = useState([]);
  const [interimCaptionSegment, setInterimCaptionSegment] = useState(null);
  const captionsEnabledRef = useRef(false);
  const manualStopRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);
  const liveSegmentCounterRef = useRef(0);
  const startRecognitionRef = useRef(null);
  const onAppendTranscriptSegmentRef = useRef(onAppendTranscriptSegment);
  const onNoticeRef = useRef(onNotice);
  const speakerLabelRef = useRef(speakerLabel);

  const SpeechRecognitionConstructor =
    typeof window === 'undefined'
      ? null
      : window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const isSupported = Boolean(SpeechRecognitionConstructor);

  const updateTranscriptRuntime = useCallback(
    (nextStatus, nextMessage = '') => {
      setCaptionsRuntimeStatus(nextStatus);
      setCaptionsStatusMessage(nextMessage);
      onUpdateTranscriptState?.({
        status: nextStatus,
        message: nextMessage,
      });
    },
    [onUpdateTranscriptState],
  );

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const scheduleRecognitionRestart = useCallback(
    ({ reason = 'unknown', delayMs = 350, statusMessage = 'Restarting live captions...' } = {}) => {
      clearRestartTimer();

      if (!captionsEnabledRef.current || manualStopRef.current) {
        return false;
      }

      updateTranscriptRuntime('starting', statusMessage);
      restartTimerRef.current = window.setTimeout(() => {
        if (!captionsEnabledRef.current || manualStopRef.current) {
          return;
        }

        startRecognitionRef.current?.();
      }, delayMs);

      return true;
    },
    [clearRestartTimer, updateTranscriptRuntime],
  );

  const stopRecognition = useCallback(
    ({ reason = 'manual-stop', resetRuntime = true } = {}) => {
      clearRestartTimer();
      manualStopRef.current = true;
      setInterimCaptionSegment(null);
      const activeRecognition = recognitionRef.current;
      recognitionRef.current = null;

      if (activeRecognition) {
        detachRecognitionHandlers(activeRecognition);

        try {
          activeRecognition.stop();
        } catch (error) {
          console.warn('[captions] Failed to stop speech recognition cleanly.', {
            reason,
            error,
          });
        }
      }

      if (resetRuntime) {
        updateTranscriptRuntime('idle', '');
      }
    },
    [clearRestartTimer, updateTranscriptRuntime],
  );

  const startRecognition = useCallback(() => {
    if (!isSupported) {
      const fallbackMessage = 'Live captions are not supported in this browser.';
      updateTranscriptRuntime('unsupported', fallbackMessage);
      onNoticeRef.current?.(fallbackMessage, 'warning');
      console.warn('[captions] Browser speech recognition is unavailable.');
      return;
    }

    stopRecognition({
      reason: 'restart-before-start',
      resetRuntime: false,
    });
    manualStopRef.current = false;

    try {
      const recognition = new SpeechRecognitionConstructor();
      const isStaleRecognitionInstance = () => recognitionRef.current !== recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if (isStaleRecognitionInstance()) {
          return;
        }

        updateTranscriptRuntime('listening', 'Live captions are listening.');
      };

      recognition.onresult = (event) => {
        if (isStaleRecognitionInstance()) {
          return;
        }

        let latestInterimTranscript = '';
        const finalizedTranscripts = [];

        for (let resultIndex = event.resultIndex; resultIndex < event.results.length; resultIndex += 1) {
          const result = event.results[resultIndex];
          const transcriptText = result?.[0]?.transcript?.trim() ?? '';

          if (!transcriptText) {
            continue;
          }

          if (result.isFinal) {
            finalizedTranscripts.push(transcriptText);
            continue;
          }

          latestInterimTranscript = transcriptText;
        }

        const nowIsoTimestamp = new Date().toISOString();

        if (latestInterimTranscript) {
          const nextSpeakerLabel = speakerLabelRef.current ?? 'Speaker';

          setInterimCaptionSegment({
            id: 'interim-live-caption',
            speakerLabel: nextSpeakerLabel,
            speakerUserName: nextSpeakerLabel,
            content: latestInterimTranscript,
            isFinal: false,
            startedAt: nowIsoTimestamp,
            endedAt: null,
            createdAt: nowIsoTimestamp,
          });
        } else {
          setInterimCaptionSegment(null);
        }

        if (finalizedTranscripts.length === 0) {
          return;
        }

        finalizedTranscripts.forEach((transcriptText) => {
          const nextSpeakerLabel = speakerLabelRef.current ?? 'Speaker';

          liveSegmentCounterRef.current += 1;
          const localLiveSegment = {
            id: `live-caption-${Date.now()}-${liveSegmentCounterRef.current}`,
            speakerLabel: nextSpeakerLabel,
            speakerUserName: nextSpeakerLabel,
            content: transcriptText,
            isFinal: true,
            startedAt: nowIsoTimestamp,
            endedAt: nowIsoTimestamp,
            createdAt: nowIsoTimestamp,
          };

          setLivePreviewSegments((currentSegments) =>
            mergeLiveCaptionSegments(currentSegments, [localLiveSegment]).slice(-8),
          );
          setInterimCaptionSegment(null);

          if (typeof onAppendTranscriptSegmentRef.current === 'function') {
            void Promise.resolve(
              onAppendTranscriptSegmentRef.current({
                content: transcriptText,
                speakerLabel: nextSpeakerLabel,
                isFinal: true,
                startedAt: nowIsoTimestamp,
                endedAt: nowIsoTimestamp,
              }),
            ).catch((appendError) => {
              console.error('[captions] Failed to append transcript segment.', appendError);
            });
          }
        });
      };

      recognition.onerror = (event) => {
        if (isStaleRecognitionInstance()) {
          return;
        }

        const errorCode = event?.error ?? null;
        const mappedMessage = mapRecognitionErrorToMessage(errorCode);

        console.warn('[captions] Speech recognition error.', {
          errorCode,
          mappedMessage,
        });

        if (manualStopRef.current) {
          return;
        }

        if (errorCode === 'not-allowed' || errorCode === 'service-not-allowed') {
          setCaptionsEnabled(false);
          manualStopRef.current = true;
          updateTranscriptRuntime('unsupported', mappedMessage);
          onNoticeRef.current?.(mappedMessage, 'warning');
          return;
        }

        if (errorCode === 'aborted') {
          scheduleRecognitionRestart({
            reason: 'speech-error-aborted',
            delayMs: 250,
            statusMessage: mappedMessage,
          });
          return;
        }

        if (errorCode === 'network') {
          scheduleRecognitionRestart({
            reason: 'speech-error-network',
            delayMs: 900,
            statusMessage: mappedMessage,
          });
          return;
        }

        if (errorCode === 'no-speech') {
          updateTranscriptRuntime('listening', mappedMessage);
          return;
        }

        updateTranscriptRuntime('error', mappedMessage);
        onNoticeRef.current?.(mappedMessage, 'warning');
      };

      recognition.onend = () => {
        if (isStaleRecognitionInstance()) {
          return;
        }

        if (!captionsEnabledRef.current || manualStopRef.current) {
          updateTranscriptRuntime('idle', '');
          return;
        }

        scheduleRecognitionRestart({
          reason: 'speech-ended',
          delayMs: 350,
        });
      };

      recognitionRef.current = recognition;
      updateTranscriptRuntime('starting', 'Starting live captions...');
      recognition.start();
    } catch (startError) {
      const fallbackMessage = startError?.message || 'Unable to start live captions.';
      updateTranscriptRuntime('error', fallbackMessage);
      onNoticeRef.current?.(fallbackMessage, 'warning');
      console.error('[captions] Failed to initialize speech recognition.', startError);
    }
  }, [
    SpeechRecognitionConstructor,
    isSupported,
    language,
    scheduleRecognitionRestart,
    stopRecognition,
    updateTranscriptRuntime,
  ]);

  useEffect(() => {
    startRecognitionRef.current = startRecognition;
  }, [startRecognition]);

  useEffect(() => {
    onAppendTranscriptSegmentRef.current = onAppendTranscriptSegment;
  }, [onAppendTranscriptSegment]);

  useEffect(() => {
    onNoticeRef.current = onNotice;
  }, [onNotice]);

  useEffect(() => {
    speakerLabelRef.current = speakerLabel;
  }, [speakerLabel]);

  useEffect(() => {
    captionsEnabledRef.current = captionsEnabled;
  }, [captionsEnabled]);

  useEffect(() => {
    if (!captionsEnabled) {
      stopRecognition({
        reason: 'captions-disabled',
      });
      return;
    }

    startRecognition();

    return () => {
      stopRecognition({
        reason: 'captions-effect-cleanup',
      });
    };
  }, [captionsEnabled, startRecognition, stopRecognition]);

  useEffect(() => () => {
    stopRecognition({
      reason: 'captions-hook-unmount',
    });
  }, [stopRecognition]);

  const activeCaptionSegments = useMemo(() => {
    if (!captionsEnabled) {
      return [];
    }

    const recentTranscriptSegments = transcriptSegments
      .filter((segment) => typeof segment.content === 'string' && segment.content.trim())
      .slice(-2);

    return mergeLiveCaptionSegments(
      recentTranscriptSegments.slice(-2),
      livePreviewSegments.slice(-2),
      interimCaptionSegment ? [interimCaptionSegment] : [],
    ).slice(-2);
  }, [captionsEnabled, interimCaptionSegment, livePreviewSegments, transcriptSegments]);

  const toggleCaptions = useCallback(() => {
    if (!captionsEnabledRef.current && !isSupported) {
      const fallbackMessage = 'Live captions are not supported in this browser.';
      updateTranscriptRuntime('unsupported', fallbackMessage);
      onNoticeRef.current?.(fallbackMessage, 'warning');
      return false;
    }

    setCaptionsEnabled((currentValue) => !currentValue);
    return true;
  }, [isSupported, updateTranscriptRuntime]);

  return {
    captionsEnabled,
    activeCaptionSegments,
    captionsRuntimeStatus,
    captionsStatusMessage,
    isSupported,
    setCaptionsEnabled,
    toggleCaptions,
  };
}

export default useCaptions;
