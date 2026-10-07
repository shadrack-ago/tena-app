import { Text, View } from "react-native";
import { formatKes } from "../../src/lib";
import { useTena } from "../../src/store";
import { colors, radius, space } from "../../src/theme";
import { Screen } from "../../src/ui";

const PRACTICES = [
  {
    title: "Answer while they still care",
    body: "An enquiry older than a few hours is already shopping next door. It sits on Today. Reply in the first hour of shop time.",
  },
  {
    title: "Write the next step, not a novel",
    body: "Every follow-up should offer one easy yes: hold it, pass by, M-Pesa, send a photo.",
  },
  {
    title: "Payday is a calendar, not a hope",
    body: "When someone says Friday, put Friday on the list. You send that day.",
  },
  {
    title: "After they pay, you are not done",
    body: "Thank them. Tell them when to come back. That is cheaper than a new Instagram ad.",
  },
  {
    title: "Rewards only work if you mention them",
    body: "A silent stamp card is a notebook. Tell Faith she is two visits away.",
  },
];

export default function Coach() {
  const shop = useTena((s) => s.shop);
  const due = useTena((s) => s.followUps.filter((f) => f.status === "due").length);
  const sales = useTena((s) => s.sales);
  const week = sales
    .filter((s) => Date.now() - new Date(s.soldAt).getTime() < 7 * 86400000)
    .reduce((n, s) => n + s.amountKes, 0);
  const names = useTena((s) => {
    const ids = s.followUps.filter((f) => f.status === "due").map((f) => f.customerId);
    return s.customers.filter((c) => ids.includes(c.id)).map((c) => c.name);
  });

  return (
    <Screen title="Coach" subtitle="What to do in the next 20 minutes.">
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.lg,
          padding: 16,
          marginBottom: space.xl,
        }}
      >
        <Text style={{ lineHeight: 22, color: colors.ink }}>
          {shop?.name ?? "Your shop"} has {due} follow-up{due === 1 ? "" : "s"} waiting on Today.
          Sales logged this week: {formatKes(week)}.
          {names.length ? ` Start with ${names.slice(0, 3).join(", ")}.` : " Capture the next walk-in."}
        </Text>
      </View>
      {PRACTICES.map((p) => (
        <View key={p.title} style={{ marginBottom: 18 }}>
          <Text style={{ fontWeight: "700", fontSize: 16 }}>{p.title}</Text>
          <Text style={{ color: colors.muted, marginTop: 4, lineHeight: 20 }}>{p.body}</Text>
        </View>
      ))}
    </Screen>
  );
}
