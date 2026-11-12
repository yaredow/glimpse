import { useCallback, useState } from "react";
import {
  ActivityIndicator, Modal, Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import YoutubeIframe from "react-native-youtube-iframe";
import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowUpRightIcon,
  PlayCircleIcon,
  YoutubeLogoIcon,
} from "phosphor-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { tmdbImage } from "../constants/images";
import { colors } from "@/lib/theme/tokens.generated";

interface CinemaTrailerModalProps {
  visible: boolean;
  trailerKey?: string;
  movieTitle: string;
  backdropPath?: string;
  posterPath?: string;
  onClose: () => void;
}

export default function CinemaTrailerModal({
  visible,
  trailerKey,
  movieTitle,
  backdropPath,
  posterPath,
  onClose,
}: CinemaTrailerModalProps) {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16));
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
      <View className="flex-1 justify-between bg-background/[0.96]">
        <View
          className="flex-row items-center justify-between px-4 pb-3"
          style={{ paddingTop: insets.top + 8 }}
        >
          <Pressable
            onPress={handleClose}
            className="h-10 w-10 items-center justify-center rounded-full bg-surface-5 active:opacity-70"
            accessibilityLabel="Close trailer"
          >
            <ArrowLeftIcon size={22} color={colors.white} />
          </Pressable>

          <View className="mx-3 flex-1 items-center">
            <Text
              className="text-center text-[16px] tracking-[-0.2px] font-brandBold text-white"
              numberOfLines={1}
            >
              {movieTitle}
            </Text>
            <View className="mt-[3px] flex-row items-center gap-1">
              <PlayCircleIcon
                size={12}
                color={colors.gold}
              />
              <Text className="text-[10px] tracking-[1px] font-brandBold text-amber-500">
                OFFICIAL TRAILER
              </Text>
            </View>
          </View>

          {trailerKey ? (
            <Pressable
              onPress={handleOpenYouTube}
              className="h-10 w-10 items-center justify-center rounded-full bg-surface-5 active:opacity-70"
              accessibilityLabel="Open in YouTube"
            >
              <YoutubeLogoIcon size={22} color="#FF0000" />
            </Pressable>
          ) : (
            <View className="h-10 w-10" />
          )}
        </View>

        <View className="relative w-full items-center justify-center">
          <View className="absolute h-full w-[90%] rounded-[30px] bg-primary/[0.08] blur-[40px]" />

          <View
            className="w-full items-center justify-center overflow-hidden bg-black"
            style={{ height: VIDEO_HEIGHT }}
          >
            {backdropSrc && !isReady && !playerError ? (
              <View className="absolute inset-0">
                <Image
                  source={{ uri: backdropSrc }}
                  style={AbsoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                <View className="absolute inset-0 items-center justify-center gap-2.5 bg-background/[0.75]">
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text className="text-[12px] tracking-[0.2px] font-brandMedium text-zinc-300">
                    Connecting cinema reel...
                  </Text>
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
              <View className="absolute inset-0 items-center justify-center gap-2 bg-surface-2 px-6">
                <YoutubeLogoIcon size={44} color="#FF0000" />
                <Text className="mt-1 text-[16px] font-brandBold text-white">
                  Studio Restricted Playback
                </Text>
                <Text className="mb-1.5 text-center text-[13px] leading-[18px] font-brand text-zinc-400">
                  This distributor restricts embedded mobile playback. You can
                  view the full trailer directly in YouTube.
                </Text>
                <Pressable
                  onPress={handleOpenYouTube}
                  className="flex-row items-center gap-1.5 rounded-[20px] bg-primary px-4 py-2.5 active:opacity-85"
                >
                  <ArrowSquareOutIcon size={16} color={colors.white} />
                  <Text className="text-[12px] tracking-[0.4px] font-brandBold text-white">
                    WATCH ON YOUTUBE
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>

        <View
          className="items-center px-5"
          style={{ paddingBottom: insets.bottom + 20 }}
        >
          {trailerKey && !playerError ? (
            <Pressable
              onPress={handleOpenYouTube}
              className="w-full max-w-[280px] flex-row items-center justify-center gap-2 rounded-[24px] border border-white/[0.08] bg-surface-5 px-5 py-3 active:opacity-80"
            >
              <YoutubeLogoIcon size={20} color="#FF0000" />
              <Text className="text-[13px] font-brandSemiBold text-white">
                Open in YouTube App
              </Text>
              <ArrowUpRightIcon
                size={16}
                color={colors.subtleForeground}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const AbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
