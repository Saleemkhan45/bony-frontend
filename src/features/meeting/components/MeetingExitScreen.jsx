import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

function MeetingExitScreen({ description, onReturnHome, onTryAgain, title }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--meeting-bg)] text-[var(--meeting-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,90,122,0.12),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(102,88,245,0.14),transparent_30%),linear-gradient(180deg,#f8f9fe_0%,#f5f4fa_44%,#f7f8fc_100%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl items-center px-3 py-8 sm:px-6 sm:py-12">
        <div className="w-full rounded-[26px] border border-[var(--meeting-border)] bg-white/92 p-5 shadow-[0_30px_80px_-40px_rgba(20,36,89,0.18)] backdrop-blur-xl sm:rounded-[36px] sm:p-8 md:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] shadow-[0_10px_28px_rgba(20,36,89,0.08)] sm:h-14 sm:w-14 sm:rounded-3xl">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--meeting-text)] sm:mt-6 sm:text-3xl md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--meeting-muted)] sm:mt-4 sm:text-base sm:leading-8">
            {description}
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <button
              type="button"
              onClick={onReturnHome}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--meeting-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition hover:bg-[var(--meeting-surface-tint)] sm:w-auto sm:px-5 sm:py-3"
            >
              <ArrowLeft className="h-4 w-4 text-[var(--meeting-accent)]" />
              Return Home
            </button>

            {onTryAgain ? (
              <button
                type="button"
                onClick={onTryAgain}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--meeting-accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_34px_-18px_rgba(102,88,245,0.62)] transition hover:bg-[var(--meeting-accent-hover)] sm:w-auto sm:px-5 sm:py-3"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingExitScreen;
