import mirrorflyVideoCalling from '@/assets/images/mirrorfly-video-calling.webp';

function WindowControls() {
  return (
    <div className="flex items-center justify-between px-1.5 pb-2 pt-0.5 sm:px-2 sm:pb-3 sm:pt-1">
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className="h-2 w-2 rounded-full bg-[#ff6b6b] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#ffd166] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#06d6a0] sm:h-2.5 sm:w-2.5" />
      </div>

      <div className="flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 sm:gap-3 sm:px-3 sm:py-1.5">
        <span className="h-2 w-2 rounded-full bg-white/40 sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-[#3bc5ff] sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-white/40 sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-white/40 sm:h-2.5 sm:w-2.5" />
        <span className="h-2 w-2 rounded-full bg-white/40 sm:h-2.5 sm:w-2.5" />
      </div>
    </div>
  );
}

function HeroMedia({ alt }) {
  return (
    <div className="relative mx-auto -mt-1 w-full max-w-[34rem] sm:mt-0 sm:max-w-[38rem]">
      <div className="rounded-[22px] border-[3px] border-[#14295a] bg-white p-1.5 shadow-hero sm:rounded-[34px] sm:p-3">
        <div className="rounded-[18px] bg-[#13295b] p-1.5 sm:rounded-[28px] sm:p-3">
          <WindowControls />

          <div className="relative overflow-hidden rounded-[14px] bg-[#f6eee1] sm:rounded-[24px]">
            <img
              src={mirrorflyVideoCalling}
              alt={alt}
              width={576}
              height={324}
              loading="eager"
              fetchpriority="high"
              decoding="async"
              sizes="(max-width: 640px) 92vw, 576px"
              className="block aspect-[16/9] w-full object-cover object-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroMedia;
