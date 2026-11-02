-- Paystack checkout: one payments row per Paystack transaction reference.
create unique index if not exists payments_paystack_ref_uidx
  on payments (reference) where method = 'paystack';
