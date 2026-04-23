import { conferenceHighlightContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import ConferenceHighlightMedia from './ConferenceHighlightMedia';

function ConferenceHighlightSection() {
  const content = conferenceHighlightContent;

  return (
    <section id={content.id} className="relative overflow-hidden py-16 sm:py-[4.5rem] lg:py-24">
      <Container>
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-14 xl:gap-16">
          <ConferenceHighlightMedia media={content.media} />

          <div className="relative mx-auto max-w-md text-center lg:mx-0 lg:text-left">
            <div className="pointer-events-none absolute -right-10 top-7 hidden h-3 w-3 rounded-full border border-[#e5e4ff] lg:block" />
            <h2 className="mx-auto max-w-[15ch] text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl sm:leading-[1.1] lg:mx-0 lg:max-w-sm lg:text-[46px] lg:leading-[1.08]">
              {content.title}
            </h2>
            <p className="mt-4 text-[13px] font-medium leading-7 text-slate-500 sm:mt-5 sm:text-[14px]">
              {content.description}
            </p>
            <a
              href={content.link.href}
              className="mt-5 inline-flex text-sm font-bold text-accent transition-colors duration-200 hover:text-[#5747f3] sm:mt-6"
            >
              {content.link.label}
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default ConferenceHighlightSection;
