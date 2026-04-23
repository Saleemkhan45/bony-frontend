import { useState } from 'react';

function useTestimonialsCarousel(reviews, initialReviewId) {
  const fallbackReviewId = reviews[0]?.id ?? null;
  const [activeReviewId, setActiveReviewId] = useState(initialReviewId ?? fallbackReviewId);

  const activeIndex = reviews.findIndex((review) => review.id === activeReviewId);
  const safeIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeReview = reviews[safeIndex] ?? null;

  const selectReview = (reviewId) => {
    setActiveReviewId(reviewId);
  };

  const goToPrevious = () => {
    if (!reviews.length) {
      return;
    }

    const previousIndex = (safeIndex - 1 + reviews.length) % reviews.length;
    setActiveReviewId(reviews[previousIndex].id);
  };

  const goToNext = () => {
    if (!reviews.length) {
      return;
    }

    const nextIndex = (safeIndex + 1) % reviews.length;
    setActiveReviewId(reviews[nextIndex].id);
  };

  return {
    activeReview,
    activeReviewId,
    goToNext,
    goToPrevious,
    selectReview,
  };
}

export default useTestimonialsCarousel;

