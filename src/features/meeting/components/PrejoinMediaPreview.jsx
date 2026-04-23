import { Camera, Mic } from 'lucide-react';
import { createInitials } from '../utils/meetingRoom';
import SkeletonBlock from './SkeletonBlock';
import SkeletonText from './SkeletonText';

function PrejoinMediaPreview({
  audioEnabled,
  displayName,
  hasVideoTrack = false,
  previewError,
  previewStatus,
  previewVideoRef,
  videoEnabled,
}) {
  const showVideoPreview = videoEnabled && previewStatus === 'ready' && hasVideoTrack;
  const isPreviewLoading = videoEnabled && previewStatus === 'loading';

  return (
    <div className="overflow-hidden rounded-[24px] border border-[var(--meeting-border)] bg-white shadow-[0_18px_48px_rgba(20,36,89,0.12)] sm:rounded-[30px]">
      <div className="relative overflow-hidden rounded-[22px] border border-[#edf0fa] bg-[var(--meeting-surface-tint)] sm:rounded-[28px]">
        {showVideoPreview ? (
          <video
            ref={previewVideoRef}
            autoPlay
            playsInline
            muted
            className="aspect-[4/3] w-full bg-[#dfe6fb] object-cover"
          />
        ) : isPreviewLoading ? (
          <div className="relative flex aspect-[4/3] min-h-[220px] flex-col justify-between overflow-hidden bg-[linear-gradient(150deg,#e5e9ff_0%,#edf2ff_55%,#f3f6ff_100%)] p-4 sm:min-h-[280px] sm:p-5">
            <SkeletonBlock className="h-8 w-36" roundedClassName="rounded-full" />
            <div className="space-y-3">
              <SkeletonBlock className="h-[150px] w-full" roundedClassName="rounded-[20px]" />
              <SkeletonText lines={2} />
            </div>
          </div>
        ) : (
          <div className="relative flex aspect-[4/3] min-h-[220px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.85),transparent_34%),linear-gradient(140deg,#dce4ff_0%,#d7f3ee_48%,#ffe7d7_100%)] sm:min-h-[280px]">
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))]" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/80 bg-white/78 text-2xl font-bold tracking-[0.08em] text-[var(--meeting-text)] shadow-[0_18px_40px_rgba(20,36,89,0.10)] backdrop-blur-sm sm:h-28 sm:w-28 sm:text-3xl">
              {createInitials(displayName || 'You')}
            </div>
            <p className="absolute bottom-3 left-3 right-3 rounded-2xl border border-white/70 bg-white/82 px-3 py-1.5 text-center text-[11px] font-semibold leading-5 text-[var(--meeting-muted)] shadow-[0_10px_24px_rgba(20,36,89,0.08)] backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-4 sm:rounded-full sm:px-4 sm:py-2 sm:text-xs">
              {!videoEnabled
                ? 'Camera preview is turned off for this join.'
                : previewStatus === 'loading'
                  ? 'Starting your camera preview...'
                  : previewStatus === 'ready' && !hasVideoTrack
                    ? 'No camera video track is available on this device right now.'
                  : previewStatus === 'blocked'
                    ? 'Camera access is blocked. You can still join without media.'
                    : previewStatus === 'unsupported'
                      ? 'This browser cannot show a local camera preview.'
                      : previewError || 'Camera preview is unavailable right now.'}
            </p>
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 sm:left-4 sm:top-4 sm:gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde1fb] bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5a4cf1] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em]">
            <Camera className="h-3.5 w-3.5" />
            {videoEnabled ? 'Camera Ready' : 'Camera Off'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7ebff] bg-white/88 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#2d6eb8] sm:gap-2 sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em]">
            <Mic className="h-3.5 w-3.5" />
            {audioEnabled ? 'Mic Ready' : 'Mic Off'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PrejoinMediaPreview;
