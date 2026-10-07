export type Role = "owner" | "staff";
export type AccessStatus = "trial" | "active" | "locked";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  source: string;
  notes: string;
  stampCount: number;
  loyaltyPoints: number;
  lastPurchaseAt: string | null;
  createdAt: string;
};

export type FollowUp = {
  id: number;
  customerId: number;
  kind: string;
  dueAt: string;
  status: "due" | "sent" | "skipped";
  draftText: string;
  reason: string;
};

export type Sale = {
  id: number;
  customerId: number;
  item: string;
  amountKes: number;
  soldAt: string;
};

export type Message = {
  id: number;
  customerId: number;
  direction: "in" | "out";
  body: string;
  sentAt: string;
};

export type TicketMsg = { id: number; from: "shop" | "ops"; body: string; at: string };
export type Ticket = {
  id: number;
  shopId: string;
  shopName: string;
  subject: string;
  status: "open" | "closed";
  createdAt: string;
  messages: TicketMsg[];
};

export type Shop = {
  id: string;
  name: string;
  city: string;
  ownerEmail: string;
  stampGoal: number;
  rewardLabel: string;
  joinCode: string;
  inviteCode: string;
  trialEndsAt: string;
  paidUntil: string | null;
  seeded: boolean;
};
