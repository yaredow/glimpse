import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import NotificationsDropdown from "./notifications-dropdown";

interface ExploreHeaderProps {
  syncsRemaining?: number;
  onSyncPress?: () => void;
}

export default function ExploreHeader({
  syncsRemaining = 3,
  onSyncPress,
}: ExploreHeaderProps) {
  const theme = useAppTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const handleSyncPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSyncPress?.();
  };

  const handleNotificationPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowNotifications(true);
    setHasUnread(false);
  };

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).toUpperCase();

  return (
    <>
      <View style={styles.container}>
        <View style={styles.brandContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.brandTitle, { color: theme.colors.textPrimary }]}>
              GLIMPSE
            </Text>
            <View
              style={[styles.brandDot, { backgroundColor: theme.colors.primary }]}
            />
          </View>
          <Text style={[styles.dateText, { color: theme.colors.textSecondary }]}>
            {todayDate}
          </Text>
        </View>

        <View style={styles.rightActions}>
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

          <Pressable
            onPress={handleNotificationPress}
            style={({ pressed }) => [
              styles.notificationBtn,
              {
                backgroundColor: theme.colors.elevation.level2,
                borderColor: theme.colors.outlineVariant,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={18}
              color={theme.colors.textPrimary}
            />
            {hasUnread ? (
              <View
                style={[
                  styles.unreadDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            ) : null}
          </Pressable>
        </View>
      </View>

      <NotificationsDropdown
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        syncsRemaining={syncsRemaining}
      />
    </>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  brandTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 22,
    letterSpacing: 2,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 2,
  },
  dateText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  notificationBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  unreadDot: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
