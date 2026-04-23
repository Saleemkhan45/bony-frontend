import { CalendarClock, Download, ExternalLink, HardDrive, UserRound, Video } from 'lucide-react';
import {
  canOpenRecordingInNewTab,
  isRecordingDownloadUrlSupported,
  openRecordingInNewTab,
  triggerRecordingDownload,
} from '../utils/recordingDownload';

function formatRecordingDate(createdAt) {
  const timestamp = Date.parse(createdAt ?? '');

  if (Number.isNaN(timestamp)) {
    return 'Unknown time';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function formatRecordingSize(fileSize) {
  const numericSize = Number(fileSize);

  if (!Number.isFinite(numericSize) || numericSize <= 0) {
    return 'Unknown size';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(numericSize) / Math.log(1024)), units.length - 1);
  const normalizedSize = numericSize / 1024 ** unitIndex;
  const precision = normalizedSize >= 100 || unitIndex === 0 ? 0 : 1;

  return `${normalizedSize.toFixed(precision)} ${units[unitIndex]}`;
}

function RecordingItem({ recording }) {
  const fileName = recording?.fileName || 'Meeting recording';
  const createdLabel = formatRecordingDate(recording?.createdAt);
  const sizeLabel = formatRecordingSize(recording?.fileSize);
  const recordedByLabel = recording?.recordedByName || recording?.recordedBy || 'Unknown participant';
  const fileUrl = recording?.fileUrl || '';
  const hasDownloadUrl = isRecordingDownloadUrlSupported(fileUrl);
  const hasOpenUrl = canOpenRecordingInNewTab(fileUrl);

  function handleDownload() {
    if (!hasDownloadUrl) {
      return;
    }

    const didStartDownload = triggerRecordingDownload(fileUrl, fileName);

    if (!didStartDownload && hasOpenUrl) {
      openRecordingInNewTab(fileUrl);
    }
  }

  return (
    <article className="rounded-[22px] border border-[var(--meeting-border)] bg-white p-4 shadow-[0_12px_30px_rgba(20,36,89,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-[var(--meeting-text)]">
            <Video className="h-4 w-4 text-[var(--meeting-accent)]" />
            <span className="truncate">{fileName}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--meeting-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5" />
              {createdLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              {sizeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5" />
              {recordedByLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!hasDownloadUrl}
          onClick={handleDownload}
          className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200 ${
            hasDownloadUrl
              ? 'border-[#D9DCFF] bg-[#EEF1FF] text-[#4F46E5] hover:bg-[#E7EAFF]'
              : 'cursor-not-allowed border-[#ECEEF6] bg-[#F8F9FD] text-[#9AA5BF]'
          }`}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>

        {hasOpenUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--meeting-text)] transition-colors duration-200 hover:bg-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default RecordingItem;
