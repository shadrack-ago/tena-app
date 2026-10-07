import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { formatPhone, kindLabel, nextFriday, startOfDay, whatsappUrl } from "./lib";
import { useTena } from "./store";
import { colors, space } from "./theme";
import type { FollowUp } from "./types";
import { Avatar, Btn, Chip, Pill, relativeDue } from "./ui";

export function FollowCard({ item }: { item: FollowUp }) {
  const customers = useTena((s) => s.customers);
  const sendFollowUp = useTena((s) => s.sendFollowUp);
  const skipFollowUp = useTena((s) => s.skipFollowUp);
  const scheduleFollowUp = useTena((s) => s.scheduleFollowUp);
  const person = customers.find((c) => c.id === item.customerId);
  const [body, setBody] = useState(item.draftText);
  const [pick, setPick] = useState(false);
  if (!person) return null;
  const wa = whatsappUrl(person.phone, body);
  const overdue = new Date(item.dueAt).getTime() < Date.now();

  async function send() {
    sendFollowUp(item.id, body);
    if (wa) await Linking.openURL(wa);
  }

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderColor: colors.line,
        borderWidth: 1,
        borderRadius: 18,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12, alignItems: "flex-start" }}>
        <Avatar name={person.name} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Text style={{ fontWeight: "700", color: colors.ink }}>{person.name}</Text>
            <Pill label={kindLabel(item.kind)} tone={overdue ? "warn" : "primary"} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            {formatPhone(person.phone)} · {relativeDue(item.dueAt)}
          </Text>
        </View>
      </View>
      {item.reason ? (
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 10, lineHeight: 18 }}>
          {item.reason}
        </Text>
      ) : null}
      <TextInput
        value={body}
        onChangeText={setBody}
        multiline
        style={{
          marginTop: 10,
          minHeight: 88,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: 8,
          padding: 10,
          color: colors.ink,
          backgroundColor: colors.card,
          fontSize: 14,
        }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        <Btn label="Send on WhatsApp" icon="logo-whatsapp" onPress={() => void send()} />
        <Btn
          kind="outline"
          label="Copy"
          onPress={() => {
            void Clipboard.setStringAsync(body);
            Alert.alert("Copied", "Paste in WhatsApp");
          }}
        />
        <Btn kind="ghost" label="Snooze 2 days" onPress={() => skipFollowUp(item.id, 48)} />
        <Btn kind="ghost" label="Skip" onPress={() => skipFollowUp(item.id)} />
        <Btn kind="ghost" label={pick ? "Hide times" : "When"} onPress={() => setPick((v) => !v)} />
      </View>
      {pick ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: space.sm }}>
          <Chip label="Today" onPress={() => scheduleFollowUp(item.id, startOfDay(0).toISOString())} />
          <Chip label="Tomorrow" onPress={() => scheduleFollowUp(item.id, startOfDay(1).toISOString())} />
          <Chip label="Friday" onPress={() => scheduleFollowUp(item.id, nextFriday().toISOString())} />
          <Chip label="Next week" onPress={() => scheduleFollowUp(item.id, startOfDay(7).toISOString())} />
        </View>
      ) : null}
    </View>
  );
}
