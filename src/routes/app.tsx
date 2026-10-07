import { useEffect, useState } from "react";
import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { hasBearer, refetchSession } from "@/lib/session-boot";
import { AppShell } from "@/components/app-shell";
import { getAccess, joinShopWithInvite } from "@/lib/server/shop";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hold, setHold] = useState(() => hasBearer());
  const [inviteTried, setInviteTried] = useState(false);

  useEffect(() => {
    if (user) {
      setHold(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        if (hasBearer()) await refetchSession();
      } finally {
        if (!cancelled) setHold(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user || inviteTried) return;
    const code =
      typeof window === "undefined" ? "" : sessionStorage.getItem("tena-invite");
    if (!code) {
      setInviteTried(true);
      return;
    }
    void joinShopWithInvite({
      data: { code, name: user.displayName, email: user.primaryEmail },
    })
      .catch(() => undefined)
      .finally(() => {
        sessionStorage.removeItem("tena-invite");
        setInviteTried(true);
      });
  }, [user, inviteTried]);

  const access = useQuery({
    queryKey: ["access"],
    queryFn: () => getAccess(),
    enabled: Boolean(user) && !hold && !isPending,
  });

  if (isPending || hold) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-secondary" />
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  const locked = access.data?.status === "locked";
  const onShop = pathname.startsWith("/app/shop") || pathname.startsWith("/app/support");
  if (locked && !onShop && access.isSuccess) {
    return <Navigate to="/app/shop" />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}