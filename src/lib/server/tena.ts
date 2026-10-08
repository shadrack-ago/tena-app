import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { uidOf } from "./shop";
import { dueHoursFor } from "@/lib/utils";
import { draftFollowUpMessage, parseCaptureNote, writeCoachBrief } from "./ai";
import type { Conversation, Customer, Dashboard, FollowUp, Message, Sale, Shop } from "@/lib/types";

function mapShop(row: {
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

export const bootstrapShop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await uidOf(sql, context.userId);
    return { ok: true as const };
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Dashboard> => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);

    const shops = await sql<{
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
    }>`select * from shops where user_id = ${uid} limit 1`;
    const shop = mapShop(shops[0]);

    const dueFollowUps = await sql<FollowUpRow>`
      select f.id, f.customer_id, c.name as customer_name, c.phone as customer_phone,
             f.conversation_id, f.kind, f.due_at, f.status, f.draft_text, f.reason
      from follow_ups f
      join customers c on c.id = f.customer_id
      where f.user_id = ${uid} and f.status = 'due'
      order by f.due_at asc
      limit 20
    `;

    const loyaltyReady = await sql<CustRow>`
      select cu.*, 
        coalesce((select sum(s.amount_kes) from sales s where s.customer_id = cu.id), 0)::int as total_spent,
        coalesce((select count(*) from sales s where s.customer_id = cu.id), 0)::int as sale_count
      from customers cu
      where cu.user_id = ${uid}
        and (
          (select stamp_goal from shops where user_id = ${uid} limit 1) - cu.stamp_count <= 3
          and cu.stamp_count > 0
        )
      order by cu.stamp_count desc
      limit 8
    `;

    const people = await sql<{ n: number }>`
      select count(*)::int as n from customers where user_id = ${uid}
    `;
    const dueToday = await sql<{ n: number }>`
      select count(*)::int as n from follow_ups
      where user_id = ${uid} and status = 'due' and due_at <= now() + interval '18 hours'
    `;
    const openEnquiries = await sql<{ n: number }>`
      select count(*)::int as n from follow_ups
      where user_id = ${uid} and status = 'due' and kind = 'enquiry'
    `;
    const weekSales = await sql<{ kes: number; n: number }>`
      select coalesce(sum(amount_kes), 0)::int as kes, count(*)::int as n
      from sales
      where user_id = ${uid} and sold_at >= now() - interval '7 days'
    `;

    return {
      shop,
      dueFollowUps: dueFollowUps.map(mapFollowUp),
      loyaltyReady: loyaltyReady.map(mapCustomer),
      stats: {
        people: people[0]?.n ?? 0,
        dueToday: dueToday[0]?.n ?? 0,
        openEnquiries: openEnquiries[0]?.n ?? 0,
        salesThisWeekKes: weekSales[0]?.kes ?? 0,
        salesThisWeekCount: weekSales[0]?.n ?? 0,
      },
    };
  });

type FollowUpRow = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  conversation_id: number | null;
  kind: string;
  due_at: string;
  status: string;
  draft_text: string | null;
  reason: string | null;
};

function mapFollowUp(r: FollowUpRow): FollowUp {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    conversationId: r.conversation_id,
    kind: r.kind,
    dueAt: r.due_at,
    status: r.status,
    draftText: r.draft_text,
    reason: r.reason,
  };
}

type ConvRow = {
  id: number;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  channel: string;
  status: string;
  last_message_at: string;
  last_body: string | null;
  last_direction: string | null;
};

function mapConv(r: ConvRow): Conversation {
  return {
    id: r.id,
    customerId: r.customer_id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    channel: r.channel,
    status: r.status,
    lastMessageAt: r.last_message_at,
    lastBody: r.last_body,
    lastDirection: r.last_direction,
    unread: r.last_direction === "in",
  };
}

type CustRow = {
  id: number;
  name: string;
  phone: string;
  source: string;
  notes: string | null;
  language: string;
  tags: string;
  loyalty_points: number;
  stamp_count: number;
  opted_in: boolean;
  last_purchase_at: string | null;
  last_contact_at: string | null;
  created_at: string;
  total_spent: number;
  sale_count: number;
};

function mapCustomer(r: CustRow): Customer {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    source: r.source,
    notes: r.notes,
    language: r.language,
    tags: r.tags,
    loyaltyPoints: r.loyalty_points,
    stampCount: r.stamp_count,
    optedIn: r.opted_in,
    lastPurchaseAt: r.last_purchase_at,
    lastContactAt: r.last_contact_at,
    createdAt: r.created_at,
    totalSpent: Number(r.total_spent) || 0,
    saleCount: Number(r.sale_count) || 0,
  };
}

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Customer[]> => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const rows = await sql<CustRow>`
      select cu.*,
        coalesce((select sum(s.amount_kes) from sales s where s.customer_id = cu.id), 0)::int as total_spent,
        coalesce((select count(*) from sales s where s.customer_id = cu.id), 0)::int as sale_count
      from customers cu
      where cu.user_id = ${uid}
      order by cu.last_contact_at desc nulls last, cu.created_at desc
    `;
    return rows.map(mapCustomer);
  });

export const getCustomer = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data: id,
    }): Promise<{
      customer: Customer;
      sales: Sale[];
      followUps: FollowUp[];
      conversationId: number | null;
    } | null> => {
      const sql = await getSql();
      const uid = await uidOf(sql, context.userId);
      const rows = await sql<CustRow>`
      select cu.*,
        coalesce((select sum(s.amount_kes) from sales s where s.customer_id = cu.id), 0)::int as total_spent,
        coalesce((select count(*) from sales s where s.customer_id = cu.id), 0)::int as sale_count
      from customers cu
      where cu.user_id = ${uid} and cu.id = ${id}
      limit 1
    `;
      if (!rows[0]) return null;
      const sales = await sql<{
        id: number;
        customer_id: number;
        item: string;
        amount_kes: number;
        sold_at: string;
      }>`
      select id, customer_id, item, amount_kes, sold_at
      from sales where user_id = ${uid} and customer_id = ${id}
      order by sold_at desc
    `;
      const followUps = await sql<FollowUpRow>`
      select f.id, f.customer_id, c.name as customer_name, c.phone as customer_phone,
             f.conversation_id, f.kind, f.due_at, f.status, f.draft_text, f.reason
      from follow_ups f
      join customers c on c.id = f.customer_id
      where f.user_id = ${uid} and f.customer_id = ${id}
      order by f.due_at desc
    `;
      const conv = await sql<{ id: number }>`
      select id from conversations
      where user_id = ${uid} and customer_id = ${id}
      order by last_message_at desc limit 1
    `;
      return {
        customer: mapCustomer(rows[0]),
        sales: sales.map((s) => ({
          id: s.id,
          customerId: s.customer_id,
          item: s.item,
          amountKes: s.amount_kes,
          soldAt: s.sold_at,
        })),
        followUps: followUps.map(mapFollowUp),
        conversationId: conv[0]?.id ?? null,
      };
    },
  );

export const listConversations = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<Conversation[]> => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const rows = await sql<ConvRow>`
      select conv.id, conv.customer_id, cu.name as customer_name, cu.phone as customer_phone,
             conv.channel, conv.status, conv.last_message_at,
             (select m.body from messages m where m.conversation_id = conv.id order by m.sent_at desc limit 1) as last_body,
             (select m.direction from messages m where m.conversation_id = conv.id order by m.sent_at desc limit 1) as last_direction
      from conversations conv
      join customers cu on cu.id = conv.customer_id
      where conv.user_id = ${uid}
      order by conv.last_message_at desc
    `;
    return rows.map(mapConv);
  });

export const getThread = createServerFn({ method: "GET" })
  .validator((id: number) => id)
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data: id,
    }): Promise<{
      conversation: Conversation;
      messages: Message[];
      due: FollowUp | null;
    } | null> => {
      const sql = await getSql();
      const uid = await uidOf(sql, context.userId);
      const rows = await sql<ConvRow>`
      select conv.id, conv.customer_id, cu.name as customer_name, cu.phone as customer_phone,
             conv.channel, conv.status, conv.last_message_at,
             (select m.body from messages m where m.conversation_id = conv.id order by m.sent_at desc limit 1) as last_body,
             (select m.direction from messages m where m.conversation_id = conv.id order by m.sent_at desc limit 1) as last_direction
      from conversations conv
      join customers cu on cu.id = conv.customer_id
      where conv.user_id = ${uid} and conv.id = ${id}
      limit 1
    `;
      if (!rows[0]) return null;
      const messages = await sql<{
        id: number;
        conversation_id: number;
        customer_id: number;
        direction: string;
        body: string;
        is_ai_draft: boolean;
        sent_at: string;
      }>`
      select id, conversation_id, customer_id, direction, body, is_ai_draft, sent_at
      from messages
      where user_id = ${uid} and conversation_id = ${id}
      order by sent_at asc
    `;
      const due = await sql<FollowUpRow>`
      select f.id, f.customer_id, c.name as customer_name, c.phone as customer_phone,
             f.conversation_id, f.kind, f.due_at, f.status, f.draft_text, f.reason
      from follow_ups f
      join customers c on c.id = f.customer_id
      where f.user_id = ${uid} and f.conversation_id = ${id} and f.status = 'due'
      order by f.due_at asc
      limit 1
    `;
      return {
        conversation: mapConv(rows[0]),
        messages: messages.map((m) => ({
          id: m.id,
          conversationId: m.conversation_id,
          customerId: m.customer_id,
          direction: m.direction === "out" ? "out" : "in",
          body: m.body,
          isAiDraft: m.is_ai_draft,
          sentAt: m.sent_at,
        })),
        due: due[0] ? mapFollowUp(due[0]) : null,
      };
    },
  );

export const sendMessage = createServerFn({ method: "POST" })
  .validator((input: { conversationId: number; body: string; followUpId?: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const conv = await sql<{ id: number; customer_id: number }>`
      select id, customer_id from conversations
      where id = ${data.conversationId} and user_id = ${uid}
      limit 1
    `;
    if (!conv[0]) throw new Error("Conversation not found");
    const body = data.body.trim();
    if (!body) throw new Error("Message is empty");
    const now = new Date().toISOString();
    await sql`
      insert into messages (user_id, conversation_id, customer_id, direction, body, sent_at)
      values (${uid}, ${data.conversationId}, ${conv[0].customer_id}, ${"out"}, ${body}, ${now})
    `;
    await sql`
      update conversations set last_message_at = ${now}, status = 'waiting'
      where id = ${data.conversationId} and user_id = ${uid}
    `;
    await sql`
      update customers set last_contact_at = ${now}
      where id = ${conv[0].customer_id} and user_id = ${uid}
    `;
    if (data.followUpId) {
      await sql`
        update follow_ups set status = 'sent'
        where id = ${data.followUpId} and user_id = ${uid}
      `;
    }
    return { ok: true as const };
  });

export const draftForFollowUp = createServerFn({ method: "POST" })
  .validator((followUpId: number) => followUpId)
  .middleware([authMiddleware])
  .handler(async ({ context, data: followUpId }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const rows = await sql<{
      id: number;
      customer_id: number;
      conversation_id: number | null;
      kind: string;
      reason: string | null;
      name: string;
      source: string;
      notes: string | null;
      language: string;
      shop_name: string;
      city: string;
      shop_language: string;
    }>`
      select f.id, f.customer_id, f.conversation_id, f.kind, f.reason,
             c.name, c.source, c.notes, c.language,
             s.name as shop_name, s.city, s.language as shop_language
      from follow_ups f
      join customers c on c.id = f.customer_id
      join shops s on s.user_id = f.user_id
      where f.id = ${followUpId} and f.user_id = ${uid}
      limit 1
    `;
    if (!rows[0]) throw new Error("Follow-up not found");
    const r = rows[0];
    const msgs = r.conversation_id
      ? await sql<{ direction: string; body: string }>`
          select direction, body from messages
          where conversation_id = ${r.conversation_id} and user_id = ${uid}
          order by sent_at desc
          limit 8
        `
      : [];
    const drafted = await draftFollowUpMessage({
      shopName: r.shop_name,
      city: r.city,
      language: r.language || r.shop_language,
      customerName: r.name,
      source: r.source,
      notes: r.notes,
      kind: r.kind,
      reason: r.reason,
      recentMessages: msgs.reverse(),
    });
    await sql`
      update follow_ups set draft_text = ${drafted.text}
      where id = ${followUpId} and user_id = ${uid}
    `;
    return drafted;
  });

export const skipFollowUp = createServerFn({ method: "POST" })
  .validator((input: { id: number; snoozeHours?: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    if (data.snoozeHours) {
      const due = new Date(Date.now() + data.snoozeHours * 3600_000).toISOString();
      await sql`
        update follow_ups set due_at = ${due}, status = 'due'
        where id = ${data.id} and user_id = ${uid}
      `;
    } else {
      await sql`
        update follow_ups set status = 'skipped'
        where id = ${data.id} and user_id = ${uid}
      `;
    }
    return { ok: true as const };
  });

export const sendFollowUp = createServerFn({ method: "POST" })
  .validator((input: { id: number; body: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const rows = await sql<{
      id: number;
      customer_id: number;
      conversation_id: number | null;
    }>`
      select id, customer_id, conversation_id from follow_ups
      where id = ${data.id} and user_id = ${uid}
      limit 1
    `;
    if (!rows[0]) throw new Error("Follow-up not found");
    let conversationId = rows[0].conversation_id;
    const now = new Date().toISOString();
    const body = data.body.trim();
    if (!body) throw new Error("Message is empty");

    if (!conversationId) {
      const created = await sql<{ id: number }>`
        insert into conversations (user_id, customer_id, channel, status, last_message_at)
        values (${uid}, ${rows[0].customer_id}, ${"whatsapp"}, ${"waiting"}, ${now})
        returning id
      `;
      conversationId = created[0].id;
    }

    await sql`
      insert into messages (user_id, conversation_id, customer_id, direction, body, is_ai_draft, sent_at)
      values (${uid}, ${conversationId}, ${rows[0].customer_id}, ${"out"}, ${body}, ${true}, ${now})
    `;
    await sql`
      update conversations set last_message_at = ${now}, status = 'waiting'
      where id = ${conversationId} and user_id = ${uid}
    `;
    await sql`
      update customers set last_contact_at = ${now}
      where id = ${rows[0].customer_id} and user_id = ${uid}
    `;
    await sql`
      update follow_ups set status = 'sent', draft_text = ${body}, conversation_id = ${conversationId}
      where id = ${data.id} and user_id = ${uid}
    `;
    return { ok: true as const, conversationId };
  });

export const captureCustomer = createServerFn({ method: "POST" })
  .validator((input: { note: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const shops = await sql<{ name: string }>`
      select name from shops where user_id = ${uid} limit 1
    `;
    const parsed = await parseCaptureNote(data.note, shops[0]?.name ?? "the shop");
    if (!parsed) throw new Error("Could not read that note");
    return parsed;
  });

export const saveCapturedCustomer = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      phone: string;
      source: string;
      notes: string;
      bought: boolean;
      item: string | null;
      amountKes: number | null;
      followUpKind: string;
      followUpReason: string;
      draft: string;
      dueHours: number;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const now = new Date().toISOString();
    const amount = data.bought && data.amountKes != null && data.amountKes > 0 ? data.amountKes : 0;
    const stamps = data.bought ? 1 : 0;
    const points = amount;
    const lastPurchase = data.bought ? now : null;
    const wanted = data.notes.trim();
    const cust = await sql<{ id: number }>`
      insert into customers (
        user_id, name, phone, source, notes, language, tags,
        loyalty_points, stamp_count, opted_in, last_purchase_at, last_contact_at
      ) values (
        ${uid}, ${data.name.trim()}, ${data.phone.trim()}, ${data.source},
        ${wanted || null}, ${"en"}, ${""}, ${points}, ${stamps}, ${true}, ${lastPurchase}, ${now}
      ) returning id
    `;
    const customerId = cust[0].id;
    if (amount > 0) {
      const label = (data.item ?? "").trim() || "Purchase";
      await sql`
        insert into sales (user_id, customer_id, item, amount_kes, sold_at)
        values (${uid}, ${customerId}, ${label}, ${amount}, ${now})
      `;
    }
    const conv = await sql<{ id: number }>`
      insert into conversations (user_id, customer_id, channel, status, last_message_at)
      values (${uid}, ${customerId}, ${"whatsapp"}, ${"open"}, ${now})
      returning id
    `;
    const hours = dueHoursFor(data.followUpKind, data.bought);
    const due = new Date(Date.now() + hours * 3600_000).toISOString();
    await sql`
      insert into follow_ups (
        user_id, customer_id, conversation_id, kind, due_at, status, draft_text, reason
      ) values (
        ${uid}, ${customerId}, ${conv[0].id}, ${data.followUpKind}, ${due}, ${"due"}, ${data.draft}, ${data.followUpReason}
      )
    `;
    return { customerId, conversationId: conv[0].id };
  });

export const recordSale = createServerFn({ method: "POST" })
  .validator((input: { customerId: number; item: string; amountKes: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const now = new Date().toISOString();
    const amount = Number(data.amountKes);
    if (!(amount > 0)) throw new Error("Enter the amount they paid.");
    const label = data.item.trim() || "Purchase";
    await sql`
      insert into sales (user_id, customer_id, item, amount_kes, sold_at)
      values (${uid}, ${data.customerId}, ${label}, ${amount}, ${now})
    `;
    const shops = await sql<{ stamp_goal: number; reward_label: string }>`
      select stamp_goal, reward_label from shops where user_id = ${uid} limit 1
    `;
    const goal = shops[0]?.stamp_goal ?? 10;
    const current = await sql<{ stamp_count: number; loyalty_points: number }>`
      select stamp_count, loyalty_points from customers
      where id = ${data.customerId} and user_id = ${uid}
    `;
    let stamps = (current[0]?.stamp_count ?? 0) + 1;
    let redeemed = false;
    if (stamps >= goal) {
      stamps = 0;
      redeemed = true;
    }
    await sql`
      update customers
      set stamp_count = ${stamps},
          loyalty_points = loyalty_points + ${amount},
          last_purchase_at = ${now},
          last_contact_at = ${now}
      where id = ${data.customerId} and user_id = ${uid}
    `;
    const due = new Date(Date.now() + 24 * 3600_000).toISOString();
    await sql`
      insert into follow_ups (
        user_id, customer_id, kind, due_at, status, reason, draft_text
      ) values (
        ${uid}, ${data.customerId}, ${"post_purchase"}, ${due}, ${"due"},
        ${"Thank them. Tell them when to come back."},
        ${null}
      )
    `;
    return { ok: true as const, redeemed, rewardLabel: shops[0]?.reward_label ?? "Reward" };
  });

export const listLoyalty = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const shops = await sql<{
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
    }>`select * from shops where user_id = ${uid} limit 1`;
    const customers = await sql<CustRow>`
      select cu.*,
        coalesce((select sum(s.amount_kes) from sales s where s.customer_id = cu.id), 0)::int as total_spent,
        coalesce((select count(*) from sales s where s.customer_id = cu.id), 0)::int as sale_count
      from customers cu
      where cu.user_id = ${uid} and cu.stamp_count > 0
      order by cu.stamp_count desc, cu.loyalty_points desc
    `;
    return { shop: mapShop(shops[0]), customers: customers.map(mapCustomer) };
  });

export const updateShop = createServerFn({ method: "POST" })
  .validator(
    (input: {
      name: string;
      city: string;
      vertical: string;
      language: string;
      loyaltyType: "stamps" | "points";
      stampGoal: number;
      rewardLabel: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    await sql`
      update shops set
        name = ${data.name.trim() || "My shop"},
        city = ${data.city.trim()},
        vertical = ${data.vertical},
        language = ${data.language},
        loyalty_type = ${data.loyaltyType},
        stamp_goal = ${Math.max(3, Math.min(20, data.stampGoal))},
        reward_label = ${data.rewardLabel.trim() || "Reward"}
      where user_id = ${uid}
    `;
    return { ok: true as const };
  });

export const getCoach = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const uid = await uidOf(sql, context.userId);
    const shop = await sql<{ name: string }>`
      select name from shops where user_id = ${uid} limit 1
    `;
    const due = await sql<{ n: number }>`
      select count(*)::int as n from follow_ups where user_id = ${uid} and status = 'due'
    `;
    const loyalty = await sql<{ n: number }>`
      select count(*)::int as n from customers
      where user_id = ${uid} and stamp_count >= 7
    `;
    const week = await sql<{ kes: number }>`
      select coalesce(sum(amount_kes), 0)::int as kes from sales
      where user_id = ${uid} and sold_at >= now() - interval '7 days'
    `;
    const names = await sql<{ name: string }>`
      select c.name from follow_ups f
      join customers c on c.id = f.customer_id
      where f.user_id = ${uid} and f.status = 'due'
      order by f.due_at asc
      limit 5
    `;
    const brief = await writeCoachBrief({
      shopName: shop[0]?.name ?? "Your shop",
      dueCount: due[0]?.n ?? 0,
      loyaltyReady: loyalty[0]?.n ?? 0,
      weekSalesKes: week[0]?.kes ?? 0,
      namesDue: names.map((n) => n.name),
    });
    return { brief };
  });
