import EmptyState from './EmptyState';
import QualityIndicator from './QualityIndicator';

function DiagnosticsMetric({ label, value }) {
  return (
    <div className="rounded-[18px] border border-[var(--meeting-border)] bg-white px-3.5 py-3 shadow-[0_8px_20px_rgba(20,36,89,0.05)] sm:rounded-[22px] sm:px-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--meeting-text)]">{value}</p>
    </div>
  );
}

function formatMetric(value, suffix) {
  if (typeof value !== 'number') {
    return 'Unavailable';
  }

  return `${value}${suffix}`;
}

function DiagnosticsPanel({ qualitySamples = [], roomQualitySummary = null }) {
  if (!roomQualitySummary && qualitySamples.length === 0) {
    return (
      <EmptyState
        title="Diagnostics are warming up"
        description="Participant quality telemetry is now wired through the backend. Quality cards will appear here as connected clients publish live samples."
      />
    );
  }

  return (
    <section className="space-y-4">
      {roomQualitySummary ? (
        <div className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-3.5 sm:rounded-[28px] sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.2em]">
                Room Diagnostics
              </p>
              <p className="mt-1 text-xs text-[var(--meeting-muted)] sm:text-sm">
                Based on the latest quality sample from each connected participant.
              </p>
            </div>

            <QualityIndicator qualityLabel={roomQualitySummary.qualityLabel} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <DiagnosticsMetric
              label="Packet Loss"
              value={formatMetric(roomQualitySummary.averagePacketLossPct, '%')}
            />
            <DiagnosticsMetric
              label="Jitter"
              value={formatMetric(roomQualitySummary.averageJitterMs, ' ms')}
            />
            <DiagnosticsMetric
              label="Round Trip"
              value={formatMetric(roomQualitySummary.averageRoundTripTimeMs, ' ms')}
            />
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {qualitySamples.map((qualitySample) => (
          <article
            key={qualitySample.id}
            className="rounded-[20px] border border-[var(--meeting-border)] bg-white p-3.5 shadow-[0_8px_20px_rgba(20,36,89,0.05)] sm:rounded-[24px] sm:p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-tight text-[var(--meeting-text)]">
                  {qualitySample.userName || qualitySample.userId || 'Participant'}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--meeting-muted)]">
                  {qualitySample.sampledAt
                    ? new Date(qualitySample.sampledAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Unknown time'}
                </p>
              </div>

              <QualityIndicator compact qualityLabel={qualitySample.qualityLabel} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <DiagnosticsMetric label="Packet Loss" value={formatMetric(qualitySample.packetLossPct, '%')} />
              <DiagnosticsMetric label="Jitter" value={formatMetric(qualitySample.jitterMs, ' ms')} />
              <DiagnosticsMetric label="Round Trip" value={formatMetric(qualitySample.roundTripTimeMs, ' ms')} />
              <DiagnosticsMetric label="Audio Bitrate" value={formatMetric(qualitySample.audioBitrateKbps, ' kbps')} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DiagnosticsPanel;
