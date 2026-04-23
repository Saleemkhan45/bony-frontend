import { startStepsContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import StartStepCard from './StartStepCard';
import StepsConnector from './StepsConnector';

function StartStepsSection() {
  const content = startStepsContent;

  return (
    <section id={content.id} className="relative overflow-hidden pb-16 pt-2 sm:pb-[4.5rem] lg:pb-24">
      <Container>
        <div className="mx-auto max-w-5xl text-center">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl lg:text-[42px]">
              {content.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[44ch] text-[13px] font-medium leading-6 text-slate-500 sm:mt-4 sm:text-[14px] sm:leading-7">
              {content.description}
            </p>
          </div>

          <div className="relative mx-auto mt-10 max-w-4xl sm:mt-12 lg:mt-16">
            <StepsConnector />

            <div className="grid gap-8 text-center sm:gap-10 md:grid-cols-3 md:gap-8 lg:gap-10">
              {content.items.map((item, index) => (
                <div
                  key={item.title}
                  className={[
                    'flex justify-center',
                    index === 1 ? 'md:pt-6 lg:pt-8' : '',
                    index === 2 ? 'md:pt-10 lg:pt-14' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <StartStepCard item={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export default StartStepsSection;
