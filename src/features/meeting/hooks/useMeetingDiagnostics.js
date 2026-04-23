import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getMeetingDiagnostics,
  recordMeetingQualitySample,
} from '../services/diagnosticsApi';
import {
  collectPeerConnectionStatsSummary,
  deriveConnectionQualityLabel,
} from '../services/webrtcMesh';

function averageMetric(values) {
  const numericValues = values.filter((value) => typeof value === 'number' && Number.isFinite(value));

  if (numericValues.length === 0) {
    return null;
  }

  return Math.round((numericValues.reduce((total, value) => total + value, 0) / numericValues.length) * 100) / 100;
}

function buildQualityByUser(qualitySamples) {
  return qualitySamples.reduce((qualityMap, qualitySample) => {
    if (!qualitySample?.userId) {
      return qualityMap;
    }

    qualityMap[qualitySample.userId] = qualitySample;
    return qualityMap;
  }, {});
}

function aggregatePeerSummaries(peerSummaries) {
  if (!Array.isArray(peerSummaries) || peerSummaries.length === 0) {
    return null;
  }

  const packetLossPct = averageMetric(peerSummaries.map((summary) => summary.packetLossPct));
  const jitterMs = averageMetric(peerSummaries.map((summary) => summary.jitterMs));
  const roundTripTimeMs = averageMetric(peerSummaries.map((summary) => summary.roundTripTimeMs));
  const audioBitrateKbps = averageMetric(peerSummaries.map((summary) => summary.audioBitrateKbps));
  const videoBitrateKbps = averageMetric(peerSummaries.map((summary) => summary.videoBitrateKbps));

  if (
    packetLossPct === null &&
    jitterMs === null &&
    roundTripTimeMs === null &&
    audioBitrateKbps === null &&
    videoBitrateKbps === null
  ) {
    return null;
  }

  return {
    packetLossPct,
    jitterMs,
    roundTripTimeMs,
    audioBitrateKbps,
    videoBitrateKbps,
    qualityLabel: deriveConnectionQualityLabel({
      packetLossPct,
      jitterMs,
      roundTripTimeMs,
    }),
  };
}

function useMeetingDiagnostics({
  connectionState = 'connecting',
  enabled = true,
  getPeerDiagnosticsTargets = null,
  isPanelActive = false,
  roomCode,
}) {
  const [status, setStatus] = useState(enabled ? 'loading' : 'idle');
  const [error, setError] = useState(null);
  const [roomQualitySummary, setRoomQualitySummary] = useState(null);
  const [qualitySamples, setQualitySamples] = useState([]);
  const [diagnosticsPanelOpen, setDiagnosticsPanelOpen] = useState(false);
  const diagnosticsLoadInFlightRef = useRef(false);
  const diagnosticsCaptureInFlightRef = useRef(false);

  const loadDiagnostics = useCallback(async () => {
    if (!enabled || !roomCode) {
      setStatus('idle');
      setRoomQualitySummary(null);
      setQualitySamples([]);
      return;
    }

    if (diagnosticsLoadInFlightRef.current) {
      return;
    }

    diagnosticsLoadInFlightRef.current = true;

    try {
      const payload = await getMeetingDiagnostics(roomCode);

      setRoomQualitySummary(payload.roomQualitySummary ?? null);
      setQualitySamples(Array.isArray(payload.qualitySamples) ? payload.qualitySamples : []);
      setStatus('ready');
      setError(null);
    } catch (nextError) {
      setError(nextError);
      setStatus('error');
    } finally {
      diagnosticsLoadInFlightRef.current = false;
    }
  }, [enabled, roomCode]);

  const captureLocalDiagnostics = useCallback(async () => {
    if (!enabled || !roomCode || typeof getPeerDiagnosticsTargets !== 'function') {
      return null;
    }

    if (diagnosticsCaptureInFlightRef.current) {
      return null;
    }

    diagnosticsCaptureInFlightRef.current = true;

    try {
      const diagnosticsTargets = getPeerDiagnosticsTargets();

      if (!Array.isArray(diagnosticsTargets) || diagnosticsTargets.length === 0) {
        return null;
      }

      const peerSummaries = await Promise.all(
        diagnosticsTargets.map(async (target) => {
          try {
            return await collectPeerConnectionStatsSummary(target.peerConnection);
          } catch (captureError) {
            console.warn('[meeting] Unable to collect peer diagnostics.', {
              roomCode,
              targetUserId: target.userId,
              captureError,
            });

            return null;
          }
        }),
      );
      const aggregateSummary = aggregatePeerSummaries(peerSummaries.filter(Boolean));

      if (!aggregateSummary) {
        return null;
      }

      try {
        const payload = await recordMeetingQualitySample({
          roomCode,
          ...aggregateSummary,
        });

        setRoomQualitySummary(payload.roomQualitySummary ?? aggregateSummary);
      } catch (publishError) {
        console.warn('[meeting] Unable to publish quality diagnostics.', {
          roomCode,
          publishError,
        });
      }

      return aggregateSummary;
    } finally {
      diagnosticsCaptureInFlightRef.current = false;
    }
  }, [enabled, getPeerDiagnosticsTargets, roomCode]);

  useEffect(() => {
    let isMounted = true;
    const intervalMs =
      connectionState === 'connected' || connectionState === 'degraded'
        ? isPanelActive
          ? 12000
          : 26000
        : 18000;

    async function syncDiagnostics() {
      if (!isMounted) {
        return;
      }

      if (
        !isPanelActive &&
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      if (
        connectionState === 'degraded' ||
        (isPanelActive && (connectionState === 'connected' || connectionState === 'degraded'))
      ) {
        await captureLocalDiagnostics();
      }

      await loadDiagnostics();
    }

    void syncDiagnostics();

    if (!enabled || !roomCode) {
      return () => {
        isMounted = false;
      };
    }

    const intervalId = window.setInterval(() => {
      void syncDiagnostics();
    }, intervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [
    captureLocalDiagnostics,
    connectionState,
    enabled,
    isPanelActive,
    loadDiagnostics,
    roomCode,
  ]);

  return useMemo(
    () => ({
      diagnosticsPanelOpen,
      error,
      errorMessage: error?.message ?? '',
      networkQualityByUser: buildQualityByUser(qualitySamples),
      qualitySamples,
      roomQualitySummary,
      setDiagnosticsPanelOpen,
      status,
      refresh: loadDiagnostics,
    }),
    [diagnosticsPanelOpen, error, loadDiagnostics, qualitySamples, roomQualitySummary, status],
  );
}

export default useMeetingDiagnostics;
