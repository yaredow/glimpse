import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import type { BottomTabBarProps } from "expo-router/tabs";
import * as Haptics from "expo-haptics";
import {
  FilmStripIcon,
  BookmarkSimpleIcon,
  UserIcon,
} from "phosphor-react-native";
import { fonts } from "@/lib/theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TabItemConfig {
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    weight?: "regular" | "fill" | "bold";
  }>;
}

const TAB_CONFIGS: Record<string, TabItemConfig> = {
  index: {
    label: "Today",
    Icon: FilmStripIcon,
  },
  journal: {
    label: "Journal",
    Icon: BookmarkSimpleIcon,
  },
  profile: {
    label: "Profile",
    Icon: UserIcon,
  },
};

export function FloatingTabBar({
  state,
  descriptors,
  emitter,
  navigateToTab,
  insets,
}: BottomTabBarProps) {
  const bottomInset = Math.max(insets?.bottom ?? 0, 16);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.floatingWrapper, { bottom: bottomInset }]}
    >
      <View style={styles.dockContainer}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const descriptor = descriptors[route.key];
          const options = descriptor?.options;
          const config = TAB_CONFIGS[route.name] ?? {
            label: options?.title ?? route.name,
            Icon: FilmStripIcon,
          };
          const { Icon, label } = config;

          const handlePress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            if (!isFocused) {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
            }

            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          const handleLongPress = () => {
            emitter.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              onPress={handlePress}
              onLongPress={handleLongPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.tabItem,
                isFocused ? styles.tabItemActive : styles.tabItemInactive,
                pressed && styles.tabItemPressed,
              ]}
            >
              <Icon
                size={20}
                color={isFocused ? "#E50914" : "#8E8E93"}
                weight={isFocused ? "fill" : "regular"}
              />
              {isFocused && (
                <Text style={styles.activeLabel} numberOfLines={1}>
                  {label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  dockContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 18, 22, 0.94)",
    borderRadius: 36,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
    gap: 6,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    minHeight: 44,
  },
  tabItemActive: {
    backgroundColor: "rgba(229, 9, 20, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(229, 9, 20, 0.35)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  tabItemInactive: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    minWidth: 44,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabItemPressed: {
    opacity: 0.7,
  },
  activeLabel: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
    fontSize: 12.5,
    letterSpacing: 0.4,
  },
});
