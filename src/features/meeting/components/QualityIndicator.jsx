function QualityIndicator({ compact = false, qualityLabel = 'unknown' }) {
  const normalizedLabel = String(qualityLabel ?? 'unknown').toLowerCase();
  const toneClassName =
    normalizedLabel === 'good'
      ? 'border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]'
      : normalizedLabel === 'fair'
        ? 'border-[#ffe1c9] bg-[#fff5eb] text-[#c76b1a]'
        : normalizedLabel === 'poor'
          ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]'
          : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-muted)]';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-[0.14em] ${toneClassName} ${
        compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-[11px]'
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      {normalizedLabel === 'unknown' ? 'Unknown quality' : `${normalizedLabel} quality`}
    </span>
  );
}

export default QualityIndicator;
