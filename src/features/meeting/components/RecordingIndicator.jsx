import { Download, Radio } from 'lucide-react';

function RecordingIndicator({ hasRecordingReady, isRecording, elapsedTimeLabel, statusLabel }) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-[0_10px_24px_rgba(20,36,89,0.08)] ${
        isRecording
          ? 'border-[#ffd5e1] bg-[#fff1f5] text-[#d84b71]'
          : hasRecordingReady
            ? 'border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]'
            : 'border-[var(--meeting-border)] bg-white text-[var(--meeting-muted)]'
      }`}
      title={statusLabel}
    >
      <span
        className={`inline-flex h-2.5 w-2.5 rounded-full ${
          isRecording
            ? 'animate-pulse bg-[var(--meeting-danger)]'
            : hasRecordingReady
              ? 'bg-[var(--meeting-success)]'
              : 'bg-[#c4cadc]'
        }`}
      />
      {hasRecordingReady && !isRecording ? (
        <Download className="h-3.5 w-3.5" />
      ) : (
        <Radio className="h-3.5 w-3.5" />
      )}
      {isRecording
        ? `Recording ${elapsedTimeLabel}`
        : hasRecordingReady
          ? 'Recording Saved'
          : 'Recording Ready'}
    </div>
  );
}

export default RecordingIndicator;
