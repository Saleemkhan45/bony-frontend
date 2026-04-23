import { newsletterContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';

import NewsletterForm from './NewsletterForm';

function NewsletterSection() {
  const content = newsletterContent;

  return (
    <section id={content.id} className="pb-0 pt-4 sm:pt-6 lg:pt-8">
      <Container>
        <div className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#5437f1_0%,#5f38f5_42%,#4f2fe9_100%)] px-5 py-8 shadow-[0_40px_90px_-58px_rgba(79,47,233,0.95)] sm:rounded-[28px] sm:px-8 sm:py-10 lg:rounded-[32px] lg:px-12 lg:py-12 xl:px-14 xl:py-14">
          <div className="pointer-events-none absolute -left-16 -top-14 h-40 w-40 rounded-full bg-white/7 blur-sm" />
          <div className="pointer-events-none absolute left-1/3 top-0 h-full w-40 -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_65%)]" />
          <div className="pointer-events-none absolute -right-12 top-1/2 hidden h-52 w-52 -translate-y-1/2 rounded-full border border-white/8 sm:block" />
          <div className="pointer-events-none absolute right-16 top-10 hidden h-16 w-16 rounded-full bg-white/6 sm:block" />

          <div className="relative z-10 grid items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,430px)] lg:gap-10">
            <div className="max-w-md text-center text-white lg:text-left">
              <h2 className="text-3xl font-extrabold tracking-[-0.04em] sm:text-[36px] lg:text-[40px]">
                {content.title}
              </h2>
              <p className="mx-auto mt-3 max-w-[360px] text-[13px] leading-7 text-white/72 sm:mt-4 lg:mx-0">
                {content.description}
              </p>
            </div>

            <div className="w-full lg:justify-self-end">
              <NewsletterForm form={content.form} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default NewsletterSection;
