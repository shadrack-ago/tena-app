import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getOpsTeam,
  inviteAdmin,
  removeAdmin,
  revokeAdminInvite,
  type AdminRole,
} from "@/lib/server/admin";
import { Card, PageHeader, fmtDate } from "@/components/ops-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ops/team")({ component: Team });

const ROLES: { value: AdminRole; label: string; body: string }[] = [
  {
    value: "support",
    label: "Support",
    body: "Sees everything, answers tickets, sends reset links.",
  },
  { value: "owner", label: "Owner", body: "Everything, plus billing, suspensions and the team." },
];

function Team() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["ops-team"], queryFn: () => getOpsTeam() });
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("support");
  const isOwner = q.data?.me.role === "owner";

  const ok = (msg: string) => {
    toast.success(msg);
    void qc.invalidateQueries({ queryKey: ["ops-team"] });
  };
  const fail = (e: Error) => toast.error(e.message);

  const inviteMut = useMutation({
    mutationFn: () => inviteAdmin({ data: { email, role } }),
    onSuccess: (r) => {
      void navigator.clipboard?.writeText(r.link).catch(() => undefined);
      ok(
        r.emailed
          ? `Invite emailed to ${email}. Link also copied.`
          : `Invited ${email}. Email isn’t set up yet, so the invite link was copied: send it to them.`,
      );
      setEmail("");
    },
    onError: fail,
  });
  const revokeMut = useMutation({
    mutationFn: (e: string) => revokeAdminInvite({ data: e }),
    onSuccess: () => ok("Invite revoked"),
    onError: fail,
  });
  const removeMut = useMutation({
    mutationFn: (userId: string) => removeAdmin({ data: userId }),
    onSuccess: () => ok("Admin removed"),
    onError: fail,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Team" sub="People who can open Tena HQ." />

      {isOwner && (
        <Card
          title="Invite an admin"
          sub="They sign up (or sign in) with this email, then open /ops."
        >
          <form
            className="grid gap-4 md:max-w-xl"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMut.mutate();
            }}
          >
            <label className="grid gap-1 text-sm">
              <span className="font-medium">Email</span>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@tena.co.ke"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Role">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={role === r.value}
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "rounded-xl border p-3 text-left",
                    role === r.value ? "border-primary bg-accent" : "border-border bg-card",
                  )}
                >
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{r.body}</p>
                </button>
              ))}
            </div>
            <Button
              type="submit"
              className="justify-self-start"
              disabled={inviteMut.isPending || !email.trim()}
            >
              {inviteMut.isPending ? "Inviting…" : "Send invite"}
            </Button>
          </form>
        </Card>
      )}

      <Card title="Admins">
        <ul className="divide-y divide-border text-sm">
          {(q.data?.admins ?? []).map((a) => (
            <li
              key={a.userId}
              className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="font-medium">
                  {a.name || a.email}
                  {a.userId === q.data?.me.userId && (
                    <span className="text-muted-foreground"> (you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.email} · since {fmtDate(a.since)}
                  {a.locked && " · set in TENA_ADMIN_EMAILS"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.role === "owner" ? "primary" : "default"}>{a.role}</Badge>
                {isOwner && !a.locked && a.userId !== q.data?.me.userId && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={removeMut.isPending}
                    onClick={() => {
                      if (confirm(`Remove ${a.email} from Tena HQ?`)) removeMut.mutate(a.userId);
                    }}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      {(q.data?.invites.length ?? 0) > 0 && (
        <Card
          title="Pending invites"
          sub="Send them the link. They sign up with that email and land in Tena HQ."
        >
          <ul className="divide-y divide-border text-sm">
            {q.data!.invites.map((i) => (
              <li
                key={i.email}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.role} · invited {fmtDate(i.createdAt)}
                    {i.invitedBy ? ` by ${i.invitedBy}` : ""}
                  </p>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        void navigator.clipboard.writeText(i.link);
                        toast.success("Invite link copied");
                      }}
                    >
                      Copy link
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeMut.mutate(i.email)}
                      disabled={revokeMut.isPending}
                    >
                      Revoke
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
