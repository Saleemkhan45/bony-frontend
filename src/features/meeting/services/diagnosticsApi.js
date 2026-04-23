import { requestMeetingJson } from './apiClient';

export async function recordMeetingQualitySample(payload) {
  return requestMeetingJson('/api/quality/samples', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getMeetingDiagnostics(roomCode) {
  return requestMeetingJson(`/api/quality/${encodeURIComponent(roomCode)}`);
}

export async function getParticipantMeetingQualityHistory(roomCode, userId) {
  return requestMeetingJson(`/api/quality/${encodeURIComponent(roomCode)}/${encodeURIComponent(userId)}`);
}
