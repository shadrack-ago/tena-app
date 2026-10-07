import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  dueHoursFor,
  nextFriday,
  PLANS,
  randomCode,
  startOfDay,
  type PlanId,
} from "./lib";
import type {
  AccessStatus,
  Customer,
  FollowUp,
  Member,
  Message,
  Role,
  Sale,
  Shop,
  Ticket,
} from "./types";

type Session = { email: string; name: string; role: Role; isAdmin: boolean };

type State = {
  hydrated: boolean;
  session: Session | null;
  shop: Shop | null;
  members: Member[];
  customers: Customer[];
  followUps: FollowUp[];
  sales: Sale[];
  messages: Message[];
  tickets: Ticket[];
  adminEmail: string | null;
  nextId: number;
  setHydrated: () => void;
  signOut: () => void;
  createShop: (input: { name: string; city: string; email: string; ownerName: string }) => void;
  loadSample: (email: string, ownerName: string) => void;
  signIn: (email: string) => string | null;
  joinWithInvite: (code: string, name: string, email: string) => string | null;
  claimOps: () => string | null;
  capture: (input: {
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
    dueAt: string;
  }) => number;
  sendFollowUp: (id: number, body: string) => void;
  skipFollowUp: (id: number, snoozeHours?: number) => void;
  scheduleFollowUp: (id: number, dueAt: string) => void;
  recordSale: (customerId: number, item: string, amountKes: number) => void;
  subscribe: (plan: PlanId, method: "mpesa" | "card") => void;
  rotateInvite: () => void;
  addStaff: (name: string, email: string) => void;
  createTicket: (subject: string, body: string) => void;
  replyTicket: (id: number, body: string, from: "shop" | "ops", close?: boolean) => void;
  access: () => AccessStatus;
  daysLeft: () => number;
};

function hoursAgo(h: number) {
  return new Date(Date.now() - h * 3600_000).toISOString();
}
function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600_000).toISOString();
}

function sampleShop(email: string, ownerName: string): Pick<
  State,
  "shop" | "members" | "customers" | "followUps" | "sales" | "messages" | "nextId"
> {
  const shop: Shop = {
    id: "shop-1",
    name: "Kitenge House",
    city: "Nairobi",
    ownerEmail: email,
    stampGoal: 10,
    rewardLabel: "A wrap on us",
    joinCode: "KH7P2",
    inviteCode: "STAFF9K",
    trialEndsAt: hoursFromNow(14 * 24),
    paidUntil: null,
    seeded: true,
  };
  const customers: Customer[] = [
    {
      id: 1,
      name: "Amina Wanjiku",
      phone: "0712456789",
      source: "whatsapp",
      notes: "Olive kitenge midi. Holding matching wrap for Saturday.",
      stampCount: 4,
      loyaltyPoints: 4500,
      lastPurchaseAt: hoursAgo(52),
      createdAt: hoursAgo(60),
    },
    {
      id: 2,
      name: "Brian Otieno",
      phone: "0723987123",
      source: "instagram",
      notes: "White linen shirt, size L.",
      stampCount: 0,
      loyaltyPoints: 0,
      lastPurchaseAt: null,
      createdAt: hoursAgo(18),
    },
    {
      id: 3,
      name: "Faith Chebet",
      phone: "0745123987",
      source: "walk-in",
      notes: "Regular. Two stamps from a reward.",
      stampCount: 8,
      loyaltyPoints: 9200,
      lastPurchaseAt: hoursAgo(96),
      createdAt: hoursAgo(400),
    },
    {
      id: 4,
      name: "Joseph Kamau",
      phone: "0733567890",
      source: "tiktok",
      notes: "Brown satchel. Payday Friday.",
      stampCount: 1,
      loyaltyPoints: 2800,
      lastPurchaseAt: hoursAgo(200),
      createdAt: hoursAgo(210),
    },
  ];
  const followUps: FollowUp[] = [
    {
      id: 11,
      customerId: 1,
      kind: "hold",
      dueAt: hoursFromNow(2),
      status: "due",
      reason: "Promised to hold the matching wrap for Saturday afternoon.",
      draftText:
        "Hi Amina, your matching wrap is still on hold. We'll be here till 6. Want me to keep it at the till?",
    },
    {
      id: 12,
      customerId: 2,
      kind: "enquiry",
      dueAt: hoursAgo(17),
      status: "due",
      reason: "Instagram enquiry about white linen in L.",
      draftText:
        "Hi Brian — yes, white linen in L is in. 2,800. I can hold one till this evening if you want to pass by or M-Pesa.",
    },
    {
      id: 13,
      customerId: 3,
      kind: "loyalty",
      dueAt: hoursFromNow(5),
      status: "due",
      reason: "Two stamps from a reward.",
      draftText:
        "Hi Faith — you're two visits from a wrap on us at Kitenge House. Want me to put a couple of new pieces aside?",
    },
    {
      id: 14,
      customerId: 4,
      kind: "payday",
      dueAt: hoursFromNow(20),
      status: "due",
      reason: "Said payday Friday for the brown satchel.",
      draftText:
        "Hi Joseph — checking in as we said. The brown satchel is still here. I can hold it through the weekend if that helps.",
    },
  ];
  const sales: Sale[] = [
    { id: 21, customerId: 1, item: "Olive kitenge midi", amountKes: 4500, soldAt: hoursAgo(52) },
    { id: 22, customerId: 3, item: "Mustard wrap", amountKes: 1800, soldAt: hoursAgo(96) },
    { id: 23, customerId: 3, item: "Print shirt", amountKes: 3200, soldAt: hoursAgo(200) },
  ];
  const messages: Message[] = [
    { id: 31, customerId: 1, direction: "out", body: "Yes — 4500 to the till. Karibu!", sentAt: hoursAgo(52) },
    { id: 32, customerId: 2, direction: "out", body: "Hi Brian — L in white is here.", sentAt: hoursAgo(18) },
  ];
  return {
    shop,
    members: [{ id: "m1", name: ownerName, email, role: "owner" }],
    customers,
    followUps,
    sales,
    messages,
    nextId: 40,
  };
}

export const useTena = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      session: null,
      shop: null,
      members: [],
      customers: [],
      followUps: [],
      sales: [],
      messages: [],
      tickets: [],
      adminEmail: null,
      nextId: 1,
      setHydrated: () => set({ hydrated: true }),
      signOut: () => set({ session: null }),
      createShop: ({ name, city, email, ownerName }) => {
        const shop: Shop = {
          id: `shop-${Date.now()}`,
          name: name.trim() || "My shop",
          city: city.trim() || "Nairobi",
          ownerEmail: email.trim().toLowerCase(),
          stampGoal: 10,
          rewardLabel: "A gift on us",
          joinCode: randomCode(5),
          inviteCode: randomCode(7),
          trialEndsAt: hoursFromNow(14 * 24),
          paidUntil: null,
          seeded: false,
        };
        set({
          shop,
          session: { email: shop.ownerEmail, name: ownerName.trim() || "Owner", role: "owner", isAdmin: get().adminEmail === shop.ownerEmail },
          members: [{ id: "m-owner", name: ownerName.trim() || "Owner", email: shop.ownerEmail, role: "owner" }],
          customers: [],
          followUps: [],
          sales: [],
          messages: [],
          nextId: 1,
        });
      },
      loadSample: (email, ownerName) => {
        const seeded = sampleShop(email.trim().toLowerCase(), ownerName.trim() || "Owner");
        set({
          ...seeded,
          session: {
            email: email.trim().toLowerCase(),
            name: ownerName.trim() || "Owner",
            role: "owner",
            isAdmin: get().adminEmail === email.trim().toLowerCase(),
          },
        });
      },
      signIn: (email) => {
        const e = email.trim().toLowerCase();
        const shop = get().shop;
        if (!shop) return "No shop on this phone yet. Create one.";
        const member = get().members.find((m) => m.email === e);
        if (!member) return "That email is not on this shop. Use the staff invite.";
        set({
          session: {
            email: e,
            name: member.name,
            role: member.role,
            isAdmin: get().adminEmail === e,
          },
        });
        return null;
      },
      joinWithInvite: (code, name, email) => {
        const shop = get().shop;
        if (!shop) return "No shop to join on this phone.";
        if (code.trim().toUpperCase() !== shop.inviteCode) return "Invite code is not valid.";
        const e = email.trim().toLowerCase();
        const existing = get().members.find((m) => m.email === e);
        const members = existing
          ? get().members
          : [...get().members, { id: `m-${Date.now()}`, name: name.trim() || "Staff", email: e, role: "staff" as const }];
        set({
          members,
          session: { email: e, name: name.trim() || "Staff", role: existing?.role ?? "staff", isAdmin: get().adminEmail === e },
        });
        return null;
      },
      claimOps: () => {
        const s = get().session;
        if (!s) return "Sign in first.";
        if (get().adminEmail && get().adminEmail !== s.email) return "Ops already has an owner.";
        set({
          adminEmail: s.email,
          session: { ...s, isAdmin: true },
        });
        return null;
      },
      capture: (input) => {
        const id = get().nextId;
        const now = new Date().toISOString();
        const customer: Customer = {
          id,
          name: input.name.trim(),
          phone: input.phone.trim(),
          source: input.source,
          notes: input.notes.trim(),
          stampCount: input.bought ? 1 : 0,
          loyaltyPoints: input.amountKes && input.amountKes > 0 ? input.amountKes : 0,
          lastPurchaseAt: input.bought ? now : null,
          createdAt: now,
        };
        const follow: FollowUp = {
          id: id + 1,
          customerId: id,
          kind: input.followUpKind,
          dueAt: input.dueAt,
          status: "due",
          draftText: input.draft,
          reason: input.followUpReason,
        };
        const sales =
          input.bought && input.amountKes && input.amountKes > 0
            ? [
                ...get().sales,
                {
                  id: id + 2,
                  customerId: id,
                  item: (input.item ?? "").trim() || "Purchase",
                  amountKes: input.amountKes,
                  soldAt: now,
                },
              ]
            : get().sales;
        set({
          customers: [customer, ...get().customers],
          followUps: [follow, ...get().followUps],
          sales,
          nextId: id + 3,
        });
        return id;
      },
      sendFollowUp: (id, body) => {
        const f = get().followUps.find((x) => x.id === id);
        if (!f) return;
        const now = new Date().toISOString();
        set({
          followUps: get().followUps.map((x) =>
            x.id === id ? { ...x, status: "sent", draftText: body } : x,
          ),
          messages: [
            ...get().messages,
            { id: get().nextId, customerId: f.customerId, direction: "out", body, sentAt: now },
          ],
          nextId: get().nextId + 1,
        });
      },
      skipFollowUp: (id, snoozeHours) => {
        set({
          followUps: get().followUps.map((x) => {
            if (x.id !== id) return x;
            if (snoozeHours) {
              return { ...x, dueAt: hoursFromNow(snoozeHours), status: "due" };
            }
            return { ...x, status: "skipped" };
          }),
        });
      },
      scheduleFollowUp: (id, dueAt) => {
        set({
          followUps: get().followUps.map((x) => (x.id === id ? { ...x, dueAt, status: "due" } : x)),
        });
      },
      recordSale: (customerId, item, amountKes) => {
        const now = new Date().toISOString();
        const shop = get().shop;
        const goal = shop?.stampGoal ?? 10;
        set({
          sales: [
            ...get().sales,
            {
              id: get().nextId,
              customerId,
              item: item.trim() || "Purchase",
              amountKes,
              soldAt: now,
            },
          ],
          customers: get().customers.map((c) => {
            if (c.id !== customerId) return c;
            let stamps = c.stampCount + 1;
            if (stamps >= goal) stamps = 0;
            return {
              ...c,
              stampCount: stamps,
              loyaltyPoints: c.loyaltyPoints + amountKes,
              lastPurchaseAt: now,
            };
          }),
          followUps: [
            {
              id: get().nextId + 1,
              customerId,
              kind: "post_purchase",
              dueAt: hoursFromNow(24),
              status: "due",
              reason: "After the sale",
              draftText: "Hi — hope you're enjoying it. Anything you need, just say.",
            },
            ...get().followUps,
          ],
          nextId: get().nextId + 2,
        });
      },
      subscribe: (plan, _method) => {
        const shop = get().shop;
        if (!shop) return;
        const months = PLANS[plan].months;
        const base = shop.paidUntil && new Date(shop.paidUntil) > new Date()
          ? new Date(shop.paidUntil)
          : new Date();
        base.setMonth(base.getMonth() + months);
        set({ shop: { ...shop, paidUntil: base.toISOString(), seeded: shop.seeded } });
      },
      rotateInvite: () => {
        const shop = get().shop;
        if (!shop) return;
        set({ shop: { ...shop, inviteCode: randomCode(7) } });
      },
      addStaff: (name, email) => {
        const e = email.trim().toLowerCase();
        if (!e || get().members.some((m) => m.email === e)) return;
        set({
          members: [
            ...get().members,
            { id: `m-${Date.now()}`, name: name.trim() || e, email: e, role: "staff" },
          ],
        });
      },
      createTicket: (subject, body) => {
        const shop = get().shop;
        if (!shop) return;
        const id = get().nextId;
        const now = new Date().toISOString();
        set({
          tickets: [
            {
              id,
              shopId: shop.id,
              shopName: shop.name,
              subject: subject.trim(),
              status: "open",
              createdAt: now,
              messages: [{ id: id + 1, from: "shop", body: body.trim(), at: now }],
            },
            ...get().tickets,
          ],
          nextId: id + 2,
        });
      },
      replyTicket: (id, body, from, close) => {
        const now = new Date().toISOString();
        set({
          tickets: get().tickets.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              status: close ? "closed" : t.status,
              messages: [...t.messages, { id: get().nextId, from, body: body.trim(), at: now }],
            };
          }),
          nextId: get().nextId + 1,
        });
      },
      access: () => {
        const shop = get().shop;
        if (!shop) return "locked";
        const now = Date.now();
        if (shop.paidUntil && new Date(shop.paidUntil).getTime() > now) return "active";
        if (new Date(shop.trialEndsAt).getTime() > now) return "trial";
        return "locked";
      },
      daysLeft: () => {
        const shop = get().shop;
        if (!shop) return 0;
        const end = shop.paidUntil
          ? Math.max(new Date(shop.paidUntil).getTime(), new Date(shop.trialEndsAt).getTime())
          : new Date(shop.trialEndsAt).getTime();
        return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
      },
    }),
    {
      name: "tena-mobile",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        shop: s.shop,
        members: s.members,
        customers: s.customers,
        followUps: s.followUps,
        sales: s.sales,
        messages: s.messages,
        tickets: s.tickets,
        adminEmail: s.adminEmail,
        nextId: s.nextId,
        session: s.session,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export { dueHoursFor, nextFriday, startOfDay } from "./lib";
