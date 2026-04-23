import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRightIcon, HashIcon, XIcon } from '@/features/home/components/icons/HomeIcons';
import { Button } from '@/shared/ui/Button';
import { extractRoomIdFromInput } from '@/shared/utils/roomId';

const MEETING_ID_PATTERN = /^[A-F0-9]{8}$/;

function validateMeetingId(value) {
  const normalizedMeetingId = extractRoomIdFromInput(value);

  if (!normalizedMeetingId) {
    return 'Meeting ID or invite link is required.';
  }

  if (!MEETING_ID_PATTERN.test(normalizedMeetingId)) {
    return 'Use the 8-character meeting ID shared with you.';
  }

  return '';
}

function JoinMeetingModal({ isOpen, onClose, onJoin }) {
  const [meetingId, setMeetingId] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const normalizedMeetingId = useMemo(() => extractRoomIdFromInput(meetingId), [meetingId]);
  const handleModalClose = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) {
      setMeetingId('');
      setError('');
      return;
    }

    const focusTimeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.clearTimeout(focusTimeoutId);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event) {
    event.preventDefault();

    const validationError = validateMeetingId(meetingId);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    onJoin(normalizedMeetingId);
  }

  function handleInputChange(event) {
    const nextValue = event.target.value;

    setMeetingId(nextValue);

    if (error) {
      setError(validateMeetingId(nextValue));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.28)] px-3 py-6 backdrop-blur-md sm:px-4 sm:py-10"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-meeting-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleModalClose(event);
        }
      }}
    >
      <div
        className="relative w-full max-w-[520px] overflow-hidden rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,249,255,0.94))] p-5 shadow-[0_32px_80px_-26px_rgba(76,64,182,0.32)] sm:rounded-[32px] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(124,114,223,0.18),transparent_56%),radial-gradient(circle_at_top_right,rgba(64,191,154,0.16),transparent_50%)]" />

        <button
          type="button"
          onClick={handleModalClose}
          className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#e6e8fb] bg-white/90 text-slate-500 shadow-[0_12px_24px_rgba(20,36,89,0.08)] transition hover:-translate-y-0.5 hover:text-slate-700 sm:right-5 sm:top-5 sm:h-11 sm:w-11"
          aria-label="Close join meeting modal"
        >
          <XIcon className="h-4.5 w-4.5" />
        </button>

        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e8e6ff] bg-white/85 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5f54c9] shadow-sm">
            <HashIcon className="h-3.5 w-3.5" />
            Quick Join
          </span>

          <h2
            id="join-meeting-title"
            className="mt-4 text-[30px] font-extrabold tracking-[-0.04em] text-ink sm:mt-5 sm:text-[36px]"
          >
            Join a meeting
          </h2>

          <p className="mt-2.5 max-w-md text-sm leading-7 text-slate-500 sm:mt-3 sm:text-[15px]">
            Enter the meeting ID shared with you and we&apos;ll open a quick device check before you join.
          </p>

          <form className="mt-6 space-y-4 sm:mt-7" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Meeting ID
              </span>
              <input
                ref={inputRef}
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck="false"
                value={meetingId}
                onChange={handleInputChange}
                placeholder="E76E02C1"
                className={`w-full rounded-[24px] border bg-white px-5 py-4 text-base font-semibold uppercase tracking-[0.18em] text-ink outline-none transition placeholder:tracking-[0.18em] placeholder:text-slate-500 focus:border-[#8c81ff] focus:ring-4 focus:ring-[#8c81ff]/12 ${
                  error ? 'border-[#ffb6c8]' : 'border-[#e4e8fb]'
                }`}
              />
            </label>

            {error ? (
              <p className="text-sm font-medium text-[#d84b71]">{error}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Paste an invite link or use the 8-character meeting ID shared by the host.
              </p>
            )}

            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:justify-end sm:gap-3 sm:pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-[20px] px-6 py-3.5 sm:w-auto"
                onClick={handleModalClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full gap-2 rounded-[20px] px-6 py-3.5 sm:w-auto"
              >
                Join Now
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JoinMeetingModal;
