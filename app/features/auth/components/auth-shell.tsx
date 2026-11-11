import { useEffect, type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeftIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { AuthBackdrop } from "./auth-backdrop";
import BrandLockup from "./brand-lockup";
import { palette } from "@/lib/theme/colors";

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  compact?: boolean;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  onBack,
  compact = false,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  const initialBackdropHeight = compact
    ? Math.round(insets.top + screenHeight * 0.22)
    : Math.round(insets.top + screenHeight * 0.3);
  const collapsedBackdropHeight = Math.round(insets.top + screenHeight * 0.12);

  const keyboardProgress = useSharedValue(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        keyboardProgress.value = withTiming(1, { duration: 250 });
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        keyboardProgress.value = withTiming(0, { duration: 250 });
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardProgress]);

  const animatedBackdropStyle = useAnimatedStyle(() => {
    const currentHeight = interpolate(
      keyboardProgress.value,
      [0, 1],
      [initialBackdropHeight, collapsedBackdropHeight]
    );
    return {
      height: currentHeight,
    };
  });

  const animatedLogoContentStyle = useAnimatedStyle(() => {
    const scale = interpolate(keyboardProgress.value, [0, 1], [1, 0.75]);
    const opacity = interpolate(keyboardProgress.value, [0, 1], [1, 0.35]);
    const translateY = interpolate(keyboardProgress.value, [0, 1], [0, -8]);
    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <View className="flex-1 bg-background">
      {onBack ? (
        <Pressable
          onPress={onBack}
          className="absolute left-4 z-20 h-10 w-10 items-center justify-center rounded-full border border-white/[0.15] bg-black/55 active:opacity-70"
          style={{ top: Math.max(insets.top, 12) + 8 }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeftIcon size={18} color={palette.white} weight="bold" />
        </Pressable>
      ) : null}

      <Animated.View
        style={[
          {
            width: "100%",
            position: "relative",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            paddingBottom: 12,
          },
          { paddingTop: Math.max(insets.top, 24) + 10 },
          animatedBackdropStyle,
        ]}
      >
        <AuthBackdrop />

        {/* Hero Logo & Brand Centerpiece (Safely below notch/punch hole) */}
        <Animated.View
          style={[
            {
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              paddingHorizontal: 16,
            },
            animatedLogoContentStyle,
          ]}
        >
          <BrandLockup stagger />
        </Animated.View>
      </Animated.View>

      {/* Bottom Form Zone */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-between"
          contentContainerStyle={{
            paddingBottom: Math.max(insets.bottom + 12, 24),
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-[420px] self-center px-6 pt-4">
            {/* Title & Subtitle */}
            <View className="mb-2 items-center">
              <Animated.Text
                entering={FadeInDown.delay(100).duration(350).springify()}
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 24,
                  lineHeight: 30,
                  letterSpacing: -0.6,
                  color: palette.white,
                  textAlign: "center",
                }}
              >
                {title}
              </Animated.Text>
              {subtitle ? (
                <Animated.View
                  entering={FadeIn.delay(200).duration(300)}
                  style={{ marginTop: 6, alignItems: "center" }}
                >
                  {typeof subtitle === "string" ? (
                    <Text className="text-zinc-400 text-sm text-center leading-relaxed px-4 max-w-sm self-center">
                      {subtitle}
                    </Text>
                  ) : (
                    <View className="items-center">{subtitle}</View>
                  )}
                </Animated.View>
              ) : null}
            </View>

            {/* Form Fields & Children */}
            <Animated.View
              entering={FadeInUp.delay(300).duration(400)}
              style={{ marginTop: 16 }}
            >
              {children}
              {footer ? <View className="mt-4">{footer}</View> : null}
            </Animated.View>
          </View>

          {/* Bottom Footnote */}
          <View className="items-center justify-center pb-1.5 pt-6">
            <Text className="text-center text-[10px] uppercase tracking-[1.2px] text-zinc-600">
              A quieter way to choose what to watch.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
