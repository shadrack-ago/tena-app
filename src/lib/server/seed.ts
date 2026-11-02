import type { Sql } from "@/lib/db";

type SeedCustomer = {
  name: string;
  phone: string;
  source: string;
  notes: string;
  language: string;
  tags: string;
  stamps: number;
  points: number;
  lastPurchaseHoursAgo: number | null;
  lastContactHoursAgo: number;
  sales: { item: string; amount: number; hoursAgo: number }[];
  messages: { direction: "in" | "out"; body: string; hoursAgo: number }[];
  followUps: {
    kind: string;
    dueHoursFromNow: number;
    reason: string;
    draft?: string;
  }[];
};

/**
 * Sample customers every new shop starts with, clearly marked "(demo)" and
 * removable from Today. Kept to two: one open enquiry, one buyer on loyalty.
 */
const DEMO: SeedCustomer[] = [
  {
    name: "Amina Wanjiku (demo)",
    phone: "0712456789",
    source: "whatsapp",
    notes: "Bought the olive kitenge midi. Holding a matching wrap for Saturday afternoon.",
    language: "en",
    tags: "regular,kitenge",
    stamps: 4,
    points: 4500,
    lastPurchaseHoursAgo: 52,
    lastContactHoursAgo: 20,
    sales: [{ item: "Olive kitenge midi dress", amount: 4500, hoursAgo: 52 }],
    messages: [
      {
        direction: "in",
        body: "Hi, is the olive kitenge dress in the story still available? Size M.",
        hoursAgo: 54,
      },
      {
        direction: "out",
        body: "Hi Amina — yes, M is here. I can hold it at the shop on Ngong Road.",
        hoursAgo: 53.5,
      },
      {
        direction: "in",
        body: "I'll pass by after work. Can I M-Pesa first?",
        hoursAgo: 53,
      },
      {
        direction: "out",
        body: "Yes — 4500 to the till. I'll keep it aside. Karibu!",
        hoursAgo: 52.8,
      },
      {
        direction: "in",
        body: "The dress is beautiful! Do you have a matching headwrap?",
        hoursAgo: 22,
      },
      {
        direction: "out",
        body: "We do — same print, 800. I can hold one for Saturday?",
        hoursAgo: 21,
      },
      {
        direction: "in",
        body: "Hold it please, I'll pass by Saturday afternoon.",
        hoursAgo: 20,
      },
    ],
    followUps: [
      {
        kind: "hold",
        dueHoursFromNow: 2,
        reason: "Promised to hold the matching wrap for Saturday afternoon.",
        draft:
          "Hi Amina, your matching wrap is still on hold. We'll be here till 6. Want me to keep it at the till?",
      },
    ],
  },
  {
    name: "Brian Otieno (demo)",
    phone: "0723987123",
    source: "instagram",
    notes: "Saw linen shirts on IG. Asked for L in white. No reply yet.",
    language: "en",
    tags: "new,shirts",
    stamps: 0,
    points: 0,
    lastPurchaseHoursAgo: null,
    lastContactHoursAgo: 18,
    sales: [],
    messages: [
      {
        direction: "in",
        body: "Hi, nimeona those linen shirts on IG. Do you have L in white? How much?",
        hoursAgo: 18,
      },
    ],
    followUps: [
      {
        kind: "enquiry",
        dueHoursFromNow: -17,
        reason: "Instagram enquiry sitting unanswered for 18 hours.",
        draft:
          "Hi Brian — yes, white linen in L is in. 2,800. I can hold one till this evening if you want to pass by or M-Pesa.",
      },
    ],
  },
];

/**
 * Phone numbers of every sample customer Uzatena has ever seeded (older shops
 * got ten). Used to find and remove demo data.
 */
export const DEMO_PHONES = [
  "0712456789",
  "0723987123",
  "0701122334",
  "0733567890",
  "0744111222",
  "0718887766",
  "0722001100",
  "0700777888",
  "0799111222",
  "0711002200",
];

export async function ensureShopAndDemo(sql: Sql, userId: string) {
  const existing = await sql<{ id: number; seeded: boolean }>`
    select id, seeded from shops where user_id = ${userId} limit 1
  `;
  if (existing[0]?.seeded) return existing[0].id;

  let shopId: number;
  if (existing[0]) {
    shopId = existing[0].id;
  } else {
    // The owner's own name, not a sample boutique's: the demo is only customers.
    const owner = await sql<{ name: string | null }>`
      select name from "user" where id = ${userId} limit 1
    `;
    const ownerName = owner[0]?.name?.trim() || null;
    const inserted = await sql<{ id: number }>`
      insert into shops (user_id, name, owner_name, city, vertical, language, loyalty_type, stamp_goal, reward_label, seeded)
      values (${userId}, ${ownerName ? `${ownerName.split(" ")[0]}'s shop` : "My shop"}, ${ownerName}, ${"Nairobi"}, ${"boutique"}, ${"en"}, ${"stamps"}, ${10}, ${"Free gift"}, ${true})
      returning id
    `;
    shopId = inserted[0].id;
  }

  for (const c of DEMO) {
    const lastPurchase =
      c.lastPurchaseHoursAgo == null
        ? null
        : new Date(Date.now() - c.lastPurchaseHoursAgo * 3600_000).toISOString();
    const lastContact = new Date(Date.now() - c.lastContactHoursAgo * 3600_000).toISOString();

    const cust = await sql<{ id: number }>`
      insert into customers (
        user_id, name, phone, source, notes, language, tags,
        loyalty_points, stamp_count, opted_in, last_purchase_at, last_contact_at
      ) values (
        ${userId}, ${c.name}, ${c.phone}, ${c.source}, ${c.notes}, ${c.language}, ${c.tags},
        ${c.points}, ${c.stamps}, ${true}, ${lastPurchase}, ${lastContact}
      ) returning id
    `;
    const customerId = cust[0].id;

    for (const s of c.sales) {
      const soldAt = new Date(Date.now() - s.hoursAgo * 3600_000).toISOString();
      await sql`
        insert into sales (user_id, customer_id, item, amount_kes, sold_at)
        values (${userId}, ${customerId}, ${s.item}, ${s.amount}, ${soldAt})
      `;
    }

    let conversationId: number | null = null;
    if (c.messages.length > 0) {
      const lastMsg = c.messages.reduce((a, b) => (a.hoursAgo < b.hoursAgo ? a : b));
      const lastAt = new Date(Date.now() - lastMsg.hoursAgo * 3600_000).toISOString();
      const conv = await sql<{ id: number }>`
        insert into conversations (user_id, customer_id, channel, status, last_message_at)
        values (${userId}, ${customerId}, ${"whatsapp"}, ${c.followUps.some((f) => f.kind === "enquiry") ? "open" : "waiting"}, ${lastAt})
        returning id
      `;
      conversationId = conv[0].id;
      for (const m of c.messages) {
        const sentAt = new Date(Date.now() - m.hoursAgo * 3600_000).toISOString();
        await sql`
          insert into messages (user_id, conversation_id, customer_id, direction, body, sent_at)
          values (${userId}, ${conversationId}, ${customerId}, ${m.direction}, ${m.body}, ${sentAt})
        `;
      }
    }

    for (const f of c.followUps) {
      const dueAt = new Date(Date.now() + f.dueHoursFromNow * 3600_000).toISOString();
      await sql`
        insert into follow_ups (
          user_id, customer_id, conversation_id, kind, due_at, status, draft_text, reason
        ) values (
          ${userId}, ${customerId}, ${conversationId}, ${f.kind}, ${dueAt}, ${"due"}, ${f.draft ?? null}, ${f.reason}
        )
      `;
    }
  }

  await sql`update shops set seeded = true where id = ${shopId}`;
  return shopId;
}
