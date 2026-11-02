import { createFileRoute } from "@tanstack/react-router";
import { getSql } from "@/lib/db";
import { settlePaystackPayment, validWebhookSignature } from "@/lib/server/paystack";

/**
 * Paystack webhook. Set this URL in Paystack → Settings → API Keys & Webhooks:
 * https://<your domain>/api/paystack/webhook. It activates plans even when the
 * owner closes the browser before returning to Uzatena.
 */
export const Route = createFileRoute("/api/paystack/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        if (!validWebhookSignature(raw, request.headers.get("x-paystack-signature"))) {
          return new Response("invalid signature", { status: 401 });
        }
        const event = JSON.parse(raw) as { event?: string; data?: { reference?: string } };
        if (event.event === "charge.success" && event.data?.reference) {
          const sql = await getSql();
          await settlePaystackPayment(sql, event.data.reference);
        }
        return new Response("ok");
      },
    },
  },
});
