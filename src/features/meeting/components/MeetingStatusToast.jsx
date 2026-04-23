import { AlertCircle, Bell, CheckCircle2 } from 'lucide-react';

const TONE_STYLES = {
  error: {
    accentClassName: 'border-[#ffd6e0] bg-[#fff1f5] text-[#d84b71]',
    icon: AlertCircle,
  },
  success: {
    accentClassName: 'border-[#cfe9de] bg-[#ebfaf3] text-[#15865c]',
    icon: CheckCircle2,
  },
  warning: {
    accentClassName: 'border-[#ffe1c9] bg-[#fff5eb] text-[#c76b1a]',
    icon: Bell,
  },
  info: {
    accentClassName: 'border-[#d9dcff] bg-[#eef1ff] text-[#5a4cf1]',
    icon: Bell,
  },
};

function MeetingStatusToast({ notice }) {
  if (!notice?.message) {
    return null;
  }

  const toneStyle = TONE_STYLES[notice.tone] ?? TONE_STYLES.info;
  const Icon = toneStyle.icon;

  return (
    <div className="pointer-events-none fixed right-4 top-24 z-50 w-[min(100%-2rem,360px)]">
      <div
        className={`rounded-[26px] border px-4 py-3 shadow-[0_18px_40px_rgba(20,36,89,0.12)] backdrop-blur-xl ${toneStyle.accentClassName}`}
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/70 bg-white/75 shadow-[0_8px_18px_rgba(20,36,89,0.08)]">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Meeting update</p>
            <p className="mt-1 text-sm font-medium leading-6">{notice.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeetingStatusToast;
