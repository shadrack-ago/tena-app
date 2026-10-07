import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { dueHoursFor, nextFriday, parseCaptureNote, startOfDay, whatsappUrl } from "../../src/lib";
import { useTena } from "../../src/store";
import { colors, space } from "../../src/theme";
import { Btn, Chip, Field, Screen } from "../../src/ui";

const SOURCES = ["walk-in", "qr", "whatsapp", "instagram", "tiktok", "facebook", "referral"] as const;

export default function Capture() {
  const shop = useTena((s) => s.shop);
  const capture = useTena((s) => s.capture);
  const [note, setNote] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseCaptureNote> | null>(null);
  const [dueAt, setDueAt] = useState<string | null>(null);

  function read() {
    if (!note.trim()) return;
    const p = parseCaptureNote(note, shop?.name ?? "the shop");
    setParsed(p);
    const hours = dueHoursFor(p.followUpKind, p.bought);
    setDueAt(new Date(Date.now() + hours * 3600_000).toISOString());
  }

  const wa = parsed ? whatsappUrl(parsed.phone, parsed.draft) : null;
  const whenLabel = useMemo(() => {
    if (!dueAt) return "Default timing";
    const d = new Date(dueAt);
    return d.toLocaleString("en-KE", { weekday: "short", day: "numeric", month: "short", hour: "2-digit" });
  }, [dueAt]);

  function save(openWa: boolean) {
    if (!parsed) return;
    if (!parsed.name.trim() || !parsed.phone.trim()) {
      Alert.alert("Need name and phone");
      return;
    }
    const kind = parsed.bought
      ? parsed.followUpKind === "enquiry"
        ? "post_purchase"
        : parsed.followUpKind
      : parsed.followUpKind === "post_purchase"
        ? "enquiry"
        : parsed.followUpKind;
    const when =
      dueAt ?? new Date(Date.now() + dueHoursFor(kind, parsed.bought) * 3600_000).toISOString();
    capture({
      ...parsed,
      followUpKind: kind,
      dueAt: when,
    });
    if (openWa && wa) void Linking.openURL(wa);
    router.replace("/(shop)");
  }

  return (
    <Screen title="Capture" subtitle="Name and number are enough. Add what they wanted only if you know it.">
      <Field
        label="Note"
        multiline
        placeholder="Joseph Kamau 0733 567 890 or 0112 345 678"
        value={note}
        onChangeText={setNote}
        hint="You can add the piece after the number."
      />
      <Btn label="Read note" onPress={read} />

      {parsed ? (
        <View style={{ marginTop: space.xl }}>
          <Field label="Name" value={parsed.name} onChangeText={(v) => setParsed({ ...parsed, name: v })} />
          <Field
            label="Phone"
            keyboardType="phone-pad"
            value={parsed.phone}
            onChangeText={(v) => setParsed({ ...parsed, phone: v })}
          />
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Where they came from</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {SOURCES.map((s) => (
              <Chip
                key={s}
                label={s}
                active={parsed.source === s}
                onPress={() => setParsed({ ...parsed, source: s })}
              />
            ))}
          </View>
          <Field
            label="What they wanted"
            hint="Optional"
            value={parsed.notes}
            onChangeText={(v) => setParsed({ ...parsed, notes: v })}
          />
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Did they buy?</Text>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <Chip
              label="Not yet"
              active={!parsed.bought}
              onPress={() => setParsed({ ...parsed, bought: false })}
            />
            <Chip
              label="They paid"
              active={parsed.bought}
              onPress={() => setParsed({ ...parsed, bought: true, followUpKind: "post_purchase" })}
            />
          </View>
          {parsed.bought ? (
            <>
              <Field
                label="What they bought"
                hint="Optional"
                value={parsed.item ?? ""}
                onChangeText={(v) => setParsed({ ...parsed, item: v || null })}
              />
              <Field
                label="Amount paid (KES)"
                hint="Optional"
                keyboardType="numeric"
                value={parsed.amountKes != null ? String(parsed.amountKes) : ""}
                onChangeText={(v) =>
                  setParsed({ ...parsed, amountKes: v.trim() ? Number(v.replace(/[^\d]/g, "")) : null })
                }
              />
            </>
          ) : null}
          <Field
            label="Follow-up message"
            multiline
            value={parsed.draft}
            onChangeText={(v) => setParsed({ ...parsed, draft: v })}
          />
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>When to follow up · {whenLabel}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <Chip label="Now" onPress={() => setDueAt(new Date().toISOString())} />
            <Chip label="Tomorrow" onPress={() => setDueAt(startOfDay(1).toISOString())} />
            <Chip label="Friday" onPress={() => setDueAt(nextFriday().toISOString())} />
            <Chip label="Next week" onPress={() => setDueAt(startOfDay(7).toISOString())} />
          </View>
          {wa ? <Btn label="Save and send on WhatsApp" onPress={() => save(true)} /> : null}
          <View style={{ height: 8 }} />
          <Btn kind={wa ? "outline" : "primary"} label="Save person" onPress={() => save(false)} />
        </View>
      ) : null}
    </Screen>
  );
}
