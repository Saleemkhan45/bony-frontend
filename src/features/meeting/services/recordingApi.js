import {
  listRoomRecordingSessions,
  listRoomRecordings,
  startRoomRecordingSession,
  stopRoomRecordingSession,
  uploadRoomRecording,
} from '../../../services/recordingApi';

function toTimestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeMeetingRecording(recording) {
  if (!recording || typeof recording !== 'object') {
    return null;
  }

  return {
    ...recording,
    id: recording.id ?? recording.recordingId ?? recording.recording_id ?? null,
    roomId: recording.roomId ?? recording.room_id ?? null,
    recordedBy: recording.recordedBy ?? recording.recorded_by ?? null,
    recordedByName: recording.recordedByName ?? recording.recorded_by_name ?? null,
    fileUrl: recording.fileUrl ?? recording.file_url ?? '',
    filePath: recording.filePath ?? recording.file_path ?? null,
    fileName: recording.fileName ?? recording.file_name ?? '',
    fileSize: recording.fileSize ?? recording.file_size ?? null,
    createdAt: recording.createdAt ?? recording.created_at ?? null,
  };
}

function buildRecordingIdentity(recording) {
  if (recording?.id) {
    return `id:${recording.id}`;
  }

  if (recording?.fileUrl) {
    return `url:${recording.fileUrl}`;
  }

  return `fallback:${recording?.fileName ?? 'recording'}:${recording?.createdAt ?? ''}`;
}

function sortRecordingsNewestFirst(recordings) {
  return [...recordings].sort((firstRecording, secondRecording) => {
    const secondTimestamp = toTimestamp(secondRecording?.createdAt);
    const firstTimestamp = toTimestamp(firstRecording?.createdAt);

    if (secondTimestamp !== firstTimestamp) {
      return secondTimestamp - firstTimestamp;
    }

    return String(secondRecording?.id ?? '').localeCompare(String(firstRecording?.id ?? ''));
  });
}

function mergeNormalizedRecordings(...recordingSources) {
  const recordingsByIdentity = new Map();

  recordingSources
    .flatMap((source) => {
      if (Array.isArray(source)) {
        return source;
      }

      if (source && typeof source === 'object') {
        return toArray(source.recordings);
      }

      return [];
    })
    .map(normalizeMeetingRecording)
    .filter(Boolean)
    .forEach((recording) => {
      const identityKey = buildRecordingIdentity(recording);
      const currentRecording = recordingsByIdentity.get(identityKey);

      if (!currentRecording) {
        recordingsByIdentity.set(identityKey, recording);
        return;
      }

      if (toTimestamp(recording.createdAt) > toTimestamp(currentRecording.createdAt)) {
        recordingsByIdentity.set(identityKey, recording);
      }
    });

  return sortRecordingsNewestFirst(Array.from(recordingsByIdentity.values()));
}

export function mergeMeetingRecordings(...recordingSources) {
  return mergeNormalizedRecordings(...recordingSources);
}

function resolveUploadedRecording(payload) {
  const candidateRecordings = [
    payload?.recording,
    payload?.savedRecording,
    payload?.data?.recording,
    payload?.data?.savedRecording,
    payload?.payload?.recording,
    payload?.payload?.savedRecording,
  ];

  for (const candidate of candidateRecordings) {
    const normalizedCandidate = normalizeMeetingRecording(candidate);

    if (normalizedCandidate) {
      return normalizedCandidate;
    }
  }

  return mergeNormalizedRecordings(payload)[0] ?? null;
}

export function normalizeMeetingRecordingsPayload(payload) {
  const normalizedRecordings = mergeNormalizedRecordings(
    payload,
    payload?.data,
    payload?.payload,
  );

  return {
    ...payload,
    ...(payload?.data && typeof payload.data === 'object'
      ? {
          data: {
            ...payload.data,
            recordings: normalizedRecordings,
          },
        }
      : {}),
    recordings: normalizedRecordings,
  };
}

export async function uploadMeetingRecording({ file, roomCode, userId, fileName, mimeType }) {
  const payload = await uploadRoomRecording(roomCode, file, {
    userId,
    fileName,
    mimeType,
  });
  const normalizedRecording = resolveUploadedRecording(payload);

  if (!normalizedRecording) {
    return payload;
  }

  return {
    ...payload,
    ...(payload?.data && typeof payload.data === 'object'
      ? {
          data: {
            ...payload.data,
            recording: normalizedRecording,
            savedRecording: normalizedRecording,
          },
        }
      : {}),
    recording: normalizedRecording,
    savedRecording: normalizedRecording,
  };
}

export async function startMeetingRoomRecordingSession(roomCode) {
  return startRoomRecordingSession(roomCode);
}

export async function stopMeetingRoomRecordingSession(roomCode) {
  return stopRoomRecordingSession(roomCode);
}

export async function getMeetingRoomRecordingSessions(roomCode) {
  return listRoomRecordingSessions(roomCode);
}

export async function getMeetingRoomRecordings(roomCode) {
  const payload = await listRoomRecordings(roomCode);
  return normalizeMeetingRecordingsPayload(payload);
}

export {
  listRoomRecordingSessions,
  listRoomRecordings,
  startRoomRecordingSession,
  stopRoomRecordingSession,
  uploadRoomRecording,
};
