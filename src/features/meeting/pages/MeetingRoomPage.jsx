import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLoader from '../components/AppLoader';
import MeetingControlBar from '../components/MeetingControlBar';
import MeetingExitScreen from '../components/MeetingExitScreen';
import MeetingStageSkeleton from '../components/MeetingStageSkeleton';
import RecordingConsentBanner from '../components/RecordingConsentBanner';
import MeetingStageLayout from '../components/MeetingStageLayout';
import MeetingSidebar from '../components/MeetingSidebar';
import MeetingStatusToast from '../components/MeetingStatusToast';
import MeetingTopBar from '../components/MeetingTopBar';
import PermissionGate from '../components/PermissionGate';
import UploadStatusCard from '../components/UploadStatusCard';
import useCaptions from '../hooks/useCaptions';
import useMeetingDiagnostics from '../hooks/useMeetingDiagnostics';
import useMeetingHistory from '../hooks/useMeetingHistory';
import useMeetingRoom from '../hooks/useMeetingRoom';
import '../styles/meetingLoaders.css';
import { buildMeetingRecapPath, buildMeetingWaitingPath } from '../utils/meetingRoom';

function MeetingRoomPage() {
  const navigate = useNavigate();
  const { roomId = '' } = useParams();
  const meetingRoom = useMeetingRoom(roomId);
  const [isMobileTransportExpanded, setIsMobileTransportExpanded] = useState(false);
  const participantQualityCacheRef = useRef(new Map());
  const meetingHistory = useMeetingHistory(roomId, {
    activeTab: meetingRoom.activeSidebarTab,
    enabled:
      meetingRoom.authStatus === 'ready' &&
      meetingRoom.roomDataStatus === 'ready' &&
      meetingRoom.admissionStatus === 'admitted',
  });
  const meetingDiagnostics = useMeetingDiagnostics({
    connectionState: meetingRoom.connectionState,
    enabled:
      meetingRoom.authStatus === 'ready' &&
      meetingRoom.roomDataStatus === 'ready' &&
      meetingRoom.admissionStatus === 'admitted',
    getPeerDiagnosticsTargets: meetingRoom.getPeerDiagnosticsTargets,
    isPanelActive: meetingRoom.activeSidebarTab === 'diagnostics',
    roomCode: roomId,
  });
  const captions = useCaptions({
    onAppendTranscriptSegment: meetingHistory.appendTranscriptSegment,
    onNotice: meetingRoom.showStatusNotice,
    onUpdateTranscriptState: meetingHistory.setLiveTranscriptState,
    speakerLabel: meetingRoom.localParticipant?.userName ?? 'You',
    transcriptSegments: meetingHistory.transcriptSegments,
  });
  const participantsWithQuality = useMemo(
    () => {
      const nextCache = new Map();
      const nextParticipants = meetingRoom.participants.map((participant) => {
        const qualitySample = meetingDiagnostics.networkQualityByUser[participant.userId] ?? null;
        const cached = participantQualityCacheRef.current.get(participant.userId);

        if (
          cached &&
          cached.participantRef === participant &&
          cached.qualitySampleRef === qualitySample
        ) {
          nextCache.set(participant.userId, cached);
          return cached.mergedParticipant;
        }

        const mergedParticipant = qualitySample
          ? {
              ...participant,
              qualitySample,
            }
          : participant.qualitySample
            ? {
                ...participant,
                qualitySample: null,
              }
            : participant;

        nextCache.set(participant.userId, {
          participantRef: participant,
          qualitySampleRef: qualitySample,
          mergedParticipant,
        });

        return mergedParticipant;
      });

      participantQualityCacheRef.current = nextCache;
      return nextParticipants;
    },
    [meetingDiagnostics.networkQualityByUser, meetingRoom.participants],
  );
  const isRoomBootstrapping = meetingRoom.isInitializing;
  const shouldShowStageSkeleton =
    isRoomBootstrapping ||
    meetingRoom.mediaBootstrapStatus === 'requesting' ||
    (meetingRoom.connectionState !== 'connected' && participantsWithQuality.length === 0);
  const panelLoadingByTab = useMemo(
    () => ({
      chat: meetingRoom.roomDataStatus !== 'ready',
      participants: meetingRoom.roomDataStatus !== 'ready',
      hands: meetingRoom.roomDataStatus !== 'ready',
      queue: meetingRoom.roomDataStatus !== 'ready',
      moderation: meetingRoom.roomDataStatus !== 'ready',
      history: meetingRoom.roomDataStatus !== 'ready',
      transcript: meetingHistory.status !== 'ready',
      diagnostics: meetingDiagnostics.status !== 'ready',
    }),
    [meetingDiagnostics.status, meetingHistory.status, meetingRoom.roomDataStatus],
  );

  useEffect(() => {
    if (!meetingRoom.exitState) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/');
    }, 4500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [meetingRoom.exitState, navigate]);

  useEffect(() => {
    if (meetingRoom.admissionStatus !== 'waiting') {
      return;
    }

    navigate(buildMeetingWaitingPath(roomId), {
      replace: true,
    });
  }, [meetingRoom.admissionStatus, navigate, roomId]);

  async function handleCopyInvite() {
    try {
      await navigator.clipboard.writeText(meetingRoom.inviteLink);
      meetingRoom.showStatusNotice('Link copied to clipboard.', 'success');
      meetingRoom.appendSystemMessage('Invite link copied to the clipboard.');
    } catch {
      meetingRoom.showStatusNotice('Clipboard access was blocked. Copy the invite link manually.', 'warning');
      meetingRoom.appendSystemMessage(
        `Clipboard access was blocked. Share this link manually: ${meetingRoom.inviteLink}`,
      );
    }
  }

  function handleLeaveMeeting() {
    meetingRoom.leaveMeeting();
    navigate('/');
  }

  if (meetingRoom.exitState) {
    return (
      <MeetingExitScreen
        description={meetingRoom.exitState.description}
        onReturnHome={() => navigate('/')}
        onTryAgain={
          meetingRoom.exitState.reason === 'room-full'
            ? () => window.location.reload()
            : null
        }
        title={meetingRoom.exitState.title}
      />
    );
  }

  const initializationTitle =
    meetingRoom.authStatus === 'loading'
      ? 'Preparing your meeting room...'
      : meetingRoom.roomDataStatus === 'loading' || meetingRoom.roomDataStatus === 'idle'
      ? 'Connecting live collaboration...'
      : 'Restoring devices and room state...';
  const initializationDescription =
    meetingRoom.authStatus === 'loading'
      ? 'Creating or restoring your signed meeting session so room APIs and host permissions are backed by the server before the live socket connects.'
      : meetingRoom.roomDataStatus === 'loading' || meetingRoom.roomDataStatus === 'idle'
        ? 'Fetching real room details, previous messages, participant state, and meeting history from the backend before the live socket joins.'
        : 'Your persistent room data is ready. Restoring your pre-join device choices and preparing local media before live sync connects.';
  const recordingUploadStatus = useMemo(() => {
    if (meetingRoom.recordingPhase === 'uploading') {
      return {
        description: 'Saving meeting file securely to your room history.',
        state: 'uploading',
        title: 'Uploading recording...',
      };
    }

    if (meetingRoom.recordingPhase === 'stopping') {
      return {
        description: 'Finalizing your local media capture before upload begins.',
        state: 'uploading',
        title: 'Saving meeting file...',
      };
    }

    if (meetingRoom.recordingPhase === 'uploaded') {
      return {
        description: 'Recording metadata is synced and ready in this room.',
        state: 'uploaded',
        title: 'Recording saved',
      };
    }

    if (meetingRoom.recordingPhase === 'upload-failed') {
      return {
        description:
          meetingRoom.recordingError ||
          'Upload failed. The local file is still available for download.',
        state: 'upload-failed',
        title: 'Upload failed',
      };
    }

    return null;
  }, [meetingRoom.recordingError, meetingRoom.recordingPhase]);
  const transcriptExportStatus = useMemo(() => {
    if (meetingHistory.transcriptExportStatus === 'exporting') {
      return {
        description:
          meetingHistory.transcriptExportMessage || 'Generating your transcript file now.',
        state: 'exporting',
        title: 'Saving transcript...',
      };
    }

    if (meetingHistory.transcriptExportStatus === 'success') {
      return {
        description:
          meetingHistory.transcriptExportMessage || 'Transcript export started successfully.',
        state: 'success',
        title: 'Transcript ready',
      };
    }

    if (meetingHistory.transcriptExportStatus === 'error') {
      return {
        description:
          meetingHistory.transcriptExportMessage ||
          'Unable to export the transcript right now.',
        state: 'error',
        title: 'Transcript export failed',
      };
    }

    return null;
  }, [meetingHistory.transcriptExportMessage, meetingHistory.transcriptExportStatus]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--meeting-bg)] text-[var(--meeting-text)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(102,88,245,0.14),transparent_26%),radial-gradient(circle_at_82%_10%,rgba(96,165,250,0.16),transparent_23%),radial-gradient(circle_at_52%_100%,rgba(255,90,122,0.08),transparent_28%),linear-gradient(180deg,#f8f9fe_0%,#f5f4fa_44%,#f7f8fc_100%)]" />
      <div className="pointer-events-none absolute -left-20 top-8 h-[16rem] w-[16rem] rounded-full bg-[#d9ddff]/60 blur-3xl sm:h-[22rem] sm:w-[22rem]" />
      <div className="pointer-events-none absolute right-[-7rem] top-20 h-[14rem] w-[14rem] rounded-full bg-[#d6ecff]/75 blur-3xl sm:right-[-8rem] sm:top-24 sm:h-[20rem] sm:w-[20rem]" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-1/3 h-[13rem] w-[13rem] rounded-full bg-[#ffdce5]/55 blur-3xl sm:bottom-[-8rem] sm:h-[18rem] sm:w-[18rem]" />
      <AppLoader
        description={initializationDescription}
        isVisible={isRoomBootstrapping}
        showPreview
        title={initializationTitle}
      />

      <div className="relative flex min-h-screen flex-col">
        <MeetingStatusToast notice={meetingRoom.statusNotice} />

        <MeetingTopBar
          captionsEnabled={captions.captionsEnabled}
          captionsRuntimeStatus={captions.captionsRuntimeStatus}
          connectionLabel={meetingRoom.connectionLabel}
          connectionTone={meetingRoom.connectionTone}
          currentRole={meetingRoom.currentRole}
          hasRecordingReady={meetingRoom.isRecordingReady}
          hasUploadedRecording={meetingRoom.hasUploadedRecording}
          isHost={meetingRoom.isHost}
          isRoomLocked={meetingRoom.roomSettings?.isLocked ?? false}
          isRoomRecordingActive={meetingRoom.isRoomRecordingActive}
          isRecording={meetingRoom.isRecording}
          meetingDuration={meetingRoom.elapsedTimeLabel}
          onCameraOffAllParticipants={meetingRoom.cameraOffAllParticipants}
          onCopyInvite={handleCopyInvite}
          onDownloadRecording={meetingRoom.downloadRecording}
          onDownloadUploadedRecording={meetingRoom.downloadUploadedRecording}
          onMuteAllParticipants={meetingRoom.muteAllParticipants}
          onOpenRecap={() => navigate(buildMeetingRecapPath(meetingRoom.roomId))}
          onOpenSidebar={meetingRoom.openSidebar}
          onToggleCaptions={captions.toggleCaptions}
          onToggleRecording={meetingRoom.toggleRecording}
          participantCount={meetingRoom.participants.length}
          presenterLabel={meetingRoom.presenterLabel}
          recordingStatus={meetingRoom.recordingStatus}
          recordingTimeLabel={meetingRoom.recordingTimeLabel}
          roomQualitySummary={meetingDiagnostics.roomQualitySummary}
          roomId={meetingRoom.roomId}
          spotlightLabel={meetingRoom.spotlightLabel}
          transcriptStatus={meetingHistory.transcriptStatus}
          unreadChatCount={meetingRoom.unreadChatCount}
          waitingCount={meetingRoom.waitingParticipants.length}
          waitingRoomEnabled={meetingRoom.roomSettings?.waitingRoomEnabled ?? false}
        />

        <div className="mx-auto flex w-full max-w-[1580px] flex-1 flex-col gap-2.5 px-2 pb-24 pt-2.5 sm:gap-4 sm:px-5 sm:pb-32 sm:pt-5 lg:px-6">
          {meetingRoom.authStatus === 'error' && meetingRoom.authError ? (
            <PermissionGate
              title="Unable to authenticate this meeting session"
              description={meetingRoom.authError}
              tone="error"
            />
          ) : null}

          {meetingRoom.roomDataStatus === 'error' && meetingRoom.roomDataError ? (
            <PermissionGate
              title="Unable to load meeting room data"
              description={meetingRoom.roomDataError}
              tone="error"
            />
          ) : null}

          <div className="sm:hidden rounded-[20px] border border-[var(--meeting-border)] bg-white/88 shadow-[0_10px_28px_rgba(20,36,89,0.08)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setIsMobileTransportExpanded((currentState) => !currentState)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
              aria-expanded={isMobileTransportExpanded}
            >
              <div className="min-w-0">
                <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#7b84a4]">
                  Transport
                </p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-[var(--meeting-text)]">
                  {meetingRoom.connectionLabel}
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                    meetingRoom.connectionTone === 'success'
                      ? 'border-[#cdebdc] bg-[#ebfaf3] text-[#15865c]'
                      : meetingRoom.connectionTone === 'warning'
                        ? 'border-[#ffe1c9] bg-[#fff5eb] text-[#c76b1a]'
                        : meetingRoom.connectionTone === 'error'
                          ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]'
                          : 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1]'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      meetingRoom.connectionTone === 'success'
                        ? 'bg-[var(--meeting-success)]'
                        : meetingRoom.connectionTone === 'warning'
                          ? 'bg-[#f59e0b]'
                          : meetingRoom.connectionTone === 'error'
                            ? 'bg-[var(--meeting-danger)]'
                            : 'bg-[var(--meeting-accent)]'
                    }`}
                  />
                  Live
                </span>
                <ChevronDown className={`h-4 w-4 text-[#7b84a4] transition ${isMobileTransportExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isMobileTransportExpanded ? (
              <div className="border-t border-[var(--meeting-border)] px-3 py-2.5">
                <p className="text-xs leading-6 text-[var(--meeting-muted)]">
                  {meetingRoom.connectionSummary}
                </p>
              </div>
            ) : null}
          </div>

          <div className="hidden sm:flex sm:flex-col sm:gap-3 sm:rounded-[28px] sm:border sm:border-[var(--meeting-border)] sm:bg-white/85 sm:px-5 sm:py-4 sm:shadow-[0_10px_30px_rgba(20,36,89,0.08)] sm:backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4] sm:text-[11px] sm:tracking-[0.22em]">
                Transport status
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--meeting-text)] sm:leading-7">
                {meetingRoom.connectionSummary}
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:px-3.5 sm:py-2 sm:text-xs ${
                meetingRoom.connectionTone === 'success'
                  ? 'border-[#cdebdc] bg-[#ebfaf3] text-[#15865c]'
                  : meetingRoom.connectionTone === 'warning'
                    ? 'border-[#ffe1c9] bg-[#fff5eb] text-[#c76b1a]'
                    : meetingRoom.connectionTone === 'error'
                      ? 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]'
                      : 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1]'
              }`}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  meetingRoom.connectionTone === 'success'
                    ? 'bg-[var(--meeting-success)]'
                    : meetingRoom.connectionTone === 'warning'
                      ? 'bg-[#f59e0b]'
                      : meetingRoom.connectionTone === 'error'
                        ? 'bg-[var(--meeting-danger)]'
                        : 'bg-[var(--meeting-accent)]'
                }`}
              />
              {meetingRoom.connectionLabel}
            </span>
          </div>

          {meetingRoom.mediaBootstrapStatus === 'blocked' || meetingRoom.mediaBootstrapStatus === 'unsupported' ? (
            <PermissionGate
              title={
                meetingRoom.mediaBootstrapStatus === 'blocked'
                  ? 'Camera or microphone permission blocked'
                  : 'Media devices are unavailable'
              }
              description={meetingRoom.mediaError}
              tone={meetingRoom.mediaBootstrapStatus === 'blocked' ? 'warning' : 'error'}
            />
          ) : null}

          <RecordingConsentBanner isVisible={meetingRoom.isRoomRecordingActive} />

          <div className="flex flex-1 flex-col gap-3 xl:flex-row xl:gap-4">
            <section className="min-w-0 flex-1">
              {shouldShowStageSkeleton ? (
                <MeetingStageSkeleton />
              ) : (
                <MeetingStageLayout
                  activeSpeakerUserId={meetingRoom.activeSpeakerUserId}
                  captionSegments={captions.activeCaptionSegments}
                  hasRecordingReady={meetingRoom.isRecordingReady}
                  isRecordingLocal={meetingRoom.isRecording}
                  layoutMode={meetingRoom.layoutMode}
                  participants={participantsWithQuality}
                  localVideoRef={meetingRoom.localVideoRef}
                  onPinParticipant={meetingRoom.togglePinnedParticipant}
                  pinnedUserId={meetingRoom.pinnedUserId}
                  presenterUserId={meetingRoom.presenterUserId}
                  spotlightUserId={meetingRoom.spotlightUserId}
                />
              )}
            </section>

            <MeetingSidebar
              activeTab={meetingRoom.activeSidebarTab}
              adminActionNames={meetingRoom.adminActionNames}
              connectionLabel={meetingRoom.connectionLabel}
              currentUserId={meetingRoom.localParticipant?.userId}
              draftMessage={meetingRoom.draftMessage}
              hasRecordingReady={meetingRoom.isRecordingReady}
              isHost={meetingRoom.isHost}
              isAdminActionPending={meetingRoom.isAdminActionPending}
              isModerator={meetingRoom.isModerator}
              isOpen={meetingRoom.isSidebarOpen}
              isRoomRecordingActive={meetingRoom.isRoomRecordingActive}
              isRecordingLocal={meetingRoom.isRecording}
              meetingEvents={meetingRoom.meetingEvents}
              meetingSummary={meetingHistory.meetingSummary}
              messages={meetingRoom.messages}
              onAdmitParticipant={meetingRoom.admitParticipant}
              onClearSpotlight={meetingRoom.clearSpotlight}
              onCameraOffAllParticipants={meetingRoom.cameraOffAllParticipants}
              onChangeTab={meetingRoom.setActiveSidebarTab}
              onClose={meetingRoom.closeSidebar}
              onDenyParticipant={meetingRoom.denyParticipant}
              onDraftChange={meetingRoom.setDraftMessage}
              onKickParticipant={meetingRoom.kickParticipant}
              onLowerAllHands={meetingRoom.lowerAllHands}
              onLowerParticipantHand={meetingRoom.lowerParticipantHand}
              onMakeCohost={meetingRoom.makeCohost}
              onMuteAllParticipants={meetingRoom.muteAllParticipants}
              onMuteParticipant={meetingRoom.muteParticipant}
              onRemoveCohost={meetingRoom.removeCohost}
              onSendMessage={meetingRoom.sendMessage}
              onSpotlightParticipant={meetingRoom.spotlightParticipant}
              onStartRoomRecording={meetingRoom.startRoomRecording}
              onStopRoomRecording={meetingRoom.stopRoomRecording}
              onDownloadTranscript={meetingHistory.downloadTranscript}
              onTurnOffParticipantCamera={meetingRoom.cameraOffParticipant}
              onUpdateRoomPermission={meetingRoom.updateRoomPermission}
              panelLoadingByTab={panelLoadingByTab}
              participants={participantsWithQuality}
              qualitySamples={meetingDiagnostics.qualitySamples}
              recordings={meetingRoom.recordings}
              roomQualitySummary={meetingDiagnostics.roomQualitySummary}
              roomSettings={meetingRoom.roomSettings}
              spotlightUserId={meetingRoom.spotlightUserId}
              transcriptExportStatus={meetingHistory.transcriptExportStatus}
              transcriptSegments={meetingHistory.transcriptSegments}
              transcriptMessage={meetingHistory.transcriptMessage}
              transcriptStatus={meetingHistory.transcriptStatus}
              unreadChatCount={meetingRoom.unreadChatCount}
              waitingParticipants={meetingRoom.waitingParticipants}
            />
          </div>
        </div>

        <MeetingControlBar
          activeRoomRecording={meetingRoom.isRoomRecordingActive}
          captionsEnabled={captions.captionsEnabled}
          captionsRuntimeStatus={captions.captionsRuntimeStatus}
          hasRecordingReady={meetingRoom.isRecordingReady}
          hasUploadedRecording={meetingRoom.hasUploadedRecording}
          isCameraEnabled={meetingRoom.isLocalCameraEnabled}
          isHandRaised={Boolean(meetingRoom.localParticipant?.handRaised)}
          isMicEnabled={meetingRoom.isLocalMicrophoneEnabled}
          isModerator={meetingRoom.isModerator}
          isRecording={meetingRoom.isRecording}
          isScreenShareTransitioning={meetingRoom.isScreenShareTransitioning}
          isScreenShareSupported={meetingRoom.isScreenShareSupported}
          isScreenSharing={meetingRoom.isScreenSharing}
          layoutMode={meetingRoom.layoutMode}
          onCycleLayout={meetingRoom.cycleLayoutMode}
          onLeaveMeeting={handleLeaveMeeting}
          onOpenSidebar={meetingRoom.openSidebar}
          onToggleCamera={meetingRoom.toggleCamera}
          onToggleCaptions={captions.toggleCaptions}
          onDownloadRecording={meetingRoom.downloadRecording}
          onDownloadUploadedRecording={meetingRoom.downloadUploadedRecording}
          onToggleMicrophone={meetingRoom.toggleMicrophone}
          onToggleRaiseHand={meetingRoom.toggleRaiseHand}
          onToggleRecording={meetingRoom.toggleRecording}
          onToggleRoomRecording={
            meetingRoom.isRoomRecordingActive
              ? meetingRoom.stopRoomRecording
              : meetingRoom.startRoomRecording
          }
          onToggleScreenShare={meetingRoom.toggleScreenShare}
          unreadChatCount={meetingRoom.unreadChatCount}
        />
        <UploadStatusCard
          description={recordingUploadStatus?.description ?? ''}
          isVisible={Boolean(recordingUploadStatus)}
          offsetClassName={transcriptExportStatus ? 'bottom-[8.7rem] right-2 sm:bottom-[11.8rem] sm:right-4' : 'bottom-[6.8rem] right-2 sm:bottom-[8.8rem] sm:right-4'}
          state={recordingUploadStatus?.state ?? 'idle'}
          title={recordingUploadStatus?.title ?? ''}
        />
        <UploadStatusCard
          description={transcriptExportStatus?.description ?? ''}
          isVisible={Boolean(transcriptExportStatus)}
          offsetClassName="bottom-[11.2rem] right-2 sm:bottom-[15rem] sm:right-4"
          state={transcriptExportStatus?.state ?? 'idle'}
          title={transcriptExportStatus?.title ?? ''}
        />
      </div>
    </div>
  );
}

export default MeetingRoomPage;
