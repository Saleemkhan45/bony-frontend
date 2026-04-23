import { memo, useMemo } from 'react';
import EmptyState from './EmptyState';
import RecordingItem from './RecordingItem';

function toTimestamp(value) {
  const parsed = Date.parse(value ?? '');
  return Number.isNaN(parsed) ? 0 : parsed;
}

function sortRecordingsNewestFirst(recordings) {
  return [...recordings].sort((firstRecording, secondRecording) => {
    const secondTimestamp = toTimestamp(secondRecording?.createdAt);
    const firstTimestamp = toTimestamp(firstRecording?.createdAt);

    if (secondTimestamp !== firstTimestamp) {
      return secondTimestamp - firstTimestamp;
    }

    return String(secondRecording?.id ?? '').localeCompare(String(firstRecording?.id ?? ''));
  });
}

function RecordingList({ recordings }) {
  const sortedRecordings = useMemo(
    () => sortRecordingsNewestFirst(Array.isArray(recordings) ? recordings : []),
    [recordings],
  );

  if (!Array.isArray(recordings) || recordings.length === 0) {
    return (
      <EmptyState
        title="No saved recordings yet"
        description="Room recordings will appear here after upload finishes and metadata is saved."
      />
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">
          Recordings
        </h4>
        <span className="inline-flex items-center rounded-full border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--meeting-muted)]">
          {sortedRecordings.length}
        </span>
      </div>

      <div className="space-y-3">
        {sortedRecordings.map((recording) => (
          <RecordingItem
            key={recording.id || `${recording.fileUrl}-${recording.createdAt}`}
            recording={recording}
          />
        ))}
      </div>
    </section>
  );
}

export default memo(RecordingList);
