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

const DEMO: SeedCustomer[] = [
  {
    name: "Amina Wanjiku",
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
    name: "Brian Otieno",
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
  {
    name: "Faith Chebet",
    phone: "0701122334",
    source: "walk-in",
    notes: "Regular. Loves earth tones. 8 stamps — 2 away from a free wrap.",
    language: "en",
    tags: "vip,regular",
    stamps: 8,
    points: 18200,
    lastPurchaseHoursAgo: 240,
    lastContactHoursAgo: 240,
    sales: [
      { item: "Terracotta wrap dress", amount: 3800, hoursAgo: 240 },
      { item: "Beaded earrings", amount: 1200, hoursAgo: 720 },
    ],
    messages: [
      {
        direction: "in",
        body: "Asante for the dress last month, I wore it to a wedding 😍",
        hoursAgo: 200,
      },
      {
        direction: "out",
        body: "Faith you looked stunning. New earth-tone wraps landed this week — want first look?",
        hoursAgo: 199,
      },
    ],
    followUps: [
      {
        kind: "loyalty",
        dueHoursFromNow: 0,
        reason: "8 of 10 stamps. Two visits from a free wrap.",
        draft:
          "Hi Faith — you're 2 stamps from a free wrap. New earth-tone prints arrived. Want me to put two aside for you to try?",
      },
    ],
  },
  {
    name: "Joseph Kamau",
    phone: "0733567890",
    source: "walk-in",
    notes: "Looked at the brown leather satchel (6,500). Said payday Friday.",
    language: "en",
    tags: "bags",
    stamps: 0,
    points: 0,
    lastPurchaseHoursAgo: null,
    lastContactHoursAgo: 30,
    sales: [],
    messages: [
      {
        direction: "in",
        body: "Hi, I came in yesterday — the brown satchel. Still thinking. Is it still there?",
        hoursAgo: 30,
      },
      {
        direction: "out",
        body: "Hi Joseph — yes it's here. I can hold it till Friday if that helps.",
        hoursAgo: 29,
      },
      {
        direction: "in",
        body: "Hold it. Payday Friday, I'll confirm.",
        hoursAgo: 28,
      },
    ],
    followUps: [
      {
        kind: "payday",
        dueHoursFromNow: 1,
        reason: "Said he would confirm on payday Friday.",
        draft:
          "Hi Joseph — checking in as promised. The brown satchel is still on hold. Want me to keep it through the weekend?",
      },
    ],
  },
  {
    name: "Mercy Achieng",
    phone: "0744111222",
    source: "whatsapp",
    notes: "Bought ankara co-ord. Feedback not yet asked.",
    language: "en",
    tags: "new",
    stamps: 1,
    points: 3200,
    lastPurchaseHoursAgo: 28,
    lastContactHoursAgo: 26,
    sales: [{ item: "Ankara co-ord set", amount: 3200, hoursAgo: 28 }],
    messages: [
      {
        direction: "in",
        body: "Can I get the ankara co-ord in the story, size 12?",
        hoursAgo: 30,
      },
      {
        direction: "out",
        body: "Yes Mercy — 3,200. Send to till and I'll pack it.",
        hoursAgo: 29,
      },
      {
        direction: "in",
        body: "Sent. I'll pick at 5.",
        hoursAgo: 28,
      },
      {
        direction: "out",
        body: "Received, asante. See you at 5.",
        hoursAgo: 27.5,
      },
    ],
    followUps: [
      {
        kind: "feedback",
        dueHoursFromNow: -4,
        reason: "Bought yesterday. Ask how the fit was.",
        draft:
          "Hi Mercy — how did the co-ord fit? If you need a different size we can swap this week.",
      },
    ],
  },
  {
    name: "Hassan Ali",
    phone: "0718887766",
    source: "facebook",
    notes: "Last bought a kofia and kanzu for Eid. Quiet for 3 weeks.",
    language: "en",
    tags: "mens",
    stamps: 3,
    points: 7600,
    lastPurchaseHoursAgo: 504,
    lastContactHoursAgo: 480,
    sales: [{ item: "Kanzu + kofia set", amount: 5200, hoursAgo: 504 }],
    messages: [
      {
        direction: "in",
        body: "Asante, the kanzu was perfect.",
        hoursAgo: 480,
      },
      {
        direction: "out",
        body: "Karibu Hassan. We'll have new linen shirts next month.",
        hoursAgo: 479,
      },
    ],
    followUps: [
      {
        kind: "winback",
        dueHoursFromNow: -2,
        reason: "No visit in 3 weeks. New linen drop.",
        draft:
          "Hi Hassan — new linen shirts landed, including the sand colour you liked. Want a photo of the L?",
      },
    ],
  },
  {
    name: "Njeri Mwangi",
    phone: "0722001100",
    source: "whatsapp",
    notes: "Asked about size 42 in the rust palazzo. This morning.",
    language: "en",
    tags: "new",
    stamps: 0,
    points: 0,
    lastPurchaseHoursAgo: null,
    lastContactHoursAgo: 2,
    sales: [],
    messages: [
      {
        direction: "in",
        body: "Hi, rust palazzo trousers — do you have 42? And can they be shortened?",
        hoursAgo: 2,
      },
    ],
    followUps: [
      {
        kind: "enquiry",
        dueHoursFromNow: -1,
        reason: "Fresh enquiry this morning — reply now.",
        draft:
          "Hi Njeri — yes, 42 is in. We hem in 2 days, free if you buy. Want me to hold them?",
      },
    ],
  },
  {
    name: "David Kipchoge",
    phone: "0700777888",
    source: "walk-in",
    notes: "Bought leather loafers. Care follow-up.",
    language: "en",
    tags: "shoes",
    stamps: 2,
    points: 8900,
    lastPurchaseHoursAgo: 96,
    lastContactHoursAgo: 94,
    sales: [{ item: "Tan leather loafers", amount: 6500, hoursAgo: 96 }],
    messages: [
      {
        direction: "in",
        body: "The loafers are nice. Any cream you recommend?",
        hoursAgo: 94,
      },
      {
        direction: "out",
        body: "Use a neutral cream once a week. Don't soak them. Enjoy.",
        hoursAgo: 93,
      },
    ],
    followUps: [
      {
        kind: "post_purchase",
        dueHoursFromNow: 6,
        reason: "Four days after shoes — offer care cream.",
        draft:
          "Hi David — how are the loafers breaking in? We have a small leather cream at 450 if you want it packed.",
      },
    ],
  },
  {
    name: "Lucy Wambui",
    phone: "0799111222",
    source: "instagram",
    notes: "Delivery ran late. Unhappy. Recover.",
    language: "en",
    tags: "at-risk",
    stamps: 2,
    points: 4100,
    lastPurchaseHoursAgo: 72,
    lastContactHoursAgo: 8,
    sales: [{ item: "Printed blouse", amount: 2200, hoursAgo: 72 }],
    messages: [
      {
        direction: "in",
        body: "The blouse came a day late and I needed it for a meeting.",
        hoursAgo: 10,
      },
      {
        direction: "out",
        body: "Lucy I'm sorry — that's on us. I'll make it right.",
        hoursAgo: 8,
      },
    ],
    followUps: [
      {
        kind: "winback",
        dueHoursFromNow: 0,
        reason: "Delivery miss. Offer a recovery discount.",
        draft:
          "Lucy, again — sorry about the delay. I've put 500 off your next piece. Valid this month. Want me to send today's new blouses?",
      },
    ],
  },
  {
    name: "Samuel Omondi",
    phone: "0711002200",
    source: "referral",
    notes: "Referred by Faith. Bought a shirt. Good candidate for loyalty pitch.",
    language: "en",
    tags: "referral",
    stamps: 1,
    points: 2800,
    lastPurchaseHoursAgo: 120,
    lastContactHoursAgo: 118,
    sales: [{ item: "White linen shirt", amount: 2800, hoursAgo: 120 }],
    messages: [
      {
        direction: "in",
        body: "Faith Chebet sent me. You still have the white linen shirts?",
        hoursAgo: 122,
      },
      {
        direction: "out",
        body: "Karibu Samuel — yes, L and XL. 2,800.",
        hoursAgo: 121,
      },
      {
        direction: "in",
        body: "I'll take L. Sending now.",
        hoursAgo: 120,
      },
    ],
    followUps: [
      {
        kind: "loyalty",
        dueHoursFromNow: 8,
        reason: "First purchase via referral. Invite to stamp card.",
        draft:
          "Hi Samuel — asante for coming via Faith. You're on our stamp card now: 10 visits, one wrap or shirt on us. See you soon.",
      },
    ],
  },
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
    const inserted = await sql<{ id: number }>`
      insert into shops (user_id, name, owner_name, city, vertical, language, loyalty_type, stamp_goal, reward_label, seeded)
      values (${userId}, ${"Kitenge House"}, ${"Wanjiru"}, ${"Nairobi"}, ${"boutique"}, ${"en"}, ${"stamps"}, ${10}, ${"Free wrap"}, ${true})
      returning id
    `;
    shopId = inserted[0].id;
  }

  for (const c of DEMO) {
    const lastPurchase =
      c.lastPurchaseHoursAgo == null
        ? null
        : new Date(Date.now() - c.lastPurchaseHoursAgo * 3600_000).toISOString();
    const lastContact = new Date(
      Date.now() - c.lastContactHoursAgo * 3600_000,
    ).toISOString();

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
      const lastMsg = c.messages.reduce((a, b) =>
        a.hoursAgo < b.hoursAgo ? a : b,
      );
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
