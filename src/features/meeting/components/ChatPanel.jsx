import { memo, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import EmptyState from './EmptyState';
import { formatMessageTime } from '../utils/meetingRoom';

function ChatPanel({
  canSendMessages,
  connectionLabel,
  currentUserId,
  draftMessage,
  messages,
  onDraftChange,
  onSendMessage,
}) {
  const messagesViewportRef = useRef(null);

  useEffect(() => {
    messagesViewportRef.current?.scrollTo({
      top: messagesViewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  function handleSubmit(event) {
    event.preventDefault();
    onSendMessage();
  }

  const hasUserMessages = messages.some((message) => message.type !== 'system');

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="rounded-[26px] border border-[#dde1fb] bg-[#f6f7ff] px-4 py-3 text-sm text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.06)]">
        Chat is using the same event contract you will keep for the live room.
        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b84a4]">
          {connectionLabel}
        </span>
      </div>

      <div
        ref={messagesViewportRef}
        className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1"
      >
        {!hasUserMessages ? (
          <EmptyState
            title="No messages yet"
            description="Start the conversation and the chat will scroll new messages into view automatically."
          />
        ) : null}

        {messages.map((message) => {
          const isSystemMessage = message.type === 'system';
          const isCurrentUserMessage = message.senderId === currentUserId;

          if (isSystemMessage) {
            return (
              <div key={message.id} className="flex justify-center">
                <div className="max-w-full rounded-full border border-[var(--meeting-border)] bg-white px-3.5 py-2 text-center text-xs font-medium text-[var(--meeting-muted)] shadow-[0_8px_20px_rgba(20,36,89,0.06)]">
                  {message.text}
                </div>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUserMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-[24px] px-4 py-3.5 ${
                  isCurrentUserMessage
                    ? 'bg-[var(--meeting-accent)] text-white shadow-[0_18px_34px_-18px_rgba(102,88,245,0.62)]'
                    : 'border border-[var(--meeting-border)] bg-[var(--meeting-surface-tint)] text-[var(--meeting-text)] shadow-[0_10px_24px_rgba(20,36,89,0.06)]'
                }`}
              >
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <span>{isCurrentUserMessage ? 'You' : message.senderName}</span>
                  <span className={isCurrentUserMessage ? 'text-white/70' : 'text-[#8a93af]'}>
                    {formatMessageTime(message.createdAt)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6">{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="rounded-[28px] border border-[var(--meeting-border)] bg-white p-2 shadow-[0_14px_34px_rgba(20,36,89,0.08)]">
          <div className="flex items-end gap-2">
            <input
              value={draftMessage}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder={
                canSendMessages
                  ? 'Send a message to everyone...'
                  : 'Chat is disabled by the host'
              }
              disabled={!canSendMessages}
              className="h-12 flex-1 rounded-full border border-transparent bg-[var(--meeting-bg-alt)] px-4 text-sm text-[var(--meeting-text)] outline-none transition placeholder:text-[#98a0b7] focus:border-[#d4d5fb] focus:ring-4 focus:ring-[#6658f5]/10 disabled:cursor-not-allowed disabled:text-[#98a0b7]"
            />

            <button
              type="submit"
              disabled={!canSendMessages}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--meeting-accent)] text-white shadow-[0_18px_34px_-18px_rgba(102,88,245,0.65)] transition hover:bg-[var(--meeting-accent-hover)] disabled:cursor-not-allowed disabled:bg-[#cfd4e6] disabled:shadow-none"
              aria-label="Send chat message"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function areChatPanelPropsEqual(previousProps, nextProps) {
  return (
    previousProps.canSendMessages === nextProps.canSendMessages &&
    previousProps.connectionLabel === nextProps.connectionLabel &&
    previousProps.currentUserId === nextProps.currentUserId &&
    previousProps.draftMessage === nextProps.draftMessage &&
    previousProps.messages === nextProps.messages
  );
}

export default memo(ChatPanel, areChatPanelPropsEqual);
