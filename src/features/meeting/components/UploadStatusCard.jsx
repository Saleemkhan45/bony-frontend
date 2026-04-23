import { AlertTriangle, CheckCircle2, UploadCloud } from 'lucide-react';
import InlineSpinner from './InlineSpinner';
import SkeletonBlock from './SkeletonBlock';

function UploadStatusCard({
  description = '',
  isVisible = false,
  offsetClassName = 'bottom-28 right-4',
  state = 'idle',
  title = 'Processing...',
}) {
  if (!isVisible) {
    return null;
  }

  const isBusy = state === 'uploading' || state === 'exporting';
  const isSuccess = state === 'success' || state === 'uploaded';
  const isError = state === 'error' || state === 'upload-failed';
  const toneClassName = isSuccess
    ? 'border-[#cfe9de] bg-[#f4fcf8]'
    : isError
      ? 'border-[#ffd6e0] bg-[#fff4f7]'
      : 'border-[#d9dcff] bg-white';

  return (
    <aside
      aria-live="polite"
      className={`fixed z-40 w-[min(92vw,360px)] ${offsetClassName} loader-fade-up`}
    >
      <div className={`rounded-[24px] border px-4 py-3 shadow-[0_18px_44px_-20px_rgba(20,36,89,0.36)] backdrop-blur-xl ${toneClassName}`}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--meeting-border)] bg-white/80">
            {isBusy ? (
              <InlineSpinner size="xs" />
            ) : isSuccess ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-[var(--meeting-success)]" />
            ) : isError ? (
              <AlertTriangle className="h-4.5 w-4.5 text-[var(--meeting-danger)]" />
            ) : (
              <UploadCloud className="h-4.5 w-4.5 text-[var(--meeting-accent)]" />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">{title}</p>
            <p className="mt-1 text-xs leading-5 text-[var(--meeting-muted)]">{description}</p>

            {isBusy ? (
              <div className="mt-3">
                <SkeletonBlock className="h-2.5 w-full" roundedClassName="rounded-full" />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default UploadStatusCard;
