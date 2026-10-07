import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("254")) {
    return `0${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 9) {
    return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

/** Pull a Kenyan mobile from free text: 07xx and 01xx (011x / 010x), +2547 / +2541. */
export function extractKenyanPhone(text: string): string | null {
  const m = text.match(/(?:\+?254|0)\s*[17][\d\s-]{7,14}/);
  if (!m) {
    const loose = text.replace(/\D/g, "");
    if (loose.length === 9 && (loose.startsWith("7") || loose.startsWith("1"))) {
      return `0${loose}`;
    }
    return null;
  }
  const d = m[0].replace(/\D/g, "");
  if (d.startsWith("254") && d.length >= 12) return `0${d.slice(3, 12)}`;
  if (d.startsWith("0") && d.length >= 10) return d.slice(0, 10);
  if (d.length === 9 && (d.startsWith("7") || d.startsWith("1"))) return `0${d}`;
  return d.length >= 9 ? d : null;
}

/** Kenyan (or already-international) number as digits for wa.me — no plus. */
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

export function sourceLabel(source: string) {
  switch (source) {
    case "whatsapp":
      return "WhatsApp";
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "walk-in":
      return "Walk-in";
    case "qr":
      return "Counter QR";
    case "referral":
      return "Referral";
    default:
      return source;
  }
}

export function kindLabel(kind: string) {
  switch (kind) {
    case "enquiry":
      return "Enquiry";
    case "hold":
      return "Hold";
    case "post_purchase":
      return "After sale";
    case "restock":
      return "Restock";
    case "loyalty":
      return "Loyalty";
    case "feedback":
      return "Feedback";
    case "winback":
      return "Win-back";
    case "payday":
      return "Payday";
    default:
      return kind;
  }
}

export function relativeDue(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

/** Hours until the first follow-up. One ping, then send / skip / snooze — never a daily drip. */
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
    case "feedback":
      return 24;
    case "winback":
      return 14 * 24;
    default:
      return 20;
  }
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
  if (/^(new customer|customer|client|phone|number|name)$/i.test(t)) return "";
  return t;
}
