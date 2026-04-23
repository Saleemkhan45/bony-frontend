import InlineSpinner from './InlineSpinner';

function SettingRow({
  checked = false,
  description,
  isUpdating = false,
  label,
  onChange,
}) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] px-4 py-4 shadow-[0_10px_24px_rgba(20,36,89,0.06)] ${isUpdating ? 'loader-soft-pulse' : ''}`}>
      <div>
        <p className="text-sm font-semibold text-[var(--meeting-text)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--meeting-muted)]">{description}</p>
      </div>

      <div className="flex items-center gap-2">
        {isUpdating ? <InlineSpinner size="xs" /> : null}
        <input
          type="checkbox"
          checked={checked}
          disabled={isUpdating}
          onChange={onChange}
          className="mt-1 h-4 w-4 rounded border-[var(--meeting-border)] text-[var(--meeting-accent)] focus:ring-[var(--meeting-accent)] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>
    </label>
  );
}

function MeetingModerationPanel({
  actionNames = {},
  currentRole,
  isActionPending = () => false,
  isRoomRecordingActive,
  onStartRoomRecording,
  onStopRoomRecording,
  onUpdateRoomPermission,
  roomSettings,
}) {
  const canModerate = currentRole === 'host' || currentRole === 'cohost';
  const lockRoomPending = isActionPending(actionNames.UPDATE_ROOM_PERMISSION, 'isLocked');
  const waitingRoomPending = isActionPending(actionNames.UPDATE_ROOM_PERMISSION, 'waitingRoomEnabled');
  const chatPending = isActionPending(actionNames.UPDATE_ROOM_PERMISSION, 'chatEnabled');
  const raiseHandPending = isActionPending(actionNames.UPDATE_ROOM_PERMISSION, 'raiseHandEnabled');
  const screenSharePending = isActionPending(actionNames.UPDATE_ROOM_PERMISSION, 'screenShareEnabled');
  const roomRecordingPending = isRoomRecordingActive
    ? isActionPending(actionNames.STOP_ROOM_RECORDING)
    : isActionPending(actionNames.START_ROOM_RECORDING);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-[var(--meeting-text)]">
          Moderation
        </h3>
        <p className="text-sm text-[var(--meeting-muted)]">
          Adjust room rules and the shared recording session.
        </p>
      </div>

      <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
        <SettingRow
          checked={Boolean(roomSettings?.isLocked)}
          description="Prevent new people from joining unless they are already admitted."
          isUpdating={lockRoomPending}
          label="Lock room"
          onChange={() => {
            void onUpdateRoomPermission?.({
              isLocked: !roomSettings?.isLocked,
            });
          }}
        />
        <SettingRow
          checked={Boolean(roomSettings?.waitingRoomEnabled)}
          description="Route new joins into the waiting room until a moderator admits them."
          isUpdating={waitingRoomPending}
          label="Waiting room"
          onChange={() => {
            void onUpdateRoomPermission?.({
              waitingRoomEnabled: !roomSettings?.waitingRoomEnabled,
            });
          }}
        />
        <SettingRow
          checked={roomSettings?.chatEnabled !== false}
          description="Allow or block meeting chat for everyone in the room."
          isUpdating={chatPending}
          label="Chat"
          onChange={() => {
            void onUpdateRoomPermission?.({
              chatEnabled: !(roomSettings?.chatEnabled !== false),
            });
          }}
        />
        <SettingRow
          checked={roomSettings?.raiseHandEnabled !== false}
          description="Allow or block the raised-hand queue."
          isUpdating={raiseHandPending}
          label="Raise hand"
          onChange={() => {
            void onUpdateRoomPermission?.({
              raiseHandEnabled: !(roomSettings?.raiseHandEnabled !== false),
            });
          }}
        />
        <SettingRow
          checked={roomSettings?.screenShareEnabled !== false}
          description="Allow or block screen sharing across the meeting."
          isUpdating={screenSharePending}
          label="Screen share"
          onChange={() => {
            void onUpdateRoomPermission?.({
              screenShareEnabled: !(roomSettings?.screenShareEnabled !== false),
            });
          }}
        />

        {canModerate ? (
          <div className="rounded-[24px] border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] p-4 shadow-[0_10px_24px_rgba(20,36,89,0.06)]">
            <p className="text-sm font-semibold text-[var(--meeting-text)]">Shared room recording</p>
            <p className="mt-1 text-sm text-[var(--meeting-muted)]">
              This is separate from local device recording and shows up for the whole room.
            </p>
            <div className="mt-4">
              {isRoomRecordingActive ? (
                <button
                  type="button"
                  disabled={roomRecordingPending}
                  onClick={() => {
                    void onStopRoomRecording?.();
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    roomRecordingPending
                      ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)]'
                      : 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71] hover:bg-[#ffe8ef]'
                  }`}
                >
                  {roomRecordingPending ? <InlineSpinner size="xs" /> : 'Stop Meeting Recording'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={roomRecordingPending}
                  onClick={() => {
                    void onStartRoomRecording?.();
                  }}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                    roomRecordingPending
                      ? 'cursor-not-allowed border-[var(--meeting-border)] bg-[var(--meeting-bg-alt)] text-[var(--meeting-muted)]'
                      : 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1] hover:bg-[#e7eaff]'
                  }`}
                >
                  {roomRecordingPending ? <InlineSpinner size="xs" /> : 'Start Meeting Recording'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default MeetingModerationPanel;
