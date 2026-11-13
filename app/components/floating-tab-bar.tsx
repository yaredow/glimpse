import {
  Pressable,
  View,
} from "react-native";
import Animated, {
  LinearTransition,
  ReduceMotion,
} from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import type { BottomTabBarProps } from "expo-router/tabs";
import * as Haptics from "expo-haptics";
import {
  FilmStripIcon,
  BookmarkSimpleIcon,
  UserIcon,
} from "phosphor-react-native";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme/tokens.generated";
import { shadows } from "@/lib/theme/shadows";

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
      {/* Intentional inset: surface-1 keeps the floating bar a step above the
          background canvas while the 95% alpha lets content show through. */}
      <View
        className="flex-row items-center gap-1.5 rounded-full border border-white/[0.08] bg-surface-1/95 px-2 py-1.5"
        style={{
          boxShadow: shadows.deck,
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
            <Animated.View
              key={route.key}
              layout={LinearTransition.duration(200).reduceMotion(
                ReduceMotion.System,
              )}
            >
              <Pressable
                onPress={handlePress}
                onLongPress={handleLongPress}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
                className={cn(
                  "min-h-[44px] flex-row items-center justify-center rounded-full active:opacity-70",
                  isFocused
                    ? "gap-2 border border-primary/35 bg-primary/[0.16] px-4 py-2.5"
                    : "min-w-[44px] border border-transparent px-4 py-2.5",
                )}
              >
                <Icon
                  size={20}
                  color={isFocused ? colors.primary : colors.mutedForeground}
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
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}
