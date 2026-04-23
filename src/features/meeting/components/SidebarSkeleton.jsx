import SkeletonBlock from './SkeletonBlock';
import SkeletonText from './SkeletonText';

function ChatSidebarSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <SkeletonBlock className="h-16 w-full" roundedClassName="rounded-[22px]" />
      <div className="mt-4 flex-1 space-y-3 overflow-hidden">
        <SkeletonBlock className="h-11 w-8/12" roundedClassName="rounded-full" />
        <SkeletonBlock className="ml-auto h-14 w-9/12" roundedClassName="rounded-[20px]" />
        <SkeletonBlock className="h-14 w-10/12" roundedClassName="rounded-[20px]" />
        <SkeletonBlock className="ml-auto h-14 w-7/12" roundedClassName="rounded-[20px]" />
      </div>
      <SkeletonBlock className="mt-4 h-[58px] w-full" roundedClassName="rounded-[24px]" />
    </div>
  );
}

function ListSidebarSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonText className="max-w-[280px]" lines={2} />
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          key={`sidebar-list-skeleton-${index}`}
          className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4"
        >
          <SkeletonText lines={2} lineClassName="h-3.5" />
          <div className="mt-3 flex gap-2">
            <SkeletonBlock className="h-8 w-24" roundedClassName="rounded-full" />
            <SkeletonBlock className="h-8 w-20" roundedClassName="rounded-full" />
          </div>
        </article>
      ))}
    </div>
  );
}

function InsightSidebarSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-[130px] w-full" roundedClassName="rounded-[26px]" />
      <SkeletonBlock className="h-[150px] w-full" roundedClassName="rounded-[26px]" />
      <SkeletonBlock className="h-[150px] w-full" roundedClassName="rounded-[26px]" />
    </div>
  );
}

function SidebarSkeleton({ tab = 'chat' }) {
  if (tab === 'chat') {
    return <ChatSidebarSkeleton />;
  }

  if (tab === 'diagnostics' || tab === 'history' || tab === 'transcript') {
    return <InsightSidebarSkeleton />;
  }

  return <ListSidebarSkeleton />;
}

export default SidebarSkeleton;
