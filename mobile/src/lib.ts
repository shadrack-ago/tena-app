export function formatKes(n: number) {
  return `KES ${Math.round(n).toLocaleString("en-KE")}`;
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("254")) {
    return `0${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  return phone;
}

export function extractKenyanPhone(text: string): string | null {
  const m = text.match(/(?:\+?254|0)\s*[17][\d\s-]{7,14}/);
  if (!m) {
    const loose = text.replace(/\D/g, "");
    if (loose.length === 9 && (loose.startsWith("7") || loose.startsWith("1"))) return `0${loose}`;
    return null;
  }
  const d = m[0].replace(/\D/g, "");
  if (d.startsWith("254") && d.length >= 12) return `0${d.slice(3, 12)}`;
  if (d.startsWith("0") && d.length >= 10) return d.slice(0, 10);
  if (d.length === 9 && (d.startsWith("7") || d.startsWith("1"))) return `0${d}`;
  return d.length >= 9 ? d : null;
}

export function toWhatsAppNumber(phone: string): string | null {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("254") && d.length >= 12) return d.slice(0, 12);
  if (d.startsWith("0") && d.length >= 10) return `254${d.slice(1, 10)}`;
  if (d.length === 9 && (d.startsWith("7") || d.startsWith("1"))) return `254${d}`;
  return d.length >= 9 ? d : null;
}

export function whatsappUrl(phone: string, text?: string) {
  const n = toWhatsAppNumber(phone);
  if (!n) return null;
  const base = `https://wa.me/${n}`;
  const trimmed = text?.trim();
  return trimmed ? `${base}?text=${encodeURIComponent(trimmed)}` : base;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function kindLabel(kind: string) {
  const map: Record<string, string> = {
    enquiry: "Enquiry",
    hold: "Hold",
    post_purchase: "After sale",
    loyalty: "Loyalty",
    winback: "Win-back",
    payday: "Payday",
  };
  return map[kind] ?? kind;
}

export function wantedFromNote(note: string, name: string, phone: string) {
  let t = note;
  t = t.replace(/(?:\+?254|0)?[17][\d\s-]{8,14}/g, " ");
  const digits = phone.replace(/\D/g, "");
  if (digits.length >= 9) {
    t = t.replace(new RegExp(digits.slice(-9).split("").join("\\D*"), "g"), " ");
  }
  for (const part of name.split(/\s+/).filter((p) => p.length >= 2)) {
    const esc = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`\\b${esc}\\b`, "ig"), " ");
  }
  t = t.replace(
    /\b(walk-?ins?|whats?app|instagram|insta|tiktok|facebook|fb|referral|counter qr)\b/gi,
    " ",
  );
  t = t.replace(/[|/]+/g, " ").replace(/\s+/g, " ").replace(/^[,;.\-–—\s]+|[,;.\-–—\s]+$/g, "").trim();
  if (t.length < 3) return "";
  return t;
}

export function parseCaptureNote(note: string, shopName: string) {
  const phone = extractKenyanPhone(note) ?? "";
  const nameMatch =
    note.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/) ??
    note.match(/\b([A-Z][a-z]{2,})\b/);
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
  const amountMatch = note.match(/(?:ksh|kes|kshs)?\s*([0-9]{3,6})/i);
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

export function dueHoursFor(kind: string, bought: boolean) {
  if (bought) return 24;
  switch (kind) {
    case "enquiry":
      return 0;
    case "hold":
      return 6;
    case "payday":
      return 20;
    case "loyalty":
      return 48;
    case "winback":
      return 14 * 24;
    default:
      return 20;
  }
}

export function nextFriday(): Date {
  const d = new Date();
  const day = d.getDay();
  const add = day <= 5 ? 5 - day || 7 : 7 - day + 5;
  d.setDate(d.getDate() + add);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function startOfDay(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(9, 0, 0, 0);
  return d;
}

export const PLANS = {
  monthly: { id: "monthly" as const, label: "1 month", kes: 999, months: 1 },
  quarter: { id: "quarter" as const, label: "3 months", kes: 2699, months: 3 },
  half: { id: "half" as const, label: "6 months", kes: 4999, months: 6 },
  yearly: { id: "yearly" as const, label: "1 year", kes: 8999, months: 12 },
};

export type PlanId = keyof typeof PLANS;

export function randomCode(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
