import { useEffect, useState } from "react";
import { Animated } from "react-native";
import { Image } from "expo-image";
import { SplashScreen } from "expo-router";
import { colors } from "@/lib/theme/tokens.generated";

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
          backgroundColor: colors.background,
          zIndex: 99999,
          alignItems: "center",
          justifyContent: "center",
        },
        { opacity },
      ]}
    >
      <Image
        source={require("@/assets/images/splash-icon.png")}
        style={{ width: 220, height: 220 }}
        contentFit="contain"
      />
    </Animated.View>
  );
}

