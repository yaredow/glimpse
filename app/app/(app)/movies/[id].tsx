import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMovie } from "@/features/movies/hooks/query/use-get-movie";
import type { MovieInteractionAction } from "@/features/movies/types/movies.type";
import MovieTrailer from "@/features/movies/components/movie-trailer";
import MovieActions from "@/features/movies/components/movie-actions";
import MovieCast from "@/features/movies/components/movie-cast";
import MovieReviews from "@/features/movies/components/movie-reviews";
import MovieDetailTabs from "@/features/movies/components/movie-detail-tabs";
import DecisionVitalsStrip from "@/features/movies/components/decision-vitals-strip";
import CuratorPitchCard from "@/features/movies/components/curator-pitch-card";
import WhereToWatch from "@/features/movies/components/where-to-watch";
import { colors } from "@/lib/theme/tokens.generated";

const HEADER_THRESHOLD = 300;

export default function MovieDetail() {
  const router = useRouter();
  const { id, sessionId, slot, action } = useLocalSearchParams<{
    id: string;
    sessionId?: string;
    slot?: string;
    action?: string;
  }>();
  const movieId = Number.parseInt(String(id), 10);
  const insets = useSafeAreaInsets();

  const { data, isPending, isError, refetch } = useGetMovie(
    Number.isFinite(movieId) ? movieId : 0,
  );

  const movie = data?.movie;

  const [activeTab, setActiveTab] = useState("CAST");
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_THRESHOLD],
      [0, 1],
      "clamp",
    ),
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    top: interpolate(
      scrollY.value,
      [0, HEADER_THRESHOLD],
      [insets.top + 20, insets.top],
      "clamp",
    ),
  }));

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-2">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-2">
        <Text className="text-[16px] text-white">Couldn&apos;t load movie</Text>
        <Pressable
          onPress={() => refetch()}
          accessibilityRole="button"
          accessibilityLabel="Retry loading movie"
        >
          <Text className="text-[14px] font-brandBold text-primary">
            Tap to retry
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!movie) {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-surface-2">
        <Text className="text-[16px] text-white">Movie not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-2">
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            paddingBottom: 12,
            zIndex: 10,
            height: 90,
          },
          { paddingTop: insets.top, backgroundColor: colors.surface2 },
          headerAnimatedStyle,
        ]}
        pointerEvents="box-none"
      >
        <Text
          className="flex-1 text-center text-[18px] font-brandBold text-white"
          numberOfLines={1}
        >
          {movie.title}
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            left: 0,
            zIndex: 11,
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "center",
            paddingHorizontal: 16,
          },
          buttonAnimatedStyle,
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.15] bg-black/55"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={6}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          { paddingBottom: 40 },
          { paddingBottom: insets.bottom + 48 },
        ]}
      >
        <MovieTrailer movie={movie} />

        <DecisionVitalsStrip movie={movie} />

        <MovieActions
          movie={movie}
          sessionId={sessionId}
          slot={slot ? Number.parseInt(slot, 10) : undefined}
          initialAction={action as MovieInteractionAction | undefined}
          onActionComplete={() => router.back()}
        />

        <CuratorPitchCard movie={movie} />

        <WhereToWatch movieId={movie.id} movieTitle={movie.title} />

        <MovieDetailTabs activeTab={activeTab} onTabPress={setActiveTab}>
          {activeTab === "CAST" && movie.cast_members ? (
            <MovieCast cast={movie.cast_members} />
          ) : null}
          {activeTab === "REVIEWS" ? (
            <MovieReviews movieId={movie.id} />
          ) : null}
          {activeTab === "DETAILS" && (
            <View className="gap-4">
              {movie.full_synopsis ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    SYNOPSIS
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.full_synopsis}
                  </Text>
                </View>
              ) : null}
              {movie.original_title && movie.original_title !== movie.title ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    ORIGINAL TITLE
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.original_title}
                  </Text>
                </View>
              ) : null}
              {movie.tagline ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    TAGLINE
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.tagline}
                  </Text>
                </View>
              ) : null}
              {movie.spoken_languages && movie.spoken_languages.length > 0 ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    LANGUAGES
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.spoken_languages.join(", ")}
                  </Text>
                </View>
              ) : null}
              {movie.production_countries &&
              movie.production_countries.length > 0 ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    COUNTRIES
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.production_countries.join(", ")}
                  </Text>
                </View>
              ) : null}
              {movie.vote_count ? (
                <View className="gap-1">
                  <Text className="text-[12px] font-brandBold text-primary">
                    COMMUNITY CONSENSUS
                  </Text>
                  <Text className="text-[14px] leading-5 text-zinc-100">
                    {movie.vote_average.toFixed(1)} / 10 (
                    {movie.vote_count.toLocaleString()} registered ratings)
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </MovieDetailTabs>
      </Animated.ScrollView>
    </View>
  );
}
