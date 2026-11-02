import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import GlimpseLogo from "@/components/ui/glimpse-logo";

interface ExploreHeaderProps {
  syncsRemaining?: number;
  onSyncPress?: () => void;
}

export default function ExploreHeader({
  syncsRemaining = 3,
  onSyncPress,
}: ExploreHeaderProps) {
  const theme = useAppTheme();

  const handleSyncPress = () => {
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
        <GlimpseLogo size="medium" />
        <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
          {todayDate}
        </Text>
      </View>

      {onSyncPress ? (
        <Pressable
          onPress={handleSyncPress}
          style={({ pressed }) => [
            styles.syncPill,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
              opacity: pressed ? 0.75 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${syncsRemaining} syncs remaining. Tap to select mood and sync.`}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={15}
            color={
              syncsRemaining > 0 ? theme.colors.gold : theme.colors.textMuted
            }
          />
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
            {syncsRemaining}
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
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  brandContainer: {
    justifyContent: "center",
  },
  dateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 3,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
  },
  syncText: {
    fontFamily: "Inter_700Bold",
    fontSize: 12,
  },
});
