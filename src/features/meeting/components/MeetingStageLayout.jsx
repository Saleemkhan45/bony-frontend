import { memo, useMemo } from 'react';
import MeetingVideoGrid from './MeetingVideoGrid';
import ParticipantVideoCard from './ParticipantVideoCard';

function pickPrimaryParticipant({
  activeSpeakerUserId,
  participants,
  pinnedUserId,
  presenterUserId,
  spotlightUserId,
}) {
  const orderedUserIds = [
    presenterUserId,
    spotlightUserId,
    pinnedUserId,
    activeSpeakerUserId,
    participants.find((participant) => !participant.isLocal)?.userId ?? null,
    participants[0]?.userId ?? null,
  ].filter(Boolean);

  return (
    orderedUserIds
      .map((userId) => participants.find((participant) => participant.userId === userId))
      .find(Boolean) ?? null
  );
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

function MeetingStageLayout({
  activeSpeakerUserId,
  captionSegments = [],
  hasRecordingReady,
  isRecordingLocal,
  layoutMode,
  localVideoRef,
  onPinParticipant,
  participants,
  pinnedUserId,
  presenterUserId,
  spotlightUserId,
}) {
  const primaryParticipant = pickPrimaryParticipant({
    activeSpeakerUserId,
    participants,
    pinnedUserId,
    presenterUserId,
    spotlightUserId,
  });
  const captionLookupBySpeaker = useMemo(
    () => buildCaptionLookupBySpeaker(captionSegments),
    [captionSegments],
  );
  const shouldUseStageLayout =
    layoutMode === 'speaker' || Boolean(presenterUserId) || Boolean(spotlightUserId) || Boolean(pinnedUserId);

  if (!shouldUseStageLayout || !primaryParticipant) {
    return (
      <MeetingVideoGrid
        activeCaptionSegments={captionSegments}
        activeSpeakerUserId={activeSpeakerUserId}
        hasRecordingReady={hasRecordingReady}
        isRecordingLocal={isRecordingLocal}
        localVideoRef={localVideoRef}
        onPinParticipant={onPinParticipant}
        participants={participants}
        pinnedUserId={pinnedUserId}
        presenterUserId={presenterUserId}
        spotlightUserId={spotlightUserId}
      />
    );
  }

  const secondaryParticipants = participants.filter(
    (participant) => participant.userId !== primaryParticipant.userId,
  );
  const stageTitle = presenterUserId
    ? 'Presentation focus'
    : spotlightUserId
      ? 'Host spotlight'
      : pinnedUserId
        ? 'Pinned speaker'
        : 'Speaker view';
  const stageSubtitle = presenterUserId
    ? 'The presenter stays large while the rest of the room stays visible in the filmstrip.'
    : spotlightUserId
      ? 'The host spotlight is currently leading the room for everyone.'
      : pinnedUserId
        ? 'This pinned participant stays on your stage locally.'
        : 'The most important speaker stays centered while the rest of the room follows below.';

  return (
    <section className="rounded-[22px] border border-[var(--meeting-border)] bg-white/86 p-2 shadow-[0_14px_36px_rgba(20,36,89,0.10)] backdrop-blur-xl sm:rounded-[32px] sm:p-4">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 rounded-[18px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-3 py-2 sm:mb-4 sm:rounded-[26px] sm:px-4 sm:py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.2em]">
            Stage mode
          </p>
          <h2 className="mt-0.5 text-[15px] font-semibold tracking-tight text-[var(--meeting-text)] sm:mt-1 sm:text-lg">
            {stageTitle}
          </h2>
          <p className="mt-0.5 hidden text-xs text-[var(--meeting-muted)] sm:mt-1 sm:block sm:text-sm">
            {stageSubtitle}
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1 text-[10px] font-semibold text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.06)] sm:gap-2 sm:px-3.5 sm:py-2 sm:text-xs">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--meeting-success)]" />
          {participants.length} participant{participants.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="grid gap-2 sm:gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.95fr)]">
        <ParticipantVideoCard
          captionLines={getCaptionLinesForParticipant(captionLookupBySpeaker, primaryParticipant)}
          hasRecordingReady={primaryParticipant.isLocal && hasRecordingReady}
          isActiveSpeaker={activeSpeakerUserId === primaryParticipant.userId}
          isPinned={pinnedUserId === primaryParticipant.userId}
          isPresenting={presenterUserId === primaryParticipant.userId || primaryParticipant.isPresenting}
          isRecordingLocal={primaryParticipant.isLocal && isRecordingLocal}
          isSpotlighted={spotlightUserId === primaryParticipant.userId}
          isStageCard
          mediaOverrideStream={primaryParticipant.presentationStream ?? null}
          onPinParticipant={onPinParticipant}
          participant={primaryParticipant}
          localVideoRef={primaryParticipant.isLocal ? localVideoRef : null}
          showPinButton={!primaryParticipant.isLocal}
        />

        {secondaryParticipants.length > 0 ? (
          <MeetingVideoGrid
            activeCaptionSegments={captionSegments}
            activeSpeakerUserId={activeSpeakerUserId}
            compact
            hasRecordingReady={hasRecordingReady}
            isRecordingLocal={isRecordingLocal}
            localVideoRef={localVideoRef}
            onPinParticipant={onPinParticipant}
            participants={secondaryParticipants}
            pinnedUserId={pinnedUserId}
            presenterUserId={presenterUserId}
            showHeader={false}
            spotlightUserId={spotlightUserId}
            title="Room strip"
            subtitle="Secondary participants stay visible while the stage stays focused."
          />
        ) : null}
      </div>
    </section>
  );
}

function areMeetingStageLayoutPropsEqual(previousProps, nextProps) {
  return (
    previousProps.activeSpeakerUserId === nextProps.activeSpeakerUserId &&
    previousProps.captionSegments === nextProps.captionSegments &&
    previousProps.hasRecordingReady === nextProps.hasRecordingReady &&
    previousProps.isRecordingLocal === nextProps.isRecordingLocal &&
    previousProps.layoutMode === nextProps.layoutMode &&
    previousProps.localVideoRef === nextProps.localVideoRef &&
    previousProps.participants === nextProps.participants &&
    previousProps.pinnedUserId === nextProps.pinnedUserId &&
    previousProps.presenterUserId === nextProps.presenterUserId &&
    previousProps.spotlightUserId === nextProps.spotlightUserId
  );
}

export default memo(MeetingStageLayout, areMeetingStageLayoutPropsEqual);
