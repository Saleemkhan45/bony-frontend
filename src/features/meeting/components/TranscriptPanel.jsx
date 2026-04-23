import { memo } from 'react';
import EmptyState from './EmptyState';
import InlineSpinner from './InlineSpinner';

function formatTranscriptTime(timestamp) {
  if (!timestamp) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

function TranscriptPanel({
  isExporting = false,
  onDownloadTranscript = null,
  transcriptSegments = [],
  transcriptStatus = 'pending',
  transcriptMessage = '',
}) {
  const hasTranscriptSegments =
    Array.isArray(transcriptSegments) && transcriptSegments.length > 0;

  if (!hasTranscriptSegments) {
    const emptyStateDescription =
      transcriptMessage ||
      (transcriptStatus === 'unsupported'
        ? 'Live captions are not supported in this browser for this meeting.'
        : 'Transcript persistence is wired now, but no transcript segments have been captured for this room yet.');

    return (
      <EmptyState
        title="Transcript is still empty"
        description={emptyStateDescription}
      />
    );
  }

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7b84a4]">
            Transcript
          </p>
          <p className="mt-1 text-sm text-[var(--meeting-muted)]">
            Status: {transcriptStatus}
          </p>
        </div>

        {onDownloadTranscript ? (
          <button
            type="button"
            disabled={isExporting}
            onClick={onDownloadTranscript}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold shadow-[0_8px_20px_rgba(20,36,89,0.06)] transition ${
              isExporting
                ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)]'
                : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-text)] hover:bg-[var(--meeting-surface-tint)]'
            }`}
          >
            {isExporting ? (
              <>
                <InlineSpinner size="xs" />
                Exporting...
              </>
            ) : (
              'Download Transcript'
            )}
          </button>
        ) : null}
      </div>

      <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
        {transcriptSegments.map((segment) => (
          <article
            key={segment.id}
            className="rounded-[24px] border border-[var(--meeting-border)] bg-white p-4 shadow-[0_8px_20px_rgba(20,36,89,0.05)]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">
                {segment.speakerLabel || segment.speakerUserName || 'Speaker'}
              </p>
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--meeting-muted)]">
                {formatTranscriptTime(segment.startedAt)}
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-[var(--meeting-text)]">{segment.content}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function areTranscriptPanelPropsEqual(previousProps, nextProps) {
  return (
    previousProps.isExporting === nextProps.isExporting &&
    previousProps.onDownloadTranscript === nextProps.onDownloadTranscript &&
    previousProps.transcriptSegments === nextProps.transcriptSegments &&
    previousProps.transcriptStatus === nextProps.transcriptStatus &&
    previousProps.transcriptMessage === nextProps.transcriptMessage
  );
}

export default memo(TranscriptPanel, areTranscriptPanelPropsEqual);
