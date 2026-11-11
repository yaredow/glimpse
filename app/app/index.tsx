import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { isPending, isError, refetch } = useGetPreferences(isAuthenticated);

  if (!isAuthenticated) {
    return null;
  }

  if (isError) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Couldn&apos;t load your profile</Text>
        <Text style={styles.subtitle}>
          We couldn&apos;t check your film preferences. Check your connection and try
          again.
        </Text>
        <Pressable
          onPress={() => {
            refetch();
          }}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry loading your profile"
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (isPending) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#E50914" />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: "#71717A",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E50914",
  },
});
