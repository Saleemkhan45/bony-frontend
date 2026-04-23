import { useRef, useState } from 'react';

function stopMediaStream(stream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

const DISPLAY_MEDIA_CONSTRAINTS = Object.freeze({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30, max: 60 },
    cursor: 'always',
  },
  audio: false,
  preferCurrentTab: false,
  selfBrowserSurface: 'exclude',
  surfaceSwitching: 'include',
  monitorTypeSurfaces: 'include',
});

async function requestDisplayMediaStream() {
  try {
    return await navigator.mediaDevices.getDisplayMedia(DISPLAY_MEDIA_CONSTRAINTS);
  } catch (error) {
    if (error?.name !== 'TypeError' && error?.name !== 'OverconstrainedError') {
      throw error;
    }

    return navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
  }
}

function useScreenShare({ onStart, onStop, onError } = {}) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const screenStreamRef = useRef(null);
  const startingRef = useRef(false);
  const stoppingRef = useRef(false);

  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getDisplayMedia);

  async function stopScreenShare(options = {}) {
    if (startingRef.current || stoppingRef.current) {
      return;
    }

    const activeScreenStream = screenStreamRef.current;

    if (!activeScreenStream) {
      setIsScreenSharing(false);
      setScreenStream(null);
      return;
    }

    stoppingRef.current = true;

    try {
      await onStop?.(activeScreenStream, options);
    } finally {
      stopMediaStream(activeScreenStream);
      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);
      stoppingRef.current = false;
    }
  }

  async function startScreenShare() {
    if (startingRef.current || stoppingRef.current) {
      return screenStreamRef.current;
    }

    if (screenStreamRef.current) {
      return screenStreamRef.current;
    }

    if (!isSupported) {
      const error = new Error('Screen sharing is not supported in this browser.');
      onError?.(error);
      throw error;
    }

    startingRef.current = true;
    let nextScreenStream = null;

    try {
      nextScreenStream = await requestDisplayMediaStream();

      const primaryTrack = nextScreenStream.getVideoTracks()[0] ?? null;

      if (!primaryTrack) {
        stopMediaStream(nextScreenStream);
        throw new Error('No screen video track was returned.');
      }

      screenStreamRef.current = nextScreenStream;
      setScreenStream(nextScreenStream);
      setIsScreenSharing(true);

      primaryTrack.addEventListener(
        'ended',
        () => {
          void stopScreenShare({ source: 'track-ended' });
        },
        { once: true },
      );

      await onStart?.(nextScreenStream);
      return nextScreenStream;
    } catch (error) {
      if (nextScreenStream) {
        stopMediaStream(nextScreenStream);
      }

      screenStreamRef.current = null;
      setScreenStream(null);
      setIsScreenSharing(false);

      if (error?.name !== 'AbortError') {
        onError?.(error);
      }

      throw error;
    } finally {
      startingRef.current = false;
    }
  }

  return {
    isScreenSharing,
    isSupported,
    screenStream,
    startScreenShare,
    stopScreenShare,
  };
}

export default useScreenShare;
