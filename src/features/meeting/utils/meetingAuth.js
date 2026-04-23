const MEETING_AUTH_STORAGE_KEY = 'bony.meetingAuth';

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

export function getStoredMeetingAuthSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  return readJsonStorage(window.localStorage, MEETING_AUTH_STORAGE_KEY, null);
}

export function storeMeetingAuthSession(session) {
  if (typeof window === 'undefined') {
    return session;
  }

  return writeJsonStorage(window.localStorage, MEETING_AUTH_STORAGE_KEY, session);
}

export function clearStoredMeetingAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(MEETING_AUTH_STORAGE_KEY);
  } catch {
    return;
  }
}

export function getStoredMeetingAccessToken() {
  return getStoredMeetingAuthSession()?.token ?? '';
}
