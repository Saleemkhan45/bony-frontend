import InlineSpinner from './InlineSpinner';
import SkeletonText from './SkeletonText';

function LoadingState({ description, title }) {
  return (
    <div className="rounded-[30px] border border-[var(--meeting-border)] bg-white/90 px-6 py-6 shadow-[0_18px_44px_rgba(20,36,89,0.10)] backdrop-blur-xl">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d9dcff] bg-[#eef1ff] text-[var(--meeting-accent)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] loader-soft-pulse">
          <InlineSpinner size="xs" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-[var(--meeting-text)]">{title}</h2>
          <p className="mt-2 text-sm leading-7 text-[var(--meeting-muted)]">{description}</p>
          <SkeletonText className="mt-4 max-w-[320px]" lines={1} lineClassName="h-2.5" />
        </div>
      </div>
    </div>
  );
}

export default LoadingState;
