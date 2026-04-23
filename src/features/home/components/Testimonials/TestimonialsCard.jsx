import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@/features/home/components/icons/HomeIcons';

import TestimonialsAvatar from './TestimonialsAvatar';

function TestimonialsCard({ review, onNext, onPrevious }) {
  return (
    <div className="relative z-20 mx-auto w-full max-w-[620px] overflow-visible px-3 sm:px-8 md:px-0">
      <button
        type="button"
        onClick={onPrevious}
        className="absolute left-1 top-1/2 z-40 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#edf0f8] bg-white/95 text-[#667295] shadow-[0_18px_34px_-24px_rgba(24,33,77,0.45)] transition-colors duration-200 hover:border-[#dfe4f3] hover:text-ink sm:left-2 sm:h-10 sm:w-10 md:-left-4 md:h-11 md:w-11"
        aria-label="Previous testimonial"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onNext}
        className="absolute right-1 top-1/2 z-40 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[#edf0f8] bg-white/95 text-[#667295] shadow-[0_18px_34px_-24px_rgba(24,33,77,0.45)] transition-colors duration-200 hover:border-[#dfe4f3] hover:text-ink sm:right-2 sm:h-10 sm:w-10 md:-right-4 md:h-11 md:w-11"
        aria-label="Next testimonial"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>

      <div className="relative min-h-[284px] overflow-visible rounded-[22px] border border-[#eef1f8] bg-white/95 px-5 pb-6 pt-12 text-center shadow-[0_34px_70px_-50px_rgba(24,33,77,0.35)] backdrop-blur-[6px] sm:min-h-[304px] sm:rounded-[24px] sm:px-8 sm:pb-8 sm:pt-14 md:min-h-[326px] md:rounded-[26px] md:px-12 md:pb-10 md:pt-16">
        <div className="absolute left-1/2 z-30 -top-8 -translate-x-1/2 sm:-top-10">
          <TestimonialsAvatar avatar={review} isActive size="featured" />
        </div>

        <p className="mx-auto max-w-[34ch] text-[13px] font-medium leading-7 text-slate-500 sm:max-w-[320px]">
          {review.quote}
        </p>

        <p className="mt-5 text-[13px] font-bold tracking-tight text-ink">{review.name}</p>
        <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
          {review.role}
        </p>

        <div className="mt-3 flex items-center justify-center gap-1 text-[#ffb52c]">
          {Array.from({ length: review.rating }).map((_, index) => (
            <StarIcon key={index} className="h-4 w-4" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default TestimonialsCard;
