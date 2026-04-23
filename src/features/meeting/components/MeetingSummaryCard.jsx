import EmptyState from './EmptyState';

function SummaryList({ items, title }) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[20px] border border-[var(--meeting-border)] bg-white p-3.5 shadow-[0_10px_24px_rgba(20,36,89,0.06)] sm:rounded-[24px] sm:p-4">
      <h4 className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--meeting-muted)] sm:leading-7">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="rounded-xl bg-[var(--meeting-surface-tint)] px-3 py-2 sm:rounded-2xl">
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MeetingSummaryCard({ meetingSummary }) {
  if (!meetingSummary || (!meetingSummary.summaryText && meetingSummary.status === 'pending')) {
    return (
      <EmptyState
        title="Meeting summary is still being prepared"
        description="Phase 4 now has the persistence layer and recap surface in place. Summary content will appear here as transcript and summary providers start feeding real data."
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-[var(--meeting-border)] bg-white p-4 shadow-[0_12px_30px_rgba(20,36,89,0.06)] sm:rounded-[28px] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.2em]">
              Meeting Summary
            </p>
            <h3 className="mt-2 text-base font-semibold tracking-tight text-[var(--meeting-text)] sm:text-lg">
              Post-meeting overview
            </h3>
          </div>

          <span className="inline-flex items-center rounded-full border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--meeting-muted)] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em]">
            {meetingSummary.status}
          </span>
        </div>

        <p className="mt-4 text-sm leading-6 text-[var(--meeting-text)] sm:leading-7">
          {meetingSummary.summaryText || 'No summary text is available yet.'}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SummaryList items={meetingSummary.decisions} title="Decisions" />
        <SummaryList items={meetingSummary.actionItems} title="Action Items" />
      </div>
    </section>
  );
}

export default MeetingSummaryCard;
