import { useEffect, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { SplashScreen } from "expo-router";
import GlimpseLogo from "./glimpse-logo";

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
        StyleSheet.absoluteFill,
        styles.container,
        { opacity },
      ]}
    >
      <View style={styles.centerContent}>
        <GlimpseLogo
          size="large"
          tagline="CINEMA DISCOVERY"
          style={styles.logo}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0C0C0E",
    zIndex: 99999,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    alignItems: "center",
  },
});
