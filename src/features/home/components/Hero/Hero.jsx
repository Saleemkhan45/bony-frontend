import { Container } from '@/shared/ui/Container';
import HeroContent from './HeroContent';
import HeroMedia from './HeroMedia';
import HeroStats from './HeroStats';

function Hero({ content, isStartMeetingLoading = false, onAction }) {
  return (
    <section className="relative isolate overflow-hidden pb-8 pt-0 sm:pb-10 lg:pb-[4.5rem]">
      <Container>
        <div className="grid items-center gap-6 pb-8 pt-4 min-[390px]:pt-5 sm:gap-8 sm:pb-10 sm:pt-6 md:pb-12 md:pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10 lg:pb-[4.5rem] lg:pt-14">
          <HeroContent
            content={content}
            isStartMeetingLoading={isStartMeetingLoading}
            onAction={onAction}
          />
          <HeroMedia alt={content.media.alt} />
        </div>

        <HeroStats socialProof={content.socialProof} />
      </Container>
    </section>
  );
}

export default Hero;
