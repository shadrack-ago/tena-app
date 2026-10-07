import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useTena } from "../../src/store";
import { colors } from "../../src/theme";

export default function ShopTabs() {
  const session = useTena((s) => s.session);
  const access = useTena((s) => s.access());
  if (!session) return <Redirect href="/" />;

  const locked = access === "locked";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          height: 58,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          href: locked ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          href: locked ? null : undefined,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: "People",
          href: locked ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="loyalty"
        options={{
          title: "Loyalty",
          href: locked ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="ribbon-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="capture" options={{ href: null, title: "Capture" }} />
      <Tabs.Screen name="coach" options={{ href: null, title: "Coach" }} />
      <Tabs.Screen name="support" options={{ href: null, title: "Support" }} />
    </Tabs>
  );
}
