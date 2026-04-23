import { memo, useMemo } from 'react';
import ParticipantVideoCard from './ParticipantVideoCard';

function getGridClassName({ compact, participantCount }) {
  const safeParticipantCount = Math.max(1, participantCount);
  const mobileGridClassName =
    safeParticipantCount <= 1
      ? 'grid-cols-1'
      : safeParticipantCount === 2
        ? 'grid-cols-1 min-[360px]:grid-cols-2'
        : 'grid-cols-2';
  const desktopGridClassName = compact
    ? 'sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2'
    : 'sm:grid-cols-2 2xl:grid-cols-3';

  return `${mobileGridClassName} ${desktopGridClassName}`;
}

function getMobileCardLayout(participantCount, participantIndex) {
  const safeParticipantCount = Math.max(1, participantCount);

  if (safeParticipantCount <= 1) {
    return {
      mobileLayout: 'hero',
      mobileSpanClassName: '',
    };
  }

  if (safeParticipantCount === 2) {
    return {
      mobileLayout: 'pair',
      mobileSpanClassName: '',
    };
  }

  if (safeParticipantCount === 3) {
    if (participantIndex === 0) {
      return {
        mobileLayout: 'hero',
        mobileSpanClassName: 'col-span-2',
      };
    }

    return {
      mobileLayout: 'pair',
      mobileSpanClassName: '',
    };
  }

  if (safeParticipantCount === 4) {
    return {
      mobileLayout: 'pair',
      mobileSpanClassName: '',
    };
  }

  const isOddTailCard =
    safeParticipantCount % 2 === 1 && participantIndex === safeParticipantCount - 1;

  return {
    mobileLayout: 'compact',
    mobileSpanClassName: isOddTailCard ? 'col-span-2' : '',
  };
}

function normalizeCaptionKey(value) {
  return String(value ?? '').trim().toLowerCase();
}

function buildCaptionLookupBySpeaker(activeCaptionSegments = []) {
  const captionLookup = new Map();

  (Array.isArray(activeCaptionSegments) ? activeCaptionSegments : [])
    .filter((segment) => typeof segment?.content === 'string' && segment.content.trim())
    .forEach((segment) => {
      const lookupKeys = [
        normalizeCaptionKey(segment.speakerUserId),
        normalizeCaptionKey(segment.speakerUserName),
        normalizeCaptionKey(segment.speakerLabel),
      ].filter(Boolean);

      lookupKeys.forEach((speakerKey) => {
        const currentLines = captionLookup.get(speakerKey) ?? [];
        captionLookup.set(speakerKey, [...currentLines, segment].slice(-2));
      });
    });

  return captionLookup;
}

function getCaptionLinesForParticipant(captionLookup, participant) {
  const byUserId = captionLookup.get(normalizeCaptionKey(participant.userId));

  if (byUserId?.length) {
    return byUserId;
  }

  return captionLookup.get(normalizeCaptionKey(participant.userName)) ?? [];
}

function MeetingVideoGrid({
  activeSpeakerUserId = null,
  activeCaptionSegments = [],
  compact = false,
  hasRecordingReady,
  isRecordingLocal,
  onPinParticipant = null,
  participants,
  pinnedUserId = null,
  presenterUserId = null,
  localVideoRef,
  showHeader = true,
  spotlightUserId = null,
  title = 'Meeting stage',
  subtitle = 'Collaborative room view',
}) {
  const participantCount = participants.length;
  const wrapperClassName = compact
    ? 'rounded-[20px] border border-[var(--meeting-border)] bg-white/80 p-1.5 shadow-[0_12px_30px_rgba(20,36,89,0.08)] backdrop-blur-xl sm:rounded-[28px] sm:p-3'
    : 'rounded-[22px] border border-[var(--meeting-border)] bg-white/84 p-1.5 shadow-[0_14px_34px_rgba(20,36,89,0.09)] backdrop-blur-xl sm:rounded-[32px] sm:p-4';
  const captionLookupBySpeaker = useMemo(
    () => buildCaptionLookupBySpeaker(activeCaptionSegments),
    [activeCaptionSegments],
  );
  const gridClassName = useMemo(
    () => getGridClassName({ compact, participantCount }),
    [compact, participantCount],
  );

  return (
    <div className={wrapperClassName}>
      {showHeader ? (
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2.5 rounded-[16px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-2.5 py-2 sm:mb-4 sm:rounded-[26px] sm:px-4 sm:py-3">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.2em]">
              Meeting stage
            </p>
            <h2 className="mt-0.5 truncate text-[14px] font-semibold tracking-tight text-[var(--meeting-text)] sm:mt-1 sm:text-lg">
              {title}
            </h2>
            <p className="mt-0.5 hidden text-xs text-[var(--meeting-muted)] sm:mt-1 sm:block sm:text-sm">
              {subtitle}
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.06)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--meeting-success)]" />
            {participantCount} participant{participantCount === 1 ? '' : 's'}
          </span>
        </div>
      ) : null}

      <div className={`grid gap-2 sm:gap-4 ${gridClassName}`}>
        {participants.map((participant, participantIndex) => {
          const mobileCardLayout = getMobileCardLayout(participantCount, participantIndex);

          return (
            <div key={participant.userId} className={mobileCardLayout.mobileSpanClassName}>
              <ParticipantVideoCard
                captionLines={getCaptionLinesForParticipant(captionLookupBySpeaker, participant)}
                hasRecordingReady={participant.isLocal && hasRecordingReady}
                isActiveSpeaker={activeSpeakerUserId === participant.userId}
                isPinned={pinnedUserId === participant.userId}
                isPresenting={presenterUserId === participant.userId || participant.isPresenting}
                isRecordingLocal={participant.isLocal && isRecordingLocal}
                isSpotlighted={spotlightUserId === participant.userId}
                mobileLayout={mobileCardLayout.mobileLayout}
                onPinParticipant={onPinParticipant}
                participant={participant}
                localVideoRef={participant.isLocal ? localVideoRef : null}
                showPinButton={Boolean(onPinParticipant) && !participant.isLocal}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function areMeetingVideoGridPropsEqual(previousProps, nextProps) {
  return (
    previousProps.activeSpeakerUserId === nextProps.activeSpeakerUserId &&
    previousProps.activeCaptionSegments === nextProps.activeCaptionSegments &&
    previousProps.compact === nextProps.compact &&
    previousProps.hasRecordingReady === nextProps.hasRecordingReady &&
    previousProps.isRecordingLocal === nextProps.isRecordingLocal &&
    previousProps.participants === nextProps.participants &&
    previousProps.pinnedUserId === nextProps.pinnedUserId &&
    previousProps.presenterUserId === nextProps.presenterUserId &&
    previousProps.localVideoRef === nextProps.localVideoRef &&
    previousProps.showHeader === nextProps.showHeader &&
    previousProps.spotlightUserId === nextProps.spotlightUserId &&
    previousProps.title === nextProps.title &&
    previousProps.subtitle === nextProps.subtitle
  );
}

export default memo(MeetingVideoGrid, areMeetingVideoGridPropsEqual);
