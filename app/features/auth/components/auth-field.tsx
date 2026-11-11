import {
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import {
  Pressable,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  EnvelopeSimpleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  LockSimpleIcon,
  UserIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type SupportedAuthIcon =
  | "email"
  | "email-outline"
  | "lock"
  | "lock-outline"
  | "user"
  | "account"
  | "account-outline"
  | "key"
  | "key-outline";

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  icon?: SupportedAuthIcon | ReactNode;
  placeholder?: string;
  secure?: boolean;
  inputRef?: RefObject<ComponentRef<typeof TextInput> | null>;
  autoComplete?: TextInputProps["autoComplete"];
  textContentType?: TextInputProps["textContentType"];
  keyboardType?: TextInputProps["keyboardType"];
  autoCapitalize?: TextInputProps["autoCapitalize"];
  autoCorrect?: boolean;
  returnKeyType?: TextInputProps["returnKeyType"];
  onSubmitEditing?: () => void;
  accessibilityLabel?: string;
  autoFocus?: boolean;
  passwordRules?: string;
  className?: string;
}

export default function AuthField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  hint,
  icon,
  placeholder,
  secure = false,
  inputRef,
  autoComplete,
  textContentType,
  keyboardType,
  autoCapitalize = "none",
  autoCorrect = false,
  returnKeyType,
  onSubmitEditing,
  accessibilityLabel,
  autoFocus,
  passwordRules,
  className,
}: AuthFieldProps) {
  const fallbackRef = useRef<ComponentRef<typeof TextInput>>(null);
  const ref = inputRef ?? fallbackRef;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const focusAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Animate focus transition smoothly
  useEffect(() => {
    focusAnim.value = withTiming(focused ? 1 : 0, { duration: 200 });
  }, [focused, focusAnim]);

  // Trigger error shake + haptic notification when an error appears
  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      shakeAnim.value = withSequence(
        withTiming(-5, { duration: 40 }),
        withTiming(5, { duration: 40 }),
        withTiming(-3, { duration: 40 }),
        withTiming(3, { duration: 40 }),
        withTiming(0, { duration: 40 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    }
    prevErrorRef.current = error;
  }, [error, shakeAnim]);

  const animatedInputStyle = useAnimatedStyle(() => {
    const defaultBorder = error
      ? "rgba(239, 68, 68, 0.7)"
      : "rgba(255, 255, 255, 0.08)";
    const focusedBorder = error
      ? "rgba(239, 68, 68, 1)"
      : "rgba(229, 9, 20, 0.65)";

    const defaultBg = error
      ? "rgba(59, 7, 10, 0.35)"
      : "rgba(22, 22, 24, 0.65)";
    const focusedBg = error
      ? "rgba(59, 7, 10, 0.55)"
      : "rgba(22, 22, 24, 0.95)";

    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [defaultBorder, focusedBorder],
    );

    const backgroundColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [defaultBg, focusedBg],
    );

    const shadowOpacity = interpolate(focusAnim.value, [0, 1], [0, 0.25]);

    return {
      borderColor,
      backgroundColor,
      shadowColor: error ? "#EF4444" : "#E50914",
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity,
      shadowRadius: 8,
      transform: [{ translateX: shakeAnim.value }],
    };
  });

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon !== "string") {
      return icon;
    }

    const iconColor = focused ? "#FFFFFF" : "#71717A";
    const iconSize = 20;

    switch (icon) {
      case "email":
      case "email-outline":
        return <EnvelopeSimpleIcon size={iconSize} color={iconColor} />;
      case "lock":
      case "lock-outline":
        return <LockSimpleIcon size={iconSize} color={iconColor} />;
      case "user":
      case "account":
      case "account-outline":
        return <UserIcon size={iconSize} color={iconColor} />;
      case "key":
      case "key-outline":
        return <KeyIcon size={iconSize} color={iconColor} />;
      default:
        return null;
    }
  };

  return (
    <View className={cn("mb-4", className)}>
      <Text className="text-zinc-300 text-xs font-brandSemiBold mb-2 px-0.5 tracking-wide">
        {label}
      </Text>

      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            height: 54,
            borderRadius: 16,
            borderWidth: 1,
            gap: 12,
          },
          animatedInputStyle,
        ]}
      >
        {renderIcon()}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            setFocused(true);
            Haptics.selectionAsync().catch(() => {});
          }}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          placeholder={placeholder}
          placeholderTextColor="#71717A"
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secure ? hidden : false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          accessibilityLabel={accessibilityLabel ?? label}
          autoFocus={autoFocus}
          passwordRules={passwordRules}
          className="flex-1 text-white text-[15px] font-brandMedium h-full py-0"
        />

        {secure ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setHidden((current) => !current);
            }}
            hitSlop={10}
            className="p-1 active:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            {hidden ? (
              <EyeSlashIcon size={20} color="#71717A" />
            ) : (
              <EyeIcon size={20} color="#A1A1AA" />
            )}
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <View
          className="flex-row items-center gap-1.5 mt-2 px-1"
          accessibilityLiveRegion="polite"
        >
          <WarningCircleIcon size={14} color="#EF4444" weight="fill" />
          <Text className="text-destructive text-xs font-brandMedium">
            {error}
          </Text>
        </View>
      ) : null}

      {hint && !error ? (
        <Text className="text-zinc-500 text-[11px] mt-1.5 px-1 leading-4">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
