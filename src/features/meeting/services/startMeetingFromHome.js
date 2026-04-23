let meetingStartDependenciesPromise = null;

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

async function createRoomWithAuth(meetingProfile, { forceFreshAuth = false } = {}) {
  const dependencies = await getMeetingStartDependencies();
  const authSession = forceFreshAuth
    ? await dependencies.createMeetingAuthSession({
        userName: meetingProfile.userName,
      })
    : await dependencies.ensureMeetingAuthSession(meetingProfile);

  return dependencies.createMeetingRoom({
    userId: authSession.user.userId,
    userName: authSession.user.userName,
  });
}

export async function startMeetingFromHome() {
  const dependencies = await getMeetingStartDependencies();
  const meetingProfile = dependencies.getOrCreateMeetingProfile();
  console.info('[home] Ensuring meeting auth session', {
    userId: meetingProfile.userId,
    userName: meetingProfile.userName,
  });

  let response;

  try {
    response = await createRoomWithAuth(meetingProfile, {
      forceFreshAuth: false,
    });
  } catch (initialError) {
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
}
