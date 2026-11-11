import { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { SplashScreen } from "expo-router";
import GlimpseLogo from "./glimpse-logo";
import { palette } from "@/lib/theme/colors";

interface AnimatedSplashScreenProps {
  isReady: boolean;
}

export default function AnimatedSplashScreen({ isReady }: AnimatedSplashScreenProps) {
  const [opacity] = useState(() => new Animated.Value(1));
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    SplashScreen.hideAsync().catch(() => {});

    Animated.timing(opacity, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      setIsDone(true);
    });
  }, [isReady, opacity]);

  if (isDone) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents={isReady ? "none" : "auto"}
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: palette.appBackground,
          zIndex: 99999,
          alignItems: "center",
          justifyContent: "center",
        },
        { opacity },
      ]}
    >
      <View className="items-center justify-center">
        <GlimpseLogo
          size="large"
          tagline="CINEMA DISCOVERY"
          style={{ alignItems: "center" }}
        />
      </View>
    </Animated.View>
  );
}

