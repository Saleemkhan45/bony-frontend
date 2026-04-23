import { Clock3, DoorOpen, Shield, Users } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PermissionGate from '../components/PermissionGate';
import useWaitingRoom from '../hooks/useWaitingRoom';
import { buildMeetingRoomPath } from '../utils/meetingRoom';

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--meeting-border)] bg-white/90 px-4 py-4 shadow-[0_12px_30px_rgba(20,36,89,0.08)] sm:rounded-[24px]">
      <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4] sm:gap-3 sm:text-[11px] sm:tracking-[0.18em]">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] sm:h-10 sm:w-10">
          <Icon className="h-4.5 w-4.5 text-[var(--meeting-accent)]" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 tracking-tight text-[var(--meeting-text)]">{value}</p>
    </div>
  );
}

function MeetingWaitingRoomPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();
  const waitingRoom = useWaitingRoom(roomId);

  useEffect(() => {
    if (waitingRoom.admissionStatus !== 'admitted') {
      return;
    }

    navigate(buildMeetingRoomPath(waitingRoom.roomId), {
      replace: true,
    });
  }, [navigate, waitingRoom.admissionStatus, waitingRoom.roomId]);

  async function handleLeave() {
    try {
      await waitingRoom.leaveWaitingRoom();
    } finally {
      navigate('/');
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--meeting-bg)] text-[var(--meeting-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(102,88,245,0.14),transparent_26%),radial-gradient(circle_at_82%_10%,rgba(96,165,250,0.16),transparent_23%),radial-gradient(circle_at_52%_100%,rgba(255,90,122,0.08),transparent_28%),linear-gradient(180deg,#f8f9fe_0%,#f5f4fa_44%,#f7f8fc_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1080px] flex-col px-3 pb-6 pt-5 sm:px-6 sm:pb-8 sm:pt-8 lg:px-8">
        <div className="rounded-[28px] border border-[var(--meeting-border)] bg-white/92 p-4 shadow-[0_24px_60px_-24px_rgba(20,36,89,0.20)] backdrop-blur-xl sm:rounded-[36px] sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.22em]">
            Waiting Room
          </p>
          <h1 className="mt-3 max-w-[15ch] text-[clamp(1.7rem,8vw,2.65rem)] font-extrabold tracking-[-0.04em] text-[var(--meeting-text)] sm:max-w-none sm:text-[42px]">
            Waiting for the host to let you in
          </h1>
          <p className="mt-3 max-w-[56ch] text-sm leading-6 text-[var(--meeting-muted)] sm:text-base sm:leading-7">
            You're ready for room {waitingRoom.roomId}. We'll move you into the meeting automatically when a host or co-host admits you.
          </p>

          {waitingRoom.authStatus === 'error' && waitingRoom.authError ? (
            <div className="mt-6">
              <PermissionGate
                title="Unable to authenticate your meeting session"
                description={waitingRoom.authError}
                tone="error"
              />
            </div>
          ) : null}

          {waitingRoom.status === 'error' && waitingRoom.error ? (
            <div className="mt-6">
              <PermissionGate
                title="Unable to refresh the waiting room"
                description={waitingRoom.error}
                tone="error"
              />
            </div>
          ) : null}

          {waitingRoom.admissionStatus === 'denied' ? (
            <div className="mt-6">
              <PermissionGate
                title="The host did not admit this join request"
                description="You can safely return home and try another meeting when the host is ready."
                tone="warning"
              />
            </div>
          ) : null}

          <div className="mt-7 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
            <InfoCard
              icon={Clock3}
              label="Status"
              value={waitingRoom.admissionStatus === 'denied' ? 'Not admitted' : 'Pending host approval'}
            />
            <InfoCard
              icon={Users}
              label="Queue"
              value={`${waitingRoom.waitingParticipants.length || 1} request${waitingRoom.waitingParticipants.length === 1 ? '' : 's'} waiting`}
            />
            <InfoCard
              icon={Shield}
              label="Role"
              value={waitingRoom.currentRole === 'cohost' ? 'Co-host' : waitingRoom.currentRole === 'host' ? 'Host' : 'Participant'}
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[var(--meeting-muted)]">
              {waitingRoom.participant?.userName
                ? `${waitingRoom.participant.userName} is checked in and waiting.`
                : 'Your join request is waiting for host approval.'}
            </div>

            <button
              type="button"
              onClick={handleLeave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[20px] border border-[#ffd6e0] bg-[#fff1f5] px-4 py-2.5 text-sm font-semibold text-[#d84b71] transition hover:bg-[#ffe8ef] sm:w-auto sm:rounded-[22px] sm:px-5 sm:py-3"
            >
              <DoorOpen className="h-4 w-4" />
              Leave Waiting Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingWaitingRoomPage;
