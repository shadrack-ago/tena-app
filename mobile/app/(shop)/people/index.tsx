import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { formatKes, formatPhone } from "../../../src/lib";
import { useTena } from "../../../src/store";
import { colors, radius } from "../../../src/theme";
import { Avatar, Screen } from "../../../src/ui";

export default function People() {
  const customers = useTena((s) => s.customers);
  const sales = useTena((s) => s.sales);

  return (
    <Screen title="People" subtitle="Everyone you captured.">
      {customers.length === 0 ? (
        <Text style={{ color: colors.muted }}>No one yet. Capture a walk-in.</Text>
      ) : (
        customers.map((c) => {
          const spent = sales.filter((s) => s.customerId === c.id).reduce((n, s) => n + s.amountKes, 0);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(shop)/people/${c.id}`)}
              style={{
                flexDirection: "row",
                gap: 12,
                padding: 12,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.lg,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <Avatar name={c.name} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: "700" }}>{c.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {formatPhone(c.phone)} · {c.source}
                </Text>
              </View>
              <Text style={{ fontWeight: "600", fontSize: 13 }}>{formatKes(spent)}</Text>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
