import { getStoredMeetingAccessToken } from '../utils/meetingAuth';

export function getMeetingApiBaseUrl() {
  return (
    import.meta.env.VITE_MEETING_API_URL ??
    import.meta.env.VITE_MEETING_SOCKET_URL ??
    import.meta.env.VITE_API_BASE_URL
  ).replace(/\/$/, '');
}

export async function requestMeetingJson(pathname, options = {}) {
  const accessToken = getStoredMeetingAccessToken();
  const requestUrl = `${getMeetingApiBaseUrl()}${pathname}`;

  console.info('[meetingApi] Request start', {
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

    console.info('[meetingApi] Response received', {
      requestUrl,
      status: response.status,
      ok: response.ok,
      payload,
    });

    if (!response.ok) {
      const error = new Error(payload.message ?? 'The meeting API request failed.');
      error.status = response.status;
      error.code = payload.code;
      error.payload = payload;

      console.error('[meetingApi] Request failed', {
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

    console.error('[meetingApi] Request error', {
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
