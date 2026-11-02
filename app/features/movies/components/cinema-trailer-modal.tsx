import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import YoutubeIframe from "react-native-youtube-iframe";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/lib/theme";
import { tmdbImage } from "../consants/images";

interface CinemaTrailerModalProps {
  visible: boolean;
  trailerKey?: string;
  movieTitle: string;
  backdropPath?: string;
  posterPath?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));

export default function CinemaTrailerModal({
  visible,
  trailerKey,
  movieTitle,
  backdropPath,
  posterPath,
  onClose,
}: CinemaTrailerModalProps) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const backdropSrc = tmdbImage(backdropPath || posterPath, "w780");

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlaying(false);
    setIsReady(false);
    setPlayerError(null);
    onClose();
  }, [onClose]);

  const handleStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setIsPlaying(false);
    }
  }, []);

  const handleOpenYouTube = useCallback(() => {
    if (trailerKey) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`);
    }
  }, [trailerKey]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.navBtn,
              { backgroundColor: theme.colors.elevation.level2 },
              pressed && { opacity: 0.7 },
            ]}
            accessibilityLabel="Close trailer"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.titleColumn}>
            <Text style={styles.movieTitle} numberOfLines={1}>
              {movieTitle}
            </Text>
            <View style={styles.badgeRow}>
              <MaterialCommunityIcons
                name="movie-play-outline"
                size={12}
                color={theme.colors.gold}
              />
              <Text style={[styles.badgeText, { color: theme.colors.gold }]}>
                OFFICIAL TRAILER
              </Text>
            </View>
          </View>

          {trailerKey ? (
            <Pressable
              onPress={handleOpenYouTube}
              style={({ pressed }) => [
                styles.navBtn,
                { backgroundColor: theme.colors.elevation.level2 },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityLabel="Open in YouTube"
            >
              <MaterialCommunityIcons name="youtube" size={22} color="#FF0000" />
            </Pressable>
          ) : (
            <View style={styles.navBtnPlaceholder} />
          )}
        </View>

        <View style={styles.cinemaStage}>
          <View style={styles.ambientGlow} />

          <View style={[styles.videoContainer, { height: VIDEO_HEIGHT }]}>
            {backdropSrc && !isReady && !playerError ? (
              <View style={StyleSheet.absoluteFill}>
                <Image
                  source={{ uri: backdropSrc }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.loadingScrim}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>Connecting cinema reel...</Text>
                </View>
              </View>
            ) : null}

            {trailerKey && !playerError ? (
              <YoutubeIframe
                height={VIDEO_HEIGHT}
                width={SCREEN_WIDTH}
                play={isPlaying}
                videoId={trailerKey}
                onReady={() => setIsReady(true)}
                onChangeState={handleStateChange}
                onError={(err: unknown) => {
                  setPlayerError(String(err));
                }}
                webViewProps={{
                  androidLayerType: "hardware",
                  allowsFullscreenVideo: true,
                  mediaPlaybackRequiresUserAction: false,
                  scrollEnabled: false,
                }}
                initialPlayerParams={{
                  controls: true,
                  modestbranding: true,
                  rel: false,
                  preventFullScreen: false,
                  showClosedCaptions: false,
                  iv_load_policy: 3,
                }}
              />
            ) : null}

            {playerError ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="youtube" size={44} color="#FF0000" />
                <Text style={styles.errorTitle}>Studio Restricted Playback</Text>
                <Text style={styles.errorDescription}>
                  This distributor restricts embedded mobile playback. You can view
                  the full trailer directly in YouTube.
                </Text>
                <Pressable
                  onPress={handleOpenYouTube}
                  style={({ pressed }) => [
                    styles.errorDirectBtn,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <MaterialCommunityIcons name="open-in-new" size={16} color="#FFFFFF" />
                  <Text style={styles.errorDirectText}>WATCH ON YOUTUBE</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          {trailerKey && !playerError ? (
            <Pressable
              onPress={handleOpenYouTube}
              style={({ pressed }) => [
                styles.youtubeAppBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <MaterialCommunityIcons name="youtube" size={20} color="#FF0000" />
              <Text style={styles.youtubeAppBtnText}>Open in YouTube App</Text>
              <MaterialCommunityIcons
                name="arrow-top-right"
                size={16}
                color={theme.colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 12, 0.96)",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnPlaceholder: {
    width: 40,
    height: 40,
  },
  titleColumn: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  movieTitle: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  badgeText: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1,
  },
  cinemaStage: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  ambientGlow: {
    position: "absolute",
    width: "90%",
    height: "100%",
    backgroundColor: "rgba(229, 9, 20, 0.08)",
    borderRadius: 30,
    filter: "blur(40px)",
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: "#000000",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10, 10, 12, 0.75)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingText: {
    color: "#D4D4D8",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#141416",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginTop: 4,
  },
  errorDescription: {
    color: "#A1A1AA",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 6,
  },
  errorDirectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E50914",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  errorDirectText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  youtubeAppBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    width: "100%",
    maxWidth: 280,
  },
  youtubeAppBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
