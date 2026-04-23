import { Hand, MicOff, Pin, VideoOff, X } from 'lucide-react';
import InlineSpinner from './InlineSpinner';

function ActionButton({
  accentClassName,
  disabled = false,
  icon: Icon,
  isLoading = false,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
        disabled || isLoading
          ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)] opacity-80'
          : accentClassName
      }`}
    >
      {isLoading ? <InlineSpinner size="xs" /> : <Icon className="h-3.5 w-3.5" />}
      {isLoading ? 'Working...' : label}
    </button>
  );
}

function AdminActionMenu({
  actionNames = {},
  isActionPending = () => false,
  isHost,
  onMakeCohost,
  onKickParticipant,
  onLowerParticipantHand,
  onMuteParticipant,
  onRemoveCohost,
  onSpotlightParticipant,
  onTurnOffCamera,
  participant,
  spotlightUserId,
}) {
  const isSpotlighted = spotlightUserId === participant.userId;
  const mutePending = isActionPending(actionNames.MUTE_PARTICIPANT, participant.userId);
  const cameraPending = isActionPending(actionNames.CAMERA_OFF_PARTICIPANT, participant.userId);
  const lowerHandPending = isActionPending(actionNames.LOWER_PARTICIPANT_HAND, participant.userId);
  const spotlightPending = isActionPending(actionNames.SPOTLIGHT_PARTICIPANT, participant.userId);
  const makeCohostPending = isActionPending(actionNames.MAKE_COHOST, participant.userId);
  const removeCohostPending = isActionPending(actionNames.REMOVE_COHOST, participant.userId);
  const kickPending = isActionPending(actionNames.KICK_PARTICIPANT, participant.userId);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <ActionButton
        accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]"
        icon={MicOff}
        isLoading={mutePending}
        label="Mute User"
        onClick={() => {
          void onMuteParticipant(participant.userId);
        }}
      />
      <ActionButton
        accentClassName="border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8] hover:bg-[#e6f2ff]"
        icon={VideoOff}
        isLoading={cameraPending}
        label="Camera Off"
        onClick={() => {
          void onTurnOffCamera(participant.userId);
        }}
      />
      {participant.handRaised ? (
        <ActionButton
          accentClassName="border-[#ffe3b5] bg-[#fff7e8] text-[#b76a12] hover:bg-[#fff2da]"
          icon={Hand}
          isLoading={lowerHandPending}
          label="Lower Hand"
          onClick={() => {
            void onLowerParticipantHand(participant.userId);
          }}
        />
      ) : null}
      <ActionButton
        accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]"
        icon={Pin}
        isLoading={spotlightPending}
        label={isSpotlighted ? 'Spotlighted' : 'Spotlight'}
        onClick={() => {
          void onSpotlightParticipant(participant.userId);
        }}
      />
      {isHost && participant.role !== 'host' ? (
        participant.role === 'cohost' ? (
          <ActionButton
            accentClassName="border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8] hover:bg-[#e6f2ff]"
            icon={Pin}
            isLoading={removeCohostPending}
            label="Remove Co-host"
            onClick={() => {
              void onRemoveCohost(participant.userId);
            }}
          />
        ) : (
          <ActionButton
            accentClassName="border-[#d7ebff] bg-[#eef7ff] text-[#2d6eb8] hover:bg-[#e6f2ff]"
            icon={Pin}
            isLoading={makeCohostPending}
            label="Make Co-host"
            onClick={() => {
              void onMakeCohost(participant.userId);
            }}
          />
        )
      ) : null}
      <ActionButton
        accentClassName="ml-auto border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] hover:bg-[#ffe8ef]"
        icon={X}
        isLoading={kickPending}
        label="Remove User"
        onClick={() => {
          void onKickParticipant(participant.userId);
        }}
      />
    </div>
  );
}

export default AdminActionMenu;
