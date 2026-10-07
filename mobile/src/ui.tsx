import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, space } from "./theme";

export function Screen({
  children,
  title,
  subtitle,
  right,
}: {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {(title || right) && (
          <View style={styles.headRow}>
            <View style={{ flex: 1 }}>
              {title ? <Text style={styles.title}>{title}</Text> : null}
              {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
            </View>
            {right}
          </View>
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Btn({
  label,
  onPress,
  kind = "primary",
  disabled,
  icon,
}: {
  label: string;
  onPress?: () => void;
  kind?: "primary" | "outline" | "ghost";
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bg =
    kind === "primary" ? colors.primary : kind === "outline" ? colors.card : "transparent";
  const fg = kind === "primary" ? colors.primaryFg : colors.ink;
  const border = kind === "outline" ? colors.line : "transparent";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.5 : 1 },
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.muted}
        style={[styles.input, rest.multiline && { minHeight: 96, textAlignVertical: "top" }]}
        {...rest}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({
  label,
  tone = "muted",
}: {
  label: string;
  tone?: "muted" | "primary" | "warn" | "success";
}) {
  const map = {
    muted: { bg: colors.secondary, fg: colors.muted },
    primary: { bg: colors.accent, fg: colors.accentFg },
    warn: { bg: "#f3e6d4", fg: colors.warn },
    success: { bg: colors.accent, fg: colors.success },
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={[styles.pillText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.accent : colors.card,
          borderColor: active ? colors.primary : colors.line,
        },
      ]}
    >
      <Text style={{ color: active ? colors.accentFg : colors.ink, fontWeight: "600", fontSize: 13 }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/);
  const t =
    parts.length === 1 ? parts[0].slice(0, 2).toUpperCase() : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (
    <View style={styles.av}>
      <Text style={styles.avText}>{t}</Text>
    </View>
  );
}

export function relativeDue(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paper },
  body: { padding: space.lg, paddingBottom: 48 },
  headRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: space.md },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: "Georgia",
  },
  sub: { marginTop: 4, color: colors.muted, fontSize: 14, lineHeight: 20 },
  btn: {
    minHeight: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  btnText: { fontWeight: "600", fontSize: 14 },
  label: { fontSize: 13, fontWeight: "600", color: colors.ink, marginBottom: 6 },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    color: colors.ink,
    fontSize: 16,
  },
  hint: { marginTop: 4, fontSize: 12, color: colors.muted },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  pillText: { fontSize: 11, fontWeight: "600" },
  chip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  av: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avText: { color: colors.accentFg, fontWeight: "700", fontSize: 13 },
});
