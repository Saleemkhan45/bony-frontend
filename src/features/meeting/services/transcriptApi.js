import { requestMeetingJson } from './apiClient';

export async function getMeetingTranscript(roomCode) {
  return requestMeetingJson(`/api/transcripts/${encodeURIComponent(roomCode)}`);
}

export async function exportMeetingTranscript(roomCode) {
  return requestMeetingJson(`/api/transcripts/${encodeURIComponent(roomCode)}/export`);
}

export async function appendMeetingTranscriptSegment(roomCode, segment) {
  return requestMeetingJson(`/api/transcripts/${encodeURIComponent(roomCode)}`, {
    method: 'POST',
    body: JSON.stringify(segment),
  });
}
