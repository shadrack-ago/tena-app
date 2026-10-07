import { Text, View } from "react-native";
import { formatPhone } from "../../src/lib";
import { useTena } from "../../src/store";
import { colors, radius } from "../../src/theme";
import { Screen } from "../../src/ui";

export default function Loyalty() {
  const shop = useTena((s) => s.shop);
  const customers = useTena((s) => s.customers.filter((c) => c.stampCount > 0));
  const goal = shop?.stampGoal ?? 10;

  return (
    <Screen
      title="Loyalty"
      subtitle={`${shop?.rewardLabel ?? "Reward"} at ${goal} stamps. Mention it or it is a notebook.`}
    >
      {customers.length === 0 ? (
        <Text style={{ color: colors.muted }}>No stamps yet. Log a sale after they pay.</Text>
      ) : (
        customers
          .slice()
          .sort((a, b) => b.stampCount - a.stampCount)
          .map((c) => (
            <View
              key={c.id}
              style={{
                padding: 14,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.lg,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontWeight: "700" }}>{c.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{formatPhone(c.phone)}</Text>
              <View
                style={{
                  height: 8,
                  backgroundColor: colors.secondary,
                  borderRadius: 4,
                  marginTop: 10,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${Math.min(100, (c.stampCount / goal) * 100)}%`,
                    height: 8,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
              <Text style={{ marginTop: 6, color: colors.primary, fontWeight: "600", fontSize: 13 }}>
                {c.stampCount}/{goal} stamps
              </Text>
            </View>
          ))
      )}
    </Screen>
  );
}
