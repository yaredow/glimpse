import type { ReactNode } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { ArrowLeftIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { typeClasses } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import BrandLockup from "@/features/auth/components/brand-lockup";
import { palette } from "@/lib/theme/colors";

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: ReactNode;
}

export default function StepLayout({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  children,
}: StepLayoutProps) {
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack?.();
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background px-5"
      edges={["top", "bottom"]}
    >
      {/* Top Navigation & Segmented Progress Bar */}
      <View className="flex-row items-center justify-between gap-3 py-3">
        <View className="w-8 items-start">
          {onBack ? (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"

              hitSlop={12}
              className="rounded-sm p-1"
            >
              <ArrowLeftIcon size={22} color={palette.offWhite} weight="bold" />
            </Pressable>
          ) : (
            <View className="w-6" />
          )}
        </View>

        <View className="h-1 flex-1 flex-row gap-1.5">
          {Array.from({ length: totalSteps }, (_, i) => {
            const isActive = i <= step;
            return (
              <View
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-[2px]",
                  isActive ? "bg-primary" : "bg-surface-zinc-700",
                )}
              />
            );
          })}
        </View>

        <Text
          className={cn(
            typeClasses.labelSmall,
            "text-zinc-400 text-[12px] font-bold tracking-[1px] min-w-[28px] text-right",
          )}
        >
          {step + 1}/{totalSteps}
        </Text>
      </View>

      {/* Screen Title & Header */}
      <View className="mt-3 mb-5">
        <BrandLockup variant="compact" />

        <Text
          className={cn(
            typeClasses.headlineMedium,
            "text-[24px] leading-[30px] tracking-[-0.5px] text-white",
          )}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className={cn(
              typeClasses.bodyMedium,
              "mt-1.5 text-[15px] leading-[22px] text-zinc-400",
            )}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <Animated.View
        entering={FadeIn.duration(280)}
        exiting={FadeOut.duration(180)}
        style={{ flex: 1 }}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}
