import { Suspense, lazy } from 'react';
import { X } from 'lucide-react';
import SidebarSkeleton from './SidebarSkeleton';

const ChatPanel = lazy(() => import('./ChatPanel'));
const DiagnosticsPanel = lazy(() => import('./DiagnosticsPanel'));
const MeetingHistoryPanel = lazy(() => import('./MeetingHistoryPanel'));
const MeetingModerationPanel = lazy(() => import('./MeetingModerationPanel'));
const MeetingSummaryCard = lazy(() => import('./MeetingSummaryCard'));
const ParticipantsPanel = lazy(() => import('./ParticipantsPanel'));
const RaisedHandsPanel = lazy(() => import('./RaisedHandsPanel'));
const TranscriptPanel = lazy(() => import('./TranscriptPanel'));
const WaitingRoomQueuePanel = lazy(() => import('./WaitingRoomQueuePanel'));

function TabButton({ active, badgeCount = 0, label, onClick }) {
  const hasBadge = badgeCount > 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition sm:gap-2 sm:px-3.5 sm:py-2 sm:text-[13px] ${
        active
          ? 'bg-white text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.10)]'
          : 'text-[var(--meeting-muted)] hover:bg-white/70 hover:text-[var(--meeting-text)]'
      }`}
    >
      {label}
      <span
        className={`inline-flex min-w-[20px] items-center justify-center rounded-full bg-[#fff1f5] px-1.5 py-0.5 text-[10px] font-bold text-[var(--meeting-danger)] transition-opacity ${hasBadge ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden={!hasBadge}
      >
        {hasBadge ? badgeCount : '0'}
      </span>
    </button>
  );
}

function SidebarCard({
  activeTab,
  connectionLabel,
  currentUserId,
  draftMessage,
  panelLoadingByTab = {},
  adminActionNames = {},
  isAdminActionPending = () => false,
  hasRecordingReady,
  isHost,
  isModerator,
  isRoomRecordingActive,
  isRecordingLocal,
  meetingEvents,
  meetingSummary,
  onAdmitParticipant,
  onClearSpotlight,
  onCameraOffAllParticipants,
  onChangeTab,
  onClose,
  onDenyParticipant,
  onDraftChange,
  onKickParticipant,
  onLowerAllHands,
  onLowerParticipantHand,
  onMakeCohost,
  onMuteAllParticipants,
  onMuteParticipant,
  onRemoveCohost,
  onSendMessage,
  onSpotlightParticipant,
  onStartRoomRecording,
  onStopRoomRecording,
  onDownloadTranscript,
  onTurnOffParticipantCamera,
  onUpdateRoomPermission,
  participants,
  qualitySamples,
  recordings,
  roomQualitySummary,
  roomSettings,
  messages,
  spotlightUserId,
  transcriptSegments,
  transcriptExportStatus = 'idle',
  transcriptMessage,
  transcriptStatus,
  unreadChatCount,
  waitingParticipants,
}) {
  const resolvedPanelLoadingByTab = {
    chat: false,
    participants: false,
    hands: false,
    queue: false,
    moderation: false,
    transcript: false,
    diagnostics: false,
    history: false,
    ...panelLoadingByTab,
  };
  const isActivePanelLoading = Boolean(resolvedPanelLoadingByTab[activeTab]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[22px] border border-[var(--meeting-border)] bg-white/92 shadow-[0_20px_55px_rgba(20,36,89,0.12)] backdrop-blur-xl sm:min-h-[520px] sm:rounded-[32px]">
      <div className="flex items-center justify-between gap-2.5 border-b border-[var(--meeting-border)] px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-4">
        <div className="min-w-0 flex-1 rounded-[16px] border border-[var(--meeting-border)] bg-[var(--meeting-bg)] p-1 sm:rounded-[20px] sm:p-1.5">
          <div className="flex gap-1 overflow-x-auto pb-0.5">
            <TabButton
              active={activeTab === 'chat'}
              badgeCount={activeTab === 'chat' ? 0 : unreadChatCount}
              label="Chat"
              onClick={() => onChangeTab('chat')}
            />
            <TabButton
              active={activeTab === 'participants'}
              label="Participants"
              onClick={() => onChangeTab('participants')}
            />
            <TabButton
              active={activeTab === 'hands'}
              label="Hands"
              onClick={() => onChangeTab('hands')}
            />
            {isModerator ? (
              <>
                <TabButton
                  active={activeTab === 'queue'}
                  badgeCount={waitingParticipants.length}
                  label="Queue"
                  onClick={() => onChangeTab('queue')}
                />
                <TabButton
                  active={activeTab === 'moderation'}
                  label="Moderation"
                  onClick={() => onChangeTab('moderation')}
                />
              </>
            ) : null}
            <TabButton
              active={activeTab === 'transcript'}
              label="Transcript"
              onClick={() => onChangeTab('transcript')}
            />
            <TabButton
              active={activeTab === 'diagnostics'}
              label="Diagnostics"
              onClick={() => onChangeTab('diagnostics')}
            />
            <TabButton
              active={activeTab === 'history'}
              label="History"
              onClick={() => onChangeTab('history')}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--meeting-border)] bg-white text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] transition hover:bg-[var(--meeting-surface-tint)] hover:text-[var(--meeting-text)] sm:h-10 sm:w-10 xl:hidden"
          aria-label="Close meeting sidebar"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 p-2.5 sm:p-4">
        {isActivePanelLoading ? (
          <SidebarSkeleton tab={activeTab} />
        ) : activeTab === 'chat' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <ChatPanel
              canSendMessages
              connectionLabel={connectionLabel}
              currentUserId={currentUserId}
              draftMessage={draftMessage}
              messages={messages}
              onDraftChange={onDraftChange}
              onSendMessage={onSendMessage}
            />
          </Suspense>
        ) : activeTab === 'participants' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <ParticipantsPanel
              actionNames={adminActionNames}
              currentUserId={currentUserId}
              hasRecordingReady={hasRecordingReady}
              isHost={isHost}
              isActionPending={isAdminActionPending}
              isModerator={isModerator}
              isRecordingLocal={isRecordingLocal}
              onMakeCohost={onMakeCohost}
              onRemoveCohost={onRemoveCohost}
              onClearSpotlight={onClearSpotlight}
              onCameraOffAllParticipants={onCameraOffAllParticipants}
              onKickParticipant={onKickParticipant}
              onLowerAllHands={onLowerAllHands}
              onLowerParticipantHand={onLowerParticipantHand}
              onMuteAllParticipants={onMuteAllParticipants}
              onMuteParticipant={onMuteParticipant}
              onSpotlightParticipant={onSpotlightParticipant}
              onTurnOffParticipantCamera={onTurnOffParticipantCamera}
              participants={participants}
              spotlightUserId={spotlightUserId}
            />
          </Suspense>
        ) : activeTab === 'hands' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <RaisedHandsPanel
              isHost={isModerator}
              onClearSpotlight={onClearSpotlight}
              onLowerAllHands={onLowerAllHands}
              onLowerParticipantHand={onLowerParticipantHand}
              onSpotlightParticipant={onSpotlightParticipant}
              participants={participants}
              spotlightUserId={spotlightUserId}
            />
          </Suspense>
        ) : activeTab === 'queue' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <WaitingRoomQueuePanel
              actionNames={adminActionNames}
              isActionPending={isAdminActionPending}
              isModerator={isModerator}
              onAdmitParticipant={onAdmitParticipant}
              onDenyParticipant={onDenyParticipant}
              waitingParticipants={waitingParticipants}
            />
          </Suspense>
        ) : activeTab === 'moderation' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <MeetingModerationPanel
              actionNames={adminActionNames}
              currentRole={isHost ? 'host' : isModerator ? 'cohost' : 'participant'}
              isActionPending={isAdminActionPending}
              isRoomRecordingActive={isRoomRecordingActive}
              onStartRoomRecording={onStartRoomRecording}
              onStopRoomRecording={onStopRoomRecording}
              onUpdateRoomPermission={onUpdateRoomPermission}
              roomSettings={roomSettings}
            />
          </Suspense>
        ) : activeTab === 'transcript' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
              <MeetingSummaryCard meetingSummary={meetingSummary} />
              <div className="min-h-[240px] sm:min-h-[300px]">
                <TranscriptPanel
                  isExporting={transcriptExportStatus === 'exporting'}
                  onDownloadTranscript={onDownloadTranscript}
                  transcriptSegments={transcriptSegments}
                  transcriptMessage={transcriptMessage}
                  transcriptStatus={transcriptStatus}
                />
              </div>
            </div>
          </Suspense>
        ) : activeTab === 'diagnostics' ? (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <DiagnosticsPanel
              qualitySamples={qualitySamples}
              roomQualitySummary={roomQualitySummary}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<SidebarSkeleton tab={activeTab} />}>
            <MeetingHistoryPanel
              meetingEvents={meetingEvents}
              recordings={recordings}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}

function MeetingSidebar(props) {
  const { isOpen } = props;

  return (
    <>
      <div className="hidden w-full xl:block xl:h-[min(74vh,720px)] xl:max-w-[390px] xl:self-start 2xl:max-w-[410px]">
        <SidebarCard {...props} />
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-40 bg-[rgba(20,36,89,0.16)] p-0 backdrop-blur-sm sm:p-4 xl:hidden">
          <div className="mt-auto flex h-full w-full flex-col sm:ml-auto sm:max-w-[420px]">
            <div className="mx-auto mb-1 mt-1 h-1.5 w-14 rounded-full bg-[#cfd5ea] sm:hidden" />
            <div className="h-[min(86vh,760px)] w-full px-2 pb-2 sm:h-full sm:px-0 sm:pb-0">
              <SidebarCard {...props} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default MeetingSidebar;
