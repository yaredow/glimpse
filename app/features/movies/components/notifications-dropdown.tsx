import { useState } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export interface GlimpseNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  unread: boolean;
}

interface NotificationsDropdownProps {
  visible: boolean;
  onClose: () => void;
  syncsRemaining?: number;
}

export default function NotificationsDropdown({
  visible,
  onClose,
  syncsRemaining = 3,
}: NotificationsDropdownProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<GlimpseNotification[]>([
    {
      id: "daily_batch",
      title: "Today's Daily Five is Ready",
      message:
        "Five sealed mystery envelopes tailored to your taste have arrived. Unlock today's selection.",
      time: "Today, 9:00 AM",
      icon: "filmstrip",
      iconColor: theme.colors.primary,
      unread: true,
    },
    {
      id: "syncs_reset",
      title: "Daily Syncs Restored",
      message: `You have ${syncsRemaining} of 3 syncs available today to draw fresh mystery batches.`,
      time: "Today, 12:00 AM",
      icon: "lightning-bolt",
      iconColor: theme.colors.gold,
      unread: false,
    },
    {
      id: "evening_reminder",
      title: "Evening Showtime",
      message:
        "Ready to unwind? Make your pick from today's envelopes and lock it in for tonight.",
      time: "Yesterday, 8:00 PM",
      icon: "popcorn",
      iconColor: theme.colors.textPrimary,
      unread: false,
    },
  ]);

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close notifications dropdown"
      >
        <View
          style={[
            styles.dropdownContainer,
            {
              top: Math.max(insets.top + 48, 56),
              backgroundColor: theme.colors.elevation.level3,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View style={styles.headerRow}>
            <View style={styles.titleRow}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={16}
                color={theme.colors.textPrimary}
              />
              <Text
                style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
              >
                Notifications
              </Text>
            </View>

            <Pressable
              onPress={handleMarkAllRead}
              style={({ pressed }) => [
                styles.markReadBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[styles.markReadText, { color: theme.colors.primary }]}
              >
                Mark all read
              </Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.notificationItem,
                  {
                    backgroundColor: item.unread
                      ? theme.colors.elevation.level2
                      : "transparent",
                    borderColor: item.unread
                      ? "rgba(229, 9, 20, 0.25)"
                      : theme.colors.outlineVariant,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconBox,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon}
                    size={16}
                    color={item.iconColor ?? theme.colors.primary}
                  />
                </View>

                <View style={styles.textBox}>
                  <View style={styles.itemHeader}>
                    <Text
                      style={[
                        styles.itemTitle,
                        { color: theme.colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {item.unread ? (
                      <View
                        style={[
                          styles.unreadDot,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    ) : null}
                  </View>

                  <Text
                    style={[
                      styles.itemMessage,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    {item.message}
                  </Text>

                  <Text
                    style={[styles.itemTime, { color: theme.colors.textMuted }]}
                  >
                    {item.time}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  dropdownContainer: {
    position: "absolute",
    right: 16,
    width: Math.min(SCREEN_WIDTH - 32, 340),
    maxHeight: 420,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
  markReadBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  markReadText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  scrollList: {
    marginTop: 8,
  },
  listContent: {
    gap: 8,
    paddingBottom: 4,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    flex: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  itemMessage: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 4,
  },
  itemTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 10,
  },
});

