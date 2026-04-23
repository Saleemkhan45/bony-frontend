import InlineSpinner from './InlineSpinner';

function QueueActionButton({ isLoading = false, label, onClick, tone = 'default' }) {
  const toneClassName =
    tone === 'danger'
      ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] hover:bg-[#ffe8ef]'
      : 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]';

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition ${
        isLoading
          ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)]'
          : toneClassName
      }`}
    >
      {isLoading ? <InlineSpinner size="xs" /> : label}
    </button>
  );
}

function WaitingRoomQueuePanel({
  actionNames = {},
  isActionPending = () => false,
  isModerator,
  onAdmitParticipant,
  onDenyParticipant,
  waitingParticipants,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--meeting-text)]">
          Waiting Room
        </h3>
        <p className="text-sm text-[var(--meeting-muted)]">
          {waitingParticipants.length} join request{waitingParticipants.length === 1 ? '' : 's'} waiting for approval
        </p>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        {waitingParticipants.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-5 text-sm text-[var(--meeting-muted)]">
            No one is waiting right now.
          </div>
        ) : null}

        {waitingParticipants.map((participant) => (
          <article
            key={participant.userId}
            className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4 shadow-[0_12px_30px_rgba(20,36,89,0.06)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[var(--meeting-text)]">{participant.userName}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--meeting-muted)]">
                  Waiting to enter
                </p>
              </div>

              {isModerator ? (
                <div className="flex flex-wrap items-center gap-2">
                  <QueueActionButton
                    isLoading={isActionPending(actionNames.ADMIT_PARTICIPANT, participant.userId)}
                    label="Admit"
                    onClick={() => {
                      void onAdmitParticipant?.(participant.userId);
                    }}
                  />
                  <QueueActionButton
                    isLoading={isActionPending(actionNames.DENY_PARTICIPANT, participant.userId)}
                    label="Deny"
                    onClick={() => {
                      void onDenyParticipant?.(participant.userId);
                    }}
                    tone="danger"
                  />
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default WaitingRoomQueuePanel;
