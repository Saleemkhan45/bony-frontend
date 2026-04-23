import { useEffect, useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileText,
  Hand,
  LayoutGrid,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  MoreHorizontal,
  PhoneOff,
  Radio,
  Users,
  Video,
  VideoOff,
} from 'lucide-react';
import InlineSpinner from './InlineSpinner';

function ControlButton({
  active = false,
  compact = false,
  compactLabel = '',
  danger = false,
  disabled = false,
  icon: Icon,
  isLoading = false,
  label,
  loadingLabel = 'Working',
  onClick,
}) {
  const toneClassName = danger
    ? 'border-[#ffd1da] bg-[#fff1f5] text-[#d94f73] hover:border-[#ffc4d1] hover:bg-[#ffe8ef]'
    : active
      ? compact
        ? 'border-[#5b4df0] bg-[var(--meeting-accent)] text-white shadow-none hover:bg-[var(--meeting-accent-hover)]'
        : 'border-transparent bg-[var(--meeting-accent)] text-white shadow-[0_18px_40px_-20px_rgba(102,88,245,0.65)] hover:bg-[var(--meeting-accent-hover)]'
      : 'border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] text-[var(--meeting-text)] hover:border-[#d9dcf0] hover:bg-white';
  const disabledClassName =
    'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg)] text-[var(--meeting-muted)] opacity-60';
  const layoutClassName = compact
    ? 'inline-flex h-11 min-w-[68px] shrink-0 items-center justify-center gap-1 rounded-[14px] border px-2.5 text-[11px] font-semibold tracking-tight'
    : 'inline-flex min-w-[76px] flex-col items-center justify-center gap-1.5 rounded-[18px] border px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] sm:min-w-[84px] sm:gap-2 sm:rounded-[22px] sm:px-4 sm:py-3 sm:text-[11px] sm:tracking-[0.16em]';
  const iconClassName = compact ? 'h-4 w-4' : 'h-4.5 w-4.5';
  const displayLabel = isLoading ? loadingLabel : compact ? (compactLabel || label) : label;

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${layoutClassName} transition duration-200 active:translate-y-0 ${
        disabled || isLoading
          ? disabledClassName
          : `hover:-translate-y-0.5 ${toneClassName}`
      }`}
    >
      {isLoading ? <InlineSpinner size="xs" /> : <Icon className={iconClassName} />}
      <span>{displayLabel}</span>
    </button>
  );
}

function MoreActionButton({ badgeCount = 0, disabled = false, icon: Icon, isLoading = false, label, onClick }) {
  const hasBadge = badgeCount > 0;
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6658F5]/20 ${
        disabled || isLoading
          ? 'cursor-not-allowed text-[#8e98b3] opacity-75'
          : 'cursor-pointer text-[#142459] hover:bg-[#F5F4FA]'
      }`}
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E6E8F2] bg-[#F7F8FC] text-[#6658F5]">
        {isLoading ? <InlineSpinner size="xs" /> : <Icon className="h-4 w-4" />}
      </span>
      <span className="flex-1">{isLoading ? 'Working...' : label}</span>
      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#fff1f5] px-1.5 py-0.5 text-[10px] font-bold text-[var(--meeting-danger)] transition-opacity ${hasBadge ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!hasBadge}
      >
        {hasBadge ? badgeCount : '0'}
      </span>
    </button>
  );
}

function MeetingControlBar({
  activeRoomRecording = false,
  captionsEnabled = false,
  captionsRuntimeStatus = 'idle',
  hasRecordingReady = false,
  hasUploadedRecording = false,
  isCameraEnabled,
  isHandRaised,
  isModerator = false,
  isMicEnabled,
  isRecording,
  isScreenShareTransitioning = false,
  isScreenShareSupported = true,
  isScreenSharing = false,
  layoutMode = 'grid',
  onLeaveMeeting,
  onCycleLayout,
  onOpenSidebar,
  onToggleCamera,
  onToggleCaptions,
  onDownloadRecording,
  onDownloadUploadedRecording,
  onToggleMicrophone,
  onToggleRaiseHand,
  onToggleRecording,
  onToggleScreenShare,
  onToggleRoomRecording,
  unreadChatCount,
}) {
  const [isDesktopMoreMenuOpen, setIsDesktopMoreMenuOpen] = useState(false);
  const [isMobileMoreMenuOpen, setIsMobileMoreMenuOpen] = useState(false);
  const desktopMoreMenuRef = useRef(null);

  useEffect(() => {
    if (!isDesktopMoreMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event) {
      const isInsideDesktopMenu = desktopMoreMenuRef.current?.contains(event.target);

      if (!isInsideDesktopMenu) {
        setIsDesktopMoreMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isDesktopMoreMenuOpen]);

  useEffect(() => {
    if (!isDesktopMoreMenuOpen && !isMobileMoreMenuOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsDesktopMoreMenuOpen(false);
        setIsMobileMoreMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDesktopMoreMenuOpen, isMobileMoreMenuOpen]);

  function renderMoreActions(closeMenu) {
    return (
      <>
        <MoreActionButton
          icon={LayoutGrid}
          label={layoutMode === 'speaker' ? 'Switch to Grid View' : 'Switch to Speaker View'}
          onClick={() => {
            onCycleLayout();
            closeMenu();
          }}
        />
        {isRecording ? (
          <MoreActionButton
            icon={Radio}
            label="Stop Personal Recording"
            onClick={() => {
              onToggleRecording();
              closeMenu();
            }}
          />
        ) : (
          <MoreActionButton
            icon={Radio}
            label="Start Personal Recording"
            onClick={() => {
              onToggleRecording();
              closeMenu();
            }}
          />
        )}
        {hasRecordingReady && !isRecording ? (
          <MoreActionButton
            icon={Download}
            label="Download Personal Recording"
            onClick={() => {
              onDownloadRecording?.();
              closeMenu();
            }}
          />
        ) : null}
        {hasUploadedRecording ? (
          <MoreActionButton
            icon={Download}
            label="Download Uploaded Recording"
            onClick={() => {
              onDownloadUploadedRecording?.();
              closeMenu();
            }}
          />
        ) : null}
        {isModerator ? (
          <MoreActionButton
            icon={Radio}
            label={activeRoomRecording ? 'Stop Room Recording' : 'Start Room Recording'}
            onClick={() => {
              onToggleRoomRecording();
              closeMenu();
            }}
          />
        ) : null}
        <div className="my-2 h-px bg-[#EEF0F6]" />
        <MoreActionButton
          badgeCount={unreadChatCount}
          icon={MessageSquare}
          label="Open Chat"
          onClick={() => {
            onOpenSidebar('chat');
            closeMenu();
          }}
        />
        <MoreActionButton
          icon={Users}
          label="Open People"
          onClick={() => {
            onOpenSidebar('participants');
            closeMenu();
          }}
        />
        {onToggleCaptions ? (
          <MoreActionButton
            icon={MessageSquare}
            isLoading={captionsRuntimeStatus === 'starting'}
            label={captionsEnabled ? 'Hide Captions' : 'Show Captions'}
            onClick={() => {
              onToggleCaptions();
              closeMenu();
            }}
          />
        ) : null}
        <MoreActionButton
          icon={FileText}
          label="Open Transcript"
          onClick={() => {
            onOpenSidebar('transcript');
            closeMenu();
          }}
        />
      </>
    );
  }

  return (
    <div className="fixed inset-x-2 bottom-2 z-30 pb-[max(env(safe-area-inset-bottom),0px)] sm:inset-x-auto sm:bottom-4 sm:left-1/2 sm:w-[min(100%-1.5rem,1120px)] sm:-translate-x-1/2">
      <div className="rounded-[20px] border border-[var(--meeting-border)] bg-white p-1.5 shadow-[0_10px_26px_-18px_rgba(20,36,89,0.22)] sm:rounded-[32px] sm:bg-white/94 sm:p-3 sm:shadow-[0_24px_60px_-24px_rgba(20,36,89,0.20)] sm:backdrop-blur-xl">
        <div className="sm:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <ControlButton
              active={isMicEnabled}
              compact
              compactLabel={isMicEnabled ? 'Mute' : 'Unmute'}
              label={isMicEnabled ? 'Mute' : 'Unmute'}
              icon={isMicEnabled ? Mic : MicOff}
              onClick={onToggleMicrophone}
            />
            <ControlButton
              active={isCameraEnabled}
              compact
              compactLabel="Camera"
              label={isCameraEnabled ? 'Camera On' : 'Camera Off'}
              icon={isCameraEnabled ? Video : VideoOff}
              onClick={onToggleCamera}
            />
            <ControlButton
              active={isHandRaised}
              compact
              compactLabel={isHandRaised ? 'Lower' : 'Hand'}
              label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
              icon={Hand}
              onClick={onToggleRaiseHand}
            />
            <ControlButton
              compact
              danger
              compactLabel="Leave"
              label="Leave"
              icon={PhoneOff}
              onClick={onLeaveMeeting}
            />
            <ControlButton
              active={isScreenSharing}
              compact
              compactLabel="Share"
              disabled={!isScreenShareSupported || isScreenShareTransitioning}
              label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
              icon={MonitorUp}
              isLoading={isScreenShareTransitioning}
              loadingLabel={isScreenSharing ? 'Stopping' : 'Starting'}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleScreenShare?.(event);
              }}
            />

            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsMobileMoreMenuOpen((currentState) => !currentState);
                }}
                className="inline-flex h-11 min-w-[68px] items-center justify-center gap-1 rounded-[14px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-2.5 text-[11px] font-semibold tracking-tight text-[var(--meeting-text)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d9dcf0] hover:bg-white"
                aria-expanded={isMobileMoreMenuOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="h-4 w-4" />
                More
                <span
                  className={`inline-flex min-w-[16px] items-center justify-center rounded-full bg-[#fff1f5] px-1 py-0.5 text-[9px] font-bold text-[var(--meeting-danger)] transition-opacity ${unreadChatCount > 0 ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={unreadChatCount <= 0}
                >
                  {unreadChatCount > 0 ? unreadChatCount : '0'}
                </span>
              </button>

            </div>
          </div>
        </div>

        <div className="hidden flex-wrap items-center justify-center gap-2 sm:flex">
          <ControlButton
            active={isMicEnabled}
            label={isMicEnabled ? 'Mute' : 'Unmute'}
            icon={isMicEnabled ? Mic : MicOff}
            onClick={onToggleMicrophone}
          />
          <ControlButton
            active={isCameraEnabled}
            label={isCameraEnabled ? 'Camera On' : 'Camera Off'}
            icon={isCameraEnabled ? Video : VideoOff}
            onClick={onToggleCamera}
          />
          <ControlButton
            active={isHandRaised}
            label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
            icon={Hand}
            onClick={onToggleRaiseHand}
          />
          <ControlButton
            active={isScreenSharing}
            disabled={!isScreenShareSupported || isScreenShareTransitioning}
            label={isScreenSharing ? 'Stop Share' : 'Share Screen'}
            icon={MonitorUp}
            isLoading={isScreenShareTransitioning}
            loadingLabel={isScreenSharing ? 'Stopping' : 'Starting'}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleScreenShare?.(event);
            }}
          />

          <div ref={desktopMoreMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsDesktopMoreMenuOpen((currentState) => !currentState)}
              className="inline-flex min-w-[92px] flex-col items-center justify-center gap-2 rounded-[22px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--meeting-text)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d9dcf0] hover:bg-white"
              aria-expanded={isDesktopMoreMenuOpen}
              aria-haspopup="menu"
            >
              <span className="inline-flex items-center gap-1.5">
                <MoreHorizontal className="h-4.5 w-4.5" />
                More
                <span
                  className={`inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#fff1f5] px-1 py-0.5 text-[9px] font-bold text-[var(--meeting-danger)] transition-opacity ${unreadChatCount > 0 ? 'opacity-100' : 'opacity-0'}`}
                  aria-hidden={unreadChatCount <= 0}
                >
                  {unreadChatCount > 0 ? unreadChatCount : '0'}
                </span>
              </span>
              <ChevronDown className={`h-3.5 w-3.5 transition ${isDesktopMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDesktopMoreMenuOpen ? (
              <div
                role="menu"
                className="absolute bottom-[calc(100%+0.75rem)] left-1/2 z-40 w-[min(85vw,320px)] -translate-x-1/2 overflow-hidden rounded-[20px] border border-[#E6E8F2] bg-white p-2.5 shadow-[0_14px_40px_rgba(20,36,89,0.12)]"
              >
                {renderMoreActions(() => setIsDesktopMoreMenuOpen(false))}
              </div>
            ) : null}
          </div>

          <ControlButton
            danger
            label="Leave"
            icon={PhoneOff}
            onClick={onLeaveMeeting}
          />
        </div>
      </div>

      {isMobileMoreMenuOpen ? (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close more actions"
            className="absolute inset-0 bg-[rgba(20,36,89,0.28)]"
            onClick={() => setIsMobileMoreMenuOpen(false)}
          />
          <div className="absolute inset-x-2 bottom-[4.9rem] overflow-hidden rounded-[18px] border border-[#E6E8F2] bg-white p-2 shadow-[0_18px_44px_rgba(20,36,89,0.24)]">
            {renderMoreActions(() => setIsMobileMoreMenuOpen(false))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default MeetingControlBar;
