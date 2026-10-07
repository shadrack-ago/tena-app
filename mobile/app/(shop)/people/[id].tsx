import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { format } from "date-fns";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { FollowCard } from "../../../src/FollowCard";
import { formatKes, formatPhone, whatsappUrl } from "../../../src/lib";
import { useTena } from "../../../src/store";
import { colors, radius, space } from "../../../src/theme";
import { Btn, Field, Screen } from "../../../src/ui";

export default function Person() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const customerId = Number(id);
  const customer = useTena((s) => s.customers.find((c) => c.id === customerId));
  const sales = useTena((s) => s.sales.filter((x) => x.customerId === customerId));
  const followUps = useTena((s) => s.followUps.filter((x) => x.customerId === customerId));
  const recordSale = useTena((s) => s.recordSale);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [showSale, setShowSale] = useState(false);

  if (!customer) {
    return (
      <Screen title="Person">
        <Text>Not found.</Text>
      </Screen>
    );
  }

  const spent = sales.reduce((n, s) => n + s.amountKes, 0);
  const wa = whatsappUrl(customer.phone);
  const due = followUps.filter((f) => f.status === "due");

  return (
    <Screen
      title={customer.name}
      subtitle={`${formatPhone(customer.phone)} · ${customer.source}`}
      right={
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
      }
    >
      <View style={{ flexDirection: "row", gap: 8, marginBottom: space.lg }}>
        {[
          ["Spent", formatKes(spent)],
          ["Stamps", String(customer.stampCount)],
          ["Visits", String(sales.length)],
        ].map(([k, v]) => (
          <View
            key={k}
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.lg,
              padding: 12,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 11 }}>{k}</Text>
            <Text style={{ fontWeight: "700", marginTop: 4 }}>{v}</Text>
          </View>
        ))}
      </View>
      {customer.notes ? (
        <Text style={{ color: colors.ink, marginBottom: 16, lineHeight: 20 }}>{customer.notes}</Text>
      ) : null}
      {wa ? (
        <Btn
          label="Open WhatsApp"
          icon="logo-whatsapp"
          onPress={() => void Linking.openURL(wa)}
        />
      ) : null}

      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginTop: 24, marginBottom: 8 }}>
        Follow-ups
      </Text>
      {due.length === 0 ? (
        <Text style={{ color: colors.muted }}>None due.</Text>
      ) : (
        due.map((f) => <FollowCard key={f.id} item={f} />)
      )}

      {sales.length > 0 ? (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginBottom: 8 }}>
            Purchases
          </Text>
          {sales.map((s) => (
            <View
              key={s.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.line,
              }}
            >
              <View>
                <Text>{s.item}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {format(new Date(s.soldAt), "d MMM yyyy")}
                </Text>
              </View>
              <Text style={{ fontWeight: "600" }}>{formatKes(s.amountKes)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {showSale ? (
        <View style={{ marginTop: 16 }}>
          <Field label="What they bought" hint="Optional" value={item} onChangeText={setItem} />
          <Field
            label="Amount paid (KES)"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
          <Btn
            label="Save sale"
            onPress={() => {
              if (!(Number(amount) > 0)) return;
              recordSale(customerId, item, Number(amount));
              setItem("");
              setAmount("");
              setShowSale(false);
            }}
          />
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          <Btn
            kind="ghost"
            label={sales.length ? "Add another purchase" : "They bought later"}
            onPress={() => setShowSale(true)}
          />
        </View>
      )}
    </Screen>
  );
}
