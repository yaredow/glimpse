import {
  LayoutAnimation,
  Platform,
  Pressable,
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
import { cn } from "@/lib/utils";
import { palette } from "@/lib/theme/colors";

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
      className="absolute left-0 right-0 z-[999] items-center justify-center"
      style={{ bottom: bottomInset }}
    >
      <View
        className="flex-row items-center gap-1.5 rounded-[36px] border border-white/[0.08] bg-surface-obsidian/95 px-2 py-1.5"
        style={{
          boxShadow: "0px 10px 20.0px rgba(0, 0, 0, 0.5)",
        }}
      >
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
              className={cn(
                "min-h-[44px] flex-row items-center justify-center rounded-[24px] active:opacity-70",
                isFocused
                  ? "gap-2 border border-primary/35 bg-primary/[0.16] px-4 py-2.5"
                  : "min-w-[44px] border border-transparent px-[18px] py-2.5",
              )}
            >
              <Icon
                size={20}
                color={isFocused ? palette.cinemaRed : "#8E8E93"}
                weight={isFocused ? "fill" : "regular"}
              />
              {isFocused ? (
                <Text
                  className="text-[12.5px] tracking-[0.4px] font-brandBold text-white"
                  numberOfLines={1}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
