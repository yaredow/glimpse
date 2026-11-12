import { View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/lib/theme/tokens.generated";

const MOVIE_BACKDROPS = [
  require("@/assets/images/auth/backdrop-1.jpg"),
  require("@/assets/images/auth/backdrop-2.jpg"),
  require("@/assets/images/auth/backdrop-3.jpg"),
];

const ABSOLUTE_FILL = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

const SESSION_BACKDROP =
  MOVIE_BACKDROPS[Math.floor(Math.random() * MOVIE_BACKDROPS.length)];

interface AuthBackdropProps {
  style?: StyleProp<ViewStyle>;
  blurRadius?: number;
}

export function AuthBackdrop({ style, blurRadius = 6 }: AuthBackdropProps) {
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden" style={style}>
      <Image
        source={SESSION_BACKDROP}
        style={ABSOLUTE_FILL}
        contentFit="cover"
        blurRadius={blurRadius}
      />

      <LinearGradient
        colors={[
          "rgba(12, 12, 14, 0.15)",
          "rgba(12, 12, 14, 0.45)",
          "rgba(12, 12, 14, 0.85)",
          colors.background,
        ]}
        locations={[0, 0.35, 0.75, 1]}
        style={ABSOLUTE_FILL}
      />
    </View>
  );
}

export default AuthBackdrop;
