import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const getJoinShop = createServerFn({ method: "GET" })
  .validator((code: string) => code)
  .handler(async ({ data: raw }) => {
    const sql = await getSql();
    const code = raw.trim().toUpperCase();
    const rows = await sql<{
      name: string;
      city: string;
      owner_name: string | null;
    }>`
      select name, city, owner_name from shops where join_code = ${code} limit 1
    `;
    if (!rows[0]) return null;
    return {
      shopName: rows[0].name,
      city: rows[0].city,
      ownerName: rows[0].owner_name,
    };
  });

export const submitJoinForm = createServerFn({ method: "POST" })
  .validator(
    (input: { code: string; name: string; phone: string; item: string }) => input,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    const code = data.code.trim().toUpperCase();
    const name = data.name.trim();
    const phone = data.phone.trim();
    const item = data.item.trim();
    if (name.length < 2) throw new Error("Enter your name.");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) throw new Error("Enter a valid Kenyan number.");
    if (item.length < 2) throw new Error("What did you want?");

    const shop = await sql<{ id: number; user_id: string; name: string }>`
      select id, user_id, name from shops where join_code = ${code} limit 1
    `;
    if (!shop[0]) throw new Error("This shop code is not valid.");
    const uid = shop[0].user_id;
    const now = new Date().toISOString();
    const notes = `Asked about: ${item}`;
    const draft = `Hi ${name.split(" ")[0]} — you asked about ${item} at ${shop[0].name}. It's here if you still want it.`;

    const existing = await sql<{ id: number }>`
      select id from customers
      where user_id = ${uid}
        and regexp_replace(phone, '\\D', '', 'g') = ${digits}
      limit 1
    `;

    let customerId: number;
    if (existing[0]) {
      customerId = existing[0].id;
      await sql`
        update customers
        set notes = ${notes}, last_contact_at = ${now}, source = ${"qr"}
        where id = ${customerId} and user_id = ${uid}
      `;
    } else {
      const inserted = await sql<{ id: number }>`
        insert into customers (
          user_id, name, phone, source, notes, language, tags, opted_in, last_contact_at
        ) values (
          ${uid}, ${name}, ${phone}, ${"qr"}, ${notes}, ${"en"}, ${""}, ${true}, ${now}
        ) returning id
      `;
      customerId = inserted[0].id;
    }

    const conv = await sql<{ id: number }>`
      insert into conversations (user_id, customer_id, channel, status, last_message_at)
      values (${uid}, ${customerId}, ${"whatsapp"}, ${"open"}, ${now})
      returning id
    `;
    await sql`
      insert into follow_ups (
        user_id, customer_id, conversation_id, kind, due_at, status, draft_text, reason
      ) values (
        ${uid}, ${customerId}, ${conv[0].id}, ${"enquiry"}, ${now}, ${"due"},
        ${draft}, ${"Walk-in scanned the counter QR."}
      )
    `;
    return { shopName: shop[0].name, item };
  });
