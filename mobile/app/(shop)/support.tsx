import { format } from "date-fns";
import { useState } from "react";
import { Text, View } from "react-native";
import { useTena } from "../../src/store";
import { colors, radius, space } from "../../src/theme";
import { Btn, Field, Screen } from "../../src/ui";

export default function Support() {
  const shop = useTena((s) => s.shop);
  const tickets = useTena((s) => s.tickets.filter((t) => t.shopId === shop?.id));
  const createTicket = useTena((s) => s.createTicket);
  const replyTicket = useTena((s) => s.replyTicket);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [reply, setReply] = useState("");
  const open = tickets.find((t) => t.id === openId);

  if (open) {
    return (
      <Screen title={open.subject} subtitle={open.status}>
        <Btn kind="ghost" label="All messages" onPress={() => setOpenId(null)} />
        {open.messages.map((m) => (
          <View
            key={m.id}
            style={{
              marginTop: 10,
              padding: 12,
              borderRadius: radius.md,
              backgroundColor: m.from === "ops" ? colors.accent : colors.card,
              borderWidth: 1,
              borderColor: colors.line,
            }}
          >
            <Text style={{ fontSize: 11, color: colors.muted }}>
              {m.from === "ops" ? "Tena" : "You"} · {format(new Date(m.at), "d MMM HH:mm")}
            </Text>
            <Text style={{ marginTop: 4, lineHeight: 20 }}>{m.body}</Text>
          </View>
        ))}
        {open.status === "open" ? (
          <View style={{ marginTop: space.lg }}>
            <Field label="Reply" multiline value={reply} onChangeText={setReply} />
            <Btn
              label="Send"
              onPress={() => {
                if (!reply.trim()) return;
                replyTicket(open.id, reply, "shop");
                setReply("");
              }}
            />
          </View>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen title="Support" subtitle="Write to Tena. The same thread lands on the operator dashboard.">
      <Field label="Subject" value={subject} onChangeText={setSubject} />
      <Field label="Message" multiline value={body} onChangeText={setBody} />
      <Btn
        label="Send to Tena"
        onPress={() => {
          if (subject.trim().length < 3 || body.trim().length < 3) return;
          createTicket(subject, body);
          setSubject("");
          setBody("");
        }}
      />
      <View style={{ height: space.xl }} />
      {tickets.map((t) => (
        <Btn
          key={t.id}
          kind="outline"
          label={`${t.subject} · ${t.status}`}
          onPress={() => setOpenId(t.id)}
        />
      ))}
      {tickets.length === 0 ? (
        <Text style={{ color: colors.muted, marginTop: 12 }}>No messages yet.</Text>
      ) : null}
    </Screen>
  );
}
