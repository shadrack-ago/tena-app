/**
 * Paystack (server-only): start a hosted checkout, verify a transaction, and
 * activate the plan exactly once. Used by the shop billing page (verify on
 * return) and by the webhook (/api/paystack/webhook), whichever lands first.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { Sql } from "@/lib/db";
import { extendPlan } from "./shop";

const API = "https://api.paystack.co";

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

async function paystack<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = paystackSecret();
  if (!secret) throw new Error("Paystack is not configured.");
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: T;
  };
  if (!res.ok || !body.status || !body.data) {
    throw new Error(body.message || `Paystack error (${res.status})`);
  }
  return body.data;
}

/** Create a hosted checkout. Amount is in shillings; Paystack wants cents. */
export async function initializeTransaction(input: {
  email: string;
  amountKes: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number>;
}) {
  return paystack<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountKes * 100),
      currency: "KES",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ["mobile_money", "card"],
      metadata: input.metadata,
    }),
  });
}

type Verified = {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  channel: string;
};

export function verifyTransaction(reference: string) {
  return paystack<Verified>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs webhook bodies with HMAC-SHA512 of the raw body using the secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = paystackSecret();
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Confirm a Paystack payment against our pending row and activate the plan.
 * Idempotent: only the call that flips the row from pending to paid extends
 * the plan, so a webhook and a browser return can both run safely.
 */
export async function settlePaystackPayment(sql: Sql, reference: string) {
  const rows = await sql<{
    id: number;
    shop_id: number;
    plan: string;
    amount_kes: number;
    status: string;
  }>`
    select id, shop_id, plan, amount_kes, status from payments
    where reference = ${reference} and method = 'paystack' limit 1
  `;
  const pay = rows[0];
  if (!pay) return { state: "unknown" as const };
  if (pay.status === "paid") return { state: "paid" as const, shopId: pay.shop_id };

  const tx = await verifyTransaction(reference);
  if (tx.status !== "success") {
    // Only a definite failure is recorded. "abandoned" also means "still on the
    // checkout page", and M-Pesa can confirm late, so those stay open.
    if (tx.status === "failed" || tx.status === "reversed") {
      await sql`update payments set status = 'failed', note = ${`Paystack: ${tx.status}`} where id = ${pay.id} and status <> 'paid'`;
      return { state: "failed" as const, shopId: pay.shop_id };
    }
    return {
      state: tx.status === "abandoned" ? ("abandoned" as const) : ("pending" as const),
      shopId: pay.shop_id,
    };
  }
  if (tx.currency !== "KES" || tx.amount !== pay.amount_kes * 100) {
    await sql`update payments set note = ${`Paystack amount mismatch: ${tx.currency} ${tx.amount / 100}`} where id = ${pay.id}`;
    return { state: "mismatch" as const, shopId: pay.shop_id };
  }
  const flipped = await sql<{ id: number }>`
    update payments
    set status = 'paid', confirmed_by = ${"paystack"}, confirmed_at = now(), note = ${`Paystack ${tx.channel}`}
    where id = ${pay.id} and status <> 'paid'
    returning id
  `;
  if (flipped[0]) await extendPlan(sql, pay.shop_id, pay.plan);
  return { state: "paid" as const, shopId: pay.shop_id };
}
