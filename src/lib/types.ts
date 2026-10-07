export type Shop = {
  id: number;
  userId: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  city: string;
  vertical: string;
  language: string;
  loyaltyType: "stamps" | "points";
  stampGoal: number;
  pointsPerKes: number;
  rewardLabel: string;
  seeded: boolean;
};

export type Customer = {
  id: number;
  name: string;
  phone: string;
  source: string;
  notes: string | null;
  language: string;
  tags: string;
  loyaltyPoints: number;
  stampCount: number;
  optedIn: boolean;
  lastPurchaseAt: string | null;
  lastContactAt: string | null;
  createdAt: string;
  totalSpent: number;
  saleCount: number;
};

export type Conversation = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  channel: string;
  status: string;
  lastMessageAt: string;
  lastBody: string | null;
  lastDirection: string | null;
  unread: boolean;
};

export type Message = {
  id: number;
  conversationId: number;
  customerId: number;
  direction: "in" | "out";
  body: string;
  isAiDraft: boolean;
  sentAt: string;
};

export type FollowUp = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  conversationId: number | null;
  kind: string;
  dueAt: string;
  status: string;
  draftText: string | null;
  reason: string | null;
};

export type Sale = {
  id: number;
  customerId: number;
  item: string;
  amountKes: number;
  soldAt: string;
};

export type FeedbackRow = {
  id: number;
  customerId: number;
  customerName: string;
  rating: number | null;
  comment: string | null;
  createdAt: string;
};

export type Dashboard = {
  shop: Shop;
  dueFollowUps: FollowUp[];
  loyaltyReady: Customer[];
  stats: {
    people: number;
    dueToday: number;
    openEnquiries: number;
    salesThisWeekKes: number;
    salesThisWeekCount: number;
  };
};
