import { memo } from 'react';
import { Hand, Mic, Shield, Video } from 'lucide-react';
import InlineSpinner from './InlineSpinner';
import ParticipantItem from './ParticipantItem';

function StatCard({ icon: Icon, label, value, valueLabel, tone = 'indigo' }) {
  const toneClassName =
    tone === 'green'
      ? 'border-[#CFE9DE] bg-[#ECFBF4] text-[#15865C]'
      : tone === 'amber'
        ? 'border-[#FFE3B5] bg-[#FFF7E8] text-[#B76A12]'
        : 'border-[#D9DCFF] bg-[#EEF1FF] text-[#5A4CF1]';

  return (
    <div className="rounded-[18px] border border-[#E6E8F2] bg-white px-3.5 py-3 shadow-[0_10px_24px_rgba(20,36,89,0.06)]">
      <div className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#71809D]">
        <span
          className={`inline-flex h-8.5 w-8.5 items-center justify-center rounded-xl border shadow-[0_8px_18px_rgba(20,36,89,0.06)] ${toneClassName}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <p className="text-xl font-semibold tracking-tight text-[#142459]">{value}</p>
        <p className="text-xs font-medium text-[#71809D]">{valueLabel}</p>
      </div>
    </div>
  );
}

function HostActionButton({ accentClassName, isLoading = false, label, onClick }) {
  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
        isLoading
          ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)]'
          : accentClassName
      }`}
    >
      {isLoading ? <InlineSpinner size="xs" /> : label}
    </button>
  );
}

function ParticipantsPanel({
  actionNames = {},
  currentUserId,
  hasRecordingReady,
  isHost,
  isActionPending = () => false,
  isModerator,
  isRecordingLocal,
  onMakeCohost,
  onRemoveCohost,
  onClearSpotlight,
  onCameraOffAllParticipants,
  onKickParticipant,
  onLowerAllHands,
  onLowerParticipantHand,
  onMuteAllParticipants,
  onMuteParticipant,
  onSpotlightParticipant,
  onTurnOffParticipantCamera,
  participants,
  spotlightUserId,
}) {
  const activeMicCount = participants.filter((participant) => participant.audioEnabled).length;
  const activeVideoCount = participants.filter((participant) => participant.videoEnabled).length;
  const hostCount = participants.filter((participant) => participant.role === 'host').length;
  const cohostCount = participants.filter((participant) => participant.role === 'cohost').length;
  const raisedHandCount = participants.filter((participant) => participant.handRaised).length;
  const muteAllPending = isActionPending(actionNames.MUTE_ALL);
  const cameraOffAllPending = isActionPending(actionNames.CAMERA_OFF_ALL);
  const clearSpotlightPending = isActionPending(actionNames.CLEAR_SPOTLIGHT);
  const lowerAllHandsPending = isActionPending(actionNames.LOWER_ALL_HANDS);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--meeting-text)]">
            Participants
          </h3>
          <p className="text-sm text-[var(--meeting-muted)]">{participants.length} people in this room</p>
        </div>

        {isModerator ? (
          <div className="flex flex-wrap gap-2">
            <HostActionButton
              accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e5e8ff]"
              isLoading={muteAllPending}
              label="Mute All"
              onClick={() => {
                void onMuteAllParticipants();
              }}
            />
            <HostActionButton
              accentClassName="border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8] hover:bg-[#e6f2ff]"
              isLoading={cameraOffAllPending}
              label="Stop All Cameras"
              onClick={() => {
                void onCameraOffAllParticipants();
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <StatCard
          icon={Mic}
          label="Mic Live"
          tone="indigo"
          value={activeMicCount}
          valueLabel="active"
        />
        <StatCard
          icon={Video}
          label="Camera Live"
          tone="indigo"
          value={activeVideoCount}
          valueLabel="active"
        />
        <StatCard
          icon={Shield}
          label="Moderators"
          tone="green"
          value={hostCount + cohostCount}
          valueLabel="active"
        />
        <StatCard
          icon={Hand}
          label="Hands Raised"
          tone="amber"
          value={raisedHandCount}
          valueLabel="in queue"
        />
      </div>

      {isModerator && raisedHandCount > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <HostActionButton
            accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e5e8ff]"
            isLoading={clearSpotlightPending}
            label="Clear Spotlight"
            onClick={() => {
              void onClearSpotlight();
            }}
          />
          <HostActionButton
            accentClassName="border-[#ffe3b5] bg-[#fff7e8] text-[#b76a12] hover:bg-[#fff0d6]"
            isLoading={lowerAllHandsPending}
            label="Lower All Hands"
            onClick={() => {
              void onLowerAllHands();
            }}
          />
        </div>
      ) : null}

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {participants.map((participant) => (
          <ParticipantItem
            actionNames={actionNames}
            key={participant.userId}
            currentUserId={currentUserId}
            hasRecordingReady={hasRecordingReady}
            isHost={isHost}
            isActionPending={isActionPending}
            isModerator={isModerator}
            isRecordingLocal={isRecordingLocal}
            onMakeCohost={onMakeCohost}
            onRemoveCohost={onRemoveCohost}
            onKickParticipant={onKickParticipant}
            onLowerParticipantHand={onLowerParticipantHand}
            onMuteParticipant={onMuteParticipant}
            onSpotlightParticipant={onSpotlightParticipant}
            onTurnOffParticipantCamera={onTurnOffParticipantCamera}
            participant={participant}
            spotlightUserId={spotlightUserId}
          />
        ))}
      </div>
    </div>
  );
}

function areParticipantsPanelPropsEqual(previousProps, nextProps) {
  return (
    previousProps.actionNames === nextProps.actionNames &&
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.hasRecordingReady === nextProps.hasRecordingReady &&
    previousProps.isHost === nextProps.isHost &&
    previousProps.isModerator === nextProps.isModerator &&
    previousProps.isRecordingLocal === nextProps.isRecordingLocal &&
    previousProps.participants === nextProps.participants &&
    previousProps.spotlightUserId === nextProps.spotlightUserId &&
    previousProps.isActionPending === nextProps.isActionPending
  );
}

export default memo(ParticipantsPanel, areParticipantsPanelPropsEqual);
