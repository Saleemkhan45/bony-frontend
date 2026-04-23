const ROOM_ID_SEGMENT_REGEX = /[^A-Z0-9-]/g;
const MEETING_ID_PATTERN = /^[A-F0-9]{8}$/;
const MEETING_PATH_PATTERN = /\/MEETING\/([A-F0-9]{8})(?:\/|$)/i;

export function normalizeRoomId(roomId) {
  return String(roomId ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(ROOM_ID_SEGMENT_REGEX, '');
}

export function extractRoomIdFromInput(value) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return '';
  }

  const directRoomId = normalizeRoomId(rawValue);

  if (MEETING_ID_PATTERN.test(directRoomId)) {
    return directRoomId;
  }

  const meetingPathMatch = rawValue.toUpperCase().match(MEETING_PATH_PATTERN);

  if (meetingPathMatch?.[1]) {
    return meetingPathMatch[1];
  }

  try {
    const parsedUrl = new URL(rawValue);
    const roomQueryParam = normalizeRoomId(parsedUrl.searchParams.get('room'));

    if (MEETING_ID_PATTERN.test(roomQueryParam)) {
      return roomQueryParam;
    }

    const inviteQueryParam = normalizeRoomId(parsedUrl.searchParams.get('invite'));

    if (MEETING_ID_PATTERN.test(inviteQueryParam)) {
      return inviteQueryParam;
    }

    const parsedPathMatch = parsedUrl.pathname.toUpperCase().match(MEETING_PATH_PATTERN);

    if (parsedPathMatch?.[1]) {
      return parsedPathMatch[1];
    }
  } catch {
    // Not a URL. Fallback pattern check below.
  }

  const fallbackIdMatch = rawValue.toUpperCase().match(/\b([A-F0-9]{8})\b/);
  return fallbackIdMatch?.[1] ?? '';
}

export function buildMeetingPrejoinPath(roomId) {
  const normalizedRoomId = normalizeRoomId(roomId);
  return normalizedRoomId ? `/meeting/${normalizedRoomId}/prejoin` : '/';
}
