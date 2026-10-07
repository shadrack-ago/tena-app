import { router } from "expo-router";
import { format } from "date-fns";
import { useState } from "react";
import { Text, View } from "react-native";
import { formatKes } from "../src/lib";
import { useTena } from "../src/store";
import { colors, radius, space } from "../src/theme";
import { Btn, Field, Screen } from "../src/ui";

export default function Ops() {
  const session = useTena((s) => s.session);
  const adminEmail = useTena((s) => s.adminEmail);
  const claimOps = useTena((s) => s.claimOps);
  const shop = useTena((s) => s.shop);
  const members = useTena((s) => s.members);
  const customers = useTena((s) => s.customers);
  const sales = useTena((s) => s.sales);
  const tickets = useTena((s) => s.tickets);
  const access = useTena((s) => s.access());
  const daysLeft = useTena((s) => s.daysLeft());
  const replyTicket = useTena((s) => s.replyTicket);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [reply, setReply] = useState("");

  const isAdmin = session?.isAdmin || (adminEmail && session?.email === adminEmail);
  const canClaim = !adminEmail;
  const ticket = tickets.find((t) => t.id === ticketId);
  const week = sales
    .filter((s) => Date.now() - new Date(s.soldAt).getTime() < 7 * 86400000)
    .reduce((n, s) => n + s.amountKes, 0);

  if (!session) {
    return (
      <Screen title="Ops">
        <Btn label="Sign in first" onPress={() => router.replace("/")} />
      </Screen>
    );
  }

  if (!isAdmin) {
    return (
      <Screen title="Tena ops" subtitle="Shops, plans, and support threads.">
        {canClaim ? (
          <>
            <Text style={{ color: colors.muted, marginBottom: 12 }}>
              First person to claim this phone becomes the operator.
            </Text>
            <Btn
              label="This is my operator login"
              onPress={() => {
                const err = claimOps();
                if (err) return;
              }}
            />
          </>
        ) : (
          <Text>You are not the operator on this phone.</Text>
        )}
        <View style={{ height: 16 }} />
        <Btn kind="ghost" label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (ticket) {
    return (
      <Screen title={ticket.subject} subtitle={`${ticket.shopName} · ${ticket.status}`}>
        <Btn kind="ghost" label="All tickets" onPress={() => setTicketId(null)} />
        {ticket.messages.map((m) => (
          <View
            key={m.id}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: m.from === "ops" ? colors.accent : colors.card,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {m.from === "ops" ? "You" : ticket.shopName} · {format(new Date(m.at), "d MMM HH:mm")}
            </Text>
            <Text style={{ marginTop: 4 }}>{m.body}</Text>
          </View>
        ))}
        <View style={{ marginTop: space.lg }}>
          <Field label="Reply" multiline value={reply} onChangeText={setReply} />
          <Btn
            label="Send"
            onPress={() => {
              if (!reply.trim()) return;
              replyTicket(ticket.id, reply, "ops");
              setReply("");
            }}
          />
          <View style={{ height: 8 }} />
          <Btn kind="outline" label="Close ticket" onPress={() => replyTicket(ticket.id, reply || "Closed.", "ops", true)} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Tena ops" subtitle="Every shop on this phone, their plan, and support.">
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.lg,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontWeight: "700", fontSize: 18 }}>{shop?.name}</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {shop?.city} · {access} · {daysLeft} days · {members.length} seats · {customers.length}{" "}
          people · {formatKes(week)} this week
        </Text>
      </View>
      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
        Support
      </Text>
      {tickets.length === 0 ? (
        <Text style={{ color: colors.muted }}>No tickets.</Text>
      ) : (
        tickets.map((t) => (
          <View key={t.id} style={{ marginBottom: 8 }}>
            <Btn kind="outline" label={`${t.shopName}: ${t.subject} (${t.status})`} onPress={() => setTicketId(t.id)} />
          </View>
        ))
      )}
      <View style={{ height: 16 }} />
      <Btn kind="ghost" label="Back to shop" onPress={() => router.replace("/(shop)/more")} />
    </Screen>
  );
}
