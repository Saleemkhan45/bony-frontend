import { testimonialsContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import { useTestimonialsCarousel } from '@/features/home/hooks';

import TestimonialsAvatar from './TestimonialsAvatar';
import TestimonialsCard from './TestimonialsCard';
import TestimonialsMap from './TestimonialsMap';

function TestimonialsSection() {
  const content = testimonialsContent;

  const { activeReview, activeReviewId, goToNext, goToPrevious, selectReview } =
    useTestimonialsCarousel(content.reviews, content.initialReviewId);
  const decorativeAvatars = content.reviews.filter((review) => review.id !== activeReviewId);

  if (!activeReview) {
    return null;
  }

  return (
    <section id={content.id} className="relative overflow-visible py-16 sm:py-[4.5rem] lg:py-24">
      <Container className="overflow-visible">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl lg:text-[42px]">
              {content.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[44ch] text-[13px] font-medium leading-6 text-slate-500 sm:mt-4 sm:text-[14px] sm:leading-7">
              {content.description}
            </p>
          </div>

          <div className="relative mx-auto mt-8 max-w-5xl overflow-visible sm:mt-10 lg:mt-16">
            <div className="relative mx-auto min-h-[340px] max-w-[780px] overflow-visible px-0 pt-4 sm:min-h-[430px] sm:px-4 sm:pt-6 md:min-h-[500px] md:px-8 md:pt-8 lg:min-h-[520px]">
              <TestimonialsMap />

              {decorativeAvatars.map((review) => (
                <div
                  key={review.id}
                  className={`absolute z-30 hidden md:block ${review.positionClassName}`}
                >
                  <TestimonialsAvatar
                    avatar={review}
                    onClick={() => selectReview(review.id)}
                    size="floating"
                  />
                </div>
              ))}

              <div className="relative z-20 flex min-h-[300px] items-center justify-center overflow-visible sm:min-h-[360px] md:min-h-[430px]">
                <TestimonialsCard
                  review={activeReview}
                  onNext={goToNext}
                  onPrevious={goToPrevious}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default TestimonialsSection;
