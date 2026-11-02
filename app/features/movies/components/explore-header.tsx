import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import GlimpseLogo from "@/components/ui/glimpse-logo";

interface ExploreHeaderProps {
  syncsRemaining?: number;
  onSyncPress?: () => void;
  isSyncing?: boolean;
}

export default function ExploreHeader({
  syncsRemaining = 3,
  onSyncPress,
  isSyncing = false,
}: ExploreHeaderProps) {
  const theme = useAppTheme();

  const handleSyncPress = () => {
    if (isSyncing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSyncPress?.();
  };

  const todayDate = new Date()
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <GlimpseLogo size="medium" showMark={false} />
        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
          {`TODAY'S REEL · ${todayDate}`}
        </Text>
      </View>

      {onSyncPress ? (
        <Pressable
          onPress={handleSyncPress}
          disabled={isSyncing}
          style={({ pressed }) => [
            styles.syncPill,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
              opacity: pressed || isSyncing ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${syncsRemaining} syncs remaining. Tap to select mood and sync.`}
        >
          {isSyncing ? (
            <ActivityIndicator size={12} color={theme.colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={14}
              color={
                syncsRemaining > 0 ? theme.colors.primary : theme.colors.textMuted
              }
            />
          )}
          <Text
            style={[
              styles.syncText,
              {
                color:
                  syncsRemaining > 0
                    ? theme.colors.textPrimary
                    : theme.colors.textMuted,
              },
            ]}
          >
            {isSyncing
              ? "SYNCING"
              : syncsRemaining > 0
                ? `SYNC · ${syncsRemaining}`
                : "NO SYNCS"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: "transparent",
  },
  brandContainer: {
    justifyContent: "center",
  },
  dateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10.5,
    letterSpacing: 1.2,
    marginTop: 4,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
  },
  syncText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
  },
});
