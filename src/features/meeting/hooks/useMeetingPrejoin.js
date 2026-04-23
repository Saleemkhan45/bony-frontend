import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getMeetingPreferences,
  getOrCreateMeetingProfile,
  normalizeRoomId,
  saveMeetingPreferences,
  saveMeetingProfile,
} from '../utils/meetingRoom';
import {
  describeMediaError,
  getBrowserMediaDiagnostics,
  isPermissionMediaError,
  isRecoverableMediaError,
  requestUserMedia,
  summarizeMediaConstraints,
  supportsGetUserMedia,
} from '../utils/media';

function stopStream(stream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function buildMediaConstraints({
  audioEnabled,
  cameraId,
  ignoreSavedDevices = false,
  microphoneId,
  videoEnabled,
}) {
  return {
    audio: audioEnabled
      ? ignoreSavedDevices || !microphoneId
        ? true
        : { deviceId: { exact: microphoneId } }
      : false,
    video: videoEnabled
      ? ignoreSavedDevices || !cameraId
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        : {
            deviceId: { exact: cameraId },
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

function mapDevices(devices, kind) {
  return devices
    .filter((device) => device.kind === kind)
    .map((device, index) => ({
      deviceId: device.deviceId,
      label:
        device.label ||
        `${kind === 'audioinput' ? 'Microphone' : 'Camera'} ${index + 1}`,
    }));
}

function buildPreviewError(error) {
  if (!error) {
    return 'Unable to start the device preview right now.';
  }

  if (isPermissionMediaError(error)) {
    const browserDiagnostics = getBrowserMediaDiagnostics();
    return browserDiagnostics.isSecureContext
      ? 'Camera or microphone access is blocked. You can still join without media and re-enable access later.'
      : 'Camera and microphone access requires a secure origin (HTTPS or localhost).';
  }

  if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
    return 'The selected camera or microphone is unavailable right now. Choose another device or use your system default.';
  }

  return error.message || 'Unable to start the device preview right now.';
}

function useMeetingPrejoin(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const [profile] = useState(() => getOrCreateMeetingProfile());
  const [storedPreferences] = useState(() => getMeetingPreferences());
  const [displayName, setDisplayName] = useState(
    storedPreferences.displayName || profile.userName || '',
  );
  const [audioEnabled, setAudioEnabled] = useState(storedPreferences.audioEnabled);
  const [videoEnabled, setVideoEnabled] = useState(storedPreferences.videoEnabled);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState(
    storedPreferences.microphoneId,
  );
  const [selectedCameraId, setSelectedCameraId] = useState(storedPreferences.cameraId);
  const [devices, setDevices] = useState({
    audioInputs: [],
    videoInputs: [],
  });
  const [previewStatus, setPreviewStatus] = useState('loading');
  const [previewError, setPreviewError] = useState('');
  const [previewHasVideoTrack, setPreviewHasVideoTrack] = useState(false);
  const [formError, setFormError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const previewVideoRef = useRef(null);
  const previewStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnimationFrameRef = useRef(null);
  const analyserRef = useRef(null);

  function teardownAudioMeter() {
    if (audioAnimationFrameRef.current) {
      window.cancelAnimationFrame(audioAnimationFrameRef.current);
      audioAnimationFrameRef.current = null;
    }

    analyserRef.current = null;

    if (audioContextRef.current) {
      void audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    setAudioLevel(0);
  }

  async function refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const nextDevices = await navigator.mediaDevices.enumerateDevices();

      setDevices({
        audioInputs: mapDevices(nextDevices, 'audioinput'),
        videoInputs: mapDevices(nextDevices, 'videoinput'),
      });
    } catch (error) {
      console.warn('[prejoin] Unable to enumerate media devices.', error);
    }
  }

  function attachPreviewStream(stream) {
    if (!previewVideoRef.current) {
      return;
    }

    previewVideoRef.current.srcObject = stream ?? null;
  }

  function startAudioMeter(stream) {
    teardownAudioMeter();

    const audioTrack = stream?.getAudioTracks?.()[0];
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!audioTrack || !AudioContextClass) {
      return;
    }

    try {
      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(new MediaStream([audioTrack]));
      const sampleBuffer = new Uint8Array(analyser.fftSize);

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const updateLevel = () => {
        if (!analyserRef.current) {
          return;
        }

        analyserRef.current.getByteTimeDomainData(sampleBuffer);

        let sumSquares = 0;

        sampleBuffer.forEach((value) => {
          const normalizedValue = (value - 128) / 128;
          sumSquares += normalizedValue * normalizedValue;
        });

        const rms = Math.sqrt(sumSquares / sampleBuffer.length);
        setAudioLevel(Math.min(1, rms * 4));
        audioAnimationFrameRef.current = window.requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.warn('[prejoin] Unable to start the audio level meter.', error);
    }
  }

  useEffect(() => {
    void refreshDevices();

    if (!navigator.mediaDevices?.addEventListener) {
      return undefined;
    }

    const handleDeviceChange = () => {
      void refreshDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, []);

  useEffect(() => {
    saveMeetingPreferences({
      audioEnabled,
      cameraId: selectedCameraId,
      displayName,
      microphoneId: selectedMicrophoneId,
      videoEnabled,
    });

    if (displayName.trim()) {
      saveMeetingProfile({
        userId: profile.userId,
        userName: displayName.trim(),
      });
    }
  }, [
    audioEnabled,
    displayName,
    profile.userId,
    selectedCameraId,
    selectedMicrophoneId,
    videoEnabled,
  ]);

  useEffect(() => {
    const browserDiagnostics = getBrowserMediaDiagnostics();
    console.info('[prejoin] Browser media capabilities detected.', {
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

    async function startPreview() {
      stopStream(previewStreamRef.current);
      previewStreamRef.current = null;
      attachPreviewStream(null);
      teardownAudioMeter();
      setPreviewHasVideoTrack(false);

      if (!supportsGetUserMedia()) {
        setPreviewStatus('unsupported');
        setPreviewError(
          'This browser cannot access camera and microphone previews. You can still join, but device setup needs a supported browser.',
        );
        return;
      }

      if (!audioEnabled && !videoEnabled) {
        setPreviewStatus('ready');
        setPreviewError('');
        setPreviewHasVideoTrack(false);
        return;
      }

      setPreviewStatus('loading');
      setPreviewError('');

      async function requestPreview({
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
          : buildMediaConstraints({
              audioEnabled: requestAudioEnabled,
              cameraId: selectedCameraId,
              ignoreSavedDevices,
              microphoneId: selectedMicrophoneId,
              videoEnabled: requestVideoEnabled,
            });
        console.info('[prejoin] Local preview media request attempt.', {
          constraints: summarizeMediaConstraints(constraints),
          ignoreSavedDevices,
          requestLabel,
          requestTracks: {
            requestAudioEnabled,
            requestVideoEnabled,
          },
          roomId: normalizedRoomId,
          useSimpleConstraints,
          userId: profile.userId,
        });

        try {
          const stream = await requestUserMedia(constraints);
          console.info('[prejoin] Local preview media request succeeded.', {
            audioTrackCount: stream.getAudioTracks().length,
            requestLabel,
            roomId: normalizedRoomId,
            userId: profile.userId,
            videoTrackCount: stream.getVideoTracks().length,
          });
          return stream;
        } catch (error) {
          console.warn('[prejoin] Local preview media request failed.', {
            error: describeMediaError(error),
            requestLabel,
            roomId: normalizedRoomId,
            userId: profile.userId,
          });
          throw error;
        }
      }

      async function requestPreviewWithDeviceFallback(requestAudioEnabled, requestVideoEnabled) {
        let lastError = null;

        try {
          return await requestPreview({
            requestAudioEnabled,
            requestVideoEnabled,
            requestLabel: 'preferred',
          });
        } catch (error) {
          lastError = error;
          const hasSavedMicrophone = requestAudioEnabled && Boolean(selectedMicrophoneId);
          const hasSavedCamera = requestVideoEnabled && Boolean(selectedCameraId);

          if (
            isRecoverableMediaError(error) &&
            (hasSavedMicrophone || hasSavedCamera)
          ) {
            try {
              const fallbackStream = await requestPreview({
                requestAudioEnabled,
                requestVideoEnabled,
                requestLabel: 'fallback-ignore-saved-devices',
                ignoreSavedDevices: true,
              });

              if (hasSavedMicrophone) {
                setSelectedMicrophoneId('');
              }

              if (hasSavedCamera) {
                setSelectedCameraId('');
              }

              setPreviewError(
                'A saved camera or microphone was unavailable, so the preview switched to your default devices.',
              );

              return fallbackStream;
            } catch (fallbackError) {
              lastError = fallbackError;
            }
          }

          if (requestVideoEnabled && isRecoverableMediaError(lastError)) {
            try {
              return await requestPreview({
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

      try {
        let stream;

        try {
          stream = await requestPreviewWithDeviceFallback(audioEnabled, videoEnabled);
        } catch (error) {
          if (audioEnabled && videoEnabled) {
            let audioOnlyStream = null;
            let videoOnlyStream = null;

            try {
              audioOnlyStream = await requestPreviewWithDeviceFallback(true, false);
            } catch {
              audioOnlyStream = null;
            }

            try {
              videoOnlyStream = await requestPreviewWithDeviceFallback(false, true);
            } catch {
              videoOnlyStream = null;
            }

            if (!audioOnlyStream && !videoOnlyStream) {
              throw error;
            }

            stream = new MediaStream();

            audioOnlyStream?.getAudioTracks().forEach((track) => {
              stream.addTrack(track);
            });
            videoOnlyStream?.getVideoTracks().forEach((track) => {
              stream.addTrack(track);
            });

            if (audioOnlyStream && !videoOnlyStream) {
              setPreviewError('Microphone is ready, but no camera was detected on this device.');
            } else if (!audioOnlyStream && videoOnlyStream) {
              setPreviewError('Camera is ready, but no microphone was detected on this device.');
            }
          } else {
            throw error;
          }
        }

        if (!isMounted) {
          stopStream(stream);
          return;
        }

        previewStreamRef.current = stream;
        attachPreviewStream(stream);
        startAudioMeter(stream);
        setPreviewStatus('ready');
        setPreviewHasVideoTrack(stream.getVideoTracks().length > 0);
        void refreshDevices();
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.warn('[prejoin] Failed to initialize local preview media.', {
          error: describeMediaError(error),
          roomId: normalizedRoomId,
          userId: profile.userId,
        });
        setPreviewHasVideoTrack(false);
        setPreviewStatus(
          isPermissionMediaError(error)
            ? 'blocked'
            : 'error',
        );
        setPreviewError(buildPreviewError(error));
      }
    }

    void startPreview();

    return () => {
      isMounted = false;
    };
  }, [audioEnabled, selectedCameraId, selectedMicrophoneId, videoEnabled]);

  useEffect(() => {
    attachPreviewStream(previewStreamRef.current);
  }, [previewStatus]);

  useEffect(() => {
    return () => {
      stopStream(previewStreamRef.current);
      previewStreamRef.current = null;
      teardownAudioMeter();
    };
  }, []);

  function updateDisplayName(nextValue) {
    setDisplayName(nextValue);

    if (formError) {
      setFormError('');
    }
  }

  function prepareJoin(overrides = {}) {
    const nextDisplayName = displayName.trim();

    if (!nextDisplayName) {
      setFormError('Add your name before joining the meeting.');
      return {
        success: false,
      };
    }

    const nextPreferences = {
      audioEnabled:
        typeof overrides.audioEnabled === 'boolean'
          ? overrides.audioEnabled
          : audioEnabled,
      cameraId: selectedCameraId,
      displayName: nextDisplayName,
      microphoneId: selectedMicrophoneId,
      videoEnabled:
        typeof overrides.videoEnabled === 'boolean'
          ? overrides.videoEnabled
          : videoEnabled,
    };

    saveMeetingPreferences(nextPreferences);
    saveMeetingProfile({
      userId: profile.userId,
      userName: nextDisplayName,
    });

    return {
      success: true,
      preferences: nextPreferences,
    };
  }

  return useMemo(
    () => ({
      audioEnabled,
      audioLevel,
      devices,
      displayName,
      formError,
      previewError,
      previewStatus,
      previewHasVideoTrack,
      previewVideoRef,
      prepareJoin,
      refreshDevices,
      roomId: normalizedRoomId,
      selectedCameraId,
      selectedMicrophoneId,
      setSelectedCameraId,
      setSelectedMicrophoneId,
      setVideoEnabled,
      setAudioEnabled,
      updateDisplayName,
      videoEnabled,
    }),
    [
      audioEnabled,
      audioLevel,
      devices,
      displayName,
      formError,
      normalizedRoomId,
      previewError,
      previewHasVideoTrack,
      previewStatus,
      selectedCameraId,
      selectedMicrophoneId,
      videoEnabled,
    ],
  );
}

export default useMeetingPrejoin;
