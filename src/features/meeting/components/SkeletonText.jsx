import SkeletonBlock from './SkeletonBlock';

function SkeletonText({
  className = '',
  lineClassName = 'h-3.5',
  lines = 3,
  lastLineWidthClassName = 'w-2/3',
}) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, lineIndex) => (
        <SkeletonBlock
          key={`skeleton-text-line-${lineIndex}`}
          className={`${lineClassName} ${
            lineIndex === lines - 1 ? lastLineWidthClassName : 'w-full'
          }`}
          roundedClassName="rounded-full"
        />
      ))}
    </div>
  );
}

export default SkeletonText;
