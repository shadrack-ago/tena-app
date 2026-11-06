# Uzatena

**Turn every enquiry into a repeat customer.** Uzatena is a simple sales assistant for Kenyan retail shops. It records everyone who enquires or buys, reminds the shop who to follow up and when, drafts the WhatsApp message with AI, and rewards customers who come back.

Live at **[uzatena.com](https://uzatena.com)**.

---

## The idea

Most businesses in Kenya are small, and around 60% of them are in retail: clothes, electronics, bakeries, salons, phone accessories, shoes. Marketing brings people in, through walk-ins, Instagram, TikTok and WhatsApp. But after the first conversation, most of those sales are lost:

- "Let me think about it" and "I'll come back on payday" are never written down.
- Nobody remembers to follow up, so the customer buys next door.
- People who already bought aren't thanked, rewarded or told about new stock.

Uzatena gives a shop a simple, repeatable way to **capture → follow up → sell → reward → sell again**. It doesn't replace WhatsApp; it makes sure the right message goes out to the right person on the right day.

**Who it's for:** shop owners and their staff, mostly on a phone. Uzatena assumes the shop already has demand and needs help converting and keeping it.

---

## How it works

### 1. Capture every customer
A shop gets customers into Uzatena in two ways:

- **Capture (staff):** type a quick note, e.g. *"Wanjiku 0712 998 877 wants the red ankara maxi in size 14, back after payday Friday."* AI turns it into a customer record: name, phone, what they wanted, whether they bought, and why to follow up. It also drafts the first message. Staff check it, **pick the follow-up date** (Today, Tomorrow, In 3 days, Next week, or any date), and save.
- **Counter QR (customer):** a QR poster at the till. A customer scans it and leaves their name, WhatsApp number and what they wanted. They land on the shop's list as an enquiry to follow up.

### 2. Follow up on the right day: the Today list
**Today** shows only what's due today or overdue (Kenya time). Each follow-up card has a ready AI draft. Staff can:

- **Send on WhatsApp:** opens WhatsApp with the message ready. The shop presses send from its own number.
- **Copy** or **Rewrite** with AI.
- **Reschedule** to any date, or **Skip**.

Later follow-ups sit under **Coming up** and move onto Today on their day. Uzatena never messages customers by itself; the shop always presses send.

### 3. Record sales and reward loyalty
When someone buys, the sale is recorded on their profile. Each purchase earns **stamps** (e.g. 10 visits = a free gift) or **points**. The **Loyalty** page shows who is close to a reward, so the shop can tell them, which is what brings them back.

### 4. People, Inbox and Coach
- **People:** every customer, with purchases, stamps and follow-ups.
- **Inbox:** the messages sent to each customer through Uzatena. Customers reply in WhatsApp; Uzatena doesn't read WhatsApp.
- **Coach:** a short AI morning briefing on who to contact first and why, plus everyday sales habits.

### 5. Staff
The owner invites staff with an invite link. Everyone works from the same customer list and Today list, with their own login.

### 6. Paying for Uzatena
- New shops get a **14-day free trial** with **two demo customers**, marked "(demo)", that can be removed from Today.
- After the trial the owner picks a plan (Ksh 999/month up to Ksh 8,999/year) and pays by **M-Pesa or card through Paystack**. The plan starts as soon as Paystack confirms the payment.
- If a plan lapses, the shop can only open the Shop and Support pages until it pays. Its data is kept.

---

## Uzatena HQ (for the Uzatena team)

`/ops` is the admin panel for running Uzatena itself. Only approved admins can open it.

| Page | What it's for |
|---|---|
| **Overview** | Businesses, paying vs trial, monthly recurring revenue, money collected, trial→paid conversion, lapsed plans, and charts of sign-ups and revenue |
| **Businesses** | Search and filter every shop. Open one to **extend its trial, record a payment, give free months, suspend or reactivate it**, or send its owner a password-reset link |
| **Support** | Answer the tickets shops send from Shop → Contact support |
| **Team** | Invite admins as **Owner** (everything) or **Support** (view, answer tickets, send reset links) |
| **Activity** | A log of every change made in HQ: who, what, when |

The emails in `TENA_ADMIN_EMAILS` are permanent owners.

---

## AI

The AI features run on **Claude** (Anthropic): follow-up drafts in English or Kiswahili, reading capture notes, and the coach briefing. Drafts are short and local, and never invent prices or stock. If the AI is unavailable (no key, no credit, or an error), every feature falls back to built-in message templates, so the app keeps working.

*Planned:* "Ask about your sales", plain-language answers from the shop's own data, connected through MCP.

---

## Tech overview (for developers)

| Part | Choice |
|---|---|
| App | React + TanStack Start (TypeScript), Tailwind CSS |
| Database | PostgreSQL on Supabase; schema in `migrations/`, applied on every build |
| Sign-in | Better Auth (email and password, optional Google), accounts stored in the same database |
| Payments | Paystack hosted checkout, plus a webhook at `/api/paystack/webhook` |
| AI | Anthropic Claude via the official SDK (`src/lib/server/ai.ts`) |
| Email | Resend (password resets, admin invites) |
| Hosting | Vercel |

Where things live:
- `src/routes/`: pages. `app/*` is the shop, `ops*` is Uzatena HQ, `s.$code` is the counter-QR form, `index` is the home page.
- `src/lib/server/`: server logic. `tena.ts` (customers, follow-ups, sales), `shop.ts` (shop access and plans), `billing.ts` and `paystack.ts` (payments), `admin.ts` (HQ), `ai.ts`, `seed.ts` (demo customers).

**Run it locally:** copy `.env.example` to `.env`, fill it in, then run `npm install` and `npm run dev`, and open http://localhost:8080. Without `DATABASE_URL` the app uses a throwaway in-memory database.

**More docs:**
- [SETUP-ACCOUNTS.md](SETUP-ACCOUNTS.md): every account and key the app needs.
- [DEPLOY.md](DEPLOY.md): deploying to Vercel, Paystack webhook, troubleshooting.
- [.env.example](.env.example): every setting, explained.
