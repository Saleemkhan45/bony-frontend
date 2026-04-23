import RecordingList from './RecordingList';

function formatEventLabel(event) {
  const payloadText = event.payload?.role
    ? ` (${event.payload.role})`
    : '';

  return `${event.eventType.replaceAll('_', ' ')}${payloadText}`;
}

function MeetingHistoryPanel({ meetingEvents = [], recordings = [] }) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--meeting-text)]">Meeting History</h3>
        <p className="text-sm text-[var(--meeting-muted)]">
          Recording files and moderation activity for this room.
        </p>
        {isDev ? (
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4]">
            Debug: {recordings.length} recordings, {meetingEvents.length} events
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        <RecordingList recordings={recordings} />

        <div className="pt-1">
          <h4 className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">
            Activity Events
          </h4>
          <p className="mt-1 text-xs text-[var(--meeting-muted)]">
            Persistent moderation, recording, and access events from this room.
          </p>
        </div>

        {meetingEvents.length === 0 ? (
          <div className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-5 text-sm text-[var(--meeting-muted)]">
            Activity events will appear here as moderation and access updates happen.
          </div>
        ) : null}

        {meetingEvents.map((event) => (
          <article
            key={event.id}
            className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4 shadow-[0_12px_30px_rgba(20,36,89,0.06)]"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-[var(--meeting-text)]">{formatEventLabel(event)}</p>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--meeting-muted)]">
                {new Date(event.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--meeting-muted)]">
              {event.actorUserName || 'System'}
              {event.targetUserName ? ` -> ${event.targetUserName}` : ''}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default MeetingHistoryPanel;
