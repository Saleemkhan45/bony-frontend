import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import Hero from '@/features/home/components/Hero';

const MadeForYouSection = lazy(() => import('@/features/home/components/MadeForYou'));
const StartStepsSection = lazy(() => import('@/features/home/components/StartSteps'));
const ConferenceHighlightSection = lazy(() => import('@/features/home/components/ConferenceHighlight'));
const WhyChooseUsSection = lazy(() => import('@/features/home/components/WhyChooseUs'));
const TestimonialsSection = lazy(() => import('@/features/home/components/Testimonials'));
const PricingSection = lazy(() => import('@/features/home/components/Pricing'));
const NewsletterSection = lazy(() => import('@/features/home/components/Newsletter'));
const FooterSection = lazy(() => import('@/features/home/components/Footer'));

function DeferredSection({ children, placeholderClassName, rootMargin }) {
  const placeholderRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(false);
  const resolvedPlaceholderClassName =
    placeholderClassName ?? 'min-h-[280px] w-full sm:min-h-[320px]';
  const resolvedRootMargin = rootMargin ?? '320px 0px';

  useEffect(() => {
    if (shouldRender) {
      return undefined;
    }

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setShouldRender(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const shouldLoad = entries.some((entry) => entry.isIntersecting);

        if (!shouldLoad) {
          return;
        }

        setShouldRender(true);
        observer.disconnect();
      },
      {
        // Keep enough lead time for smooth render, while avoiding eager loading most sections on first paint.
        rootMargin: resolvedRootMargin,
      },
    );

    if (placeholderRef.current) {
      observer.observe(placeholderRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [resolvedRootMargin, shouldRender]);

  if (!shouldRender) {
    return <div ref={placeholderRef} className={resolvedPlaceholderClassName} aria-hidden="true" />;
  }

  return (
    <Suspense fallback={<div className={resolvedPlaceholderClassName} aria-hidden="true" />}>
      {children}
    </Suspense>
  );
}

function HomePage({
  heroContent,
  isStartMeetingLoading = false,
  onHeroAction,
}) {
  return (
    <>
      <Hero content={heroContent} isStartMeetingLoading={isStartMeetingLoading} onAction={onHeroAction} />
      <DeferredSection
        placeholderClassName="min-h-[780px] w-full sm:min-h-[700px] lg:min-h-[620px]"
        rootMargin="420px 0px"
      >
        <MadeForYouSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[640px] w-full sm:min-h-[680px] lg:min-h-[680px]"
        rootMargin="520px 0px"
      >
        <StartStepsSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[760px] w-full sm:min-h-[760px] lg:min-h-[740px]"
        rootMargin="520px 0px"
      >
        <ConferenceHighlightSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[760px] w-full sm:min-h-[760px] lg:min-h-[760px]"
        rootMargin="500px 0px"
      >
        <WhyChooseUsSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[760px] w-full sm:min-h-[860px] lg:min-h-[900px]"
        rootMargin="420px 0px"
      >
        <TestimonialsSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[1360px] w-full sm:min-h-[1280px] lg:min-h-[760px]"
        rootMargin="360px 0px"
      >
        <PricingSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[320px] w-full sm:min-h-[360px] lg:min-h-[380px]"
        rootMargin="300px 0px"
      >
        <NewsletterSection />
      </DeferredSection>
      <DeferredSection
        placeholderClassName="min-h-[760px] w-full sm:min-h-[600px] lg:min-h-[420px]"
        rootMargin="260px 0px"
      >
        <FooterSection />
      </DeferredSection>
    </>
  );
}

export default HomePage;
