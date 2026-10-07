import { formatDistanceToNow } from "date-fns";
import { Text, View } from "react-native";
import { useTena } from "../../src/store";
import { colors, radius } from "../../src/theme";
import { Avatar, Screen } from "../../src/ui";

export default function Inbox() {
  const customers = useTena((s) => s.customers);
  const messages = useTena((s) => s.messages);
  const threads = customers
    .map((c) => {
      const msgs = messages.filter((m) => m.customerId === c.id);
      const last = msgs[msgs.length - 1];
      return { c, last };
    })
    .filter((t) => t.last)
    .sort((a, b) => new Date(b.last!.sentAt).getTime() - new Date(a.last!.sentAt).getTime());

  return (
    <Screen title="Inbox" subtitle="What you sent from Tena — not a live WhatsApp copy.">
      {threads.length === 0 ? (
        <Text style={{ color: colors.muted }}>
          Nothing logged yet. Send a follow-up and it shows here.
        </Text>
      ) : (
        threads.map(({ c, last }) => (
          <View
            key={c.id}
            style={{
              flexDirection: "row",
              gap: 12,
              padding: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.lg,
              marginBottom: 8,
            }}
          >
            <Avatar name={c.name} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "700" }}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {formatDistanceToNow(new Date(last!.sentAt), { addSuffix: false })}
                </Text>
              </View>
              <Text numberOfLines={1} style={{ color: colors.muted, marginTop: 2 }}>
                {last!.direction === "out" ? "You: " : ""}
                {last!.body}
              </Text>
            </View>
          </View>
        ))
      )}
    </Screen>
  );
}
