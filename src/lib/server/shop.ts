import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { ensureShopAndDemo } from "./seed";
import type { Shop } from "@/lib/types";

import { PLANS, type PlanId } from "@/lib/plans";

export { PLANS, type PlanId };

/**
 * "manual" (default): shops pay by M-Pesa outside the app, tap "I've paid", and a
 * Tena admin confirms in /ops. "demo": the old self-confirming preview flow —
 * for local testing only, never for real shops.
 */
export function billingMode(): "manual" | "demo" {
  return process.env.TENA_BILLING_MODE?.trim() === "demo" ? "demo" : "manual";
}

/** Where shops send M-Pesa money in manual mode, e.g. "Till 123456". */
export function mpesaPayTo(): string | null {
  return process.env.TENA_MPESA_PAY_TO?.trim() || null;
}
export type MemberRole = "owner" | "staff";
export type AccessStatus = "trial" | "active" | "locked";

export type ShopContext = {
  shopId: number;
  tenantId: string;
  role: MemberRole;
  shopName: string;
  joinCode: string;
  inviteCode: string;
  trialEndsAt: string | null;
};

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function randomCode(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]!;
  }
  return s;
}

export function mapShopRow(row: {
  id: number;
  user_id: string;
  name: string;
  owner_name: string | null;
  phone: string | null;
  city: string;
  vertical: string;
  language: string;
  loyalty_type: string;
  stamp_goal: number;
  points_per_kes: number;
  reward_label: string;
  seeded: boolean;
}): Shop {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    ownerName: row.owner_name,
    phone: row.phone,
    city: row.city,
    vertical: row.vertical,
    language: row.language,
    loyaltyType: row.loyalty_type === "points" ? "points" : "stamps",
    stampGoal: row.stamp_goal,
    pointsPerKes: row.points_per_kes,
    rewardLabel: row.reward_label,
    seeded: row.seeded,
  };
}

async function uniqueCode(sql: Sql, column: "join_code" | "invite_code", len: number) {
  for (let i = 0; i < 8; i++) {
    const c = randomCode(len);
    const clash =
      column === "join_code"
        ? await sql<{ n: number }>`select count(*)::int as n from shops where join_code = ${c}`
        : await sql<{ n: number }>`select count(*)::int as n from shops where invite_code = ${c}`;
    if ((clash[0]?.n ?? 0) === 0) return c;
  }
  return randomCode(len) + randomCode(2);
}

export async function ensureShopMeta(
  sql: Sql,
  shopId: number,
  ownerUserId: string,
  ownerName?: string | null,
) {
  const rows = await sql<{
    join_code: string | null;
    invite_code: string | null;
    trial_ends_at: string | null;
  }>`
    select join_code, invite_code, trial_ends_at from shops where id = ${shopId} limit 1
  `;
  const row = rows[0];
  if (!row) return;
  const joinCode = row.join_code || (await uniqueCode(sql, "join_code", 6));
  const inviteCode = row.invite_code || (await uniqueCode(sql, "invite_code", 8));
  const trialEndsAt = row.trial_ends_at || new Date(Date.now() + 14 * 24 * 3600_000).toISOString();
  await sql`
    update shops
    set join_code = ${joinCode},
        invite_code = ${inviteCode},
        trial_ends_at = ${trialEndsAt}
    where id = ${shopId}
  `;
  const member = await sql<{ n: number }>`
    select count(*)::int as n from shop_members where shop_id = ${shopId} and user_id = ${ownerUserId}
  `;
  if ((member[0]?.n ?? 0) === 0) {
    await sql`
      insert into shop_members (shop_id, user_id, role, name, status)
      values (${shopId}, ${ownerUserId}, ${"owner"}, ${ownerName ?? null}, ${"active"})
    `;
  }
}

export async function resolveShop(sql: Sql, userId: string): Promise<ShopContext> {
  const asMember = await sql<{
    shop_id: number;
    tenant_id: string;
    role: string;
    shop_name: string;
    join_code: string | null;
    invite_code: string | null;
    trial_ends_at: string | null;
  }>`
    select m.shop_id, s.user_id as tenant_id, m.role, s.name as shop_name,
           s.join_code, s.invite_code, s.trial_ends_at
    from shop_members m
    join shops s on s.id = m.shop_id
    where m.user_id = ${userId} and m.status = 'active'
    order by case when m.role = 'owner' then 0 else 1 end
    limit 1
  `;
  if (asMember[0]) {
    const m = asMember[0];
    await ensureShopMeta(sql, m.shop_id, m.tenant_id);
    const refreshed = await sql<{
      join_code: string | null;
      invite_code: string | null;
      trial_ends_at: string | null;
    }>`select join_code, invite_code, trial_ends_at from shops where id = ${m.shop_id}`;
    return {
      shopId: m.shop_id,
      tenantId: m.tenant_id,
      role: m.role === "owner" ? "owner" : "staff",
      shopName: m.shop_name,
      joinCode: refreshed[0]?.join_code || "",
      inviteCode: refreshed[0]?.invite_code || "",
      trialEndsAt: refreshed[0]?.trial_ends_at ?? m.trial_ends_at,
    };
  }

  const shopId = await ensureShopAndDemo(sql, userId);
  const owned = await sql<{
    id: number;
    user_id: string;
    name: string;
    owner_name: string | null;
  }>`select id, user_id, name, owner_name from shops where user_id = ${userId} limit 1`;
  const shop = owned[0];
  if (!shop) throw new Error("Could not open shop");
  await ensureShopMeta(sql, shop.id, userId, shop.owner_name);
  const meta = await sql<{
    join_code: string | null;
    invite_code: string | null;
    trial_ends_at: string | null;
  }>`select join_code, invite_code, trial_ends_at from shops where id = ${shop.id}`;
  return {
    shopId: shop.id,
    tenantId: userId,
    role: "owner",
    shopName: shop.name,
    joinCode: meta[0]?.join_code || "",
    inviteCode: meta[0]?.invite_code || "",
    trialEndsAt: meta[0]?.trial_ends_at ?? null,
  };
}

/**
 * Tenant id for shop-data server functions. Enforces the paywall on the server:
 * a locked (expired or suspended) shop can still reach Shop/Support (which use
 * resolveShop directly) but not its customer data.
 */
export async function uidOf(sql: Sql, userId: string) {
  const shop = await resolveShop(sql, userId);
  const access = await shopAccess(sql, shop.shopId, shop.trialEndsAt);
  if (access.status === "locked") {
    throw new Error(
      access.suspended
        ? "This shop is suspended. Contact Tena support."
        : "Your plan has ended. Open Shop to renew.",
    );
  }
  return shop.tenantId;
}

export async function shopAccess(sql: Sql, shopId: number, trialEndsAt: string | null) {
  const flags = await sql<{ suspended_at: string | null; suspended_reason: string | null }>`
    select suspended_at, suspended_reason from shops where id = ${shopId} limit 1
  `;
  if (flags[0]?.suspended_at) {
    return {
      status: "locked" as AccessStatus,
      plan: null as string | null,
      periodEnd: null as string | null,
      trialEndsAt,
      daysLeft: 0,
      suspended: true,
      suspendedReason: flags[0].suspended_reason,
    };
  }
  const sub = await sql<{
    plan: string;
    status: string;
    current_period_end: string;
  }>`
    select plan, status, current_period_end from subscriptions where shop_id = ${shopId} limit 1
  `;
  const periodEnd = sub[0]?.current_period_end ? new Date(sub[0].current_period_end).getTime() : 0;
  if (sub[0]?.status === "active" && periodEnd > Date.now()) {
    return {
      status: "active" as AccessStatus,
      plan: sub[0].plan,
      periodEnd: sub[0].current_period_end,
      trialEndsAt,
      daysLeft: Math.max(0, Math.ceil((periodEnd - Date.now()) / 86400000)),
      suspended: false,
      suspendedReason: null as string | null,
    };
  }
  const trialEnd = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
  if (trialEnd > Date.now()) {
    return {
      status: "trial" as AccessStatus,
      plan: null as string | null,
      periodEnd: trialEndsAt,
      trialEndsAt,
      daysLeft: Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)),
      suspended: false,
      suspendedReason: null as string | null,
    };
  }
  return {
    status: "locked" as AccessStatus,
    plan: sub[0]?.plan ?? null,
    periodEnd: sub[0]?.current_period_end ?? trialEndsAt,
    trialEndsAt,
    daysLeft: 0,
    suspended: false,
    suspendedReason: null as string | null,
  };
}

export const getAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const access = await shopAccess(sql, shop.shopId, shop.trialEndsAt);
    const admin = await sql<{ n: number }>`
      select count(*)::int as n from platform_admins where user_id = ${context.userId}
    `;
    return {
      ...access,
      role: shop.role,
      shopId: shop.shopId,
      shopName: shop.shopName,
      isAdmin: (admin[0]?.n ?? 0) > 0,
    };
  });

export const getShopDesk = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const access = await shopAccess(sql, shop.shopId, shop.trialEndsAt);
    const members = await sql<{
      id: number;
      user_id: string;
      role: string;
      name: string | null;
      email: string | null;
      status: string;
    }>`
      select id, user_id, role, name, email, status
      from shop_members
      where shop_id = ${shop.shopId} and status = 'active'
      order by case when role = 'owner' then 0 else 1 end, created_at asc
    `;
    const pending = await sql<{
      id: number;
      plan: string;
      amount_kes: number;
      phone: string | null;
      reference: string;
      status: string;
      method: string;
    }>`
      select id, plan, amount_kes, phone, reference, status, coalesce(method, 'mpesa') as method
      from payments
      where shop_id = ${shop.shopId} and status in ('pending', 'submitted')
      order by created_at desc
      limit 1
    `;
    return {
      shopName: shop.shopName,
      joinCode: shop.joinCode,
      inviteCode: shop.inviteCode,
      role: shop.role,
      access,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        name: m.name || (m.role === "owner" ? "Owner" : "Staff"),
        email: m.email,
        isYou: m.user_id === context.userId,
      })),
      pendingPayment: pending[0]
        ? {
            id: pending[0].id,
            plan: pending[0].plan,
            amountKes: pending[0].amount_kes,
            phone: pending[0].phone,
            reference: pending[0].reference,
            method: pending[0].method,
            status: pending[0].status as "pending" | "submitted",
          }
        : null,
      plans: PLANS,
      billingMode: billingMode(),
      mpesaPayTo: mpesaPayTo(),
    };
  });

export const rotateInvite = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can change the staff invite.");
    const inviteCode = await uniqueCode(sql, "invite_code", 8);
    await sql`update shops set invite_code = ${inviteCode} where id = ${shop.shopId}`;
    return { inviteCode };
  });

export const joinShopWithInvite = createServerFn({ method: "POST" })
  .validator((input: { code: string; name?: string | null; email?: string | null }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const code = data.code.trim().toUpperCase();
    if (code.length < 4) throw new Error("Enter the invite code from the owner.");

    const alreadyMember = await sql<{ n: number }>`
      select count(*)::int as n from shop_members where user_id = ${context.userId} and status = 'active'
    `;
    if ((alreadyMember[0]?.n ?? 0) > 0) {
      throw new Error("This account already belongs to a shop.");
    }

    const owns = await sql<{ id: number; seeded: boolean }>`
      select id, seeded from shops where user_id = ${context.userId} limit 1
    `;
    if (owns[0] && owns[0].seeded) {
      throw new Error("This email already runs a shop. Staff should sign up with their own email.");
    }

    const target = await sql<{ id: number; name: string }>`
      select id, name from shops where invite_code = ${code} limit 1
    `;
    if (!target[0]) throw new Error("That invite code is not valid.");

    if (owns[0] && !owns[0].seeded) {
      await sql`delete from shops where id = ${owns[0].id} and user_id = ${context.userId}`;
    }

    await sql`
      insert into shop_members (shop_id, user_id, role, name, email, status)
      values (${target[0].id}, ${context.userId}, ${"staff"}, ${data.name ?? null}, ${data.email ?? null}, ${"active"})
      on conflict (shop_id, user_id) do update set status = 'active', role = 'staff'
    `;
    return { shopName: target[0].name };
  });

/**
 * Add `months` of paid time. Renewing early stacks on the remaining period
 * instead of throwing it away.
 */
export async function extendPlan(sql: Sql, shopId: number, planId: string, months?: number) {
  const plan = PLANS[planId as PlanId];
  const addMonths = months ?? plan?.months ?? 1;
  const current = await sql<{ status: string; current_period_end: string }>`
    select status, current_period_end from subscriptions where shop_id = ${shopId} limit 1
  `;
  const currentEnd = current[0]?.current_period_end
    ? new Date(current[0].current_period_end).getTime()
    : 0;
  const base = current[0]?.status === "active" && currentEnd > Date.now() ? currentEnd : Date.now();
  const periodEnd = new Date(base + addMonths * 30 * 24 * 3600_000).toISOString();
  const now = new Date().toISOString();
  await sql`
    insert into subscriptions (shop_id, plan, status, current_period_end, updated_at)
    values (${shopId}, ${planId}, ${"active"}, ${periodEnd}, ${now})
    on conflict (shop_id) do update set
      plan = excluded.plan,
      status = 'active',
      current_period_end = excluded.current_period_end,
      updated_at = excluded.updated_at
  `;
  return periodEnd;
}

export const startMpesaCheckout = createServerFn({ method: "POST" })
  .validator((input: { plan: PlanId; phone: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can subscribe.");
    const plan = PLANS[data.plan];
    if (!plan) throw new Error("Pick a plan.");
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 9) throw new Error("Enter the M-Pesa number that will pay.");
    const reference = `TENA${randomCode(5)}`;
    const awaiting = await sql<{ n: number }>`
      select count(*)::int as n from payments where shop_id = ${shop.shopId} and status = 'submitted'
    `;
    if ((awaiting[0]?.n ?? 0) > 0) {
      throw new Error("Tena is still confirming your last payment.");
    }
    await sql`update payments set status = 'failed' where shop_id = ${shop.shopId} and status = 'pending'`;
    const rows = await sql<{ id: number }>`
      insert into payments (shop_id, plan, amount_kes, phone, reference, status, method)
      values (${shop.shopId}, ${plan.id}, ${plan.kes}, ${data.phone.trim()}, ${reference}, ${"pending"}, ${"mpesa"})
      returning id
    `;
    return {
      paymentId: rows[0].id,
      reference,
      amountKes: plan.kes,
      plan: plan.id,
      phone: data.phone.trim(),
    };
  });

export const confirmMpesaPayment = createServerFn({ method: "POST" })
  .validator((input: { paymentId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can subscribe.");
    const pay = await sql<{
      id: number;
      plan: string;
      amount_kes: number;
      status: string;
    }>`
      select id, plan, amount_kes, status from payments
      where id = ${data.paymentId} and shop_id = ${shop.shopId}
      limit 1
    `;
    if (!pay[0] || pay[0].status !== "pending") {
      throw new Error("Payment not found.");
    }
    if (billingMode() === "manual") {
      // The shop says it paid; a Tena admin checks M-Pesa and confirms in /ops.
      await sql`update payments set status = 'submitted' where id = ${pay[0].id}`;
      return { ok: true as const, activated: false as const, periodEnd: null };
    }
    await sql`update payments set status = 'paid' where id = ${pay[0].id}`;
    const periodEnd = await extendPlan(sql, shop.shopId, pay[0].plan);
    return { ok: true as const, activated: true as const, periodEnd };
  });

export const payWithCard = createServerFn({ method: "POST" })
  .validator((input: { plan: PlanId }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can subscribe.");
    if (billingMode() !== "demo") {
      throw new Error("Card payments are coming soon. Pay with M-Pesa for now.");
    }
    const plan = PLANS[data.plan];
    if (!plan) throw new Error("Pick a plan.");
    const reference = `CARD${randomCode(5)}`;
    await sql`update payments set status = 'failed' where shop_id = ${shop.shopId} and status = 'pending'`;
    const rows = await sql<{ id: number }>`
      insert into payments (shop_id, plan, amount_kes, phone, reference, status, method)
      values (${shop.shopId}, ${plan.id}, ${plan.kes}, ${null}, ${reference}, ${"paid"}, ${"card"})
      returning id
    `;
    const periodEnd = await extendPlan(sql, shop.shopId, plan.id);
    return { ok: true as const, paymentId: rows[0].id, periodEnd, reference };
  });

export const previewLock = createServerFn({ method: "POST" })
  .validator((input: { locked: boolean }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    if (shop.role !== "owner") throw new Error("Only the owner can change billing.");
    if (billingMode() !== "demo") throw new Error("Not available.");
    if (data.locked) {
      await sql`
        update shops set trial_ends_at = ${new Date(Date.now() - 60_000).toISOString()}
        where id = ${shop.shopId}
      `;
      await sql`
        update subscriptions set status = 'canceled', current_period_end = ${new Date().toISOString()}
        where shop_id = ${shop.shopId}
      `;
    } else {
      await sql`
        update shops set trial_ends_at = ${new Date(Date.now() + 14 * 24 * 3600_000).toISOString()}
        where id = ${shop.shopId}
      `;
    }
    return { ok: true as const };
  });
