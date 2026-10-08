import { createServerFn } from "@tanstack/react-start";
import { getSql, type Sql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { PLANS, extendPlan, type PlanId } from "./shop";
import { appUrl } from "./app-url";
import { adminInviteEmail, sendEmail } from "./email";

/**
 * Tena HQ (/ops) — the platform operator's controls over every shop.
 *
 * Roles:
 *   owner   — everything: billing, suspensions, admin team.
 *   support — read everything, answer tickets, send password-reset links.
 * Emails in TENA_ADMIN_EMAILS are always owners (the bootstrap list); everyone
 * else is invited from the Team page. Every change is written to admin_audit.
 */

export type AdminRole = "owner" | "support";
export type AuditDetail = Record<string, string | number | boolean | null>;
export type Admin = { userId: string; email: string | null; name: string; role: AdminRole };

const DAY = 24 * 3600_000;

function envOwnerEmails(): string[] {
  return (process.env.TENA_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

const isEnvOwner = (email: string | null) =>
  Boolean(email && envOwnerEmails().includes(email.toLowerCase()));

export async function userLabel(sql: Sql, userId: string) {
  const rows = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId} limit 1
  `;
  return { name: rows[0]?.name || "Tena", email: rows[0]?.email || null };
}

async function findAdmin(sql: Sql, userId: string): Promise<Admin | null> {
  const rows = await sql<{ role: string }>`
    select role from platform_admins where user_id = ${userId} limit 1
  `;
  if (!rows[0]) return null;
  const who = await userLabel(sql, userId);
  const role: AdminRole = isEnvOwner(who.email) || rows[0].role === "owner" ? "owner" : "support";
  return { userId, email: who.email, name: who.name, role };
}

export async function requireAdmin(sql: Sql, userId: string, need?: "owner"): Promise<Admin> {
  const admin = await findAdmin(sql, userId);
  if (!admin) throw new Error("Not a Tena admin.");
  if (need === "owner" && admin.role !== "owner") {
    throw new Error("Only Tena owners can do that.");
  }
  return admin;
}

async function audit(
  sql: Sql,
  admin: Admin,
  action: string,
  shopId: number | null,
  detail: Record<string, unknown> = {},
) {
  await sql`
    insert into admin_audit (admin_user_id, admin_email, action, shop_id, detail)
    values (${admin.userId}, ${admin.email}, ${action}, ${shopId}, ${JSON.stringify(detail)}::jsonb)
  `;
}

async function requireShop(sql: Sql, shopId: number) {
  const rows = await sql<{ id: number; name: string; user_id: string }>`
    select id, name, user_id from shops where id = ${shopId} limit 1
  `;
  if (!rows[0]) throw new Error("Shop not found.");
  return rows[0];
}

type ShopRow = {
  id: number;
  name: string;
  city: string | null;
  owner_name: string | null;
  owner_email: string | null;
  created_at: string;
  trial_ends_at: string | null;
  suspended_at: string | null;
  plan: string | null;
  sub_status: string | null;
  current_period_end: string | null;
};

export type ShopAccessLabel = "active" | "trial" | "expired" | "suspended";

function accessOf(
  s: Pick<ShopRow, "suspended_at" | "sub_status" | "current_period_end" | "trial_ends_at">,
): ShopAccessLabel {
  if (s.suspended_at) return "suspended";
  const periodEnd = s.current_period_end ? new Date(s.current_period_end).getTime() : 0;
  if (s.sub_status === "active" && periodEnd > Date.now()) return "active";
  const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
  return trialEnd > Date.now() ? "trial" : "expired";
}

const SHOP_BASE = `
  select s.id, s.name, s.city, s.owner_name, u.email as owner_email, s.created_at,
         s.trial_ends_at, s.suspended_at, sub.plan, sub.status as sub_status, sub.current_period_end
  from shops s
  left join subscriptions sub on sub.shop_id = s.id
  left join "user" u on u.id = s.user_id
`;

/* ── Session & claim ─────────────────────────────────────────────────────── */

export const getOpsSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admin = await findAdmin(sql, context.userId);
    const who = await userLabel(sql, context.userId);
    let canClaim = false;
    if (!admin && who.email) {
      const invite = await sql<{ email: string }>`
        select email from admin_invites where email = ${who.email.toLowerCase()} limit 1
      `;
      canClaim = isEnvOwner(who.email) || Boolean(invite[0]);
    }
    return {
      isAdmin: Boolean(admin),
      role: admin?.role ?? null,
      canClaim,
      name: who.name,
      email: who.email,
    };
  });

export const claimOps = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const who = await userLabel(sql, context.userId);
    if (!who.email) throw new Error("This account has no email.");
    const email = who.email.toLowerCase();
    const invite = await sql<{ role: string; invited_by: string | null }>`
      select role, invited_by from admin_invites where email = ${email} limit 1
    `;
    const role: AdminRole = isEnvOwner(email)
      ? "owner"
      : invite[0]?.role === "owner"
        ? "owner"
        : "support";
    if (!isEnvOwner(email) && !invite[0]) throw new Error("This email is not a Tena admin.");
    await sql`
      insert into platform_admins (user_id, email, name, role, invited_by)
      values (${context.userId}, ${who.email}, ${who.name}, ${role}, ${invite[0]?.invited_by ?? null})
      on conflict (user_id) do update set role = excluded.role
    `;
    await sql`delete from admin_invites where email = ${email}`;
    const admin = { userId: context.userId, email: who.email, name: who.name, role };
    await audit(sql, admin, "admin.joined", null, { role });
    return { ok: true as const, role };
  });

/* ── Overview & growth ───────────────────────────────────────────────────── */

export const getOpsOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const shops = await sql.query<ShopRow>(`${SHOP_BASE} order by s.created_at asc`);
    const now = Date.now();

    let paying = 0;
    let trial = 0;
    let expired = 0;
    let suspended = 0;
    let mrr = 0;
    let churned30d = 0;
    const trialsEnding: { id: number; name: string; trialEndsAt: string }[] = [];
    for (const s of shops) {
      const a = accessOf(s);
      if (a === "active") {
        paying += 1;
        const plan = PLANS[s.plan as PlanId];
        if (plan) mrr += plan.kes / plan.months;
      } else if (a === "trial") {
        trial += 1;
        const end = new Date(s.trial_ends_at!).getTime();
        if (end - now <= 3 * DAY)
          trialsEnding.push({ id: s.id, name: s.name, trialEndsAt: s.trial_ends_at! });
      } else if (a === "expired") {
        expired += 1;
      } else {
        suspended += 1;
      }
      const subEnd = s.current_period_end ? new Date(s.current_period_end).getTime() : 0;
      if (a !== "active" && subEnd && subEnd <= now && subEnd > now - 30 * DAY) churned30d += 1;
    }

    // Trial → paid: of shops whose 14-day trial window has passed, how many ever paid.
    const matured = await sql<{ total: number; converted: number }>`
      select count(*)::int as total,
             count(*) filter (where exists (
               select 1 from payments p
               where p.shop_id = s.id and p.status = 'paid' and p.method <> 'grant'
             ))::int as converted
      from shops s
      where s.created_at < now() - interval '14 days'
    `;

    const revenue30 = await sql<{ kes: number }>`
      select coalesce(sum(amount_kes), 0)::int as kes from payments
      where status = 'paid' and method <> 'grant'
        and coalesce(confirmed_at, created_at) > now() - interval '30 days'
    `;

    const weekly = await sql<{ week: string; n: number }>`
      select to_char(date_trunc('week', created_at), 'YYYY-MM-DD') as week, count(*)::int as n
      from shops
      where created_at > date_trunc('week', now()) - interval '11 weeks'
      group by 1
    `;
    const monthly = await sql<{ month: string; kes: number }>`
      select to_char(date_trunc('month', coalesce(confirmed_at, created_at)), 'YYYY-MM') as month,
             coalesce(sum(amount_kes), 0)::int as kes
      from payments
      where status = 'paid' and method <> 'grant'
        and coalesce(confirmed_at, created_at) > date_trunc('month', now()) - interval '5 months'
      group by 1
    `;

    const awaiting = await sql<{
      id: number;
      shop_id: number;
      shop_name: string;
      plan: string;
      amount_kes: number;
      phone: string | null;
      reference: string;
      created_at: string;
    }>`
      select p.id, p.shop_id, s.name as shop_name, p.plan, p.amount_kes, p.phone, p.reference, p.created_at
      from payments p join shops s on s.id = p.shop_id
      where p.status = 'submitted'
      order by p.created_at asc
    `;
    const openTickets = await sql<{ n: number }>`
      select count(*)::int as n from support_tickets where status = 'open'
    `;

    // Fill empty weeks/months so the bars line up with the calendar.
    const weekStart = (d: Date) => {
      const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
      return x;
    };
    const weeks: { label: string; value: number }[] = [];
    const thisWeek = weekStart(new Date());
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(thisWeek.getTime() - i * 7 * DAY);
      const key = d.toISOString().slice(0, 10);
      weeks.push({ label: key, value: weekly.find((w) => w.week === key)?.n ?? 0 });
    }
    const months: { label: string; value: number }[] = [];
    const nowD = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(Date.UTC(nowD.getUTCFullYear(), nowD.getUTCMonth() - i, 1));
      const key = d.toISOString().slice(0, 7);
      months.push({ label: key, value: monthly.find((m) => m.month === key)?.kes ?? 0 });
    }

    return {
      kpis: {
        shops: shops.length,
        new30d: shops.filter((s) => new Date(s.created_at).getTime() > now - 30 * DAY).length,
        paying,
        trial,
        expired,
        suspended,
        mrrKes: Math.round(mrr),
        revenue30dKes: revenue30[0]?.kes ?? 0,
        churned30d,
        conversion: {
          total: matured[0]?.total ?? 0,
          converted: matured[0]?.converted ?? 0,
        },
        openTickets: openTickets[0]?.n ?? 0,
      },
      signupsByWeek: weeks,
      revenueByMonth: months,
      trialsEnding,
      awaiting: awaiting.map((p) => ({
        id: p.id,
        shopId: p.shop_id,
        shopName: p.shop_name,
        plan: p.plan,
        amountKes: p.amount_kes,
        phone: p.phone,
        reference: p.reference,
        createdAt: p.created_at,
      })),
    };
  });

/* ── Businesses ──────────────────────────────────────────────────────────── */

export const getOpsShops = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql.query<
      ShopRow & {
        people: number;
        staff: number;
        sales_30d_kes: number;
        sales_30d: number;
        sent_30d: number;
        due_now: number;
        last_active: string | null;
      }
    >(`
      select b.*,
        coalesce((select count(*) from customers c where c.user_id = sh.user_id), 0)::int as people,
        coalesce((select count(*) from shop_members m where m.shop_id = b.id and m.status = 'active'), 0)::int as staff,
        coalesce((select sum(x.amount_kes) from sales x where x.user_id = sh.user_id and x.sold_at > now() - interval '30 days'), 0)::int as sales_30d_kes,
        coalesce((select count(*) from sales x where x.user_id = sh.user_id and x.sold_at > now() - interval '30 days'), 0)::int as sales_30d,
        coalesce((select count(*) from messages m where m.user_id = sh.user_id and m.direction = 'out' and m.sent_at > now() - interval '30 days'), 0)::int as sent_30d,
        coalesce((select count(*) from follow_ups f where f.user_id = sh.user_id and f.status = 'due' and f.due_at <= now()), 0)::int as due_now,
        greatest(
          (select max(x.sold_at) from sales x where x.user_id = sh.user_id),
          (select max(m.sent_at) from messages m where m.user_id = sh.user_id and m.direction = 'out'),
          (select max(c.created_at) from customers c where c.user_id = sh.user_id)
        ) as last_active
      from (${SHOP_BASE}) b
      join shops sh on sh.id = b.id
      order by b.created_at desc
    `);
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      ownerName: s.owner_name,
      ownerEmail: s.owner_email,
      createdAt: s.created_at,
      access: accessOf(s),
      plan: s.plan,
      trialEndsAt: s.trial_ends_at,
      periodEnd: s.current_period_end,
      people: s.people,
      staff: s.staff,
      sales30dKes: s.sales_30d_kes,
      sales30d: s.sales_30d,
      sent30d: s.sent_30d,
      dueNow: s.due_now,
      lastActive: s.last_active,
    }));
  });

export const getOpsShop = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql.query<
      ShopRow & {
        phone: string | null;
        vertical: string | null;
        suspended_reason: string | null;
        user_id: string;
      }
    >(
      `select b.*, sh.phone, sh.vertical, sh.suspended_reason, sh.user_id
       from (${SHOP_BASE}) b join shops sh on sh.id = b.id
       where b.id = $1`,
      [id],
    );
    const s = rows[0];
    if (!s) throw new Error("Shop not found.");

    const stats = await sql<{
      customers: number;
      sales_all: number;
      sales_all_kes: number;
      sales_30d_kes: number;
      sent_30d: number;
      due_now: number;
    }>`
      select
        (select count(*) from customers where user_id = ${s.user_id})::int as customers,
        (select count(*) from sales where user_id = ${s.user_id})::int as sales_all,
        coalesce((select sum(amount_kes) from sales where user_id = ${s.user_id}), 0)::int as sales_all_kes,
        coalesce((select sum(amount_kes) from sales where user_id = ${s.user_id} and sold_at > now() - interval '30 days'), 0)::int as sales_30d_kes,
        (select count(*) from messages where user_id = ${s.user_id} and direction = 'out' and sent_at > now() - interval '30 days')::int as sent_30d,
        (select count(*) from follow_ups where user_id = ${s.user_id} and status = 'due' and due_at <= now())::int as due_now
    `;
    const members = await sql<{
      name: string | null;
      email: string | null;
      role: string;
      created_at: string;
    }>`
      select name, email, role, created_at from shop_members
      where shop_id = ${id} and status = 'active'
      order by case when role = 'owner' then 0 else 1 end, created_at asc
    `;
    const payments = await sql<{
      id: number;
      plan: string;
      amount_kes: number;
      method: string;
      status: string;
      reference: string;
      phone: string | null;
      note: string | null;
      confirmed_by: string | null;
      created_at: string;
    }>`
      select id, plan, amount_kes, coalesce(method, 'mpesa') as method, status, reference, phone, note,
             confirmed_by, created_at
      from payments where shop_id = ${id}
      order by created_at desc
      limit 50
    `;
    const history = await sql<{
      id: number;
      admin_email: string | null;
      action: string;
      detail: unknown;
      created_at: string;
    }>`
      select id, admin_email, action, detail, created_at from admin_audit
      where shop_id = ${id}
      order by created_at desc
      limit 50
    `;
    const tickets = await sql<{ id: number; subject: string; status: string; created_at: string }>`
      select id, subject, status, created_at from support_tickets
      where shop_id = ${id} order by created_at desc limit 20
    `;
    const st = stats[0];
    return {
      id: s.id,
      name: s.name,
      city: s.city,
      vertical: s.vertical,
      phone: s.phone,
      ownerName: s.owner_name,
      ownerEmail: s.owner_email,
      createdAt: s.created_at,
      access: accessOf(s),
      plan: s.plan,
      trialEndsAt: s.trial_ends_at,
      periodEnd: s.current_period_end,
      suspendedAt: s.suspended_at,
      suspendedReason: s.suspended_reason,
      stats: {
        customers: st?.customers ?? 0,
        salesAll: st?.sales_all ?? 0,
        salesAllKes: st?.sales_all_kes ?? 0,
        sales30dKes: st?.sales_30d_kes ?? 0,
        sent30d: st?.sent_30d ?? 0,
        dueNow: st?.due_now ?? 0,
      },
      members: members.map((m) => ({
        name: m.name,
        email: m.email,
        role: m.role,
        since: m.created_at,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        plan: p.plan,
        amountKes: p.amount_kes,
        method: p.method,
        status: p.status,
        reference: p.reference,
        phone: p.phone,
        note: p.note,
        confirmedBy: p.confirmed_by,
        createdAt: p.created_at,
      })),
      history: history.map((h) => ({
        id: h.id,
        adminEmail: h.admin_email,
        action: h.action,
        detail: (h.detail ?? {}) as AuditDetail,
        createdAt: h.created_at,
      })),
      tickets: tickets.map((t) => ({
        id: t.id,
        subject: t.subject,
        status: t.status,
        createdAt: t.created_at,
      })),
    };
  });

/* ── Shop actions (owners) ───────────────────────────────────────────────── */

export const extendTrial = createServerFn({ method: "POST" })
  .validator((input: { shopId: number; days: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const days = Math.round(data.days);
    if (!(days >= 1 && days <= 90)) throw new Error("Pick 1–90 days.");
    const shop = await requireShop(sql, data.shopId);
    const rows = await sql<{ trial_ends_at: string }>`
      update shops
      set trial_ends_at = greatest(coalesce(trial_ends_at, now()), now()) + make_interval(days => ${days}::int)
      where id = ${shop.id}
      returning trial_ends_at
    `;
    await audit(sql, admin, "trial.extended", shop.id, {
      days,
      trialEndsAt: rows[0]?.trial_ends_at,
    });
    return { ok: true as const, trialEndsAt: rows[0]?.trial_ends_at };
  });

export const grantMonths = createServerFn({ method: "POST" })
  .validator((input: { shopId: number; months: number; note: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const months = Math.round(data.months);
    if (!(months >= 1 && months <= 24)) throw new Error("Pick 1–24 months.");
    const note = data.note.trim();
    if (note.length < 3) throw new Error("Say why (for the record).");
    const shop = await requireShop(sql, data.shopId);
    await sql`
      insert into payments (shop_id, plan, amount_kes, phone, reference, status, method, note, confirmed_by, confirmed_at)
      values (${shop.id}, ${"monthly"}, ${0}, ${null}, ${`GRANT-${Date.now().toString(36).toUpperCase()}`},
              ${"paid"}, ${"grant"}, ${note}, ${admin.email}, now())
    `;
    const periodEnd = await extendPlan(sql, shop.id, "monthly", months);
    await audit(sql, admin, "plan.granted", shop.id, { months, note, periodEnd });
    return { ok: true as const, periodEnd };
  });

export const recordPayment = createServerFn({ method: "POST" })
  .validator(
    (input: {
      shopId: number;
      plan: PlanId;
      amountKes: number;
      reference: string;
      note?: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const plan = PLANS[data.plan];
    if (!plan) throw new Error("Pick a plan.");
    const amount = Math.round(data.amountKes);
    if (!(amount > 0)) throw new Error("Enter the amount received.");
    const reference = data.reference.trim().toUpperCase();
    if (reference.length < 4) throw new Error("Enter the M-Pesa code (e.g. SJK3X9P2QL).");
    const dup = await sql<{
      id: number;
    }>`select id from payments where reference = ${reference} limit 1`;
    if (dup[0]) throw new Error("That M-Pesa code is already recorded.");
    const shop = await requireShop(sql, data.shopId);
    await sql`
      insert into payments (shop_id, plan, amount_kes, phone, reference, status, method, note, confirmed_by, confirmed_at)
      values (${shop.id}, ${plan.id}, ${amount}, ${null}, ${reference}, ${"paid"}, ${"mpesa-manual"},
              ${data.note?.trim() || null}, ${admin.email}, now())
    `;
    const periodEnd = await extendPlan(sql, shop.id, plan.id);
    await audit(sql, admin, "payment.recorded", shop.id, {
      plan: plan.id,
      amountKes: amount,
      reference,
      periodEnd,
    });
    return { ok: true as const, periodEnd };
  });

export const reviewPayment = createServerFn({ method: "POST" })
  .validator(
    (input: { paymentId: number; approve: boolean; mpesaCode?: string; note?: string }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const rows = await sql<{
      id: number;
      shop_id: number;
      plan: string;
      amount_kes: number;
      status: string;
      reference: string;
    }>`
      select id, shop_id, plan, amount_kes, status, reference from payments where id = ${data.paymentId} limit 1
    `;
    const pay = rows[0];
    if (!pay || !["pending", "submitted"].includes(pay.status))
      throw new Error("Payment is not awaiting review.");
    const note =
      [
        data.mpesaCode?.trim() ? `M-Pesa ${data.mpesaCode.trim().toUpperCase()}` : null,
        data.note?.trim() || null,
      ]
        .filter(Boolean)
        .join(" · ") || null;
    if (!data.approve) {
      await sql`
        update payments set status = 'failed', note = ${note}, confirmed_by = ${admin.email}, confirmed_at = now()
        where id = ${pay.id}
      `;
      await audit(sql, admin, "payment.rejected", pay.shop_id, { reference: pay.reference, note });
      return { ok: true as const, periodEnd: null };
    }
    await sql`
      update payments set status = 'paid', note = ${note}, confirmed_by = ${admin.email}, confirmed_at = now()
      where id = ${pay.id}
    `;
    const periodEnd = await extendPlan(sql, pay.shop_id, pay.plan);
    await audit(sql, admin, "payment.confirmed", pay.shop_id, {
      reference: pay.reference,
      amountKes: pay.amount_kes,
      plan: pay.plan,
      note,
      periodEnd,
    });
    return { ok: true as const, periodEnd };
  });

export const setSuspended = createServerFn({ method: "POST" })
  .validator((input: { shopId: number; suspended: boolean; reason?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const shop = await requireShop(sql, data.shopId);
    if (data.suspended) {
      const reason = data.reason?.trim() ?? "";
      if (reason.length < 3) throw new Error("Give a reason. The shop owner will see it.");
      await sql`update shops set suspended_at = now(), suspended_reason = ${reason} where id = ${shop.id}`;
      await audit(sql, admin, "shop.suspended", shop.id, { reason });
    } else {
      await sql`update shops set suspended_at = null, suspended_reason = null where id = ${shop.id}`;
      await audit(sql, admin, "shop.reactivated", shop.id);
    }
    return { ok: true as const };
  });

/** Support and owners: email the shop owner a password-reset link. */
export const sendOwnerReset = createServerFn({ method: "POST" })
  .validator((shopId: number) => shopId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: shopId }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId);
    const shop = await requireShop(sql, shopId);
    const owner = await userLabel(sql, shop.user_id);
    if (!owner.email) throw new Error("This shop owner has no email on file.");
    const { auth } = await import("@/lib/auth/server");
    await auth.api.requestPasswordReset({
      body: { email: owner.email, redirectTo: `${appUrl()}/reset-password` },
    });
    await audit(sql, admin, "owner.reset_link_sent", shop.id, { email: owner.email });
    return { ok: true as const, email: owner.email };
  });

/* ── Admin team (owners) ─────────────────────────────────────────────────── */

/** Sign-up link that pre-fills the invited email and lands on Tena HQ. */
function adminInviteLink(email: string) {
  return `${appUrl()}/login?${new URLSearchParams({ next: "/ops", email }).toString()}`;
}

export const getOpsTeam = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const me = await requireAdmin(sql, context.userId);
    const admins = await sql<{
      user_id: string;
      email: string | null;
      name: string | null;
      role: string;
      created_at: string;
    }>`
      select a.user_id, coalesce(u.email, a.email) as email, coalesce(u.name, a.name) as name, a.role, a.created_at
      from platform_admins a left join "user" u on u.id = a.user_id
      order by a.created_at asc
    `;
    const invites = await sql<{
      email: string;
      role: string;
      invited_by: string | null;
      created_at: string;
    }>`
      select email, role, invited_by, created_at from admin_invites order by created_at desc
    `;
    return {
      me: { userId: me.userId, role: me.role },
      admins: admins.map((a) => ({
        userId: a.user_id,
        email: a.email,
        name: a.name,
        role: (isEnvOwner(a.email) || a.role === "owner" ? "owner" : "support") as AdminRole,
        locked: isEnvOwner(a.email),
        since: a.created_at,
      })),
      invites: invites.map((i) => ({
        link: adminInviteLink(i.email),
        email: i.email,
        role: i.role as AdminRole,
        invitedBy: i.invited_by,
        createdAt: i.created_at,
      })),
    };
  });

export const inviteAdmin = createServerFn({ method: "POST" })
  .validator((input: { email: string; role: AdminRole }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    const email = data.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email.");
    const role: AdminRole = data.role === "owner" ? "owner" : "support";
    const existing = await sql<{ user_id: string }>`
      select a.user_id from platform_admins a join "user" u on u.id = a.user_id
      where lower(u.email) = ${email} limit 1
    `;
    if (existing[0]) throw new Error("That person is already an admin.");
    await sql`
      insert into admin_invites (email, role, invited_by) values (${email}, ${role}, ${admin.email})
      on conflict (email) do update set role = excluded.role, invited_by = excluded.invited_by
    `;
    const link = adminInviteLink(email);
    const emailed = await sendEmail(
      adminInviteEmail(email, admin.name || admin.email || "Tena", role, link),
    );
    await audit(sql, admin, "admin.invited", null, { email, role, emailed });
    return { ok: true as const, link, emailed };
  });

export const revokeAdminInvite = createServerFn({ method: "POST" })
  .validator((email: string) => email)
  .middleware([authMiddleware])
  .handler(async ({ context, data: email }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    await sql`delete from admin_invites where email = ${email.toLowerCase()}`;
    await audit(sql, admin, "admin.invite_revoked", null, { email });
    return { ok: true as const };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .validator((userId: string) => userId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: userId }) => {
    const sql = await getSql();
    const admin = await requireAdmin(sql, context.userId, "owner");
    if (userId === admin.userId) throw new Error("You can't remove yourself.");
    const target = await findAdmin(sql, userId);
    if (!target) throw new Error("Admin not found.");
    if (isEnvOwner(target.email)) {
      throw new Error("This owner is set in TENA_ADMIN_EMAILS. Remove them there instead.");
    }
    await sql`delete from platform_admins where user_id = ${userId}`;
    await audit(sql, admin, "admin.removed", null, { email: target.email, role: target.role });
    return { ok: true as const };
  });

/* ── Activity log ────────────────────────────────────────────────────────── */

export const getOpsActivity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const rows = await sql<{
      id: number;
      admin_email: string | null;
      action: string;
      shop_id: number | null;
      shop_name: string | null;
      detail: unknown;
      created_at: string;
    }>`
      select a.id, a.admin_email, a.action, a.shop_id, s.name as shop_name, a.detail, a.created_at
      from admin_audit a left join shops s on s.id = a.shop_id
      order by a.created_at desc
      limit 200
    `;
    return rows.map((r) => ({
      id: r.id,
      adminEmail: r.admin_email,
      action: r.action,
      shopId: r.shop_id,
      shopName: r.shop_name,
      detail: (r.detail ?? {}) as AuditDetail,
      createdAt: r.created_at,
    }));
  });
