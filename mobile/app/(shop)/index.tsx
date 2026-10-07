import { Redirect, router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { FollowCard } from "../../src/FollowCard";
import { formatKes, formatPhone } from "../../src/lib";
import { useTena } from "../../src/store";
import { colors, radius, space } from "../../src/theme";
import { Btn, Screen } from "../../src/ui";

export default function Today() {
  const shop = useTena((s) => s.shop);
  const customers = useTena((s) => s.customers);
  const followUps = useTena((s) => s.followUps);
  const sales = useTena((s) => s.sales);
  const access = useTena((s) => s.access());
  const daysLeft = useTena((s) => s.daysLeft());
  if (access === "locked") return <Redirect href="/(shop)/more" />;
  const due = followUps.filter((f) => f.status === "due");
  const week = sales
    .filter((s) => Date.now() - new Date(s.soldAt).getTime() < 7 * 86400000)
    .reduce((n, s) => n + s.amountKes, 0);
  const goal = shop?.stampGoal ?? 10;
  const close = customers.filter((c) => c.stampCount > 0 && goal - c.stampCount <= 3);

  return (
    <Screen
      title="Today"
      subtitle={`${shop?.name ?? "Shop"} · ${shop?.city ?? ""}`}
      right={<Btn label="Capture" icon="add" onPress={() => router.push("/(shop)/capture")} />}
    >
      {shop?.seeded ? (
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: radius.md,
            padding: 12,
            marginBottom: space.lg,
          }}
        >
          <Text style={{ color: colors.accentFg, fontSize: 13 }}>
            Sample boutique loaded so you can try Tena. Capture your own people anytime.
          </Text>
        </View>
      ) : null}

      {access === "trial" ? (
        <Text style={{ color: colors.muted, marginBottom: 12, fontSize: 13 }}>
          Trial · {daysLeft} day{daysLeft === 1 ? "" : "s"} left
        </Text>
      ) : null}

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: space.xl }}>
        {[
          ["Due", String(due.length)],
          ["People", String(customers.length)],
          ["This week", formatKes(week)],
        ].map(([k, v]) => (
          <View
            key={k}
            style={{
              width: "31%",
              flexGrow: 1,
              backgroundColor: colors.card,
              borderColor: colors.line,
              borderWidth: 1,
              borderRadius: radius.lg,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11 }}>{k}</Text>
            <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginTop: 4 }}>
              {v}
            </Text>
          </View>
        ))}
      </View>

      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginBottom: 4 }}>
        Follow-ups
      </Text>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 12 }}>
        This is the reminder. Send before you close.
      </Text>
      {due.length === 0 ? (
        <Text style={{ color: colors.muted }}>Nothing due. Capture the next walk-in.</Text>
      ) : (
        due.map((f) => <FollowCard key={f.id} item={f} />)
      )}

      {close.length > 0 ? (
        <View style={{ marginTop: space.xl }}>
          <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
            Close to a reward
          </Text>
          {close.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(shop)/people/${c.id}`)}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                padding: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.lg,
                marginBottom: 8,
              }}
            >
              <View>
                <Text style={{ fontWeight: "600" }}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{formatPhone(c.phone)}</Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                {c.stampCount}/{goal}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
