import { Suspense, lazy, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/features/home/components/Navbar';
import useHomePageContent from '@/features/home/hooks/useHomePageContent';
import HomePage from '@/features/home/pages';
import MainLayout from '@/layouts/MainLayout';
import { Container } from '@/shared/ui/Container';
import { buildMeetingPrejoinPath } from '@/shared/utils/roomId';

const JoinMeetingModal = lazy(() => import('@/features/home/components/JoinMeetingModal'));
const MeetingRoutes = lazy(() => import('@/features/meeting/routes/MeetingRoutes'));

function MeetingRouteFallback({ message = 'Loading meeting experience...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--meeting-bg)] px-4 text-center text-[var(--meeting-text)]">
      <p className="text-sm font-semibold tracking-tight">{message}</p>
    </div>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const startMeetingModuleRef = useRef(null);
  const [isJoinMeetingOpen, setIsJoinMeetingOpen] = useState(false);
  const [isStartingMeeting, setIsStartingMeeting] = useState(false);
  const [startMeetingError, setStartMeetingError] = useState('');
  const {
    heroContent,
    navigationLinks,
    navbarAction,
  } = useHomePageContent();

  function openJoinMeetingModal() {
    setIsJoinMeetingOpen(true);
  }

  function closeJoinMeetingModal() {
    setIsJoinMeetingOpen(false);
  }

  function handleJoinMeeting(meetingId) {
    closeJoinMeetingModal();
    navigate(buildMeetingPrejoinPath(meetingId));
  }

  async function getStartMeetingModule() {
    if (startMeetingModuleRef.current) {
      return startMeetingModuleRef.current;
    }

    const module = await import('@/features/meeting/services/startMeetingFromHome');
    startMeetingModuleRef.current = module;
    return module;
  }

  async function handleHeroAction(action, event) {
    if (action.actionId === 'join-meeting') {
      event.preventDefault();
      openJoinMeetingModal();
      return;
    }

    if (action.actionId !== 'start-meeting') {
      return;
    }

    event.preventDefault();

    if (isStartingMeeting) {
      return;
    }

    setStartMeetingError('');
    setIsStartingMeeting(true);
    console.info('[home] Start Meeting clicked');

    let startMeetingModule = null;

    try {
      startMeetingModule = await getStartMeetingModule();
      const { roomId } = await startMeetingModule.startMeetingFromHome();
      navigate(buildMeetingPrejoinPath(roomId));
    } catch (error) {
      console.error('[home] Unable to create meeting room', {
        message: error.message,
        status: error.status ?? null,
        code: error.code ?? null,
        payload: error.payload ?? null,
        error,
      });

      if (startMeetingModule?.extractStartMeetingErrorMessage) {
        setStartMeetingError(startMeetingModule.extractStartMeetingErrorMessage(error));
      } else {
        setStartMeetingError(
          error?.message ?? 'Unable to create a meeting right now. Please try again.',
        );
      }
    } finally {
      setIsStartingMeeting(false);
    }
  }

  const isHomeRoute = location.pathname === '/';

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout
              header={
                <Container className="pt-5">
                  <Navbar links={navigationLinks} action={navbarAction} />
                </Container>
              }
            >
              <HomePage
                heroContent={heroContent}
                isStartMeetingLoading={isStartingMeeting}
                onHeroAction={handleHeroAction}
              />
            </MainLayout>
          }
        />
        <Route
          path="/meeting/*"
          element={(
            <Suspense fallback={<MeetingRouteFallback />}>
              <MeetingRoutes />
            </Suspense>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {isHomeRoute ? (
        <>
          {isJoinMeetingOpen ? (
            <Suspense fallback={null}>
              <JoinMeetingModal
                isOpen={isJoinMeetingOpen}
                onClose={closeJoinMeetingModal}
                onJoin={handleJoinMeeting}
              />
            </Suspense>
          ) : null}

          {isStartingMeeting ? (
            <div
              className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(245,244,250,0.68)] px-4 backdrop-blur-sm"
              role="status"
              aria-live="polite"
              aria-label="Starting meeting"
            >
              <div className="w-full max-w-sm rounded-[26px] border border-[var(--meeting-border)] bg-white/96 px-6 py-7 text-center shadow-[0_24px_60px_rgba(20,36,89,0.16)]">
                <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-[#d8dcff] border-t-[var(--meeting-accent)]" />
                <p className="mt-4 text-sm font-semibold tracking-tight text-[var(--meeting-text)]">
                  Starting your meeting...
                </p>
                <p className="mt-1.5 text-xs text-[var(--meeting-muted)]">
                  Creating room and preparing your pre-join setup.
                </p>
              </div>
            </div>
          ) : null}

          {startMeetingError ? (
            <div className="fixed inset-x-4 bottom-5 z-50 mx-auto max-w-xl rounded-2xl border border-[#ffd1d1] bg-white/95 px-4 py-3 shadow-[0_18px_36px_rgba(140,24,24,0.12)] backdrop-blur" role="alert">
              <p className="text-sm font-semibold text-[#991b1b]">Unable to start meeting</p>
              <p className="mt-1 text-sm text-[#7f1d1d]">{startMeetingError}</p>
            </div>
          ) : null}
        </>
      ) : null}
    </>
  );
}

export default AppRoutes;
