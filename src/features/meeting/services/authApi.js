import { getMeetingApiBaseUrl } from './apiClient';
import {
  clearStoredMeetingAuthSession,
  getStoredMeetingAccessToken,
  storeMeetingAuthSession,
} from '../utils/meetingAuth';
import { saveMeetingProfile } from '../utils/meetingRoom';

async function requestAuthJson(pathname, options = {}) {
  const accessToken = getStoredMeetingAccessToken();
  const requestUrl = `${getMeetingApiBaseUrl()}${pathname}`;

  console.info('[meetingAuth] Request start', {
    requestUrl,
    method: options.method ?? 'GET',
    hasAccessToken: Boolean(accessToken),
    body: options.body ?? null,
  });

  try {
    const response = await fetch(requestUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers ?? {}),
      },
      ...options,
    });
    const payload = await response.json().catch(() => ({
      success: false,
      message: 'Unexpected API response.',
    }));

    console.info('[meetingAuth] Response received', {
      requestUrl,
      status: response.status,
      ok: response.ok,
      payload,
    });

    if (!response.ok) {
      const error = new Error(payload.message ?? 'The authentication request failed.');
      error.status = response.status;
      error.code = payload.code;
      error.payload = payload;

      console.error('[meetingAuth] Request failed', {
        requestUrl,
        status: response.status,
        payload,
      });

      throw error;
    }

    return payload;
  } catch (error) {
    const isNetworkFetchFailure =
      !error?.status &&
      typeof error?.message === 'string' &&
      error.message.toLowerCase().includes('failed to fetch');
    const finalError = isNetworkFetchFailure
      ? Object.assign(
          new Error(
            `Unable to reach the meeting server at ${getMeetingApiBaseUrl()}. Confirm backend is running and API URL is correct.`,
          ),
          {
            code: 'NETWORK_ERROR',
            cause: error,
          },
        )
      : error;

    console.error('[meetingAuth] Request error', {
      requestUrl,
      message: finalError.message,
      status: finalError.status ?? null,
      code: finalError.code ?? null,
      payload: finalError.payload ?? null,
      error: finalError,
    });

    throw finalError;
  }
}

function getRequestControlOptions(options = {}) {
  return options.signal ? { signal: options.signal } : {};
}

function persistAuthSession(session) {
  storeMeetingAuthSession(session);

  if (session?.user?.userId && session?.user?.userName) {
    saveMeetingProfile({
      userId: session.user.userId,
      userName: session.user.userName,
    });
  }

  return session;
}

export async function createMeetingAuthSession({ userName, email, avatarUrl }, options = {}) {
  const session = await requestAuthJson('/api/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      userName,
      email,
      avatarUrl,
    }),
    ...getRequestControlOptions(options),
  });

  return persistAuthSession(session);
}

export async function getCurrentMeetingAuthSession(options = {}) {
  const accessToken = getStoredMeetingAccessToken();

  if (!accessToken) {
    throw new Error('No meeting auth token is stored.');
  }

  const payload = await requestAuthJson('/api/auth/me', getRequestControlOptions(options));
  return persistAuthSession({
    token: accessToken,
    user: payload.user,
  });
}

export async function ensureMeetingAuthSession(profile, options = {}) {
  try {
    const existingSession = await getCurrentMeetingAuthSession(options);

    return existingSession;
  } catch (error) {
    if (
      error.message === 'No meeting auth token is stored.' ||
      ['AUTH_REQUIRED', 'AUTH_TOKEN_EXPIRED', 'INVALID_AUTH_TOKEN', 'USER_NOT_FOUND'].includes(error.code)
    ) {
      console.info('[meetingAuth] Clearing stale meeting auth session', {
        code: error.code ?? null,
        message: error.message,
      });
      clearStoredMeetingAuthSession();
    } else {
      throw error;
    }
  }

  return createMeetingAuthSession({
    userName: profile?.userName,
  }, options);
}
