import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const MOVIE_BACKDROPS = [
  {
    local: require("@/assets/images/auth/backdrop-1.png"),
    remote: "https://image.tmdb.org/t/p/w780/k6800wP10r8N73U9kQ32C6E6x1z.jpg",
  },
  {
    local: require("@/assets/images/auth/backdrop-2.png"),
    remote: "https://image.tmdb.org/t/p/w780/ilRyAZLPeJHGnxUjsICND0i118t.jpg",
  },
  {
    local: require("@/assets/images/auth/backdrop-3.png"),
    remote: "https://image.tmdb.org/t/p/w780/rAiYTua5VoEg0mGq8ylHw6eE1V8.jpg",
  },
];

interface AuthBackdropProps {
  style?: StyleProp<ViewStyle>;
  blurRadius?: number;
}

export function AuthBackdrop({ style, blurRadius = 6 }: AuthBackdropProps) {
  const [backdrop] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MOVIE_BACKDROPS.length);
    return MOVIE_BACKDROPS[randomIndex];
  });

  return (
    <View pointerEvents="none" style={[styles.container, style]}>
      {/* Bundled local movie backdrop with proper uniform blur */}
      <Image
        source={backdrop.local}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={blurRadius}
      />

      <Image
        source={backdrop.remote}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        blurRadius={blurRadius}
        transition={400}
        cachePolicy="memory-disk"
      />

      <LinearGradient
        colors={[
          "rgba(12, 12, 14, 0.15)",
          "rgba(12, 12, 14, 0.45)",
          "rgba(12, 12, 14, 0.85)",
          "#0C0C0E",
        ]}
        locations={[0, 0.35, 0.75, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
  },
});

export default AuthBackdrop;
