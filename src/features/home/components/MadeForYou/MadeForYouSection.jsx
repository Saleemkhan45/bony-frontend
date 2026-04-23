import { madeForYouContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import MadeForYouCard from './MadeForYouCard';

function MadeForYouSection() {
  const content = madeForYouContent;

  return (
    <section id={content.id} className="py-14 sm:py-16 lg:py-[5.5rem]">
      <Container>
        <div className="mx-auto max-w-6xl border-t border-slate-100 pt-10 text-center sm:pt-12 lg:pt-16">
          <div className="mx-auto max-w-xl">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl lg:text-[44px]">
              {content.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[44ch] text-[13px] font-medium leading-6 text-slate-500 sm:mt-4 sm:text-[14px] sm:leading-7">
              {content.description}
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:mt-12 lg:grid-cols-3">
            {content.items.map((item) => (
              <MadeForYouCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default MadeForYouSection;
