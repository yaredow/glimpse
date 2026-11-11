import { ActivityIndicator, Pressable, View } from "react-native";
import { Link, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { WarningCircleIcon } from "phosphor-react-native";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

interface AuthPrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function AuthPrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  className,
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Button
      size="xl"
      disabled={isDisabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      className={cn(
        "w-full mt-3",
        isDisabled && "opacity-50",
        className
      )}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text className="text-white font-brandBold text-[15px] tracking-wide">
          {label}
        </Text>
      )}
    </Button>
  );
}

interface AuthTextLinkProps {
  label: string;
  onPress?: () => void;
  href?: Href;
  align?: "center" | "flex-start" | "flex-end";
  tone?: "primary" | "muted";
  className?: string;
}

export function AuthTextLink({
  label,
  onPress,
  href,
  align = "center",
  tone = "primary",
  className,
}: AuthTextLinkProps) {
  const content = (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        if (!href) onPress?.();
      }}
      hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
      accessibilityRole="link"
      className={cn(
        "py-2 px-1.5",
        align === "flex-end" && "self-end",
        align === "flex-start" && "self-start",
        align === "center" && "self-center",
        className
      )}
    >
      {({ pressed }) => (
        <Text
          className={cn(
            "font-brandSemiBold text-xs tracking-wide",
            tone === "primary" ? "text-primary" : "text-zinc-400",
            pressed && "opacity-50"
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        {content}
      </Link>
    );
  }

  return content;
}

export function AuthErrorBanner({ message }: { message: string }) {
  return (
    <View
      className="flex-row items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 mb-3.5"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <WarningCircleIcon
        size={17}
        color="#EF4444"
        weight="fill"
        style={{ marginTop: 1 }}
      />
      <Text className="flex-1 text-destructive text-xs leading-5 font-brandMedium">
        {message}
      </Text>
    </View>
  );
}
