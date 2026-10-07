import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Btn, Field, Screen } from "../src/ui";
import { useTena } from "../src/store";
import { colors, space } from "../src/theme";

export default function Welcome() {
  const session = useTena((s) => s.session);
  const hydrated = useTena((s) => s.hydrated);
  const createShop = useTena((s) => s.createShop);
  const loadSample = useTena((s) => s.loadSample);
  const signIn = useTena((s) => s.signIn);
  const joinWithInvite = useTena((s) => s.joinWithInvite);
  const [mode, setMode] = useState<"create" | "in" | "staff">("create");
  const [name, setName] = useState("");
  const [shop, setShop] = useState("");
  const [city, setCity] = useState("Nairobi");
  const [email, setEmail] = useState("");
  const [invite, setInvite] = useState("");

  useEffect(() => {
    if (hydrated && session) router.replace("/(shop)");
  }, [hydrated, session]);

  function goCreate() {
    if (!email.trim()) return Alert.alert("Email", "Enter your email.");
    createShop({ name: shop, city, email, ownerName: name });
    router.replace("/(shop)");
  }
  function goSample() {
    if (!email.trim()) return Alert.alert("Email", "Enter your email.");
    loadSample(email, name || "Owner");
    router.replace("/(shop)");
  }
  function goIn() {
    const err = signIn(email);
    if (err) return Alert.alert("Sign in", err);
    router.replace("/(shop)");
  }
  function goStaff() {
    const err = joinWithInvite(invite, name, email);
    if (err) return Alert.alert("Staff", err);
    router.replace("/(shop)");
  }

  if (!hydrated) {
    return (
      <Screen title="Tena">
        <Text style={{ color: colors.muted }}>Opening shop…</Text>
      </Screen>
    );
  }

  return (
    <Screen title="Tena" subtitle="Come again. Capture, follow up, get paid.">
      <View style={{ flexDirection: "row", gap: 8, marginBottom: space.lg }}>
        {(["create", "in", "staff"] as const).map((m) => (
          <Btn
            key={m}
            kind={mode === m ? "primary" : "outline"}
            label={m === "create" ? "New shop" : m === "in" ? "Sign in" : "Staff"}
            onPress={() => setMode(m)}
          />
        ))}
      </View>

      {mode !== "in" ? <Field label="Your name" value={name} onChangeText={setName} /> : null}
      <Field
        label="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {mode === "create" ? (
        <>
          <Field label="Shop name" value={shop} onChangeText={setShop} placeholder="Kitenge House" />
          <Field label="City" value={city} onChangeText={setCity} />
          <Btn label="Create shop" onPress={goCreate} />
          <View style={{ height: space.sm }} />
          <Btn kind="outline" label="Try the sample boutique" onPress={goSample} />
        </>
      ) : null}
      {mode === "in" ? <Btn label="Open shop" onPress={goIn} /> : null}
      {mode === "staff" ? (
        <>
          <Field
            label="Invite code"
            autoCapitalize="characters"
            value={invite}
            onChangeText={setInvite}
          />
          <Btn label="Join this shop" onPress={goStaff} />
        </>
      ) : null}
      <Text style={{ marginTop: space.xl, color: colors.muted, fontSize: 13, lineHeight: 20 }}>
        One shop, many logins. The owner sends an invite code — staff do not share a password.
        14-day trial, then M-Pesa or card.
      </Text>
    </Screen>
  );
}
