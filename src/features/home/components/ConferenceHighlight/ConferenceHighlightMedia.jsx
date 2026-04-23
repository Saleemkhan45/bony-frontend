import {
  workflowCallCentreVideoCallWithCustomers,
  workflowCallCentreVideoCallWithCustomersCompact,
} from '@/assets/images';

function ConferenceHighlightMedia({ media }) {
  return (
    <div className="relative mx-auto w-full max-w-[560px] px-1 sm:px-0">
      <div className="pointer-events-none absolute -left-1 top-4 hidden h-16 w-16 sm:block">
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#86d8ff]" />
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute -left-2 bottom-5 hidden h-24 w-24 rounded-full bg-[#f2ecff] sm:block" />

      <div className="relative z-10 aspect-[768/521] w-full overflow-hidden rounded-[20px] sm:rounded-none">
        <img
          src={workflowCallCentreVideoCallWithCustomers}
          srcSet={`${workflowCallCentreVideoCallWithCustomersCompact} 480w, ${workflowCallCentreVideoCallWithCustomers} 768w`}
          sizes="(max-width: 640px) 94vw, (max-width: 1024px) 80vw, 560px"
          alt={media.mainAlt}
          width={768}
          height={521}
          loading="lazy"
          fetchpriority="low"
          decoding="async"
          className="block h-full w-full object-contain"
        />
      </div>
    </div>
  );
}

export default ConferenceHighlightMedia;
