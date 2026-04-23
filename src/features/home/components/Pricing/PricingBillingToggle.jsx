function PricingBillingToggle({ billingCycle, options, onChange }) {
  const isMonthly = billingCycle === 'monthly';
  const isYearly = billingCycle === 'yearly';

  const radioClassName = (isActive) =>
    [
      'group inline-flex items-start gap-2 transition-colors duration-200',
      isActive ? 'text-ink' : 'text-slate-600 hover:text-slate-700',
    ].join(' ');

  const dotClassName = (isActive) =>
    [
      'mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-200',
      isActive ? 'border-accent' : 'border-slate-300',
    ].join(' ');

  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-[12px] font-semibold sm:mt-8 sm:gap-5">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={radioClassName(isMonthly)}
        aria-pressed={isMonthly}
      >
        <span className={dotClassName(isMonthly)}>
          <span className={`h-2 w-2 rounded-full ${isMonthly ? 'bg-accent' : 'bg-transparent'}`} />
        </span>
        <span>{options.monthlyLabel}</span>
      </button>

      <button
        type="button"
        onClick={() => onChange(isYearly ? 'monthly' : 'yearly')}
        className="inline-flex h-7 w-12 items-center rounded-full bg-accent/15 p-1 transition-colors duration-200 hover:bg-accent/20"
        aria-label="Toggle billing cycle"
      >
        <span
          className={`h-5 w-5 rounded-full bg-accent shadow-[0_10px_20px_-12px_rgba(105,92,251,0.85)] transition-transform duration-200 ${
            isYearly ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>

      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={radioClassName(isYearly)}
        aria-pressed={isYearly}
      >
        <span className={dotClassName(isYearly)}>
          <span className={`h-2 w-2 rounded-full ${isYearly ? 'bg-accent' : 'bg-transparent'}`} />
        </span>

        <span className="text-left leading-none">
          <span className="block">{options.yearlyLabel}</span>
          <span className="mt-1 block text-[10px] font-bold text-accent">{options.yearlyNote}</span>
        </span>
      </button>
    </div>
  );
}

export default PricingBillingToggle;
