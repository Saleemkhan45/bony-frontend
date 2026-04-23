import { pricingContent } from '@/features/home/data/homeContent';
import { Container } from '@/shared/ui/Container';
import { usePricingBilling } from '@/features/home/hooks';

import PricingBillingToggle from './PricingBillingToggle';
import PricingCard from './PricingCard';

function PricingSection() {
  const content = pricingContent;

  const { billingCycle, selectBillingCycle } = usePricingBilling(content.defaultBillingCycle);

  return (
    <section id={content.id} className="py-16 sm:py-[4.5rem] lg:py-24">
      <Container>
        <div className="mx-auto max-w-6xl border-t border-slate-100 pt-10 sm:pt-12 lg:pt-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl lg:text-[42px]">
              {content.title}
            </h2>
            <p className="mx-auto mt-3 max-w-[44ch] text-[13px] font-medium leading-6 text-slate-500 sm:mt-4 sm:text-[14px] sm:leading-7">
              {content.description}
            </p>
          </div>

          <PricingBillingToggle
            billingCycle={billingCycle}
            options={content.billingOptions}
            onChange={selectBillingCycle}
          />

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:mt-10 sm:gap-5 lg:mt-12 lg:grid-cols-3 lg:gap-6 lg:items-stretch">
            {content.plans.map((plan) => (
              <div key={plan.id} className={plan.featured ? 'xl:-translate-y-2' : ''}>
                <PricingCard
                  billingCycle={billingCycle}
                  plan={plan}
                  yearlyDiscountPercent={content.yearlyDiscountPercent}
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

export default PricingSection;
