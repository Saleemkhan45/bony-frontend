import { normalizeRoomId as normalizeSharedRoomId } from '@/shared/utils/roomId';

const HOSTED_ROOMS_STORAGE_KEY = 'bony.hostedRooms';
const PREFERENCES_STORAGE_KEY = 'bony.meetingPreferences';
const PROFILE_STORAGE_KEY = 'bony.meetingProfile';

export const DEFAULT_PARTICIPANT_PERMISSIONS = Object.freeze({
  audio: true,
  video: true,
  chat: true,
  raiseHand: true,
});

function readJsonStorage(storage, key, fallbackValue) {
  try {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      return fallbackValue;
    }

    return JSON.parse(rawValue);
  } catch {
    return fallbackValue;
  }
}

function writeJsonStorage(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    return null;
  }

  return value;
}

export function saveMeetingProfile(profile) {
  if (typeof window === 'undefined') {
    return profile;
  }

  return writeJsonStorage(window.localStorage, PROFILE_STORAGE_KEY, profile);
}

export function normalizeRoomId(roomId) {
  return normalizeSharedRoomId(roomId);
}

export function generateRoomId(length = 8) {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);

    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, length)
      .toUpperCase();
  }

  return Math.random().toString(16).slice(2, 2 + length).toUpperCase().padEnd(length, '0');
}

export function buildMeetingRoomPath(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  return normalizedRoomId ? `/meeting/${normalizedRoomId}` : '/';
}

export function buildMeetingPrejoinPath(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  return normalizedRoomId ? `/meeting/${normalizedRoomId}/prejoin` : '/';
}

export function buildMeetingWaitingPath(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  return normalizedRoomId ? `/meeting/${normalizedRoomId}/waiting` : '/';
}

export function buildMeetingRecapPath(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);

  return normalizedRoomId ? `/meeting/${normalizedRoomId}/recap` : '/';
}

export function buildInviteUrl(roomId, { inviteToken = '' } = {}) {
  const normalizedRoomId = normalizeRoomId(roomId);
  const normalizedInviteToken = typeof inviteToken === 'string' ? inviteToken.trim() : '';
  const baseInviteUrl = `${window.location.origin}${buildMeetingPrejoinPath(normalizedRoomId)}`;

  if (!normalizedInviteToken) {
    return baseInviteUrl;
  }

  return `${baseInviteUrl}?invite=${encodeURIComponent(normalizedInviteToken)}`;
}

export function buildParticipantPermissions(overrides = {}) {
  return {
    ...DEFAULT_PARTICIPANT_PERMISSIONS,
    ...overrides,
  };
}

export function getOrCreateMeetingProfile() {
  if (typeof window === 'undefined') {
    return {
      userId: `user-${generateRoomId(12).toLowerCase()}`,
      userName: `Member ${generateRoomId(4)}`,
    };
  }

  const existingProfile = readJsonStorage(window.localStorage, PROFILE_STORAGE_KEY, null);

  if (existingProfile?.userId && existingProfile?.userName) {
    return existingProfile;
  }

  const nextProfile = {
    userId: `user-${generateRoomId(12).toLowerCase()}`,
    userName: `Member ${generateRoomId(4)}`,
  };

  saveMeetingProfile(nextProfile);

  return nextProfile;
}

export function getMeetingPreferences() {
  if (typeof window === 'undefined') {
    return {
      audioEnabled: true,
      cameraId: '',
      displayName: '',
      microphoneId: '',
      videoEnabled: true,
    };
  }

  const storedPreferences = readJsonStorage(window.localStorage, PREFERENCES_STORAGE_KEY, {});

  return {
    audioEnabled:
      typeof storedPreferences?.audioEnabled === 'boolean'
        ? storedPreferences.audioEnabled
        : true,
    cameraId: typeof storedPreferences?.cameraId === 'string' ? storedPreferences.cameraId : '',
    displayName:
      typeof storedPreferences?.displayName === 'string' ? storedPreferences.displayName : '',
    microphoneId:
      typeof storedPreferences?.microphoneId === 'string' ? storedPreferences.microphoneId : '',
    videoEnabled:
      typeof storedPreferences?.videoEnabled === 'boolean'
        ? storedPreferences.videoEnabled
        : true,
  };
}

export function saveMeetingPreferences(preferences) {
  if (typeof window === 'undefined') {
    return preferences;
  }

  const currentPreferences = getMeetingPreferences();

  return writeJsonStorage(window.localStorage, PREFERENCES_STORAGE_KEY, {
    ...currentPreferences,
    ...preferences,
  });
}

export function clearMeetingPreferences() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(PREFERENCES_STORAGE_KEY);
  } catch {
    return;
  }
}

export function markHostedRoom(roomId) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedRoomId = normalizeRoomId(roomId);
  const hostedRooms = readJsonStorage(window.sessionStorage, HOSTED_ROOMS_STORAGE_KEY, []);

  if (hostedRooms.includes(normalizedRoomId)) {
    return;
  }

  writeJsonStorage(window.sessionStorage, HOSTED_ROOMS_STORAGE_KEY, [
    ...hostedRooms,
    normalizedRoomId,
  ]);
}

export function isHostedRoom(roomId) {
  if (typeof window === 'undefined') {
    return false;
  }

  const normalizedRoomId = normalizeRoomId(roomId);
  const hostedRooms = readJsonStorage(window.sessionStorage, HOSTED_ROOMS_STORAGE_KEY, []);

  return hostedRooms.includes(normalizedRoomId);
}

export function createChatMessage({ senderId = null, senderName = 'System', text, type = 'user' }) {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    senderId,
    senderName,
    text: String(text ?? '').trim(),
    type,
    createdAt: new Date().toISOString(),
  };
}

export function createSystemMessage(text) {
  return createChatMessage({
    senderName: 'System',
    text,
    type: 'system',
  });
}

export function formatElapsedTime(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
  }

  return [minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}

export function formatMessageTime(timestamp) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function createInitials(name) {
  return String(name ?? '')
    .split(' ')
    .map((segment) => segment.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function sortParticipants(participants) {
  return [...participants].sort((leftParticipant, rightParticipant) => {
    if (leftParticipant.isHost !== rightParticipant.isHost) {
      return leftParticipant.isHost ? -1 : 1;
    }

    if (leftParticipant.isLocal !== rightParticipant.isLocal) {
      return leftParticipant.isLocal ? -1 : 1;
    }

    return leftParticipant.userName.localeCompare(rightParticipant.userName);
  });
}

export function createMeetingPreviewState({ profile, roomId }) {
  const localIsHost = isHostedRoom(roomId);

  const participants = sortParticipants([
    {
      userId: profile.userId,
      userName: profile.userName,
      roleLabel: localIsHost ? 'Host' : 'Participant',
      audioEnabled: true,
      videoEnabled: true,
      handRaised: false,
      handRaisedAt: null,
      isLocal: true,
      isHost: localIsHost,
      permissions: buildParticipantPermissions(),
      accentClassName: 'from-[#d9ddff] via-[#c4bdfd] to-[#bfdbfe]',
    },
  ]);

  const messages = [
    createSystemMessage(
      localIsHost
        ? 'Room created. Waiting for teammates to join the live meeting room.'
        : 'Joining the live meeting room. Host controls will appear when the server confirms the room owner.',
    ),
  ];

  return {
    participants,
    messages,
  };
}
