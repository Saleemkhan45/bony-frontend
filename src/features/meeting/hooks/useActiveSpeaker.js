import { useEffect, useState } from 'react';

function getAudioContextConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.AudioContext ?? window.webkitAudioContext ?? null;
}

function calculateAudioLevel(analyser, sampleBuffer) {
  analyser.getByteTimeDomainData(sampleBuffer);

  let total = 0;

  for (let index = 0; index < sampleBuffer.length; index += 1) {
    const normalizedSample = (sampleBuffer[index] - 128) / 128;
    total += normalizedSample * normalizedSample;
  }

  return Math.sqrt(total / sampleBuffer.length);
}

function useActiveSpeaker({
  localStream,
  localUserId,
  participants,
  holdDurationMs = 1400,
  threshold = 0.045,
} = {}) {
  const [activeSpeakerUserId, setActiveSpeakerUserId] = useState(null);

  useEffect(() => {
    const AudioContextConstructor = getAudioContextConstructor();

    if (!AudioContextConstructor) {
      setActiveSpeakerUserId(null);
      return undefined;
    }

    const streamEntries = [];

    if (localUserId && localStream?.getAudioTracks().length) {
      streamEntries.push({
        userId: localUserId,
        stream: localStream,
      });
    }

    participants.forEach((participant) => {
      if (
        !participant.isLocal &&
        participant.mediaStream &&
        participant.mediaStream.getAudioTracks().length > 0
      ) {
        streamEntries.push({
          userId: participant.userId,
          stream: participant.mediaStream,
        });
      }
    });

    if (streamEntries.length === 0) {
      setActiveSpeakerUserId(null);
      return undefined;
    }

    const audioContext = new AudioContextConstructor();
    const monitoredStreams = streamEntries.map(({ stream, userId }) => {
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);

      return {
        analyser,
        sampleBuffer: new Uint8Array(analyser.fftSize),
        source,
        userId,
      };
    });

    let animationFrameId = 0;
    let lastActiveSpeakerUserId = null;
    let lastActiveSpeakerAt = 0;

    const measure = () => {
      if (audioContext.state === 'suspended') {
        void audioContext.resume().catch(() => {});
      }

      let loudestSpeaker = {
        level: 0,
        userId: null,
      };

      monitoredStreams.forEach(({ analyser, sampleBuffer, userId }) => {
        const level = calculateAudioLevel(analyser, sampleBuffer);

        if (level > loudestSpeaker.level) {
          loudestSpeaker = {
            level,
            userId,
          };
        }
      });

      const now = Date.now();

      if (loudestSpeaker.userId && loudestSpeaker.level >= threshold) {
        lastActiveSpeakerUserId = loudestSpeaker.userId;
        lastActiveSpeakerAt = now;
        setActiveSpeakerUserId((currentValue) =>
          currentValue === loudestSpeaker.userId ? currentValue : loudestSpeaker.userId,
        );
      } else if (
        lastActiveSpeakerUserId &&
        now - lastActiveSpeakerAt <= holdDurationMs
      ) {
        setActiveSpeakerUserId((currentValue) =>
          currentValue === lastActiveSpeakerUserId ? currentValue : lastActiveSpeakerUserId,
        );
      } else {
        lastActiveSpeakerUserId = null;
        setActiveSpeakerUserId(null);
      }

      animationFrameId = window.requestAnimationFrame(measure);
    };

    animationFrameId = window.requestAnimationFrame(measure);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }

      monitoredStreams.forEach(({ source }) => {
        source.disconnect();
      });

      void audioContext.close().catch(() => {});
    };
  }, [holdDurationMs, localStream, localUserId, participants, threshold]);

  return activeSpeakerUserId;
}

export default useActiveSpeaker;
