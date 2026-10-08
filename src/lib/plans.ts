/** Tena subscription plans (shared by the shop billing page and Tena HQ). */
export const PLANS = {
  monthly: { id: "monthly" as const, label: "1 month", kes: 999, months: 1 },
  quarter: { id: "quarter" as const, label: "3 months", kes: 2699, months: 3 },
  half: { id: "half" as const, label: "6 months", kes: 4999, months: 6 },
  yearly: { id: "yearly" as const, label: "1 year", kes: 8999, months: 12 },
};

export type PlanId = keyof typeof PLANS;
