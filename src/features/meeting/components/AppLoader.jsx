import InlineSpinner from './InlineSpinner';
import SkeletonBlock from './SkeletonBlock';
import SkeletonText from './SkeletonText';

function AppLoader({
  description = '',
  isVisible = false,
  showPreview = false,
  title = 'Preparing your workspace...',
}) {
  return (
    <div
      aria-hidden={!isVisible}
      className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-500 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_8%,rgba(102,88,245,0.14),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(93,166,250,0.16),transparent_22%),linear-gradient(180deg,rgba(250,250,255,0.86),rgba(246,246,252,0.9))] backdrop-blur-[2px]" />

      {showPreview ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-8 hidden justify-center px-5 lg:flex">
          <div className="w-full max-w-[1220px] rounded-[34px] border border-[var(--meeting-border)] bg-white/55 p-6 shadow-[0_18px_48px_rgba(20,36,89,0.09)]">
            <div className="grid grid-cols-12 gap-4">
              <SkeletonBlock className="col-span-8 h-[230px]" roundedClassName="rounded-[28px]" />
              <div className="col-span-4 space-y-3">
                <SkeletonBlock className="h-16" roundedClassName="rounded-2xl" />
                <SkeletonBlock className="h-16" roundedClassName="rounded-2xl" />
                <SkeletonBlock className="h-16" roundedClassName="rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="relative w-full max-w-[620px] rounded-[30px] border border-[var(--meeting-border)] bg-white/94 px-6 py-6 shadow-[0_28px_65px_-28px_rgba(20,36,89,0.34)] backdrop-blur-xl sm:px-8 sm:py-7">
        <div className="flex items-start gap-5">
          <div className="relative inline-flex h-14 w-14 items-center justify-center rounded-full border border-[#d9dcff] bg-[radial-gradient(circle_at_30%_25%,#f7f8ff_10%,#eef1ff_70%)] shadow-[0_14px_34px_rgba(102,88,245,0.14)]">
            <span className="absolute inset-[9px] rounded-full border border-[#e8ebfb] bg-white" />
            <span className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-[#6658f5] border-r-[#8ca7ff] animate-spin [animation-duration:1.7s]" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b84a4]">
              Live Collaboration
            </p>
            <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-[var(--meeting-text)] sm:text-[24px]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--meeting-muted)]">{description}</p>

            <div className="mt-4">
              <InlineSpinner label="Syncing room context" size="xs" />
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[22px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4">
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

export default AppLoader;
