import { useEffect, useMemo, useState } from 'react';
import { ensureMeetingAuthSession } from '../services/authApi';

function useMeetingAuth(profile) {
  const [status, setStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMeetingAuth() {
      setStatus('loading');
      setError(null);

      try {
        const nextSession = await ensureMeetingAuthSession(profile);

        if (!isMounted) {
          return;
        }

        setSession(nextSession);
        setStatus('ready');
      } catch (authError) {
        if (!isMounted) {
          return;
        }

        setSession(null);
        setError(authError);
        setStatus('error');
      }
    }

    void loadMeetingAuth();

    return () => {
      isMounted = false;
    };
  }, [profile?.userName]);

  return useMemo(
    () => ({
      status,
      session,
      token: session?.token ?? '',
      user: session?.user ?? null,
      error,
      errorMessage: error?.message ?? '',
    }),
    [error, session, status],
  );
}

export default useMeetingAuth;
