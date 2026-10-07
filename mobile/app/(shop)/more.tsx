import { router } from "expo-router";
import { useState } from "react";
import { Alert, Share, Text, View } from "react-native";
import { formatKes, PLANS, type PlanId } from "../../src/lib";
import { useTena } from "../../src/store";
import { colors, radius, space } from "../../src/theme";
import { Btn, Chip, Field, Screen } from "../../src/ui";

export default function ShopDesk() {
  const shop = useTena((s) => s.shop);
  const session = useTena((s) => s.session);
  const members = useTena((s) => s.members);
  const access = useTena((s) => s.access());
  const daysLeft = useTena((s) => s.daysLeft());
  const subscribe = useTena((s) => s.subscribe);
  const rotateInvite = useTena((s) => s.rotateInvite);
  const addStaff = useTena((s) => s.addStaff);
  const signOut = useTena((s) => s.signOut);
  const [plan, setPlan] = useState<PlanId>("monthly");
  const [method, setMethod] = useState<"mpesa" | "card">("mpesa");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const owner = session?.role === "owner";
  const locked = access === "locked";

  if (!shop) return null;

  function pay() {
    if (method === "mpesa" && phone.replace(/\D/g, "").length < 9) {
      Alert.alert("M-Pesa", "Enter the till phone.");
      return;
    }
    if (method === "card" && card.replace(/\s/g, "").length < 12) {
      Alert.alert("Card", "Enter a card number.");
      return;
    }
    subscribe(plan, method);
    Alert.alert("Subscribed", `${shop!.name} is on the ${PLANS[plan].label} plan.`);
  }

  return (
    <Screen title="Shop" subtitle="Plan, staff, and counter code. One subscription covers everyone.">
      {locked ? (
        <View
          style={{
            backgroundColor: colors.accent,
            padding: 12,
            borderRadius: radius.md,
            marginBottom: space.lg,
          }}
        >
          <Text style={{ color: colors.accentFg }}>
            Trial ended. Subscribe with M-Pesa or card to open Today and Capture.
          </Text>
        </View>
      ) : access === "trial" ? (
        <Text style={{ color: colors.muted, marginBottom: 12 }}>
          Trial · {daysLeft} days left
        </Text>
      ) : (
        <Text style={{ color: colors.success, marginBottom: 12 }}>
          Active · {daysLeft} days left
        </Text>
      )}

      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700" }}>Plan</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 }}>
        {(Object.keys(PLANS) as PlanId[]).map((id) => (
          <Chip
            key={id}
            label={`${PLANS[id].label} · ${formatKes(PLANS[id].kes)}`}
            active={plan === id}
            onPress={() => setPlan(id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
        <Chip label="M-Pesa" active={method === "mpesa"} onPress={() => setMethod("mpesa")} />
        <Chip label="Card" active={method === "card"} onPress={() => setMethod("card")} />
      </View>
      {method === "mpesa" ? (
        <Field label="M-Pesa number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      ) : (
        <Field label="Card number" keyboardType="number-pad" value={card} onChangeText={setCard} />
      )}
      {owner ? <Btn label={`Pay ${formatKes(PLANS[plan].kes)}`} onPress={pay} /> : null}

      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginTop: 28 }}>
        Counter QR
      </Text>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 8 }}>
        Walk-ins open /s/{shop.joinCode} on the web app. Code: {shop.joinCode}
      </Text>

      <Text style={{ fontFamily: "Georgia", fontSize: 20, fontWeight: "700", marginTop: 24 }}>
        Staff
      </Text>
      <Text style={{ color: colors.muted, marginTop: 4, marginBottom: 8 }}>
        Each person signs in with their own email. Share the invite code — do not share your password.
      </Text>
      <Text style={{ fontWeight: "700", fontSize: 18, letterSpacing: 2, marginBottom: 8 }}>
        {shop.inviteCode}
      </Text>
      {owner ? (
        <>
          <Btn
            kind="outline"
            label="Share invite"
            onPress={() =>
              void Share.share({
                message: `Join ${shop.name} on Tena. Invite code: ${shop.inviteCode}`,
              })
            }
          />
          <View style={{ height: 8 }} />
          <Btn kind="ghost" label="New invite code" onPress={rotateInvite} />
          <View style={{ height: 12 }} />
          <Field label="Staff name" value={staffName} onChangeText={setStaffName} />
          <Field
            label="Staff email"
            autoCapitalize="none"
            value={staffEmail}
            onChangeText={setStaffEmail}
          />
          <Btn
            kind="outline"
            label="Add staff seat"
            onPress={() => {
              addStaff(staffName, staffEmail);
              setStaffName("");
              setStaffEmail("");
            }}
          />
        </>
      ) : null}
      {members.map((m) => (
        <Text key={m.id} style={{ marginTop: 8, color: colors.ink }}>
          {m.name} · {m.email} · {m.role}
        </Text>
      ))}

      <View style={{ height: 28 }} />
      <Btn kind="outline" label="Coach" onPress={() => router.push("/(shop)/coach")} />
      <View style={{ height: 8 }} />
      <Btn kind="outline" label="Contact support" onPress={() => router.push("/(shop)/support")} />
      {session?.isAdmin ? (
        <>
          <View style={{ height: 8 }} />
          <Btn kind="outline" label="Operator dashboard" onPress={() => router.push("/ops")} />
        </>
      ) : (
        <>
          <View style={{ height: 8 }} />
          <Btn kind="ghost" label="Claim Tena ops (first owner)" onPress={() => router.push("/ops")} />
        </>
      )}
      <View style={{ height: 8 }} />
      <Btn
        kind="ghost"
        label="Sign out"
        onPress={() => {
          signOut();
          router.replace("/");
        }}
      />
    </Screen>
  );
}
