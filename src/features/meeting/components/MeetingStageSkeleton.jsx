import SkeletonBlock from './SkeletonBlock';
import SkeletonText from './SkeletonText';

function StageCardSkeleton({ className = '' }) {
  return (
    <article className={`rounded-[28px] border border-[var(--meeting-border)] bg-white p-3 shadow-[0_10px_24px_rgba(20,36,89,0.08)] ${className}`}>
      <SkeletonBlock className="aspect-[4/3] w-full" roundedClassName="rounded-[22px]" />
      <div className="mt-3 flex items-start justify-between gap-3">
        <SkeletonText className="flex-1" lines={2} lineClassName="h-3" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-9 w-9" roundedClassName="rounded-full" />
          <SkeletonBlock className="h-9 w-9" roundedClassName="rounded-full" />
        </div>
      </div>
    </article>
  );
}

function MeetingStageSkeleton() {
  return (
    <section className="rounded-[32px] border border-[var(--meeting-border)] bg-white/80 p-4 shadow-[0_18px_50px_rgba(20,36,89,0.10)] backdrop-blur-xl">
      <div className="mb-4 rounded-[26px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-3">
        <SkeletonText className="max-w-[420px]" lines={2} lineClassName="h-3.5" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <StageCardSkeleton />
        <StageCardSkeleton />
        <StageCardSkeleton className="lg:col-span-2 2xl:col-span-1" />
      </div>
    </section>
  );
}

export default MeetingStageSkeleton;
