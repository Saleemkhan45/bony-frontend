function EmptyState({ description, title }) {
  return (
    <div className="flex h-full min-h-[180px] items-center justify-center rounded-[28px] border border-dashed border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-6 py-8 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="max-w-sm">
        <h3 className="text-base font-semibold tracking-tight text-[var(--meeting-text)]">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-[var(--meeting-muted)]">{description}</p>
      </div>
    </div>
  );
}

export default EmptyState;
