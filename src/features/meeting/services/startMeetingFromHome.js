let meetingStartDependenciesPromise = null;
export const START_MEETING_TIMEOUT_MS = 15000;

function createStartMeetingTimeoutError(timeoutMs = START_MEETING_TIMEOUT_MS) {
  const error = new Error(
    `Creating the meeting took longer than ${Math.round(timeoutMs / 1000)} seconds. The backend may be waking up, so please try again in a moment.`,
  );
  error.code = 'START_MEETING_TIMEOUT';
  return error;
}

function shouldRetryStartMeeting(error) {
  if (!error) {
    return false;
  }

  if (error.status && [401, 403, 500, 502, 503, 504].includes(error.status)) {
    return true;
  }

  if (
    [
      'AUTH_REQUIRED',
      'INVALID_AUTH_TOKEN',
      'AUTH_TOKEN_EXPIRED',
      'USER_NOT_FOUND',
      'USER_LOOKUP_FAILED',
      'USER_UPSERT_FAILED',
    ].includes(error.code)
  ) {
    return true;
  }

  const message = String(error.message ?? '').toLowerCase();
  return message.includes('failed to fetch') || message.includes('networkerror');
}

export function extractStartMeetingErrorMessage(error) {
  if (error?.code === 'START_MEETING_TIMEOUT') {
    return error.message;
  }

  if (error?.payload?.message) {
    return error.payload.message;
  }

  if (error?.message) {
    return error.message;
  }

  return 'Unable to create a meeting right now. Please try again.';
}

async function getMeetingStartDependencies() {
  if (meetingStartDependenciesPromise) {
    return meetingStartDependenciesPromise;
  }

  meetingStartDependenciesPromise = Promise.all([
    import('@/features/meeting/services/authApi'),
    import('@/features/meeting/services/roomApi'),
    import('@/features/meeting/utils/meetingRoom'),
    import('@/features/meeting/utils/meetingAuth'),
  ]).then(([authApi, roomApi, meetingRoomUtils, meetingAuthUtils]) => ({
    createMeetingAuthSession: authApi.createMeetingAuthSession,
    ensureMeetingAuthSession: authApi.ensureMeetingAuthSession,
    createMeetingRoom: roomApi.createMeetingRoom,
    getOrCreateMeetingProfile: meetingRoomUtils.getOrCreateMeetingProfile,
    markHostedRoom: meetingRoomUtils.markHostedRoom,
    clearStoredMeetingAuthSession: meetingAuthUtils.clearStoredMeetingAuthSession,
  }));

  return meetingStartDependenciesPromise;
}

async function createRoomWithAuth(meetingProfile, { forceFreshAuth = false, signal } = {}) {
  const dependencies = await getMeetingStartDependencies();
  const requestOptions = signal ? { signal } : {};
  const authSession = forceFreshAuth
    ? await dependencies.createMeetingAuthSession({
        userName: meetingProfile.userName,
      }, requestOptions)
    : await dependencies.ensureMeetingAuthSession(meetingProfile, requestOptions);

  return dependencies.createMeetingRoom({
    userId: authSession.user.userId,
    userName: authSession.user.userName,
  }, requestOptions);
}

export async function startMeetingFromHome({ timeoutMs = START_MEETING_TIMEOUT_MS } = {}) {
  const shouldUseTimeout =
    Number.isFinite(timeoutMs) &&
    timeoutMs > 0 &&
    typeof AbortController !== 'undefined' &&
    typeof globalThis.setTimeout === 'function';
  const timeoutController = shouldUseTimeout ? new AbortController() : null;
  let didTimeout = false;
  const timeoutId = shouldUseTimeout
    ? globalThis.setTimeout(() => {
        didTimeout = true;
        timeoutController.abort();
      }, timeoutMs)
    : null;

  try {
    const dependencies = await getMeetingStartDependencies();
    const meetingProfile = dependencies.getOrCreateMeetingProfile();
    console.info('[home] Ensuring meeting auth session', {
      userId: meetingProfile.userId,
      userName: meetingProfile.userName,
    });

    let response;

    try {
      if (timeoutController?.signal.aborted) {
        throw createStartMeetingTimeoutError(timeoutMs);
      }

      response = await createRoomWithAuth(meetingProfile, {
        forceFreshAuth: false,
        signal: timeoutController?.signal,
      });
    } catch (initialError) {
      if (didTimeout || initialError?.name === 'AbortError') {
        throw createStartMeetingTimeoutError(timeoutMs);
      }

      if (!shouldRetryStartMeeting(initialError)) {
        throw initialError;
      }

      console.warn('[home] Start meeting failed on first attempt. Retrying with fresh auth session.', {
        message: initialError.message,
        status: initialError.status ?? null,
        code: initialError.code ?? null,
      });
      dependencies.clearStoredMeetingAuthSession();
      response = await createRoomWithAuth(meetingProfile, {
        forceFreshAuth: true,
        signal: timeoutController?.signal,
      });
    }

    console.info('[home] Create meeting response', response);
    const roomId = response.roomId ?? response.room?.roomCode ?? '';

    if (!roomId) {
      throw new Error('Meeting API did not return a roomId.');
    }

    dependencies.markHostedRoom(roomId);
    return {
      roomId,
    };
  } catch (error) {
    if (didTimeout || error?.name === 'AbortError') {
      throw createStartMeetingTimeoutError(timeoutMs);
    }

    throw error;
  } finally {
    if (timeoutId) {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
