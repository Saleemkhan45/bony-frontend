import { useState } from 'react';

function usePricingBilling(defaultBillingCycle = 'monthly') {
  const [billingCycle, setBillingCycle] = useState(defaultBillingCycle);

  const selectBillingCycle = (cycle) => {
    setBillingCycle(cycle);
  };

  return {
    billingCycle,
    isYearly: billingCycle === 'yearly',
    selectBillingCycle,
  };
}

export default usePricingBilling;
