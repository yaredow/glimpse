import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { BookmarkSimpleIcon } from "phosphor-react-native";
import { colors } from "@/lib/theme/tokens.generated";
import { shadows } from "@/lib/theme/shadows";
import {
  journalFlightOverlay,
  type JournalFlight,
  useJournalFlightStore,
} from "../store/journal-flight.store";

const TOKEN_SIZE = 34;
const FLIGHT_DURATION = 560;
const FADE_DURATION = 160;

function quadratic(start: number, control: number, end: number, t: number) {
  "worklet";
  const inverse = 1 - t;
  return (
    inverse * inverse * start +
    2 * inverse * t * control +
    t * t * end
  );
}

function FlightToken({ flight }: { flight: JournalFlight }) {
  const completeFlight = useJournalFlightStore((state) => state.completeFlight);
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = flight.source.x + flight.source.width / 2;
  const startY = flight.source.y + flight.source.height / 2;
  const endX = flight.target.x + flight.target.width / 2;
  const endY = flight.target.y + flight.target.height / 2;
  const arcHeight = Math.min(96, Math.max(44, Math.abs(endX - startX) * 0.22));
  const controlX = (startX + endX) / 2;
  const controlY = Math.min(startY, endY) - arcHeight;

  useEffect(() => {
    opacity.value = withDelay(
      FLIGHT_DURATION - FADE_DURATION,
      withTiming(0, {
        duration: FADE_DURATION,
        reduceMotion: ReduceMotion.System,
      }),
    );
    progress.value = withTiming(
      1,
      {
        duration: FLIGHT_DURATION,
        easing: Easing.bezier(0.33, 0, 0.24, 1),
        reduceMotion: ReduceMotion.System,
      },
      (finished) => {
        "worklet";
        if (finished) runOnJS(completeFlight)(flight.id);
      },
    );
  }, [completeFlight, flight.id, opacity, progress]);

  const tokenStyle = useAnimatedStyle(() => {
    const t = progress.value;
    return {
      opacity: opacity.value,
      transform: [
        { translateX: quadratic(startX, controlX, endX, t) - TOKEN_SIZE / 2 },
        { translateY: quadratic(startY, controlY, endY, t) - TOKEN_SIZE / 2 },
        { scale: interpolate(t, [0, 1], [1, 0.5]) },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0,
          top: 0,
          width: TOKEN_SIZE,
          height: TOKEN_SIZE,
          borderRadius: TOKEN_SIZE / 2,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.primary,
          boxShadow: shadows.glow,
        },
        tokenStyle,
      ]}
    >
      <BookmarkSimpleIcon size={17} color={colors.white} weight="fill" />
    </Animated.View>
  );
}

/**
 * Root-level, pointer-events-none layer that carries the Seen token from the
 * deck button to the Journal tab icon.
 */
export function JournalFlightOverlay() {
  const flight = useJournalFlightStore((state) => state.flight);

  return (
    <View
      ref={(node) => {
        journalFlightOverlay.current = node;
        return () => {
          if (journalFlightOverlay.current === node) {
            journalFlightOverlay.current = null;
          }
        };
      }}
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.overlay]}
    >
      {flight ? <FlightToken key={flight.id} flight={flight} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 1000,
  },
});
