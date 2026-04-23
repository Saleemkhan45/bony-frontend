import { whyChooseUsCallCollageCompact, whyChooseUsCallCollageUpscaled } from '@/assets/images';

function WhyChooseUsMedia({ media }) {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="pointer-events-none absolute right-2 top-4 hidden h-14 w-14 rounded-full bg-white/10 sm:block" />
      <div className="pointer-events-none absolute right-0 top-20 hidden h-2 w-2 rounded-full bg-white/20 sm:block" />
      <div className="pointer-events-none absolute bottom-2 right-10 hidden h-16 w-36 sm:block">
        <div className="grid grid-cols-9 gap-1.5">
          {Array.from({ length: 36 }).map((_, index) => (
            <span key={index} className="h-1 w-1 rounded-full bg-white/20" />
          ))}
        </div>
      </div>

      <div className="relative z-10 mx-auto aspect-[526/384] w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px]">
        <img
          src={whyChooseUsCallCollageUpscaled}
          srcSet={`${whyChooseUsCallCollageCompact} 320w, ${whyChooseUsCallCollageUpscaled} 526w`}
          sizes="(max-width: 640px) 85vw, (max-width: 1024px) 360px, 380px"
          alt={media.mainAlt}
          width={526}
          height={384}
          loading="lazy"
          fetchpriority="low"
          decoding="async"
          className="block h-full w-full object-contain drop-shadow-[0_26px_44px_rgba(19,10,94,0.35)]"
        />
      </div>
    </div>
  );
}

export default WhyChooseUsMedia;
