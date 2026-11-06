import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { extractKenyanPhone, wantedFromNote } from "@/lib/utils";

/**
 * Claude powers drafts, capture-note reading and the coach (server-only).
 * Without ANTHROPIC_API_KEY every feature falls back to built-in templates.
 * Short, everyday tasks, so effort is "low"; refusals fall back server-side.
 */
const MODEL = "claude-opus-5-5";
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

let client: Anthropic | null = null;
function claude(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) return null;
  client ??= new Anthropic();
  return client;
}

function logAiError(feature: string, err: unknown) {
  if (err instanceof Anthropic.AuthenticationError) {
    console.error(`[ai] ${feature}: ANTHROPIC_API_KEY was rejected`);
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error(`[ai] ${feature}: rate limited, using template`);
  } else if (err instanceof Anthropic.APIError) {
    console.error(`[ai] ${feature}: API error ${err.status}: ${err.message}`);
  } else {
    console.error(`[ai] ${feature}:`, err);
  }
}

/** One short text answer from Claude, or null (no key, refusal, error). */
async function askClaude(feature: string, prompt: string): Promise<string | null> {
  const c = claude();
  if (!c) return null;
  try {
    const response = await c.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: "low" },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal") return null;
    const text = response.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return text || null;
  } catch (err) {
    logAiError(feature, err);
    return null;
  }
}

type DraftInput = {
  shopName: string;
  city: string;
  language: string;
  customerName: string;
  source: string;
  notes: string | null;
  kind: string;
  reason: string | null;
  recentMessages: { direction: string; body: string }[];
};

function fallbackDraft(input: DraftInput) {
  const first = input.customerName.split(" ")[0];
  switch (input.kind) {
    case "enquiry":
      return `Hi ${first} — just seeing your message. The piece is still here. Want me to hold it, or would you rather pass by ${input.shopName}?`;
    case "hold":
      return `Hi ${first}, your piece is still on hold at ${input.shopName}. We'll keep it at the till — want me to set it aside till evening?`;
    case "payday":
      return `Hi ${first} — checking in as we said. The item is still here. I can hold it through the weekend if that helps.`;
    case "loyalty":
      return `Hi ${first} — you're close to a reward on your stamp card at ${input.shopName}. Want me to put a couple of new pieces aside for you to try?`;
    case "feedback":
      return `Hi ${first} — how did it work out? If anything's off we can sort it this week.`;
    case "winback":
      return `Hi ${first} — it's been a little while. New pieces just landed at ${input.shopName}. Want a quick photo of what you'd like?`;
    case "post_purchase":
      return `Hi ${first} — hope you're enjoying it. Anything you need — size, care, a match — just say.`;
    default:
      return `Hi ${first} — just following up from ${input.shopName}. Still happy to help whenever you're ready.`;
  }
}

export async function draftFollowUpMessage(input: DraftInput): Promise<{
  text: string;
  source: "ai" | "template";
}> {
  const lang =
    input.language === "sw"
      ? "Write in simple Kiswahili, warm and direct."
      : "Write in Kenyan English — warm, short, natural. Light Sheng is fine if the customer used it. No American sales-speak.";

  const history = input.recentMessages
    .slice(-8)
    .map((m) => `${m.direction === "in" ? "Customer" : "Shop"}: ${m.body}`)
    .join("\n");

  const prompt = `You write WhatsApp follow-ups for a Kenyan retail shop.

Shop: ${input.shopName} in ${input.city}
Customer: ${input.customerName} (source: ${input.source})
Notes: ${input.notes || "none"}
Follow-up type: ${input.kind}
Why now: ${input.reason || "due follow-up"}

Recent chat:
${history || "(no chat yet — this may be a walk-in)"}

Rules:
- One WhatsApp message, 1–3 short sentences.
- ${lang}
- No emojis. No hashtags. No "I hope this message finds you well."
- Do not invent prices, sizes, or stock the chat does not mention — if unknown, offer to hold or send a photo.
- Sound like a shop owner, not a call centre.
- End with a clear, easy next step (hold, pass by, M-Pesa, photo).
- Return ONLY the message text.`;

  const text = await askClaude("draft", prompt);
  if (!text) return { text: fallbackDraft(input), source: "template" };
  return { text: text.replace(/^["']|["']$/g, ""), source: "ai" };
}

export async function parseCaptureNote(
  note: string,
  shopName: string,
): Promise<{
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
} | null> {
  const fallback = heuristicParse(note, shopName);
  const c = claude();
  if (!c) return fallback;

  const prompt = `Extract the customer from this note a Kenyan shopkeeper typed after talking to someone.

Rules:
- notes: ONLY what they wanted (piece, size, colour). If the note is just a name and phone, notes is "". Never copy the name or phone into notes.
- bought: true ONLY if they actually paid, sent M-Pesa, or took the item home. Looking, asking the price, "I'll think", "hold it", payday, "maybe Saturday" all mean false.
- item: ONLY if bought is true AND a product was named, otherwise null. Never put a name or phone here.
- amountKes: ONLY money they actually paid. A price they asked about is not amountKes. May be null even when bought is true.
- draft: one short, warm WhatsApp follow-up from the shop, in Kenyan English, no emojis, ending with an easy next step.

Shop: ${shopName}
Note:
"""${note.slice(0, 800)}"""`;

  try {
    const response = await c.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(CaptureSchema) },
      messages: [{ role: "user", content: prompt }],
    });
    if (response.stop_reason === "refusal" || !response.parsed_output) return fallback;
    const parsed = response.parsed_output;
    if (typeof parsed.name !== "string" || !parsed.name.trim()) return fallback;
    const bought = parsed.bought === true;
    const name = String(parsed.name).trim();
    const phone =
      extractKenyanPhone(String(parsed.phone ?? "")) ||
      extractKenyanPhone(note) ||
      String(parsed.phone ?? "").trim();
    const wanted = wantedFromNote(String(parsed.notes ?? note), name, phone);
    const itemRaw = bought && parsed.item ? String(parsed.item) : "";
    const item = bought ? wantedFromNote(itemRaw || wanted, name, phone) || null : null;
    return {
      name,
      phone,
      source: String(parsed.source ?? "walk-in"),
      notes: wanted,
      bought,
      item,
      amountKes:
        bought && typeof parsed.amountKes === "number" && parsed.amountKes > 0
          ? parsed.amountKes
          : null,
      followUpKind: String(parsed.followUpKind ?? (bought ? "post_purchase" : "enquiry")),
      followUpReason: String(parsed.followUpReason ?? "New capture"),
      draft: String(parsed.draft ?? fallback.draft),
    };
  } catch (err) {
    logAiError("capture", err);
    return fallback;
  }
}

const CaptureSchema = z.object({
  name: z.string().describe("Customer's name"),
  phone: z.string().describe("Kenyan mobile, e.g. 0712345678 or 0112345678"),
  source: z.enum(["walk-in", "whatsapp", "instagram", "facebook", "tiktok", "referral"]),
  notes: z.string().describe("Only what they wanted; empty if nothing was said"),
  bought: z.boolean(),
  item: z.string().nullable(),
  amountKes: z.number().int().nullable(),
  followUpKind: z.enum([
    "enquiry",
    "hold",
    "payday",
    "post_purchase",
    "winback",
    "loyalty",
    "feedback",
  ]),
  followUpReason: z.string().describe("One sentence: why to follow up"),
  draft: z.string().describe("Short WhatsApp follow-up message"),
});

function heuristicParse(note: string, shopName: string) {
  const phone = extractKenyanPhone(note) ?? "";
  const amountMatch = note.match(/(?:ksh|kes|kshs)?\s*([0-9]{3,6})/i);
  const nameMatch =
    note.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/) ?? note.match(/\b([A-Z][a-z]{2,})\b/);
  const name = nameMatch?.[1] ?? "New customer";
  const first = name.split(" ")[0];
  const bought =
    /bought|paid|m-?pesa|sent \d|sold|picked up|till/i.test(note) &&
    !/didn'?t buy|did not buy|thinking|hold it|payday|maybe|i'll come/i.test(note);
  const source = /tiktok|tt\b/i.test(note)
    ? "tiktok"
    : /insta/i.test(note)
      ? "instagram"
      : /whats?app|wa\b/i.test(note)
        ? "whatsapp"
        : /facebook|fb\b/i.test(note)
          ? "facebook"
          : /refer/i.test(note)
            ? "referral"
            : "walk-in";
  const kind = bought
    ? "post_purchase"
    : /payday|friday|salary/i.test(note)
      ? "payday"
      : /hold/i.test(note)
        ? "hold"
        : "enquiry";
  const wanted = wantedFromNote(note, name, phone);
  return {
    name,
    phone,
    source,
    notes: wanted,
    bought,
    item: bought ? wanted || null : null,
    amountKes: bought && amountMatch ? Number(amountMatch[1]) : null,
    followUpKind: kind,
    followUpReason: bought ? "After the sale" : "Captured from shop note",
    draft: `Hi ${first} — just following up from ${shopName}. Still happy to help whenever you're ready.`,
  };
}

export async function writeCoachBrief(input: {
  shopName: string;
  dueCount: number;
  loyaltyReady: number;
  weekSalesKes: number;
  namesDue: string[];
}): Promise<string> {
  const fallback = [
    `${input.shopName} has ${input.dueCount} follow-up${input.dueCount === 1 ? "" : "s"} waiting on Today.`,
    input.loyaltyReady
      ? `${input.loyaltyReady} regular${input.loyaltyReady === 1 ? " is" : "s are"} close to a reward. Tell them.`
      : "No one is on the edge of a reward today.",
    input.namesDue.length
      ? `Start with ${input.namesDue.slice(0, 3).join(", ")}.`
      : "Capture the next walk-in before they leave.",
  ].join(" ");

  const prompt = `Write a 4–6 sentence morning briefing for the owner of ${input.shopName}, a Kenyan retail shop.
Tone: direct, kind, no fluff, no emojis, no corporate jargon.
Facts:
- Follow-ups due: ${input.dueCount} (${input.namesDue.join(", ") || "none"})
- Close to loyalty reward: ${input.loyaltyReady}
- Sales logged this week: KES ${input.weekSalesKes}

Tell them what to do in the next 20 minutes. Return plain paragraphs only.`;

  return (await askClaude("coach", prompt)) ?? fallback;
}
