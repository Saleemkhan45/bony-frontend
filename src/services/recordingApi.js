import { getMeetingApiBaseUrl } from '../features/meeting/services/apiClient';
import { getStoredMeetingAccessToken } from '../features/meeting/utils/meetingAuth';

async function parseApiPayload(response, fallbackMessage) {
  const payload = await response.json().catch(() => ({
    success: false,
    message: 'Unexpected API response.',
  }));

  if (!response.ok) {
    const error = new Error(payload.message ?? fallbackMessage);
    error.status = response.status;
    error.code = payload.code;
    error.payload = payload;
    throw error;
  }

  return payload;
}

function getAuthHeaders() {
  const accessToken = getStoredMeetingAccessToken();

  return accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
      }
    : {};
}

function normalizeRecordingFile(file, roomCode, { fileName = '', mimeType = '' } = {}) {
  if (file instanceof File) {
    return file;
  }

  const safeRoomCode = String(roomCode ?? 'meeting').trim().toUpperCase() || 'MEETING';
  const fallbackFileName = fileName || `meeting-${safeRoomCode}-${Date.now()}.webm`;
  const fallbackMimeType = mimeType || file?.type || 'video/webm';

  return new File([file], fallbackFileName, {
    type: fallbackMimeType,
  });
}

export async function uploadRoomRecording(roomCode, file, options = {}) {
  const normalizedFile = normalizeRecordingFile(file, roomCode, options);
  const formData = new FormData();

  formData.append('recording', normalizedFile);
  formData.append('roomCode', roomCode);

  if (options.userId) {
    formData.append('userId', options.userId);
  }

  if (options.mimeType) {
    formData.append('mimeType', options.mimeType);
  }

  if (options.fileName) {
    formData.append('fileName', options.fileName);
  }

  const response = await fetch(`${getMeetingApiBaseUrl()}/api/recordings/upload`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  return parseApiPayload(response, 'Unable to upload the meeting recording.');
}

export async function startRoomRecordingSession(roomCode) {
  const response = await fetch(`${getMeetingApiBaseUrl()}/api/recordings/sessions/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      roomCode,
    }),
  });

  return parseApiPayload(response, 'Unable to start the room recording session.');
}

export async function stopRoomRecordingSession(roomCode) {
  const response = await fetch(`${getMeetingApiBaseUrl()}/api/recordings/sessions/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      roomCode,
    }),
  });

  return parseApiPayload(response, 'Unable to stop the room recording session.');
}

export async function listRoomRecordings(roomCode) {
  const response = await fetch(`${getMeetingApiBaseUrl()}/api/recordings/${encodeURIComponent(roomCode)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseApiPayload(response, 'Unable to load room recordings.');
}

export async function listRoomRecordingSessions(roomCode) {
  const response = await fetch(`${getMeetingApiBaseUrl()}/api/recordings/sessions/${encodeURIComponent(roomCode)}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseApiPayload(response, 'Unable to load room recording sessions.');
}
