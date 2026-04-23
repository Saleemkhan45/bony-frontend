import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import LoadingState from '../components/LoadingState';
import MeetingSummaryCard from '../components/MeetingSummaryCard';
import PermissionGate from '../components/PermissionGate';
import TranscriptPanel from '../components/TranscriptPanel';
import UploadStatusCard from '../components/UploadStatusCard';
import useMeetingAuth from '../hooks/useMeetingAuth';
import useMeetingDiagnostics from '../hooks/useMeetingDiagnostics';
import useMeetingHistory from '../hooks/useMeetingHistory';
import '../styles/meetingLoaders.css';
import { getOrCreateMeetingProfile } from '../utils/meetingRoom';

function MeetingRecapPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();
  const profile = getOrCreateMeetingProfile();
  const meetingAuth = useMeetingAuth(profile);
  const meetingHistory = useMeetingHistory(roomId, {
    enabled: meetingAuth.status === 'ready',
  });
  const diagnostics = useMeetingDiagnostics({
    roomCode: roomId,
    enabled: meetingAuth.status === 'ready',
    connectionState: 'connected',
  });

  if (meetingAuth.status === 'loading' || meetingHistory.status === 'loading' || diagnostics.status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--meeting-bg)] px-3 py-7 sm:px-6 sm:py-10">
        <LoadingState
          title="Loading meeting recap"
          description="Pulling the persisted summary, transcript, and diagnostics for this room."
        />
      </div>
    );
  }

  if (meetingAuth.status === 'error') {
    return (
      <div className="min-h-screen bg-[var(--meeting-bg)] px-3 py-7 sm:px-6 sm:py-10">
        <PermissionGate
          title="Unable to restore the meeting session"
          description={meetingAuth.errorMessage}
          tone="error"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--meeting-bg)] px-3 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.22em]">
              Meeting recap
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--meeting-text)] sm:text-3xl">
              Room {roomId}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/meeting/${roomId}`)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--meeting-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition hover:bg-[var(--meeting-surface-tint)] sm:w-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to meeting
          </button>
        </div>

        <MeetingSummaryCard meetingSummary={meetingHistory.meetingSummary} />

        <div className="grid gap-4 sm:gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
          <div className="rounded-[26px] border border-[var(--meeting-border)] bg-white/90 p-4 shadow-[0_14px_36px_rgba(20,36,89,0.08)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
            <TranscriptPanel
              isExporting={meetingHistory.isExportingTranscript}
              onDownloadTranscript={meetingHistory.downloadTranscript}
              transcriptSegments={meetingHistory.transcriptSegments}
              transcriptMessage={meetingHistory.transcriptMessage}
              transcriptStatus={meetingHistory.transcriptStatus}
            />
          </div>

          <div className="rounded-[26px] border border-[var(--meeting-border)] bg-white/90 p-4 shadow-[0_14px_36px_rgba(20,36,89,0.08)] backdrop-blur-xl sm:rounded-[30px] sm:p-5">
            <DiagnosticsPanel
              qualitySamples={diagnostics.qualitySamples}
              roomQualitySummary={diagnostics.roomQualitySummary}
            />
          </div>
        </div>
      </div>
      <UploadStatusCard
        description={meetingHistory.transcriptExportMessage}
        isVisible={meetingHistory.transcriptExportStatus === 'exporting' || meetingHistory.transcriptExportStatus === 'success' || meetingHistory.transcriptExportStatus === 'error'}
        offsetClassName="bottom-4 right-3 sm:bottom-6 sm:right-6"
        state={
          meetingHistory.transcriptExportStatus === 'exporting'
            ? 'exporting'
            : meetingHistory.transcriptExportStatus === 'success'
              ? 'success'
              : meetingHistory.transcriptExportStatus === 'error'
                ? 'error'
                : 'idle'
        }
        title={
          meetingHistory.transcriptExportStatus === 'exporting'
            ? 'Saving transcript...'
            : meetingHistory.transcriptExportStatus === 'success'
              ? 'Transcript ready'
              : meetingHistory.transcriptExportStatus === 'error'
                ? 'Transcript export failed'
                : ''
        }
      />
    </div>
  );
}

export default MeetingRecapPage;
