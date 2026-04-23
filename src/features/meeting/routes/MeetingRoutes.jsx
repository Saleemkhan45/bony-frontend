import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const MeetingPrejoinPage = lazy(() => import('@/features/meeting/pages/MeetingPrejoinPage'));
const MeetingRecapPage = lazy(() => import('@/features/meeting/pages/MeetingRecapPage'));
const MeetingRoomPage = lazy(() => import('@/features/meeting/pages/MeetingRoomPage'));
const MeetingWaitingRoomPage = lazy(() => import('@/features/meeting/pages/MeetingWaitingRoomPage'));

function MeetingRouteFallback({ message = 'Loading meeting experience...' }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--meeting-bg)] px-4 py-10 text-[var(--meeting-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(102,88,245,0.14),transparent_28%),radial-gradient(circle_at_82%_10%,rgba(96,165,250,0.14),transparent_24%),linear-gradient(180deg,#f8f9fe_0%,#f5f4fa_44%,#f7f8fc_100%)]" />
      <div className="relative mx-auto max-w-xl rounded-[28px] border border-[var(--meeting-border)] bg-white/88 px-6 py-8 text-center shadow-[0_20px_50px_rgba(20,36,89,0.12)] backdrop-blur-xl">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#d8dcff] border-t-[var(--meeting-accent)]" />
        <p className="mt-5 text-sm font-semibold tracking-tight text-[var(--meeting-text)]">{message}</p>
      </div>
    </div>
  );
}

function MeetingRoutes() {
  return (
    <Routes>
      <Route
        path=":roomId/prejoin"
        element={(
          <Suspense fallback={<MeetingRouteFallback message="Preparing your meeting setup..." />}>
            <MeetingPrejoinPage />
          </Suspense>
        )}
      />
      <Route
        path=":roomId/waiting"
        element={(
          <Suspense fallback={<MeetingRouteFallback message="Opening the waiting room..." />}>
            <MeetingWaitingRoomPage />
          </Suspense>
        )}
      />
      <Route
        path=":roomId"
        element={(
          <Suspense fallback={<MeetingRouteFallback message="Connecting to your meeting room..." />}>
            <MeetingRoomPage />
          </Suspense>
        )}
      />
      <Route
        path=":roomId/recap"
        element={(
          <Suspense fallback={<MeetingRouteFallback message="Loading your meeting recap..." />}>
            <MeetingRecapPage />
          </Suspense>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default MeetingRoutes;
