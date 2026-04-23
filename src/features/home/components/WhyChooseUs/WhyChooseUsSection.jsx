import { CheckCircleIcon } from '@/features/home/components/icons/HomeIcons';
import { whyChooseUsContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import WhyChooseUsMedia from './WhyChooseUsMedia';

function WhyChooseUsSection() {
  const content = whyChooseUsContent;

  return (
    <section id={content.id} className="py-16 sm:py-[4.5rem] lg:py-24">
      <Container>
        <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#4a40eb_0%,#6435f3_50%,#4a31ec_100%)] px-5 py-8 shadow-[0_40px_100px_-60px_rgba(65,49,236,0.85)] sm:rounded-[32px] sm:px-8 sm:py-10 lg:rounded-[36px] lg:px-12 lg:py-12 xl:px-14 xl:py-14">
          <div className="pointer-events-none absolute -left-16 -top-14 hidden h-44 w-44 rounded-full bg-white/8 sm:block" />
          <div className="pointer-events-none absolute left-6 top-24 hidden h-2 w-2 rounded-full bg-white/15 sm:block" />
          <div className="pointer-events-none absolute right-10 top-8 hidden h-20 w-20 rounded-full bg-white/6 sm:block" />

          <div className="relative z-10 grid items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-10">
            <div className="mx-auto max-w-md text-center text-white lg:mx-0 lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl lg:text-[42px]">
                {content.title}
              </h2>
              <p className="mt-3 text-[13px] leading-7 text-white/70 sm:mt-4 sm:text-[14px]">
                {content.description}
              </p>

              <div className="mt-6 grid gap-x-6 gap-y-3 sm:mt-8 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
                {content.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-2.5 text-left text-[13px] font-medium text-white/90">
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-white/70" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <WhyChooseUsMedia media={content.media} />
          </div>
        </div>
      </Container>
    </section>
  );
}

export default WhyChooseUsSection;
