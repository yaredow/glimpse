import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#E50914" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Couldn&apos;t load movie</Text>
        <Pressable onPress={() => refetch()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Movie not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.animatedHeader,
          {
            paddingTop: insets.top,
            backgroundColor: "rgba(20, 20, 20, 1)",
          },
          headerAnimatedStyle,
        ]}
        pointerEvents="box-none"
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movie.title}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.backButton, buttonAnimatedStyle]}>
        <Pressable onPress={() => router.back()} style={styles.backPressable}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </Pressable>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
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
            <View style={styles.detailsSection}>
              {movie.original_title && movie.original_title !== movie.title ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ORIGINAL TITLE</Text>
                  <Text style={styles.detailValue}>{movie.original_title}</Text>
                </View>
              ) : null}
              {movie.tagline ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>TAGLINE</Text>
                  <Text style={styles.detailValue}>{movie.tagline}</Text>
                </View>
              ) : null}
              {movie.spoken_languages && movie.spoken_languages.length > 0 ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>LANGUAGES</Text>
                  <Text style={styles.detailValue}>
                    {movie.spoken_languages.join(", ")}
                  </Text>
                </View>
              ) : null}
              {movie.production_countries &&
              movie.production_countries.length > 0 ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>COUNTRIES</Text>
                  <Text style={styles.detailValue}>
                    {movie.production_countries.join(", ")}
                  </Text>
                </View>
              ) : null}
              {movie.vote_count ? (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>COMMUNITY CONSENSUS</Text>
                  <Text style={styles.detailValue}>
                    {movie.vote_average.toFixed(1)} / 10 ({movie.vote_count.toLocaleString()} registered ratings)
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#141414",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#141414",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  animatedHeader: {
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
  headerTitle: {
    flex: 1,
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    left: 0,
    zIndex: 11,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  backPressable: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "white",
    fontSize: 16,
  },
  retryText: {
    color: "#E50914",
    fontSize: 14,
    fontWeight: "bold",
  },
  detailsSection: {
    gap: 16,
  },
  detailItem: {
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#E50914",
  },
  detailValue: {
    fontSize: 14,
    color: "#F0F0F0",
    lineHeight: 20,
  },
});
