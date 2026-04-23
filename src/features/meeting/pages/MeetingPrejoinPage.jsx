import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  RefreshCw,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLoader from '../components/AppLoader';
import InlineSpinner from '../components/InlineSpinner';
import PermissionGate from '../components/PermissionGate';
import AudioLevelMeter from '../components/AudioLevelMeter';
import DeviceSelectorRow from '../components/DeviceSelectorRow';
import PrejoinMediaPreview from '../components/PrejoinMediaPreview';
import useMeetingPrejoin from '../hooks/useMeetingPrejoin';
import { ensureMeetingAuthSession } from '../services/authApi';
import { joinMeetingRoom } from '../services/roomApi';
import '../styles/meetingLoaders.css';
import {
  buildMeetingRoomPath,
  buildMeetingWaitingPath,
  getOrCreateMeetingProfile,
} from '../utils/meetingRoom';

function ToggleButton({ active, icon: Icon, label, onClick, tone = 'default' }) {
  const toneClassName = tone === 'danger'
    ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] hover:bg-[#ffe8ef]'
    : active
      ? 'border-transparent bg-[var(--meeting-accent)] text-white shadow-[0_18px_40px_-20px_rgba(102,88,245,0.65)] hover:bg-[var(--meeting-accent-hover)]'
      : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-text)] hover:border-[#d9dcf0] hover:bg-[var(--meeting-surface-tint)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-semibold transition duration-200 sm:px-4 sm:py-3 sm:text-sm ${toneClassName}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function MeetingPrejoinPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();
  const prejoin = useMeetingPrejoin(roomId);
  const [joinState, setJoinState] = useState({
    error: '',
    loading: false,
  });
  const previewNeedsRecovery =
    prejoin.previewStatus === 'blocked' ||
    prejoin.previewStatus === 'unsupported' ||
    prejoin.previewStatus === 'error';
  const previewDescription = useMemo(() => {
    if (!prejoin.previewError) {
      return '';
    }

    if (prejoin.previewStatus === 'blocked') {
      return `${prejoin.previewError} You can still enter the room and try device access again later.`;
    }

    if (prejoin.previewStatus === 'unsupported') {
      return `${prejoin.previewError} Joining still works for room history and signaling.`;
    }

    return `${prejoin.previewError} You can still join and adjust devices after entering the room.`;
  }, [prejoin.previewError, prejoin.previewStatus]);

  async function goToMeetingRoom(preferences) {
    if (!preferences?.success) {
      return;
    }

    setJoinState({
      error: '',
      loading: true,
    });

    try {
      await ensureMeetingAuthSession(getOrCreateMeetingProfile());
      const joinPayload = await joinMeetingRoom(prejoin.roomId);
      navigate(
        joinPayload.admissionStatus === 'waiting'
          ? buildMeetingWaitingPath(prejoin.roomId)
          : buildMeetingRoomPath(prejoin.roomId),
      );
    } catch (error) {
      setJoinState({
        error: error.message || 'Unable to join this meeting right now.',
        loading: false,
      });
    }
  }

  async function handleJoinNow() {
    await goToMeetingRoom(prejoin.prepareJoin());
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--meeting-bg)] text-[var(--meeting-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(102,88,245,0.14),transparent_26%),radial-gradient(circle_at_82%_10%,rgba(96,165,250,0.16),transparent_23%),radial-gradient(circle_at_52%_100%,rgba(255,90,122,0.08),transparent_28%),linear-gradient(180deg,#f8f9fe_0%,#f5f4fa_44%,#f7f8fc_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-8 h-[16rem] w-[16rem] rounded-full bg-[#d9ddff]/60 blur-3xl sm:h-[22rem] sm:w-[22rem]" />
      <div className="pointer-events-none absolute right-[-7rem] top-20 h-[14rem] w-[14rem] rounded-full bg-[#d6ecff]/75 blur-3xl sm:right-[-8rem] sm:top-24 sm:h-[20rem] sm:w-[20rem]" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/3 h-[13rem] w-[13rem] rounded-full bg-[#ffdce5]/55 blur-3xl sm:bottom-[-8rem] sm:h-[18rem] sm:w-[18rem]" />
      <AppLoader
        description="Connecting live collaboration and restoring your room permissions before entry."
        isVisible={joinState.loading}
        title="Preparing your meeting room..."
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-3 pb-6 pt-4 min-[390px]:pt-5 sm:px-6 sm:pb-8 sm:pt-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <a href="/" className="text-lg font-extrabold tracking-tight text-[var(--meeting-text)] sm:text-xl">
              Bony.
            </a>
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b84a4] sm:mt-3 sm:text-[11px] sm:tracking-[0.22em]">
              Pre-Join Setup
            </p>
            <h1 className="mt-2 text-[clamp(1.7rem,8vw,2.45rem)] font-extrabold tracking-[-0.04em] text-[var(--meeting-text)] sm:text-[40px]">
              Check your setup before you join
            </h1>
            <p className="mt-3 max-w-[46ch] text-sm leading-6 text-[var(--meeting-muted)] sm:text-base sm:leading-7">
              Make sure your name, camera, and microphone are ready before entering room {prejoin.roomId}.
            </p>
          </div>

          <div className="self-start rounded-full border border-[var(--meeting-border)] bg-white px-3.5 py-2.5 text-xs font-semibold text-[var(--meeting-text)] shadow-[0_12px_28px_rgba(20,36,89,0.08)] sm:px-4 sm:py-3 sm:text-sm">
            Meeting ID <span className="ml-2 text-[var(--meeting-accent)]">{prejoin.roomId}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)]">
          <div className="space-y-5">
            <PrejoinMediaPreview
              audioEnabled={prejoin.audioEnabled}
              displayName={prejoin.displayName}
              hasVideoTrack={prejoin.previewHasVideoTrack}
              previewError={prejoin.previewError}
              previewStatus={prejoin.previewStatus}
              previewVideoRef={prejoin.previewVideoRef}
              videoEnabled={prejoin.videoEnabled}
            />

            <div className="rounded-[26px] border border-[var(--meeting-border)] bg-white/90 p-4 shadow-[0_18px_48px_rgba(20,36,89,0.10)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
                    Device Check
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--meeting-muted)]">
                    Preview your camera, verify your mic level, and swap devices before joining.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    void prejoin.refreshDevices();
                  }}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--meeting-text)] transition hover:border-[#d9dcf0] hover:bg-white sm:px-4 sm:text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh Devices
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
                <ToggleButton
                  active={prejoin.audioEnabled}
                  icon={prejoin.audioEnabled ? Mic : MicOff}
                  label={prejoin.audioEnabled ? 'Mic On' : 'Mic Off'}
                  onClick={() => prejoin.setAudioEnabled((currentValue) => !currentValue)}
                />
                <ToggleButton
                  active={prejoin.videoEnabled}
                  icon={prejoin.videoEnabled ? Camera : CameraOff}
                  label={prejoin.videoEnabled ? 'Camera On' : 'Camera Off'}
                  onClick={() => prejoin.setVideoEnabled((currentValue) => !currentValue)}
                />
              </div>

              <div className="mt-5 flex flex-col gap-4 rounded-[22px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-[24px]">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
                    Microphone Level
                  </p>
                  <p className="mt-2 text-sm text-[var(--meeting-muted)]">
                    {prejoin.audioEnabled
                      ? 'Speak now to verify your microphone is active before joining.'
                      : 'Turn your microphone back on to check your audio level.'}
                  </p>
                </div>

                <AudioLevelMeter disabled={!prejoin.audioEnabled} level={prejoin.audioLevel} />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[var(--meeting-border)] bg-white/92 p-4 shadow-[0_20px_55px_rgba(20,36,89,0.12)] backdrop-blur-xl sm:rounded-[32px] sm:p-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
                Join Preferences
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--meeting-text)] sm:text-2xl">
                Personalize this join
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--meeting-muted)] sm:leading-7">
                Your display name and device choices stay ready for the next meeting on this browser.
              </p>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
                  Display Name
                </span>
                <input
                  type="text"
                  value={prejoin.displayName}
                  onChange={(event) => prejoin.updateDisplayName(event.target.value)}
                  placeholder="Your name"
                  className={`w-full rounded-[22px] border bg-white px-4 py-3 text-sm font-medium text-[var(--meeting-text)] outline-none transition placeholder:text-[#98a0b7] focus:border-[#8c81ff] focus:ring-4 focus:ring-[#8c81ff]/12 ${
                    prejoin.formError ? 'border-[#ffb6c8]' : 'border-[var(--meeting-border)]'
                  }`}
                />
                {prejoin.formError ? (
                  <p className="mt-2 text-sm font-medium text-[#d84b71]">{prejoin.formError}</p>
                ) : null}
              </label>

              <DeviceSelectorRow
                label="Microphone"
                value={prejoin.selectedMicrophoneId}
                onChange={prejoin.setSelectedMicrophoneId}
                options={prejoin.devices.audioInputs}
                helperText={
                  prejoin.devices.audioInputs.length === 0
                    ? 'Your browser has not exposed microphone devices yet. Joining still works without one.'
                    : 'Pick the microphone you want to use when you enter the room.'
                }
              />

              <DeviceSelectorRow
                label="Camera"
                value={prejoin.selectedCameraId}
                onChange={prejoin.setSelectedCameraId}
                options={prejoin.devices.videoInputs}
                helperText={
                  prejoin.devices.videoInputs.length === 0
                    ? 'No camera is available right now. You can still join with audio only.'
                    : 'Pick the camera you want ready when the meeting opens.'
                }
              />
            </div>

            {previewNeedsRecovery ? (
              <div className="mt-6">
                <PermissionGate
                  title={
                    prejoin.previewStatus === 'blocked'
                      ? 'Device access needs attention'
                      : prejoin.previewStatus === 'unsupported'
                        ? 'Preview unavailable in this browser'
                        : 'Preview needs recovery'
                  }
                  description={previewDescription}
                  tone={prejoin.previewStatus === 'unsupported' ? 'error' : 'warning'}
                />
              </div>
            ) : null}

            {joinState.error ? (
              <div className="mt-4">
                <PermissionGate
                  title="Unable to continue into the meeting"
                  description={joinState.error}
                  tone="error"
                />
              </div>
            ) : null}

            <div className="mt-6 flex justify-stretch sm:justify-end">
              <button
                type="button"
                disabled={joinState.loading}
                onClick={handleJoinNow}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-[20px] px-5 py-2.5 text-sm font-semibold shadow-[0_18px_40px_-20px_rgba(102,88,245,0.65)] transition sm:w-auto sm:rounded-[22px] sm:py-3 ${
                  joinState.loading
                    ? 'cursor-not-allowed bg-[#8f86f7] text-white/90'
                    : 'bg-[var(--meeting-accent)] text-white hover:bg-[var(--meeting-accent-hover)]'
                }`}
              >
                {joinState.loading ? (
                  <>
                    <InlineSpinner size="xs" tone="light" />
                    Joining Meeting
                  </>
                ) : (
                  <>
                    Join Meeting
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingPrejoinPage;
