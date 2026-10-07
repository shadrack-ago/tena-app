import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { resolveShop } from "./shop";

async function requireAdmin(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql<{ user_id: string }>`
    select user_id from platform_admins where user_id = ${userId} limit 1
  `;
  if (!rows[0]) throw new Error("Not a Tena admin.");
}

async function userLabel(sql: Awaited<ReturnType<typeof getSql>>, userId: string) {
  const rows = await sql<{ name: string; email: string }>`
    select name, email from "user" where id = ${userId} limit 1
  `;
  return {
    name: rows[0]?.name || "Tena",
    email: rows[0]?.email || null,
  };
}

export const getOpsSession = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admins = await sql<{ n: number }>`select count(*)::int as n from platform_admins`;
    const me = await sql<{ user_id: string }>`
      select user_id from platform_admins where user_id = ${context.userId} limit 1
    `;
    const who = await userLabel(sql, context.userId);
    return {
      isAdmin: Boolean(me[0]),
      canClaim: (admins[0]?.n ?? 0) === 0,
      name: who.name,
      email: who.email,
    };
  });

export const claimOps = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admins = await sql<{ n: number }>`select count(*)::int as n from platform_admins`;
    if ((admins[0]?.n ?? 0) > 0) throw new Error("Ops already has an owner.");
    const who = await userLabel(sql, context.userId);
    await sql`
      insert into platform_admins (user_id, email, name)
      values (${context.userId}, ${who.email}, ${who.name})
    `;
    return { ok: true as const };
  });

export const getOpsBoard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const shops = await sql<{
      id: number;
      name: string;
      city: string;
      owner_name: string | null;
      seeded: boolean;
      trial_ends_at: string | null;
      plan: string | null;
      sub_status: string | null;
      current_period_end: string | null;
      people: number;
      staff: number;
    }>`
      select s.id, s.name, s.city, s.owner_name, s.seeded, s.trial_ends_at,
             sub.plan, sub.status as sub_status, sub.current_period_end,
             coalesce((select count(*) from customers c where c.user_id = s.user_id), 0)::int as people,
             coalesce((select count(*) from shop_members m where m.shop_id = s.id and m.status = 'active'), 0)::int as staff
      from shops s
      left join subscriptions sub on sub.shop_id = s.id
      order by s.id desc
    `;
    const tickets = await sql<{
      id: number;
      shop_id: number;
      shop_name: string;
      subject: string;
      status: string;
      created_at: string;
      last_body: string | null;
    }>`
      select t.id, t.shop_id, s.name as shop_name, t.subject, t.status, t.created_at,
             (select m.body from support_messages m where m.ticket_id = t.id order by m.created_at desc limit 1) as last_body
      from support_tickets t
      join shops s on s.id = t.shop_id
      order by case when t.status = 'open' then 0 else 1 end, t.created_at desc
      limit 40
    `;
    return {
      shops: shops.map((s) => {
        const periodEnd = s.current_period_end ? new Date(s.current_period_end).getTime() : 0;
        const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
        let access: "active" | "trial" | "locked" = "locked";
        if (s.sub_status === "active" && periodEnd > Date.now()) access = "active";
        else if (trialEnd > Date.now()) access = "trial";
        return {
          id: s.id,
          name: s.name,
          city: s.city,
          ownerName: s.owner_name,
          seeded: s.seeded,
          plan: s.plan,
          access,
          periodEnd: s.current_period_end,
          trialEndsAt: s.trial_ends_at,
          people: s.people,
          staff: s.staff,
        };
      }),
      tickets: tickets.map((t) => ({
        id: t.id,
        shopId: t.shop_id,
        shopName: t.shop_name,
        subject: t.subject,
        status: t.status,
        createdAt: t.created_at,
        lastBody: t.last_body,
      })),
    };
  });

export const getOpsTicket = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    return loadTicket(sql, id, null);
  });

export const replyOpsTicket = createServerFn({ method: "POST" })
  .validator((input: { ticketId: number; body: string; close?: boolean }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await requireAdmin(sql, context.userId);
    const who = await userLabel(sql, context.userId);
    const body = data.body.trim();
    if (!body) throw new Error("Write a reply.");
    await sql`
      insert into support_messages (ticket_id, author_role, author_name, body)
      values (${data.ticketId}, ${"ops"}, ${who.name}, ${body})
    `;
    if (data.close) {
      await sql`update support_tickets set status = ${"closed"} where id = ${data.ticketId}`;
    } else {
      await sql`update support_tickets set status = ${"open"} where id = ${data.ticketId}`;
    }
    return { ok: true as const };
  });

export const listMyTickets = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const rows = await sql<{
      id: number;
      subject: string;
      status: string;
      created_at: string;
      last_body: string | null;
    }>`
      select t.id, t.subject, t.status, t.created_at,
             (select m.body from support_messages m where m.ticket_id = t.id order by m.created_at desc limit 1) as last_body
      from support_tickets t
      where t.shop_id = ${shop.shopId}
      order by t.created_at desc
    `;
    return rows.map((t) => ({
      id: t.id,
      subject: t.subject,
      status: t.status,
      createdAt: t.created_at,
      lastBody: t.last_body,
    }));
  });

export const createTicket = createServerFn({ method: "POST" })
  .validator((input: { subject: string; body: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const subject = data.subject.trim();
    const body = data.body.trim();
    if (subject.length < 3) throw new Error("What is this about?");
    if (body.length < 5) throw new Error("Write a little more so we can help.");
    const who = await userLabel(sql, context.userId);
    const ticket = await sql<{ id: number }>`
      insert into support_tickets (shop_id, user_id, subject, body, status)
      values (${shop.shopId}, ${context.userId}, ${subject}, ${body}, ${"open"})
      returning id
    `;
    await sql`
      insert into support_messages (ticket_id, author_role, author_name, body)
      values (${ticket[0].id}, ${"shop"}, ${who.name}, ${body})
    `;
    return { ticketId: ticket[0].id };
  });

export const getMyTicket = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(async ({ context, data: id }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    return loadTicket(sql, id, shop.shopId);
  });

export const replyMyTicket = createServerFn({ method: "POST" })
  .validator((input: { ticketId: number; body: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const shop = await resolveShop(sql, context.userId);
    const ticket = await sql<{ id: number }>`
      select id from support_tickets where id = ${data.ticketId} and shop_id = ${shop.shopId} limit 1
    `;
    if (!ticket[0]) throw new Error("Ticket not found.");
    const body = data.body.trim();
    if (!body) throw new Error("Write a reply.");
    const who = await userLabel(sql, context.userId);
    await sql`
      insert into support_messages (ticket_id, author_role, author_name, body)
      values (${data.ticketId}, ${"shop"}, ${who.name}, ${body})
    `;
    await sql`update support_tickets set status = ${"open"} where id = ${data.ticketId}`;
    return { ok: true as const };
  });

async function loadTicket(
  sql: Awaited<ReturnType<typeof getSql>>,
  id: number,
  shopId: number | null,
) {
  const tickets = shopId
    ? await sql<{
        id: number;
        shop_id: number;
        shop_name: string;
        subject: string;
        status: string;
        created_at: string;
      }>`
        select t.id, t.shop_id, s.name as shop_name, t.subject, t.status, t.created_at
        from support_tickets t
        join shops s on s.id = t.shop_id
        where t.id = ${id} and t.shop_id = ${shopId}
        limit 1
      `
    : await sql<{
        id: number;
        shop_id: number;
        shop_name: string;
        subject: string;
        status: string;
        created_at: string;
      }>`
        select t.id, t.shop_id, s.name as shop_name, t.subject, t.status, t.created_at
        from support_tickets t
        join shops s on s.id = t.shop_id
        where t.id = ${id}
        limit 1
      `;
  if (!tickets[0]) throw new Error("Ticket not found.");
  const messages = await sql<{
    id: number;
    author_role: string;
    author_name: string | null;
    body: string;
    created_at: string;
  }>`
    select id, author_role, author_name, body, created_at
    from support_messages
    where ticket_id = ${id}
    order by created_at asc
  `;
  return {
    id: tickets[0].id,
    shopId: tickets[0].shop_id,
    shopName: tickets[0].shop_name,
    subject: tickets[0].subject,
    status: tickets[0].status,
    createdAt: tickets[0].created_at,
    messages: messages.map((m) => ({
      id: m.id,
      role: m.author_role,
      name: m.author_name,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}
