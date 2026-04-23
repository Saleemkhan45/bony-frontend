import { useEffect, useRef, useState } from 'react';
import { formatElapsedTime } from '../features/meeting/utils/meetingRoom';
import {
  isRecordingDownloadUrlSupported,
  openRecordingInNewTab,
  triggerRecordingDownload,
} from '../features/meeting/utils/recordingDownload';

const RECORDING_MIME_TYPES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp8',
  'video/webm',
];

function stopStream(stream) {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

function getSupportedMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return '';
  }

  return RECORDING_MIME_TYPES.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) ?? '';
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function buildFileName(roomCode) {
  const safeRoomCode = String(roomCode ?? 'meeting').trim().toUpperCase() || 'MEETING';
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;

  return `meeting-${safeRoomCode}-${timestamp}.webm`;
}

function cloneRecordingStream(localStream) {
  if (!localStream) {
    return null;
  }

  const clonedTracks = localStream.getTracks().map((track) => track.clone());

  if (clonedTracks.length === 0) {
    return null;
  }

  return new MediaStream(clonedTracks);
}

function toUploadErrorMessage(error) {
  return error?.message || 'Upload failed, saved locally only.';
}

function useRecording({
  onNotice,
  onStatusMessage,
  roomId,
  streamRef,
  uploadRecording = null,
  startRoomRecordingSession = null,
  stopRoomRecordingSession = null,
}) {
  const STATUS_TOAST_AUTO_HIDE_MS = 4200;
  const [downloadUrl, setDownloadUrl] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function',
  );
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [savedRecording, setSavedRecording] = useState(null);
  const [recordingPhase, setRecordingPhase] = useState('idle');
  const [recordingStatus, setRecordingStatus] = useState('Ready to record your local camera and microphone.');
  const [sourceMode] = useState('camera');
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const chunksRef = useRef([]);
  const objectUrlRef = useRef('');
  const timerRef = useRef(null);
  const startedAtRef = useRef(0);
  const fileNameRef = useRef(buildFileName(roomId));
  const shouldStopRoomSessionRef = useRef(false);
  const phaseResetTimeoutRef = useRef(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        typeof MediaRecorder !== 'undefined' &&
        typeof URL !== 'undefined' &&
        typeof URL.createObjectURL === 'function',
    );
  }, []);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      stopStream(recordingStreamRef.current);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      if (phaseResetTimeoutRef.current) {
        window.clearTimeout(phaseResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phaseResetTimeoutRef.current) {
      window.clearTimeout(phaseResetTimeoutRef.current);
      phaseResetTimeoutRef.current = null;
    }

    if (recordingPhase !== 'uploaded' && recordingPhase !== 'upload-failed') {
      return;
    }

    phaseResetTimeoutRef.current = window.setTimeout(() => {
      setRecordingPhase('idle');
      phaseResetTimeoutRef.current = null;
    }, STATUS_TOAST_AUTO_HIDE_MS);

    return () => {
      if (phaseResetTimeoutRef.current) {
        window.clearTimeout(phaseResetTimeoutRef.current);
        phaseResetTimeoutRef.current = null;
      }
    };
  }, [recordingPhase]);

  function clearPreviousRecording() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = '';
    }

    setDownloadUrl('');
    setRecordedBlob(null);
    setSavedRecording(null);
    setUploadError('');
  }

  function startTimer() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }

    timerRef.current = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (!timerRef.current) {
      return;
    }

    window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function runUpload(blob, fileName) {
    if (!uploadRecording) {
      setRecordingPhase('idle');
      return;
    }

    setIsUploading(true);
    setRecordingPhase('uploading');
    setRecordingStatus('Uploading recording...');
    onStatusMessage?.('Uploading recording...');

    const file = new File([blob], fileName, {
      type: blob.type || 'video/webm',
    });

    try {
      const payload = await uploadRecording({
        blob,
        file,
        fileName,
        roomCode: roomId,
        mimeType: file.type,
      });
      const persistedRecording = payload?.recording ?? payload?.data?.recording ?? null;

      setSavedRecording(persistedRecording);
      setRecordingPhase('uploaded');
      setRecordingStatus('Recording uploaded successfully.');
      onNotice?.('Recording uploaded successfully.', 'success');
      onStatusMessage?.('Recording uploaded successfully.');
    } catch (uploadFailure) {
      const nextErrorMessage = toUploadErrorMessage(uploadFailure);

      setUploadError(nextErrorMessage);
      setRecordingPhase('upload-failed');
      setRecordingStatus('Upload failed, saved locally only.');
      onNotice?.(nextErrorMessage, 'warning');
      onStatusMessage?.('Upload failed, saved locally only.');
    } finally {
      setIsUploading(false);
    }
  }

  async function startRecording() {
    if (!isSupported) {
      const nextMessage = 'This browser does not support MediaRecorder-based meeting capture.';
      setError(nextMessage);
      setRecordingStatus(nextMessage);
      onNotice?.(nextMessage, 'error');
      onStatusMessage?.(nextMessage);
      return false;
    }

    if (mediaRecorderRef.current?.state === 'recording' || isUploading) {
      return false;
    }

    const liveStream = streamRef.current;
    const recordingStream = cloneRecordingStream(liveStream);

    if (!recordingStream) {
      const nextMessage = 'Recording needs an active local camera or microphone stream.';
      setError(nextMessage);
      setRecordingStatus(nextMessage);
      onNotice?.(nextMessage, 'error');
      onStatusMessage?.(nextMessage);
      return false;
    }

    clearPreviousRecording();

    if (startRoomRecordingSession) {
      try {
        await startRoomRecordingSession();
        shouldStopRoomSessionRef.current = true;
      } catch {
        shouldStopRoomSessionRef.current = false;
      }
    }

    const mimeType = getSupportedMimeType();
    const recorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream);

    chunksRef.current = [];
    recordingStreamRef.current = recordingStream;
    mediaRecorderRef.current = recorder;
    fileNameRef.current = buildFileName(roomId);
    setError('');
    setElapsedSeconds(0);
    setUploadError('');
    setSavedRecording(null);
    setRecordingPhase('recording');

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      const nextMessage = event?.error?.message ?? 'Recording stopped because the browser reported an error.';
      setError(nextMessage);
      setRecordingStatus(nextMessage);
      onNotice?.(nextMessage, 'error');
      onStatusMessage?.(nextMessage);
    };

    recorder.onstop = async () => {
      stopTimer();
      setIsRecording(false);

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || 'video/webm',
      });
      const nextDownloadUrl = URL.createObjectURL(blob);

      objectUrlRef.current = nextDownloadUrl;
      setRecordedBlob(blob);
      setDownloadUrl(nextDownloadUrl);
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));

      stopStream(recordingStreamRef.current);
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      chunksRef.current = [];

      if (shouldStopRoomSessionRef.current && stopRoomRecordingSession) {
        shouldStopRoomSessionRef.current = false;

        try {
          await stopRoomRecordingSession();
        } catch {
          // Keep local recording flow alive even if shared room session update fails.
        }
      }

      await runUpload(blob, fileNameRef.current);

      if (!uploadRecording) {
        setRecordingStatus('Recording saved locally. Download it before leaving the page.');
        onNotice?.('Recording is ready to download.', 'success');
        onStatusMessage?.('Recording stopped. Download the saved WEBM file when ready.');
      }
    };

    startedAtRef.current = Date.now();
    recorder.start(1000);
    startTimer();
    setIsRecording(true);
    setRecordingStatus('Recording started.');
    onNotice?.('Recording started.', 'success');
    onStatusMessage?.('Recording started.');
    return true;
  }

  function stopRecording() {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      return false;
    }

    mediaRecorderRef.current.stop();
    setRecordingPhase('stopping');
    setRecordingStatus('Stopping recording...');
    return true;
  }

  function downloadRecording() {
    if (downloadUrl && recordedBlob) {
      const didStartDownload = triggerRecordingDownload(downloadUrl, fileNameRef.current);

      if (didStartDownload) {
        onNotice?.('Recording download started.', 'success');
      }

      return didStartDownload;
    }

    const persistedUrl = savedRecording?.fileUrl ?? '';

    if (!persistedUrl) {
      return false;
    }

    const didStartDownload = triggerRecordingDownload(
      persistedUrl,
      savedRecording.fileName || fileNameRef.current,
    );

    if (didStartDownload) {
      onNotice?.('Uploaded recording download started.', 'success');
      return true;
    }

    if (openRecordingInNewTab(persistedUrl)) {
      return true;
    }

    return false;
  }

  function downloadUploadedRecording() {
    const persistedUrl = savedRecording?.fileUrl ?? '';

    if (!persistedUrl) {
      return false;
    }

    const didStartDownload = triggerRecordingDownload(
      persistedUrl,
      savedRecording.fileName || fileNameRef.current,
    );

    if (didStartDownload) {
      onNotice?.('Uploaded recording download started.', 'success');
      return true;
    }

    if (openRecordingInNewTab(persistedUrl)) {
      return true;
    }

    return false;
  }

  return {
    downloadRecording,
    downloadUploadedRecording,
    downloadUrl,
    elapsedTimeLabel: formatElapsedTime(elapsedSeconds),
    error,
    fileName: fileNameRef.current,
    hasRecording: Boolean(downloadUrl && recordedBlob),
    hasUploadedRecording: isRecordingDownloadUrlSupported(savedRecording?.fileUrl),
    isRecording,
    isSupported,
    isUploading,
    recordedBlob,
    recordedFileUrl: downloadUrl,
    recordingPhase,
    recordingStatus,
    recordingTime: elapsedSeconds,
    savedRecording,
    sourceMode,
    startRecording,
    stopRecording,
    uploadError,
  };
}

export default useRecording;
