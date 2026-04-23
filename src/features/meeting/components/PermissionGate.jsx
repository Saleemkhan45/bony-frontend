import { Camera, Mic, ShieldAlert } from 'lucide-react';

function PermissionGate({ description, title, tone = 'warning' }) {
  const toneClassName =
    tone === 'error'
      ? 'border-[#ffd6e0] bg-[#fff2f6] text-[#c94a70]'
      : 'border-[#ffd9c5] bg-[#fff6ed] text-[#b76a17]';

  return (
    <div className={`rounded-[28px] border px-4 py-4 shadow-[0_14px_36px_rgba(20,36,89,0.08)] ${toneClassName}`}>
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-current/15 bg-white/70">
          <ShieldAlert className="h-5 w-5" />
        </span>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            <span className="inline-flex items-center gap-1 rounded-full border border-current/15 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Mic className="h-3.5 w-3.5" />
              Mic
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-current/15 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              <Camera className="h-3.5 w-3.5" />
              Camera
            </span>
          </div>

          <p className="mt-2 text-sm leading-7">{description}</p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-current/70">
            {tone === 'error'
              ? 'Review browser support or your current meeting session settings, then try again.'
              : 'You can keep going, join without media if needed, and retry device access later.'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PermissionGate;
