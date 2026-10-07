import { Link, Stack } from "expo-router";
import { Text } from "react-native";
import { Screen } from "../src/ui";

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <Screen title="Not found">
        <Text>That screen is not in Tena.</Text>
        <Link href="/" style={{ marginTop: 12, fontWeight: "700" }}>
          Home
        </Link>
      </Screen>
    </>
  );
}
