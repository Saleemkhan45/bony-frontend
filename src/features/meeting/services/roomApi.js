import { requestMeetingJson } from './apiClient';

function getRequestControlOptions(options = {}) {
  return options.signal ? { signal: options.signal } : {};
}

export async function createMeetingRoom({ title, userId, userName }, options = {}) {
  return requestMeetingJson('/api/rooms', {
    method: 'POST',
    body: JSON.stringify({
      title,
      userId,
      userName,
    }),
    ...getRequestControlOptions(options),
  });
}

export async function joinMeetingRoom(roomCode) {
  return requestMeetingJson('/api/rooms/join', {
    method: 'POST',
    body: JSON.stringify({
      roomCode,
    }),
  });
}

export async function getMeetingRoomDetails(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}`);
}

export async function getMeetingRoomBootstrap(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/bootstrap`);
}

export async function getMeetingWaitingRoomState(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/waiting`);
}

export async function getMeetingWaitingParticipants(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/waiting/participants`);
}

export async function admitMeetingParticipant(roomCode, targetUserId) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/admit`, {
    method: 'POST',
    body: JSON.stringify({
      targetUserId,
    }),
  });
}

export async function denyMeetingParticipant(roomCode, targetUserId) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/deny`, {
    method: 'POST',
    body: JSON.stringify({
      targetUserId,
    }),
  });
}

export async function leaveMeetingRoom(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/leave`, {
    method: 'POST',
  });
}

export async function updateMeetingRoomSettings(roomCode, settings) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/settings`, {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export async function promoteMeetingParticipant(roomCode, targetUserId) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/roles/promote`, {
    method: 'POST',
    body: JSON.stringify({
      targetUserId,
    }),
  });
}

export async function demoteMeetingParticipant(roomCode, targetUserId) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/roles/demote`, {
    method: 'POST',
    body: JSON.stringify({
      targetUserId,
    }),
  });
}

export async function getMeetingRoomHistory(roomCode) {
  return requestMeetingJson(`/api/rooms/${encodeURIComponent(roomCode)}/history`);
}

export async function getMeetingSummary(roomCode) {
  return requestMeetingJson(`/api/summaries/${encodeURIComponent(roomCode)}`);
}
