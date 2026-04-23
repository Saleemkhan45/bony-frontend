import { ArrowRightIcon, CheckCircleIcon } from '@/features/home/components/icons/HomeIcons';

import { Button } from '@/shared/ui/Button';

function PricingCard({ billingCycle, plan, yearlyDiscountPercent }) {
  const isYearly = billingCycle === 'yearly';
  const displayedPrice = isYearly
    ? Math.round(plan.monthlyPrice * ((100 - yearlyDiscountPercent) / 100))
    : plan.monthlyPrice;

  return (
    <article
      className={`relative flex h-full flex-col overflow-hidden rounded-[22px] border px-5 pb-6 pt-7 text-left sm:rounded-[24px] sm:px-6 sm:pb-7 sm:pt-8 lg:rounded-[26px] lg:px-8 lg:pb-8 lg:pt-9 ${
        plan.featured
          ? 'border-[#e6ddff] bg-[#fbfaff] shadow-[0_40px_90px_-55px_rgba(105,92,251,0.5)]'
          : 'border-slate-200 bg-white shadow-[0_30px_80px_-60px_rgba(18,28,68,0.28)]'
      }`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[3px] ${
          plan.featured ? 'bg-accent' : 'bg-slate-300'
        }`}
      />

      <div className="flex items-end gap-1.5">
        <span
          className={`text-[38px] font-extrabold tracking-[-0.06em] ${
            plan.featured ? 'text-accent' : 'text-ink'
          } sm:text-[40px] lg:text-[42px]`}
        >
          ${displayedPrice}
        </span>
        <span className="mb-2 text-[12px] font-semibold text-slate-600">/month</span>
      </div>

      <h3 className="mt-3 text-[18px] font-bold tracking-tight text-ink sm:mt-4">{plan.name}</h3>
      <p className="mt-2.5 max-w-[240px] text-[13px] font-medium leading-6 text-slate-500 sm:mt-3 sm:text-[12px]">
        {plan.description}
      </p>

      <ul className="mt-6 flex flex-1 flex-col gap-3 sm:mt-7 sm:gap-3.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-[13px] font-medium text-slate-500 sm:text-[12px]">
            <CheckCircleIcon
              className={`h-4 w-4 shrink-0 ${
                plan.featured ? 'text-accent' : 'text-[#7c87a8]'
              }`}
            />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 sm:mt-8">
        {isYearly ? (
          <p className="mb-3 text-[11px] font-semibold text-accent/80">
            Save {yearlyDiscountPercent}% with annual billing
          </p>
        ) : (
          <div className="mb-3 h-[17px]" />
        )}

        <Button
          as="a"
          href={plan.action.href}
          variant={plan.featured ? 'solid' : 'outline'}
          size="sm"
          className={`w-full justify-between rounded-[12px] px-4 ${
            plan.featured
              ? 'shadow-[0_24px_42px_-22px_rgba(105,92,251,0.8)]'
              : 'border-[#d6d2ff] text-accent'
          }`}
        >
          <span>{plan.action.label}</span>
          <ArrowRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

export default PricingCard;
