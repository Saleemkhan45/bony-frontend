import { Button } from '@/shared/ui/Button';

function HeroContent({ content, isStartMeetingLoading = false, onAction }) {
  const actions = content.actions ?? [content.primaryAction].filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-xl text-center lg:mx-0 lg:text-left">
      <p className="mb-3 inline-flex rounded-full border border-[#e8e6ff] bg-white/80 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5f54c9] shadow-sm min-[390px]:text-[10px] sm:mb-4 sm:px-4 sm:py-1.5 sm:text-xs sm:tracking-[0.26em]">
        {content.badge}
      </p>

      <h1 className="mx-auto max-w-[12.5ch] text-[clamp(1.85rem,8.8vw,2.85rem)] font-extrabold leading-[1.08] tracking-[-0.04em] text-ink min-[390px]:max-w-[13.5ch] sm:max-w-[14ch] sm:text-[clamp(2.15rem,6vw,3.35rem)] lg:mx-0 lg:max-w-lg lg:text-[64px] lg:leading-[1.02]">
        {content.title}
      </h1>

      <p className="mx-auto mt-3.5 max-w-[34ch] text-[15px] leading-7 text-slate-500 sm:mt-4 sm:max-w-[40ch] sm:text-base sm:leading-8 lg:mx-0 lg:mt-5 lg:max-w-md lg:text-lg">
        {content.description}
      </p>

      <div className="mx-auto mt-5 grid w-full max-w-sm grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:mt-6 sm:max-w-md sm:gap-3 lg:mx-0 lg:mt-8 lg:flex lg:max-w-none lg:flex-wrap lg:items-center lg:justify-start lg:gap-4">
        {actions.map((action) => (
          (() => {
            const isStartMeetingAction = action.actionId === 'start-meeting';
            const isLoading = isStartMeetingAction && isStartMeetingLoading;

            return (
              <Button
                key={action.actionId ?? action.label}
                href={action.href}
                size="sm"
                variant={action.variant ?? 'solid'}
                disabled={isLoading}
                onClick={(event) => {
                  if (isLoading) {
                    event.preventDefault();
                    event.stopPropagation();
                    return;
                  }

                  onAction?.(action, event);
                }}
                className={`w-full justify-center lg:w-auto ${
                  isLoading ? 'cursor-not-allowed opacity-80' : ''
                }`}
                aria-busy={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-current" />
                    Starting...
                  </>
                ) : (
                  action.label
                )}
              </Button>
            );
          })()
        ))}
      </div>
    </div>
  );
}

export default HeroContent;
