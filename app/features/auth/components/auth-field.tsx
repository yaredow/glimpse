import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Pressable, TextInput, View } from "react-native";
import Animated, {
  ReduceMotion,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";

type InputRef = React.ComponentRef<typeof TextInput>;

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
  inputRef?: RefObject<InputRef | null>;
  autoComplete?: React.ComponentProps<typeof Input>["autoComplete"];
  textContentType?: React.ComponentProps<typeof Input>["textContentType"];
  keyboardType?: React.ComponentProps<typeof Input>["keyboardType"];
  autoCapitalize?: React.ComponentProps<typeof Input>["autoCapitalize"];
  autoCorrect?: boolean;
  returnKeyType?: React.ComponentProps<typeof Input>["returnKeyType"];
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
  const fallbackRef = useRef<InputRef>(null);
  const ref = inputRef ?? fallbackRef;
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  const focusAnim = useSharedValue(0);
  const shakeAnim = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const prevErrorRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    focusAnim.value = withTiming(focused ? 1 : 0, {
      duration: 200,
      reduceMotion: ReduceMotion.System,
    });
  }, [focused, focusAnim]);

  useEffect(() => {
    if (error && error !== prevErrorRef.current) {
      if (!reduceMotion) {
        shakeAnim.value = withSequence(
          withTiming(-5, { duration: 40, reduceMotion: ReduceMotion.System }),
          withTiming(5, { duration: 40, reduceMotion: ReduceMotion.System }),
          withTiming(-3, { duration: 40, reduceMotion: ReduceMotion.System }),
          withTiming(3, { duration: 40, reduceMotion: ReduceMotion.System }),
          withTiming(0, { duration: 40, reduceMotion: ReduceMotion.System }),
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    }
    prevErrorRef.current = error;
  }, [error, shakeAnim, reduceMotion]);

  const defaultBorder = error
    ? withAlpha(colors.destructive, 0.7)
    : withAlpha(colors.white, 0.08);
  const focusedBorder = error
    ? colors.destructive
    : withAlpha(colors.primary, 0.65);

  const defaultBg = error
    ? withAlpha(colors.errorContainer, 0.35)
    : withAlpha(colors.card, 0.65);
  const focusedBg = error
    ? withAlpha(colors.errorContainer, 0.55)
    : withAlpha(colors.card, 0.95);

  const animatedInputStyle = useAnimatedStyle(() => {
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

    const shadowColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      ["rgba(0, 0, 0, 0)", error ? colors.destructive : colors.primary],
    );

    return {
      borderColor,
      backgroundColor,
      boxShadow: `0px 0px 8px ${shadowColor}`,
      transform: [{ translateX: shakeAnim.value }],
    };
  });

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon !== "string") {
      return icon;
    }

    const iconColor = focused ? colors.white : colors.faintForeground;
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
      <Label className="mb-2 px-0.5 text-foreground text-xs font-brandSemiBold tracking-wide">
        {label}
      </Label>

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

        <Input
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
          placeholderTextColor={colors.faintForeground}
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
          className="h-full flex-1 border-0 bg-transparent px-0 py-0 text-[15px] text-white shadow-none font-brandMedium"
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
              <EyeSlashIcon size={20} color={colors.faintForeground} />
            ) : (
              <EyeIcon size={20} color={colors.subtleForeground} />
            )}
          </Pressable>
        ) : null}
      </Animated.View>

      {error ? (
        <View
          className="mt-2 flex-row items-center gap-1.5 px-1"
          accessibilityLiveRegion="polite"
        >
          <WarningCircleIcon size={14} color={colors.destructive} weight="fill" />
          <Text className="text-destructive text-xs font-brandMedium">
            {error}
          </Text>
        </View>
      ) : null}

      {hint && !error ? (
        <Text className="mt-1.5 px-1 text-[11px] leading-4 text-faint-foreground">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
