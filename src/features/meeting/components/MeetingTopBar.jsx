import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Clock3,
  Copy,
  Download,
  FileText,
  MessageSquare,
  MicOff,
  MoreHorizontal,
  Pin,
  Shield,
  Users,
  VideoOff,
  Wifi,
} from 'lucide-react';
import RecordingIndicator from './RecordingIndicator';
import QualityIndicator from './QualityIndicator';

function ActionButton({ badgeCount = 0, icon: Icon, label, onClick, tone = 'default' }) {
  const hasBadge = badgeCount > 0;
  const toneClassName =
    tone === 'danger'
      ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] hover:bg-[#ffe8ef]'
      : tone === 'info'
        ? 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]'
        : tone === 'secondary'
          ? 'border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8] hover:bg-[#e6f2ff]'
          : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-text)] hover:border-[#d7d9f3] hover:bg-[var(--meeting-surface-tint)]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition duration-200 hover:-translate-y-0.5 sm:px-4 sm:py-2.5 sm:text-sm ${toneClassName}`}
    >
      <Icon className="h-4 w-4" />
      {label}
      <span
        className={`inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#fff1f5] px-1.5 py-0.5 text-[10px] font-bold text-[var(--meeting-danger)] transition-opacity ${hasBadge ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!hasBadge}
      >
        {hasBadge ? badgeCount : '0'}
      </span>
    </button>
  );
}

function InfoChipActionButton({
  disabled = false,
  label,
  onClick,
  tone = 'default',
}) {
  const toneClassName =
    tone === 'primary'
      ? 'border-[#D9DCFF] bg-[#EEF1FF] text-[#4F46E5] hover:bg-[#E8EBFF]'
      : 'border-[#E6E8F2] bg-[#F7F8FC] text-[#142459] hover:bg-[#F0F2FA]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center rounded-xl border px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors duration-200 sm:px-3 sm:text-[10px] sm:tracking-[0.14em] ${
        disabled
          ? 'cursor-not-allowed border-[#ECEEF6] bg-[#F8F9FD] text-[#9AA5BF]'
          : toneClassName
      }`}
    >
      {label}
    </button>
  );
}

function InfoChip({ accentClassName = '', actions = null, icon: Icon, label, value }) {
  return (
    <div className="rounded-[22px] border border-[var(--meeting-border)] bg-white/88 px-3.5 py-3.5 shadow-[0_10px_28px_rgba(20,36,89,0.08)] backdrop-blur-xl sm:rounded-[26px] sm:px-4 sm:py-4">
      <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b84a4] sm:gap-3 sm:text-[11px] sm:tracking-[0.16em]">
        <span
          className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border bg-[var(--meeting-surface-tint)] shadow-[0_8px_18px_rgba(20,36,89,0.06)] sm:h-10 sm:w-10 ${accentClassName}`}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        {label}
      </div>
      <div className="mt-3 text-sm font-semibold leading-6 tracking-tight text-[var(--meeting-text)]">{value}</div>
      {actions ? <div className="mt-3 flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

function MobileSummaryPill({ tone = 'default', value, label }) {
  const toneClassName =
    tone === 'success'
      ? 'border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]'
      : tone === 'warning'
        ? 'border-[#ffe1c9] bg-[#fff5eb] text-[#c76b1a]'
        : tone === 'error'
          ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]'
          : 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1]';

  return (
    <div className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${toneClassName}`}>
      <span className="uppercase tracking-[0.12em] opacity-80">{label}</span>
      <span className="text-[11px] tracking-tight">{value}</span>
    </div>
  );
}

function MobileDetailCard({ icon: Icon, label, value, accentClassName = 'text-[var(--meeting-accent)] border-[#dde1fb]' }) {
  return (
    <div className="rounded-2xl border border-[var(--meeting-border)] bg-white/92 px-3 py-2.5 shadow-[0_10px_24px_rgba(20,36,89,0.08)]">
      <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#7b84a4]">
        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-xl border bg-[var(--meeting-surface-tint)] ${accentClassName}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-semibold tracking-tight text-[var(--meeting-text)]">{value}</p>
    </div>
  );
}

function DropdownMenu({
  badgeCount = 0,
  icon: Icon = MoreHorizontal,
  label,
  children,
}) {
  const hasBadge = badgeCount > 0;
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((currentState) => !currentState)}
        className="relative inline-flex items-center gap-2 rounded-full border border-[var(--meeting-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d7d9f3] hover:bg-[var(--meeting-surface-tint)] sm:px-4 sm:py-2.5 sm:text-sm"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Icon className="h-4 w-4" />
        <span className="hidden min-[390px]:inline">{label}</span>
        <span
          className={`inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#fff1f5] px-1.5 py-0.5 text-[10px] font-bold text-[var(--meeting-danger)] transition-opacity ${hasBadge ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!hasBadge}
        >
          {hasBadge ? badgeCount : '0'}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#7b84a4] transition ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-3 w-[min(92vw,360px)] overflow-hidden rounded-[18px] border border-[#E6E8F2] bg-white p-2 shadow-[0_14px_40px_rgba(20,36,89,0.10)] sm:rounded-[20px] sm:p-2.5"
        >
          {children({
            closeMenu: () => setIsOpen(false),
          })}
        </div>
      ) : null}
    </div>
  );
}

function DropdownSectionLabel({ label }) {
  return (
    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71809D]">
      {label}
    </p>
  );
}

function DropdownMenuItem({
  badgeCount = 0,
  icon: Icon,
  label,
  onClick,
  tone = 'default',
}) {
  const hasBadge = badgeCount > 0;
  const toneClassName =
    tone === 'danger'
      ? 'text-[#C23A63] hover:bg-[#FFF1F5]'
      : tone === 'info'
        ? 'text-[#4F46E5] hover:bg-[#EEF1FF]'
        : 'text-[#142459] hover:bg-[#F5F4FA]';

  const iconClassName =
    tone === 'danger'
      ? 'border-[#FFD6E0] bg-[#FFF1F5] text-[#C23A63]'
      : tone === 'info'
        ? 'border-[#D9DCFF] bg-[#EEF1FF] text-[#4F46E5]'
        : 'border-[#E6E8F2] bg-[#F7F8FC] text-[#6658F5]';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6658F5]/20 ${toneClassName}`}
    >
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${iconClassName}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">{label}</span>
      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#fff1f5] px-1.5 py-0.5 text-[10px] font-bold text-[var(--meeting-danger)] transition-opacity ${hasBadge ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!hasBadge}
      >
        {hasBadge ? badgeCount : '0'}
      </span>
    </button>
  );
}

function StatusRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#142459]">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6E8F2] bg-[#F7F8FC] text-[#6D7897]">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#71809D] sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
        <p className="truncate text-xs font-semibold text-[#142459] sm:text-sm">{value}</p>
      </div>
    </div>
  );
}

function MeetingTopBar({
  captionsRuntimeStatus = 'idle',
  connectionLabel,
  connectionTone = 'info',
  currentRole = 'participant',
  hasRecordingReady,
  hasUploadedRecording = false,
  isHost,
  isRoomLocked = false,
  isRoomRecordingActive = false,
  isRecording,
  meetingDuration,
  onOpenRecap,
  onCameraOffAllParticipants,
  onCopyInvite,
  onDownloadRecording,
  onDownloadUploadedRecording,
  onMuteAllParticipants,
  onOpenSidebar,
  onToggleCaptions,
  onToggleRecording,
  participantCount,
  presenterLabel = 'No one is presenting',
  recordingStatus,
  recordingTimeLabel,
  roomQualitySummary = null,
  roomId,
  spotlightLabel = 'No spotlight',
  transcriptStatus = 'pending',
  unreadChatCount,
  waitingCount = 0,
  waitingRoomEnabled = false,
  captionsEnabled = false,
}) {
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const isModerator = isHost || currentRole === 'cohost';
  const hasCloudRecording = hasUploadedRecording;
  const canDownloadRecording = hasRecordingReady || hasCloudRecording;
  const connectionToneForPill =
    connectionTone === 'success'
      ? 'success'
      : connectionTone === 'warning'
        ? 'warning'
        : connectionTone === 'error'
          ? 'error'
          : 'default';

  return (
    <div className="sticky top-0 z-30 border-b border-[var(--meeting-border)] bg-[rgba(245,244,250,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1580px] flex-col gap-2.5 px-2.5 py-2.5 sm:gap-4 sm:px-5 sm:py-4 lg:px-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <a href="/" className="shrink-0 text-base font-extrabold tracking-tight text-[var(--meeting-text)] sm:text-xl">
              Bony.
            </a>
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7b84a4] shadow-[0_10px_24px_rgba(20,36,89,0.06)] sm:px-3.5 sm:py-2 sm:text-[11px] sm:tracking-[0.18em]">
              <span className="h-2 w-2 rounded-full bg-[var(--meeting-accent)] sm:h-2.5 sm:w-2.5" />
              <span className="truncate">Room {roomId}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onCopyInvite}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--meeting-border)] bg-white text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition hover:bg-[var(--meeting-surface-tint)] sm:hidden"
              aria-label="Copy invite link"
            >
              <Copy className="h-4 w-4" />
            </button>

            <div className="hidden sm:block">
              <RecordingIndicator
                elapsedTimeLabel={recordingTimeLabel}
                hasRecordingReady={hasRecordingReady}
                isRecording={isRecording}
                statusLabel={recordingStatus}
              />
            </div>

            {roomQualitySummary ? (
              <div className="hidden sm:block">
                <QualityIndicator qualityLabel={roomQualitySummary.qualityLabel} />
              </div>
            ) : null}

            <div className="hidden sm:block">
              <ActionButton icon={Copy} label="Copy Invite" onClick={onCopyInvite} />
            </div>

            <DropdownMenu
              badgeCount={unreadChatCount + waitingCount}
              icon={MoreHorizontal}
              label="Room details"
            >
              {({ closeMenu }) => (
                <div className="max-h-[68vh] overflow-y-auto">
                  <DropdownSectionLabel label="Status" />
                  <div className="space-y-0.5 px-1 pb-2">
                    <StatusRow
                      icon={Shield}
                      label="Role"
                      value={
                        isHost
                          ? 'Host controls enabled'
                          : currentRole === 'cohost'
                            ? 'Co-host controls enabled'
                            : 'Participant'
                      }
                    />
                    <StatusRow
                      icon={Users}
                      label="Waiting"
                      value={
                        waitingRoomEnabled
                          ? `${waitingCount} pending`
                          : 'Waiting room disabled'
                      }
                    />
                    <StatusRow icon={VideoOff} label="Presenter" value={presenterLabel} />
                    <StatusRow icon={Pin} label="Spotlight" value={spotlightLabel} />
                    <StatusRow
                      icon={MessageSquare}
                      label="Captions"
                      value={captionsEnabled ? 'Visible in room' : 'Hidden in room'}
                    />
                    <StatusRow icon={FileText} label="Transcript" value={transcriptStatus} />
                  </div>

                  <div className="my-2 h-px bg-[#EEF0F6]" />
                  <DropdownSectionLabel label="Panels" />
                  <div className="space-y-0.5 px-1 pb-2">
                    <DropdownMenuItem
                      badgeCount={unreadChatCount}
                      icon={MessageSquare}
                      label="Open Chat"
                      onClick={() => {
                        onOpenSidebar('chat');
                        closeMenu();
                      }}
                    />
                    <DropdownMenuItem
                      icon={Users}
                      label="Open People"
                      onClick={() => {
                        onOpenSidebar('participants');
                        closeMenu();
                      }}
                    />
                    {isModerator ? (
                      <DropdownMenuItem
                        badgeCount={waitingCount}
                        icon={Users}
                        label="Open Waiting Queue"
                        onClick={() => {
                          onOpenSidebar('queue');
                          closeMenu();
                        }}
                      />
                    ) : null}
                    <DropdownMenuItem
                      icon={FileText}
                      label="Open Transcript"
                      onClick={() => {
                        onOpenSidebar('transcript');
                        closeMenu();
                      }}
                    />
                  </div>

                  <div className="my-2 h-px bg-[#EEF0F6]" />
                  <DropdownSectionLabel label="Actions" />
                  <div className="space-y-0.5 px-1 pb-1">
                    {onToggleCaptions ? (
                      <DropdownMenuItem
                        icon={MessageSquare}
                        label={
                          captionsRuntimeStatus === 'starting'
                            ? 'Starting Captions...'
                            : captionsEnabled
                              ? 'Hide Captions'
                              : 'Show Captions'
                        }
                        onClick={() => {
                          onToggleCaptions();
                          closeMenu();
                        }}
                        tone={captionsRuntimeStatus === 'starting' ? 'info' : 'default'}
                      />
                    ) : null}
                    {onOpenRecap ? (
                      <DropdownMenuItem
                        icon={FileText}
                        label="View Recap"
                        onClick={() => {
                          onOpenRecap();
                          closeMenu();
                        }}
                      />
                    ) : null}
                    {hasRecordingReady ? (
                      <DropdownMenuItem
                        icon={Download}
                        label="Download Recording"
                        onClick={() => {
                          onDownloadRecording();
                          closeMenu();
                        }}
                      />
                    ) : null}
                    {hasUploadedRecording ? (
                      <DropdownMenuItem
                        icon={Download}
                        label="Download Uploaded Recording"
                        onClick={() => {
                          onDownloadUploadedRecording?.();
                          closeMenu();
                        }}
                      />
                    ) : null}
                    {isModerator ? (
                      <>
                        <DropdownMenuItem
                          icon={MicOff}
                          label="Mute All Participants"
                          onClick={() => {
                            onMuteAllParticipants();
                            closeMenu();
                          }}
                          tone="info"
                        />
                        <DropdownMenuItem
                          icon={VideoOff}
                          label="Stop All Cameras"
                          onClick={() => {
                            onCameraOffAllParticipants();
                            closeMenu();
                          }}
                        />
                      </>
                    ) : null}
                  </div>
                </div>
              )}
            </DropdownMenu>
          </div>
        </div>

        <div className="sm:hidden flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {isHost ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d9dcff] bg-[#eef1ff] px-2.5 py-1 text-[10px] font-semibold text-[#5a4cf1]">
              <Shield className="h-3.5 w-3.5" />
              Host
            </span>
          ) : currentRole === 'cohost' ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#d7ebff] bg-[#eef7ff] px-2.5 py-1 text-[10px] font-semibold text-[#2d6eb8]">
              <Shield className="h-3.5 w-3.5" />
              Co-host
            </span>
          ) : null}
          {isRoomLocked ? (
            <span className="inline-flex shrink-0 items-center rounded-full border border-[#ffe1c9] bg-[#fff5eb] px-2.5 py-1 text-[10px] font-semibold text-[#c76b1a]">
              Locked
            </span>
          ) : null}
          {roomQualitySummary ? (
            <span className="shrink-0">
              <QualityIndicator compact qualityLabel={roomQualitySummary.qualityLabel} />
            </span>
          ) : null}
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
            isRecording
              ? 'border-[#ffd5e1] bg-[#fff1f5] text-[#d84b71]'
              : hasRecordingReady
                ? 'border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]'
                : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-muted)]'
          }`}>
            {isRecording ? 'Recording live' : hasRecordingReady ? 'Recording ready' : 'Recording idle'}
          </span>
        </div>

        <div className="sm:hidden flex items-center gap-2">
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="inline-flex min-w-full items-center gap-1.5">
              <MobileSummaryPill label="People" value={participantCount} />
              <MobileSummaryPill label="Time" value={meetingDuration} />
              <MobileSummaryPill label="Net" tone={connectionToneForPill} value={connectionLabel} />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen((currentState) => !currentState)}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--meeting-border)] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.08)]"
            aria-expanded={isMobileSummaryOpen}
          >
            Details
            <ChevronDown className={`h-3.5 w-3.5 transition ${isMobileSummaryOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isMobileSummaryOpen ? (
          <div className="sm:hidden rounded-[20px] border border-[var(--meeting-border)] bg-white/90 p-2.5 shadow-[0_14px_34px_rgba(20,36,89,0.10)]">
            <div className="grid grid-cols-2 gap-2">
              <MobileDetailCard
                accentClassName="border-[#dde1fb] text-[var(--meeting-accent)]"
                icon={Users}
                label="Participants"
                value={`${participantCount} connected`}
              />
              <MobileDetailCard
                accentClassName="border-[#dde1fb] text-[var(--meeting-accent)]"
                icon={Clock3}
                label="Duration"
                value={meetingDuration}
              />
              <MobileDetailCard
                accentClassName={
                  connectionTone === 'success'
                    ? 'border-[#cfe9de] text-[var(--meeting-success)]'
                    : connectionTone === 'warning'
                      ? 'border-[#ffe1c9] text-[#c76b1a]'
                      : connectionTone === 'error'
                        ? 'border-[#ffd6e0] text-[#d84b71]'
                        : 'border-[#dde1fb] text-[var(--meeting-accent)]'
                }
                icon={Wifi}
                label="Connection"
                value={connectionLabel}
              />
              <MobileDetailCard
                accentClassName={
                  isRecording
                    ? 'border-[#ffd5e1] text-[var(--meeting-danger)]'
                    : hasRecordingReady
                      ? 'border-[#cfe9de] text-[var(--meeting-success)]'
                      : 'border-[#dde1fb] text-[var(--meeting-accent)]'
                }
                icon={Download}
                label="Recording"
                value={
                  isRoomRecordingActive
                    ? 'Room recording live'
                    : isRecording
                      ? `Recording ${recordingTimeLabel}`
                      : hasCloudRecording
                        ? 'Uploaded to cloud'
                        : hasRecordingReady
                          ? 'Saved locally'
                          : 'Idle'
                }
              />
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <InfoChipActionButton
                label={isRecording ? 'Stop Recording' : 'Start Recording'}
                onClick={onToggleRecording}
                tone="primary"
              />
              <InfoChipActionButton
                disabled={!canDownloadRecording}
                label="Download Recording"
                onClick={() => onDownloadRecording?.()}
              />
            </div>
          </div>
        ) : null}

        <div className="hidden gap-2.5 sm:grid sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <InfoChip
            accentClassName="border-[#dde1fb] text-[var(--meeting-accent)]"
            icon={Users}
            label="Participants"
            value={`${participantCount} connected`}
          />
          <InfoChip
            accentClassName="border-[#dde1fb] text-[var(--meeting-accent)]"
            icon={Clock3}
            label="Duration"
            value={meetingDuration}
          />
          <InfoChip
            accentClassName={
              connectionTone === 'success'
                ? 'border-[#cfe9de] text-[var(--meeting-success)]'
                : connectionTone === 'warning'
                  ? 'border-[#ffe1c9] text-[#c76b1a]'
                  : connectionTone === 'error'
                    ? 'border-[#ffd6e0] text-[#d84b71]'
                    : 'border-[#dde1fb] text-[var(--meeting-accent)]'
            }
            icon={Wifi}
            label="Connection"
            value={connectionLabel}
          />
          <InfoChip
            accentClassName={
              isRecording
                ? 'border-[#ffd5e1] text-[var(--meeting-danger)]'
                : hasRecordingReady
                  ? 'border-[#cfe9de] text-[var(--meeting-success)]'
                  : 'border-[#dde1fb] text-[var(--meeting-accent)]'
            }
            icon={Download}
            label="Recording"
            value={
              isRoomRecordingActive
                ? 'Room recording live'
                : isRecording
                  ? `Recording ${recordingTimeLabel}`
                  : hasCloudRecording
                    ? 'Uploaded to cloud'
                    : hasRecordingReady
                      ? 'Saved locally'
                      : 'Idle'
            }
            actions={
              <>
                <InfoChipActionButton
                  label={isRecording ? 'Stop Recording' : 'Start Recording'}
                  onClick={onToggleRecording}
                  tone="primary"
                />
                <InfoChipActionButton
                  disabled={!canDownloadRecording}
                  label="Download Recording"
                  onClick={() => onDownloadRecording?.()}
                />
              </>
            }
          />
        </div>
      </div>
    </div>
  );
}

export default MeetingTopBar;
