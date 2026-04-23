import { memo } from 'react';
import { Dot, Hand, Mic, MicOff, Shield, Video, VideoOff } from 'lucide-react';
import AdminActionMenu from './AdminActionMenu';
import QualityIndicator from './QualityIndicator';

function StatusIcon({ enabled, enabledIcon: EnabledIcon, disabledIcon: DisabledIcon }) {
  return (
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--meeting-border)] bg-white shadow-[0_8px_18px_rgba(20,36,89,0.06)]">
      {enabled ? (
        <EnabledIcon className="h-4 w-4 text-[var(--meeting-text)]" />
      ) : (
        <DisabledIcon className="h-4 w-4 text-[var(--meeting-danger)]" />
      )}
    </span>
  );
}

function ParticipantItem({
  actionNames = {},
  currentUserId,
  hasRecordingReady,
  isHost,
  isActionPending = () => false,
  isModerator,
  isRecordingLocal,
  onMakeCohost,
  onKickParticipant,
  onLowerParticipantHand,
  onMuteParticipant,
  onRemoveCohost,
  onSpotlightParticipant,
  onTurnOffParticipantCamera,
  participant,
  spotlightUserId,
}) {
  const isCurrentUser = participant.userId === currentUserId;
  const isSpotlighted = spotlightUserId === participant.userId;

  return (
    <article className="rounded-[28px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4 shadow-[0_12px_30px_rgba(20,36,89,0.06)] transition hover:border-[#d8dbf6] hover:bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-[var(--meeting-text)]">
              {isCurrentUser ? `${participant.userName} (You)` : participant.userName}
            </p>
            {participant.isHost ? (
              <span className="rounded-full border border-[#d9dcff] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a4cf1]">
                Host
              </span>
            ) : participant.role === 'cohost' ? (
              <span className="rounded-full border border-[#d7ebff] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2d6eb8]">
                Co-host
              </span>
            ) : null}
            {participant.isLocal && isRecordingLocal ? (
              <span className="rounded-full border border-[#ffd6e0] bg-[#fff1f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#d84b71]">
                Recording
              </span>
            ) : null}
            {participant.isLocal && !isRecordingLocal && hasRecordingReady ? (
              <span className="rounded-full border border-[#cfe9de] bg-[#ebfaf3] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#15865c]">
                Ready To Download
              </span>
            ) : null}
            {participant.handRaised ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#ffe3b5] bg-[#fff7e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b76a12]">
                <Hand className="h-3.5 w-3.5" />
                Hand Raised
              </span>
            ) : null}
            {participant.isPresenting ? (
              <span className="rounded-full border border-[#d7ebff] bg-[#eef7ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#2d6eb8]">
                Presenting
              </span>
            ) : null}
            {isSpotlighted ? (
              <span className="rounded-full border border-[#d9dcff] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a4cf1]">
                Spotlight
              </span>
            ) : null}
            {participant.qualitySample?.qualityLabel ? (
              <QualityIndicator compact qualityLabel={participant.qualitySample.qualityLabel} />
            ) : null}
          </div>

          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--meeting-muted)]">
            {participant.roleLabel}
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium text-[var(--meeting-muted)]">
            <span className="rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1">
              {participant.audioEnabled ? 'Mic live' : 'Mic muted'}
            </span>
            <span className="rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1">
              {participant.videoEnabled ? 'Camera live' : 'Camera off'}
            </span>
            <span className="rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1">
              {participant.handRaised ? 'Hand raised' : 'Hand lowered'}
            </span>
            {participant.handRaisedAt ? (
              <span className="rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1">
                Raised {new Date(participant.handRaisedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            ) : null}
            {participant.isPresenting ? (
              <span className="rounded-full border border-[var(--meeting-border)] bg-white px-2.5 py-1">
                Sharing screen
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusIcon
            enabled={participant.audioEnabled}
            enabledIcon={Mic}
            disabledIcon={MicOff}
          />
          <StatusIcon
            enabled={participant.videoEnabled}
            enabledIcon={Video}
            disabledIcon={VideoOff}
          />
        </div>
      </div>

      {isHost && !isCurrentUser ? (
        <AdminActionMenu
          actionNames={actionNames}
          isActionPending={isActionPending}
          isHost={isHost}
          onMakeCohost={onMakeCohost}
          onKickParticipant={onKickParticipant}
          onLowerParticipantHand={onLowerParticipantHand}
          onMuteParticipant={onMuteParticipant}
          onRemoveCohost={onRemoveCohost}
          onSpotlightParticipant={onSpotlightParticipant}
          onTurnOffCamera={onTurnOffParticipantCamera}
          participant={participant}
          spotlightUserId={spotlightUserId}
        />
      ) : isModerator && !isCurrentUser ? (
        <AdminActionMenu
          actionNames={actionNames}
          isActionPending={isActionPending}
          isHost={false}
          onMakeCohost={onMakeCohost}
          onKickParticipant={onKickParticipant}
          onLowerParticipantHand={onLowerParticipantHand}
          onMuteParticipant={onMuteParticipant}
          onRemoveCohost={onRemoveCohost}
          onSpotlightParticipant={onSpotlightParticipant}
          onTurnOffCamera={onTurnOffParticipantCamera}
          participant={participant}
          spotlightUserId={spotlightUserId}
        />
      ) : (
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--meeting-muted)]">
          <Shield className="h-4 w-4 text-[var(--meeting-accent)]" />
          {participant.isHost
            ? 'This participant owns room moderation.'
            : participant.isLocal && isRecordingLocal
              ? 'Local recording is active on this device.'
              : participant.isLocal && hasRecordingReady
                ? 'A local recording file is ready to download on this device.'
                : 'Media state updates here in real time as tracks change.'}
        </div>
      )}

      {participant.isLocal && !participant.audioEnabled && !participant.videoEnabled ? (
        <div className="mt-3 inline-flex items-center rounded-full border border-[#ffe1c9] bg-[#fff5eb] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#c76b1a]">
          <Dot className="h-4 w-4" />
          Host moderation can re-enable only from your device
        </div>
      ) : null}
    </article>
  );
}

function areParticipantCoreFieldsEqual(previousParticipant, nextParticipant) {
  if (previousParticipant === nextParticipant) {
    return true;
  }

  if (!previousParticipant || !nextParticipant) {
    return false;
  }

  return (
    previousParticipant.userId === nextParticipant.userId &&
    previousParticipant.userName === nextParticipant.userName &&
    previousParticipant.isHost === nextParticipant.isHost &&
    previousParticipant.isLocal === nextParticipant.isLocal &&
    previousParticipant.role === nextParticipant.role &&
    previousParticipant.roleLabel === nextParticipant.roleLabel &&
    previousParticipant.audioEnabled === nextParticipant.audioEnabled &&
    previousParticipant.videoEnabled === nextParticipant.videoEnabled &&
    previousParticipant.handRaised === nextParticipant.handRaised &&
    previousParticipant.handRaisedAt === nextParticipant.handRaisedAt &&
    previousParticipant.isPresenting === nextParticipant.isPresenting &&
    previousParticipant.qualitySample?.qualityLabel ===
      nextParticipant.qualitySample?.qualityLabel
  );
}

function areParticipantItemPropsEqual(previousProps, nextProps) {
  return (
    previousProps.actionNames === nextProps.actionNames &&
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.hasRecordingReady === nextProps.hasRecordingReady &&
    previousProps.isHost === nextProps.isHost &&
    previousProps.isActionPending === nextProps.isActionPending &&
    previousProps.isModerator === nextProps.isModerator &&
    previousProps.isRecordingLocal === nextProps.isRecordingLocal &&
    previousProps.spotlightUserId === nextProps.spotlightUserId &&
    areParticipantCoreFieldsEqual(previousProps.participant, nextProps.participant)
  );
}

export default memo(ParticipantItem, areParticipantItemPropsEqual);
