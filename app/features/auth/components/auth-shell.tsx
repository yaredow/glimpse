import { useEffect, type ReactNode } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
import { ApertureIcon } from "phosphor-react-native";
import { Text } from "@/components/ui/text";
import { AuthBackdrop } from "./auth-backdrop";

interface AuthShellProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  icon?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  compact?: boolean;
}

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
  compact = false,
}: AuthShellProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  // Ensure backdrop height accounts for safe area so logo is never behind punch hole/notch
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
    <View style={styles.container}>
      {/* Top Backdrop Zone with Movie Still Atmosphere */}
      <Animated.View
        style={[
          styles.backdropZone,
          { paddingTop: Math.max(insets.top, 24) + 10 },
          animatedBackdropStyle,
        ]}
      >
        <AuthBackdrop />

        {/* Hero Logo & Brand Centerpiece (Safely below notch/punch hole) */}
        <Animated.View
          style={[styles.logoCenterpiece, animatedLogoContentStyle]}
        >
          {/* Emblem Badge with Aperture Icon */}
          <Animated.View
            entering={FadeIn.delay(100).duration(600)}
            style={styles.emblemBadge}
          >
            <ApertureIcon size={32} color="#E50914" weight="fill" />
          </Animated.View>

          {/* GLIMPSE Wordmark with Cinema Red Dot */}
          <Animated.View
            entering={FadeInDown.delay(250).duration(500)}
            style={styles.brandRow}
          >
            <Text style={styles.brandName}>GLIMPSE</Text>
            <View style={styles.brandDot} />
          </Animated.View>

          {/* Brand Tagline */}
          <Animated.Text
            entering={FadeIn.delay(450).duration(400)}
            style={styles.brandTagline}
          >
            FIVE FILMS. ONE NIGHT. NO SCROLLING.
          </Animated.Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom Form Zone */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formZone}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 12, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {/* Title & Subtitle */}
            <View style={styles.titleBlock}>
              <Animated.Text
                entering={FadeInDown.delay(100).duration(350).springify()}
                className="text-2xl font-bold text-white tracking-tight text-center"
              >
                {title}
              </Animated.Text>
              {subtitle ? (
                <Animated.View
                  entering={FadeIn.delay(200).duration(300)}
                  style={styles.subtitleWrapper}
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
              style={styles.formBody}
            >
              {children}
              {footer ? <View className="mt-4">{footer}</View> : null}
            </Animated.View>
          </View>

          {/* Bottom Footnote */}
          <View style={styles.footnoteRow}>
            <Text style={styles.footnoteText}>
              A quieter way to choose what to watch.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C0C0E",
  },
  backdropZone: {
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingBottom: 12,
  },
  logoCenterpiece: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    paddingHorizontal: 16,
  },
  emblemBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(229, 9, 20, 0.18)",
    borderWidth: 1.5,
    borderColor: "rgba(229, 9, 20, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  brandName: {
    fontFamily: "Inter_900Black",
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 5,
    color: "#FFFFFF",
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#E50914",
    marginBottom: 5,
    marginLeft: 3,
  },
  brandTagline: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2.8,
    color: "#8B8B94",
    textTransform: "uppercase",
    marginTop: 6,
    textAlign: "center",
  },
  formZone: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
  },
  formContainer: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: 8,
  },
  subtitleWrapper: {
    marginTop: 6,
    alignItems: "center",
  },
  formBody: {
    marginTop: 16,
  },
  footnoteRow: {
    paddingTop: 24,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  footnoteText: {
    fontFamily: "Inter_500Medium",
    fontSize: 10,
    letterSpacing: 1.2,
    color: "#52525B",
    textTransform: "uppercase",
    textAlign: "center",
  },
});
