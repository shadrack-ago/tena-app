import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { PLANS, type PlanId } from "@/lib/plans";
import { billingMode, randomCode, resolveShop, shopAccess } from "./shop";
import { initializeTransaction, settlePaystackPayment } from "./paystack";
import { appUrl } from "./app-url";

/** Start a Paystack checkout for the shop owner; returns the page to send them to. */
export const startPaystackCheckout = createServerFn({ method: "POST" })
  .validator((input: { plan: PlanId }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    if (billingMode() !== "paystack") throw new Error("Online payments are not switched on.");
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can subscribe.");
    const access = await shopAccess(sql, shop.shopId, shop.trialEndsAt);
    if (access.suspended) throw new Error("This shop is suspended. Contact Uzatena support.");
    const plan = PLANS[data.plan];
    if (!plan) throw new Error("Pick a plan.");
    const user = await sql<{
      email: string;
    }>`select email from "user" where id = ${context.userId} limit 1`;
    if (!user[0]?.email) throw new Error("Your account needs an email to pay.");

    const reference = `UZA-${shop.shopId}-${randomCode(10)}`;
    // Abandon any earlier unfinished checkout so only the newest one can activate.
    await sql`
      update payments set status = 'failed', note = ${"Replaced by a new checkout"}
      where shop_id = ${shop.shopId} and method = 'paystack' and status = 'pending'
    `;
    await sql`
      insert into payments (shop_id, plan, amount_kes, phone, reference, status, method)
      values (${shop.shopId}, ${plan.id}, ${plan.kes}, ${null}, ${reference}, ${"pending"}, ${"paystack"})
    `;
    const tx = await initializeTransaction({
      email: user[0].email,
      amountKes: plan.kes,
      reference,
      callbackUrl: `${appUrl()}/app/shop`,
      metadata: { shop_id: shop.shopId, plan: plan.id },
    });
    return { url: tx.authorization_url };
  });

/** Called when Paystack sends the owner back: confirm and activate. */
export const verifyPaystackPayment = createServerFn({ method: "POST" })
  .validator((input: { reference: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const own = await sql<{ id: number }>`
      select id from payments
      where reference = ${data.reference} and shop_id = ${shop.shopId} and method = 'paystack'
      limit 1
    `;
    if (!own[0]) throw new Error("Payment not found.");
    const result = await settlePaystackPayment(sql, data.reference);
    return { state: result.state };
  });
