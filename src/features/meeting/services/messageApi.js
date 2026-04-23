import { requestMeetingJson } from './apiClient';

export async function getMeetingRoomMessages(roomCode) {
  return requestMeetingJson(`/api/messages/${encodeURIComponent(roomCode)}`);
}

export async function createMeetingRoomMessage({ roomCode, userId, content }) {
  return requestMeetingJson('/api/messages', {
    method: 'POST',
    body: JSON.stringify({
      roomCode,
      userId,
      content,
    }),
  });
}
