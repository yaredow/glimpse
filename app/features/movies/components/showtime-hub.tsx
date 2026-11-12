import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { tmdbImage } from "../constants/images";
import { useGetMovie } from "../hooks/query/use-get-movie";
import { useMovieSources } from "../hooks/query/use-movie-sources";
import VerdictModal from "./verdict-modal";
import CinemaTrailerModal from "./cinema-trailer-modal";
import type { GridMovie, WatchProvider } from "../types/movies.type";
import { colors } from "@/lib/theme/tokens.generated";

interface ShowtimeHubProps {
  movie: GridMovie;
  onLogWatched: (movie: GridMovie, rating: number) => void;
  onOpenDetails: (movie: GridMovie) => void;
}

const AbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export default function ShowtimeHub({
  movie,
  onLogWatched,
  onOpenDetails,
}: ShowtimeHubProps) {
  const { width: SW } = useWindowDimensions();
  const HERO_H = Math.round(SW * 0.88);
  const { data: detailData } = useGetMovie(movie.movie_id);
  const movieDetails = detailData?.movie;

  const { data: sourcesData } = useMovieSources(movie.movie_id);
  const sources = sourcesData?.sources;
  const providers = sources?.providers;
  const searchLinks = sources?.search_links;

  const [showVerdictModal, setShowVerdictModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [countdown, setCountdown] = useState("");

  const trailerKey = movieDetails?.trailer_key;
  const runtime = movieDetails?.runtime ?? null;
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const backdropSrc = tmdbImage(
    movieDetails?.backdrop_path || movie.backdrop_path || movie.poster_path,
    "w1280",
  );

  // Normalize and deduplicate providers
  const cleanStreaming = useMemo(() => {
    const flatrate = providers?.flatrate ?? [];
    const seen = new Set<string>();
    return flatrate.filter((prov) => {
      const base = prov.name
        .replace(/\s+(Amazon|Apple\s*TV|Roku)\s+Channel.*/i, "")
        .trim();
      const key = base.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [providers?.flatrate]);

  const cleanRent = useMemo(() => {
    const rent = providers?.rent ?? [];
    const seen = new Set<string>();
    return rent.filter((prov) => {
      const base = prov.name
        .replace(/\s+(Amazon|Apple\s*TV|Roku)\s+Channel.*/i, "")
        .trim();
      const key = base.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [providers?.rent]);

  const primaryProvider: WatchProvider | undefined =
    cleanStreaming[0] ?? cleanRent[0];
  const isStreaming = cleanStreaming.length > 0;
  const otherProviders = isStreaming
    ? cleanStreaming.slice(1, 4)
    : cleanRent.slice(1, 4);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diffMs = midnight.getTime() - now.getTime();

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      setCountdown(`${hours}h ${String(mins).padStart(2, "0")}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const metaString = useMemo(() => {
    const parts: string[] = [];
    if (releaseYear) parts.push(String(releaseYear));
    if (movie.genres?.length > 0) parts.push(movie.genres[0]);
    if (movie.vote_average > 0) parts.push(`★ ${movie.vote_average.toFixed(1)}`);
    return parts.join("  ·  ");
  }, [movie.genres, movie.vote_average, releaseYear]);

  const hasRuntime = typeof runtime === "number" && runtime > 0;
  const runtimeFormatted = hasRuntime
    ? (() => {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      })()
    : null;

  const estimatedEndTime = useMemo(() => {
    if (!hasRuntime || !runtime) return null;
    const now = new Date();
    const finishDate = new Date(now.getTime() + runtime * 60 * 1000);
    return finishDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [hasRuntime, runtime]);

  const handleOpenTrailer = () => {
    if (trailerKey) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowTrailerModal(true);
    }
  };

  const handleCloseTrailer = () => {
    setShowTrailerModal(false);
  };

  const handleOpenLink = async (url?: string) => {
    if (!url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Linking.openURL(url);
    } catch {
      Toast.show({
        type: "error",
        text1: "Cannot Open Link",
        text2: "Unable to launch the requested source.",
      });
    }
  };

  const handleOpenPrimaryProvider = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetUrl =
      (primaryProvider?.name.toLowerCase().includes("netflix") &&
        searchLinks?.netflix) ||
      providers?.justwatch_link ||
      searchLinks?.justwatch ||
      searchLinks?.google;

    if (!targetUrl) {
      Toast.show({
        type: "info",
        text1: "Searching Source",
        text2: "Finding playback options...",
      });
      return;
    }

    try {
      await Linking.openURL(targetUrl);
    } catch {
      Toast.show({
        type: "error",
        text1: "Cannot Open Stream",
        text2: "Unable to launch the streaming app.",
      });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. CINEMA HERO */}
      <View
        className="relative justify-end"
        style={{ width: SW, height: HERO_H }}
      >
        {backdropSrc ? (
          <Image
            source={{ uri: backdropSrc }}
            style={AbsoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[AbsoluteFill, { backgroundColor: "#1c1c1f" }]} />
        )}

        <LinearGradient
          colors={[
            "rgba(18, 18, 18, 0.15)",
            "rgba(18, 18, 18, 0.65)",
            colors.surface1,
          ]}
          locations={[0, 0.5, 1]}
          style={AbsoluteFill}
        />

        <View className="px-5 pb-5">
          <View className="mb-2 self-start flex-row items-center gap-1.5 rounded-[7px] bg-amber-500 px-[9px] py-1">
            <MaterialCommunityIcons
              name="movie-open-star"
              size={13}
              color={colors.surface1}
            />
            <Text className="text-[10px] tracking-[1px] font-brandBold text-surface-1">
              TONIGHT&apos;S FEATURE
            </Text>
          </View>

          <Text className="text-[26px] leading-[31px] tracking-[-0.4px] font-brandExtraBold text-white">
            {movie.title}
          </Text>

          {metaString ? (
            <Text className="mt-1.5 text-[13px] tracking-[0.2px] font-brandMedium text-white/[0.75]">
              {metaString}
            </Text>
          ) : null}
          {movieDetails?.director ? (
            <Text className="mt-[3px] text-[12px] font-brandMedium text-zinc-400">
              Directed by {movieDetails.director}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 2. THE LAUNCHPAD (Primary Streaming Action) */}
      <View className="mt-4 px-4">
        {primaryProvider ? (
          <Pressable
            onPress={handleOpenPrimaryProvider}
            className="flex-row items-center justify-between rounded-[14px] bg-primary px-[18px] py-3.5 active:opacity-90 active:scale-[0.99]"
            style={{
              boxShadow: "0px 4px 10.0px rgba(229, 9, 20, 0.35)",
            }}
          >
            <View className="h-[34px] w-[34px] items-center justify-center rounded-[17px] bg-black/25">
              <MaterialCommunityIcons name="play" size={20} color={colors.white} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] tracking-[0.8px] font-brandBold text-white/[0.8]">
                {isStreaming ? "STREAM NOW ON" : "RENT NOW ON"}
              </Text>
              <Text className="text-[16px] tracking-[-0.2px] font-brandExtraBold text-white">
                {primaryProvider.name.toUpperCase()}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={18}
              color="rgba(255, 255, 255, 0.7)"
            />
          </Pressable>
        ) : (
          <Pressable
            onPress={() =>
              handleOpenLink(searchLinks?.justwatch || searchLinks?.google || "")
            }
            className="flex-row items-center justify-center gap-2 rounded-[14px] border border-white/[0.15] bg-white/[0.08] px-[18px] py-3.5 active:opacity-90"
            style={{
              boxShadow: "0px 4px 10.0px rgba(229, 9, 20, 0.35)",
            }}
          >
            <MaterialCommunityIcons name="magnify" size={20} color={colors.white} />
            <Text className="text-[13px] tracking-[0.6px] font-brandBold text-white">
              FIND WHERE TO WATCH
            </Text>
          </Pressable>
        )}

        {otherProviders.length > 0 ? (
          <View className="mt-2.5 flex-row items-center gap-2 px-1">
            <Text className="text-[11px] font-brandMedium text-zinc-500">
              Also on:
            </Text>
            <View className="flex-row flex-wrap items-center gap-1.5">
              {otherProviders.map((prov) => (
                <Pressable
                  key={prov.provider_id}
                  onPress={() =>
                    handleOpenLink(
                      providers?.justwatch_link || searchLinks?.justwatch || "",
                    )
                  }
                  className="rounded-[6px] border border-white/[0.08] bg-white/[0.06] px-2 py-[3px]"
                >
                  <Text className="text-[11px] font-brandSemiBold text-zinc-300">
                    {prov.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. SCHEDULE & PRE-SHOW BAR */}
      <View className="mx-4 mt-4 flex-row items-center justify-between rounded-[14px] border border-white/[0.07] bg-white/[0.03] px-3.5 py-3">
        <View className="flex-1 flex-row items-center gap-2.5">
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color={colors.subtleForeground}
          />
          <View className="flex-1">
            <Text className="text-[13px] font-brandBold text-white">
              {runtimeFormatted ? `${runtimeFormatted}` : "Runtime TBA"}
              {estimatedEndTime ? ` · Finishes ~${estimatedEndTime}` : ""}
            </Text>
            <Text className="mt-px text-[11px] text-zinc-500">
              Tonight&apos;s Feature Schedule
            </Text>
          </View>
        </View>

        {trailerKey ? (
          <Pressable
            onPress={handleOpenTrailer}
            className="flex-row items-center gap-1 rounded-[8px] border border-white/[0.12] bg-white/[0.08] px-2.5 py-1.5 active:opacity-80"
            accessibilityLabel="Play pre-show trailer"
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={15}
              color={colors.white}
            />
            <Text className="text-[10px] tracking-[0.6px] font-brandBold text-white">
              PRE-SHOW
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* 4. POST-SHOW RITUAL & VERDICT */}
      <View className="mt-4 items-center px-4">
        <View className="w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] p-4">
          <View className="mb-2 flex-row items-center gap-1.5">
            <MaterialCommunityIcons
              name="star-box-multiple-outline"
              size={17}
              color={colors.gold}
            />
            <Text className="text-[11px] tracking-[1px] font-brandBold text-amber-500">
              THE NIGHT&apos;S VERDICT
            </Text>
          </View>

          {movie.action === "watched" ? (
            <View className="py-1.5">
              <View className="mb-1 flex-row items-center gap-2">
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={22}
                  color={colors.success}
                />
                <Text className="text-[15px] font-brandBold text-white">
                  Verdict Recorded
                </Text>
              </View>
              <Text className="text-[12px] leading-[17px] text-zinc-500">
                Saved to your Journal and added to your Taste DNA.
              </Text>
            </View>
          ) : (
            <>
              <Text className="mb-3.5 text-[13px] leading-[19px] text-zinc-400">
                When the credits roll, rate tonight&apos;s feature to close the
                session and calibrate tomorrow&apos;s reel.
              </Text>
              <Pressable
                onPress={() => setShowVerdictModal(true)}
                className="h-[46px] w-full flex-row items-center justify-center gap-2 rounded-lg bg-amber-500 active:opacity-90 active:scale-[0.99]"
                style={{
                  boxShadow: "0px 4px 8.0px rgba(245, 158, 11, 0.3)",
                }}
              >
                <MaterialCommunityIcons
                  name="star-outline"
                  size={18}
                  color={colors.surface1}
                />
                <Text className="text-[12px] tracking-[0.6px] font-brandExtraBold text-surface-1">
                  FINISHED WATCHING? RATE IT
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View className="mt-3.5 flex-row items-center gap-1.5">
          <MaterialCommunityIcons
            name="timer-sand"
            size={14}
            color={colors.faintForeground}
          />
          <Text className="text-[12px] text-zinc-500">
            Next daily reel drops in {countdown}
          </Text>
        </View>

        <Pressable
          onPress={() => onOpenDetails(movie)}
          className="mt-[18px] px-3 py-1.5"
        >
          <Text className="text-[12px] text-zinc-500 underline">
            View full film synopsis &amp; cast &rarr;
          </Text>
        </Pressable>
      </View>

      <VerdictModal
        visible={showVerdictModal}
        movieTitle={movie.title}
        onConfirm={(rating) => {
          setShowVerdictModal(false);
          onLogWatched(movie, rating);
        }}
        onCancel={() => setShowVerdictModal(false)}
      />

      <CinemaTrailerModal
        visible={showTrailerModal}
        trailerKey={trailerKey}
        movieTitle={movie.title}
        backdropPath={movieDetails?.backdrop_path || movie.backdrop_path}
        posterPath={movie.poster_path}
        onClose={handleCloseTrailer}
      />
    </ScrollView>
  );
}

