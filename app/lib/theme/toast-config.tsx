import React from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  type IconProps,
} from "phosphor-react-native";
import type { ToastConfig, ToastConfigParams } from "react-native-toast-message";
import { colors } from "./tokens.generated";

interface CinemaToastProps {
  text1?: string;
  text2?: string;
  onPress?: () => void;
  icon: React.ComponentType<IconProps>;
  iconColor: string;
  accentBorderColor: string;
}

const CinemaToast = ({
  text1,
  text2,
  onPress,
  icon: Icon,
  iconColor,
  accentBorderColor,
}: CinemaToastProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={text1}

      className="w-[92%] max-w-[420px] flex-row items-center gap-3 rounded-[14px] border border-l-4 border-white/[0.08] bg-surface-6 px-4 py-3"
      style={{
        borderLeftColor: accentBorderColor,
        boxShadow: "0px 6px 10.0px rgba(0, 0, 0, 0.4)",
      }}
    >
      <View className="items-center justify-center">
        <Icon size={22} color={iconColor} />
      </View>
      <View className="flex-1">
        {text1 ? (
          <Text className="text-[14px] tracking-[0.1px] font-brandSemiBold text-off-white" numberOfLines={2}>
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text className="mt-0.5 text-[13px] leading-[18px] font-brand text-zinc-400" numberOfLines={3}>
            {text2}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

export const toastConfig: ToastConfig = {
  success: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon={CheckCircleIcon}
      iconColor={colors.success}
      accentBorderColor={colors.success}
    />
  ),
  error: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon={WarningCircleIcon}
      iconColor={colors.destructive}
      accentBorderColor={colors.destructive}
    />
  ),
  info: ({ text1, text2, onPress }: ToastConfigParams<any>) => (
    <CinemaToast
      text1={text1}
      text2={text2}
      onPress={onPress}
      icon={InfoIcon}
      iconColor={colors.primary}
      accentBorderColor={colors.primary}
    />
  ),
};
