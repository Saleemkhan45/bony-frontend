import { memo, useEffect, useRef } from 'react';
import { Download, Hand, Mic, MicOff, Pin, Radio, Shield, Video, VideoOff } from 'lucide-react';
import QualityIndicator from './QualityIndicator';
import { createInitials } from '../utils/meetingRoom';

function StatusBadge({ icon: Icon, label, toneClassName }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold shadow-[0_8px_20px_rgba(20,36,89,0.08)] backdrop-blur-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-[11px] ${toneClassName}`}
    >
      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
      {label}
    </span>
  );
}

function ParticipantStatusIcon({
  disabledIcon: DisabledIcon,
  enabled,
  enabledIcon: EnabledIcon,
  compact = false,
}) {
  const wrapperClassName = compact
    ? 'inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] shadow-[0_8px_20px_rgba(20,36,89,0.08)] sm:h-11 sm:w-11 sm:rounded-full'
    : 'inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] sm:h-11 sm:w-11 sm:rounded-full';
  const iconClassName = compact
    ? 'h-3 w-3 sm:h-4.5 sm:w-4.5'
    : 'h-3.5 w-3.5 sm:h-4.5 sm:w-4.5';

  return (
    <span className={wrapperClassName}>
      {enabled ? (
        <EnabledIcon className={`${iconClassName} text-[var(--meeting-text)]`} />
      ) : (
        <DisabledIcon className={`${iconClassName} text-[var(--meeting-danger)]`} />
      )}
    </span>
  );
}

function setMediaElementStream(element, stream) {
  if (!element) {
    return;
  }

  if (element.srcObject !== stream) {
    element.srcObject = stream;
  }
}

function areCaptionLinesEqual(previousLines = [], nextLines = []) {
  if (previousLines === nextLines) {
    return true;
  }

  if (previousLines.length !== nextLines.length) {
    return false;
  }

  for (let lineIndex = 0; lineIndex < previousLines.length; lineIndex += 1) {
    const previousLine = previousLines[lineIndex];
    const nextLine = nextLines[lineIndex];

    if (
      previousLine?.id !== nextLine?.id ||
      previousLine?.content !== nextLine?.content ||
      previousLine?.speakerUserId !== nextLine?.speakerUserId ||
      previousLine?.speakerLabel !== nextLine?.speakerLabel ||
      previousLine?.speakerUserName !== nextLine?.speakerUserName
    ) {
      return false;
    }
  }

  return true;
}

function areParticipantDisplayPropsEqual(previousParticipant, nextParticipant) {
  if (previousParticipant === nextParticipant) {
    return true;
  }

  if (!previousParticipant || !nextParticipant) {
    return false;
  }

  return (
    previousParticipant.userId === nextParticipant.userId &&
    previousParticipant.userName === nextParticipant.userName &&
    previousParticipant.isLocal === nextParticipant.isLocal &&
    previousParticipant.isHost === nextParticipant.isHost &&
    previousParticipant.role === nextParticipant.role &&
    previousParticipant.roleLabel === nextParticipant.roleLabel &&
    previousParticipant.audioEnabled === nextParticipant.audioEnabled &&
    previousParticipant.videoEnabled === nextParticipant.videoEnabled &&
    previousParticipant.handRaised === nextParticipant.handRaised &&
    previousParticipant.handRaisedAt === nextParticipant.handRaisedAt &&
    previousParticipant.isPresenting === nextParticipant.isPresenting &&
    previousParticipant.accentClassName === nextParticipant.accentClassName &&
    previousParticipant.mediaStream === nextParticipant.mediaStream &&
    previousParticipant.presentationStream === nextParticipant.presentationStream &&
    previousParticipant.qualitySample?.qualityLabel ===
      nextParticipant.qualitySample?.qualityLabel
  );
}

function ParticipantVideoCard({
  captionLines = [],
  hasRecordingReady,
  isRecordingLocal,
  isActiveSpeaker = false,
  isPinned = false,
  isPresenting = false,
  isSpotlighted = false,
  isStageCard = false,
  mediaOverrideStream = null,
  onPinParticipant = null,
  participant,
  localVideoRef,
  mobileLayout = 'default',
  showPinButton = false,
}) {
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localOverrideVideoRef = useRef(null);
  const displayStream = mediaOverrideStream ?? participant.mediaStream ?? null;
  const hasLocalPresentationVideo =
    participant.isLocal &&
    Boolean(mediaOverrideStream) &&
    mediaOverrideStream.getVideoTracks().length > 0;
  const hasLocalVideo = participant.isLocal && !hasLocalPresentationVideo && participant.videoEnabled;
  const hasRemoteMedia = !participant.isLocal && Boolean(displayStream);
  const hasRemoteVideo =
    hasRemoteMedia &&
    (participant.videoEnabled || isPresenting) &&
    displayStream.getVideoTracks().length > 0;
  const displayName = participant.isLocal
    ? `${participant.userName} (You)`
    : participant.userName;
  const latestCaptionText = captionLines[captionLines.length - 1]?.content?.trim() ?? '';
  const mediaAspectClassName = isStageCard
    ? 'aspect-[4/3]'
    : mobileLayout === 'hero'
      ? 'aspect-[16/9] min-[390px]:aspect-[16/10] sm:aspect-[4/3]'
      : mobileLayout === 'pair'
        ? 'aspect-[16/10] min-[360px]:aspect-[4/5] sm:aspect-[4/3]'
        : mobileLayout === 'compact'
          ? 'aspect-[1/1] sm:aspect-[4/3]'
          : 'aspect-[16/10] sm:aspect-[4/3]';
  const fallbackMinHeightClassName = isStageCard
    ? 'min-h-[190px] sm:min-h-[240px]'
    : mobileLayout === 'hero'
      ? 'min-h-[180px] min-[390px]:min-h-[195px] sm:min-h-[220px]'
      : mobileLayout === 'pair'
        ? 'min-h-[150px] min-[360px]:min-h-[162px] sm:min-h-[210px]'
        : mobileLayout === 'compact'
          ? 'min-h-[132px] sm:min-h-[200px]'
          : 'min-h-[150px] sm:min-h-[220px]';
  const articlePaddingClassName = isStageCard
    ? 'p-2.5 sm:p-3.5'
    : mobileLayout === 'compact'
      ? 'p-1.5 sm:p-3'
      : mobileLayout === 'pair'
        ? 'p-1.5 sm:p-3'
        : 'p-2 sm:p-3';
  const isCompactMobileCard = !isStageCard && mobileLayout === 'compact';

  useEffect(() => {
    if (participant.isLocal) {
      if (hasLocalPresentationVideo && localOverrideVideoRef.current) {
        setMediaElementStream(localOverrideVideoRef.current, mediaOverrideStream);
      }

      return;
    }

    setMediaElementStream(remoteVideoRef.current, hasRemoteVideo ? displayStream : null);
    setMediaElementStream(remoteAudioRef.current, hasRemoteMedia ? displayStream : null);

    if (!displayStream) {
      return;
    }

    [remoteVideoRef.current, remoteAudioRef.current]
      .filter(Boolean)
      .forEach((element) => {
        const playResult = element.play?.();

        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(() => {
            // Browser autoplay policies can block this; user interaction restores playback.
          });
        }
      });
  }, [
    displayStream,
    hasLocalPresentationVideo,
    hasRemoteMedia,
    hasRemoteVideo,
    mediaOverrideStream,
    participant.isLocal,
  ]);

  return (
    <article
      className={`group overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_30px_rgba(20,36,89,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(20,36,89,0.14)] sm:rounded-[32px] ${articlePaddingClassName} ${
        isActiveSpeaker
          ? 'border-[#b7f0cb] shadow-[0_20px_44px_rgba(21,134,92,0.16)]'
          : isPresenting || isSpotlighted || isPinned || isStageCard
            ? 'border-[#d9dcff] shadow-[0_18px_40px_rgba(90,76,241,0.12)]'
            : 'border-[var(--meeting-border)]'
      }`}
    >
      <div className="relative overflow-hidden rounded-[16px] border border-[#edf0fa] bg-[var(--meeting-surface-tint)] sm:rounded-[26px]">
        {hasLocalPresentationVideo ? (
          <video
            ref={localOverrideVideoRef}
            autoPlay
            playsInline
            muted
            className={`${mediaAspectClassName} w-full bg-[#dfe6fb] object-cover`}
          />
        ) : hasLocalVideo ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`${mediaAspectClassName} w-full bg-[#dfe6fb] object-cover`}
          />
        ) : hasRemoteVideo ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted
              className={`${mediaAspectClassName} w-full bg-[#dfe6fb] object-cover`}
            />
            <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
          </>
        ) : (
          <div
            className={`relative flex ${mediaAspectClassName} ${fallbackMinHeightClassName} items-center justify-center overflow-hidden bg-gradient-to-br ${participant.accentClassName}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.78),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/75 bg-white/72 text-xl font-bold tracking-[0.08em] text-[var(--meeting-text)] shadow-[0_18px_40px_rgba(20,36,89,0.10)] backdrop-blur-sm sm:h-24 sm:w-24 sm:text-3xl">
              {createInitials(participant.userName)}
            </div>
            <p className="absolute bottom-2 left-2 right-2 rounded-xl border border-white/70 bg-white/82 px-2.5 py-1 text-center text-[10px] font-semibold leading-4 text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-full sm:px-4 sm:py-2 sm:text-xs sm:leading-5">
              {(participant.videoEnabled || isPresenting)
                ? hasRemoteMedia
                  ? isPresenting
                    ? 'Screen share is live for this participant.'
                    : 'Remote camera stream is connected.'
                  : 'Connecting remote media stream...'
                : isPresenting
                  ? 'Preparing the shared screen feed...'
                  : 'Camera is off'}
            </p>
            {!hasRemoteVideo && hasRemoteMedia ? (
              <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
            ) : null}
          </div>
        )}

        {latestCaptionText ? (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-20 w-full max-w-[84%] -translate-x-1/2 rounded-xl bg-black/72 px-2.5 py-1.5 text-center text-[10px] font-medium leading-4 text-white shadow-[0_20px_40px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:bottom-4 sm:max-w-[70%] sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm sm:leading-5">
            <p className="overflow-hidden break-words [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {latestCaptionText}
            </p>
          </div>
        ) : null}

        <div className="absolute left-2 right-11 top-2 z-20 flex gap-1 overflow-x-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:left-4 sm:right-14 sm:top-4 sm:gap-2">
          {participant.isHost ? (
            <StatusBadge
              icon={Shield}
              label="Host"
              toneClassName="border-[#d9dcff] bg-white/88 text-[#5a4cf1]"
            />
          ) : null}
          {participant.isLocal && isRecordingLocal ? (
            <StatusBadge
              icon={Radio}
              label="Recording"
              toneClassName="border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]"
            />
          ) : null}
          {participant.isLocal && !isRecordingLocal && hasRecordingReady ? (
            <StatusBadge
              icon={Download}
              label="Saved Locally"
              toneClassName="border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]"
            />
          ) : null}
          {participant.handRaised ? (
            <StatusBadge
              icon={Hand}
              label="Hand Raised"
              toneClassName="border-[#ffe3b5] bg-[#fff7e8] text-[#b76a12]"
            />
          ) : null}
          {participant.qualitySample?.qualityLabel ? (
            <QualityIndicator compact qualityLabel={participant.qualitySample.qualityLabel} />
          ) : null}
          {isPresenting ? (
            <StatusBadge
              icon={Video}
              label="Presenting"
              toneClassName="border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8]"
            />
          ) : null}
          {isSpotlighted ? (
            <StatusBadge
              icon={Pin}
              label="Spotlight"
              toneClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1]"
            />
          ) : null}
          {isPinned && !isSpotlighted ? (
            <StatusBadge
              icon={Pin}
              label="Pinned"
              toneClassName="border-[#dce8ff] bg-[#f2f7ff] text-[#336fbb]"
            />
          ) : null}
        </div>

        {showPinButton ? (
          <button
            type="button"
            onClick={() => onPinParticipant?.(participant.userId)}
            className="absolute right-2 top-2 z-30 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/75 bg-white/88 text-[var(--meeting-text)] shadow-[0_12px_26px_rgba(20,36,89,0.12)] transition hover:-translate-y-0.5 hover:bg-white sm:right-4 sm:top-4 sm:h-11 sm:w-11"
            aria-label={isPinned ? `Unpin ${displayName}` : `Pin ${displayName}`}
          >
            <Pin className={`h-4 w-4 sm:h-4.5 sm:w-4.5 ${isPinned ? 'fill-current text-[#5a4cf1]' : ''}`} />
          </button>
        ) : null}

        {isActiveSpeaker ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-[#32c97f] via-[#65d69d] to-[#8ae2b6] sm:h-1.5" />
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-2 px-0.5 pb-0.5 pt-2.5 sm:gap-4 sm:px-1 sm:pb-1 sm:pt-4">
        <div className="min-w-0">
          <p
            className={`truncate font-semibold tracking-tight text-[var(--meeting-text)] sm:text-[17px] ${
              isCompactMobileCard ? 'text-[13px]' : 'text-[15px]'
            }`}
          >
            {displayName}
          </p>
          <p
            className={`mt-0.5 font-semibold uppercase text-[var(--meeting-muted)] sm:mt-1 sm:text-xs sm:tracking-[0.18em] ${
              isCompactMobileCard ? 'text-[9px] tracking-[0.11em]' : 'text-[10px] tracking-[0.12em]'
            }`}
          >
            {participant.roleLabel}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ParticipantStatusIcon
            compact={isCompactMobileCard}
            enabled={participant.audioEnabled}
            enabledIcon={Mic}
            disabledIcon={MicOff}
          />
          <ParticipantStatusIcon
            compact={isCompactMobileCard}
            enabled={participant.videoEnabled}
            enabledIcon={Video}
            disabledIcon={VideoOff}
          />
        </div>
      </div>
    </article>
  );
}

function areParticipantVideoCardPropsEqual(previousProps, nextProps) {
  return (
    previousProps.hasRecordingReady === nextProps.hasRecordingReady &&
    previousProps.isRecordingLocal === nextProps.isRecordingLocal &&
    previousProps.isActiveSpeaker === nextProps.isActiveSpeaker &&
    previousProps.isPinned === nextProps.isPinned &&
    previousProps.isPresenting === nextProps.isPresenting &&
    previousProps.isSpotlighted === nextProps.isSpotlighted &&
    previousProps.isStageCard === nextProps.isStageCard &&
    previousProps.showPinButton === nextProps.showPinButton &&
    previousProps.localVideoRef === nextProps.localVideoRef &&
    previousProps.mediaOverrideStream === nextProps.mediaOverrideStream &&
    previousProps.mobileLayout === nextProps.mobileLayout &&
    areParticipantDisplayPropsEqual(previousProps.participant, nextProps.participant) &&
    areCaptionLinesEqual(previousProps.captionLines, nextProps.captionLines)
  );
}

export default memo(ParticipantVideoCard, areParticipantVideoCardPropsEqual);
