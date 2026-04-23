import { Hand, Pin, PinOff } from 'lucide-react';

function formatRaisedAt(value) {
  if (!value) {
    return 'Just now';
  }

  const raisedAt = new Date(value);

  if (Number.isNaN(raisedAt.getTime())) {
    return 'Just now';
  }

  return raisedAt.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ActionButton({ accentClassName, icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${accentClassName}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function RaisedHandsPanel({
  isHost,
  onClearSpotlight,
  onLowerAllHands,
  onLowerParticipantHand,
  onSpotlightParticipant,
  participants,
  spotlightUserId,
}) {
  const raisedHands = [...participants]
    .filter((participant) => participant.handRaised)
    .sort((leftParticipant, rightParticipant) =>
      String(leftParticipant.handRaisedAt ?? '').localeCompare(String(rightParticipant.handRaisedAt ?? '')),
    );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--meeting-text)]">
            Raised hands
          </h3>
          <p className="text-sm text-[var(--meeting-muted)]">
            {raisedHands.length === 0
              ? 'Nobody is waiting for attention right now.'
              : `${raisedHands.length} participant${raisedHands.length === 1 ? '' : 's'} in the queue`}
          </p>
        </div>

        {isHost && raisedHands.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <ActionButton
              accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]"
              icon={PinOff}
              label="Clear Spotlight"
              onClick={onClearSpotlight}
            />
            <ActionButton
              accentClassName="border-[#ffe3b5] bg-[#fff7e8] text-[#b76a12] hover:bg-[#fff2da]"
              icon={Hand}
              label="Lower All"
              onClick={onLowerAllHands}
            />
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {raisedHands.length === 0 ? (
          <div className="rounded-[28px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-5 text-sm text-[var(--meeting-muted)] shadow-[0_12px_30px_rgba(20,36,89,0.06)]">
            Raised hands will queue here in the order they were received.
          </div>
        ) : (
          raisedHands.map((participant, index) => (
            <article
              key={participant.userId}
              className="rounded-[28px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4 shadow-[0_12px_30px_rgba(20,36,89,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[#ffe3b5] bg-[#fff7e8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#b76a12]">
                      #{index + 1}
                    </span>
                    <p className="truncate text-sm font-semibold text-[var(--meeting-text)]">
                      {participant.userName}
                    </p>
                    {spotlightUserId === participant.userId ? (
                      <span className="rounded-full border border-[#d9dcff] bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5a4cf1]">
                        Spotlight
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--meeting-muted)]">
                    Raised at {formatRaisedAt(participant.handRaisedAt)}
                  </p>
                </div>

                <Hand className="mt-1 h-5 w-5 text-[#b76a12]" />
              </div>

              {isHost ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <ActionButton
                    accentClassName="border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]"
                    icon={Pin}
                    label={spotlightUserId === participant.userId ? 'Spotlighted' : 'Spotlight'}
                    onClick={() => onSpotlightParticipant(participant.userId)}
                  />
                  <ActionButton
                    accentClassName="border-[#ffe3b5] bg-[#fff7e8] text-[#b76a12] hover:bg-[#fff2da]"
                    icon={Hand}
                    label="Lower Hand"
                    onClick={() => onLowerParticipantHand(participant.userId)}
                  />
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default RaisedHandsPanel;
