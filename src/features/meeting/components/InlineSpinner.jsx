function InlineSpinner({
  className = '',
  label = '',
  size = 'sm',
  tone = 'default',
}) {
  const sizeClassName =
    size === 'xs'
      ? 'h-3 w-3 border-[1.5px]'
      : size === 'md'
        ? 'h-4.5 w-4.5 border-2'
        : 'h-3.5 w-3.5 border-2';
  const toneClassName =
    tone === 'light'
      ? 'border-white/30 border-t-white'
      : 'border-[var(--meeting-border-strong)] border-t-[var(--meeting-accent)]';

  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-live="polite">
      <span
        aria-hidden="true"
        className={`${sizeClassName} ${toneClassName} inline-flex rounded-full animate-spin`}
      />
      {label ? <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label}</span> : null}
    </span>
  );
}

export default InlineSpinner;
