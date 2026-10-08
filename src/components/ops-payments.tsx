import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewPayment } from "@/lib/server/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKes } from "@/lib/utils";

/** Confirm or reject a payment a shop marked as sent ("I've paid"). */
export function PaymentReview({
  payment,
  canAct,
}: {
  payment: { id: number; plan: string; amountKes: number; reference: string; phone: string | null };
  canAct: boolean;
}) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const mut = useMutation({
    mutationFn: (approve: boolean) =>
      reviewPayment({ data: { paymentId: payment.id, approve, mpesaCode: code } }),
    onSuccess: (_r, approve) => {
      toast.success(approve ? "Payment confirmed. Plan is active." : "Payment rejected");
      void qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-medium">
          {formatKes(payment.amountKes)} · {payment.plan}
        </p>
        <p className="text-xs text-muted-foreground">
          Ref <span className="font-mono">{payment.reference}</span>
          {payment.phone ? ` · from ${payment.phone}` : ""}
        </p>
      </div>
      {canAct ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="M-Pesa code (optional)"
            className="h-9 w-48 text-sm"
            aria-label="M-Pesa confirmation code"
          />
          <Button size="sm" onClick={() => mut.mutate(true)} disabled={mut.isPending}>
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm("Reject this payment? The shop will be asked to pay again."))
                mut.mutate(false);
            }}
            disabled={mut.isPending}
          >
            Reject
          </Button>
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">An owner admin confirms payments</span>
      )}
    </div>
  );
}
