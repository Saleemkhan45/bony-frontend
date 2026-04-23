function SkeletonBlock({
  className = '',
  roundedClassName = 'rounded-2xl',
}) {
  return (
    <div
      aria-hidden="true"
      className={`loader-shimmer relative overflow-hidden bg-[var(--meeting-surface-soft)] ${roundedClassName} ${className}`}
    />
  );
}

export default SkeletonBlock;
