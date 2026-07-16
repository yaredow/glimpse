import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetMovie } from "@/features/movies/hooks/query/use-get-movie";
import MovieTrailer from "@/features/movies/components/movie-trailer";
import MovieActions from "@/features/movies/components/movie-actions";
import MovieSynopsis from "@/features/movies/components/movie-synopsis";
import MovieCast from "@/features/movies/components/movie-cast";
import MovieDetailTabs from "@/features/movies/components/movie-detail-tabs";

const HEADER_THRESHOLD = 300;

export default function MovieDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number.parseInt(String(id), 10);
  const insets = useSafeAreaInsets();

  const { data, isPending, isError, refetch } = useGetMovie(
    Number.isFinite(movieId) ? movieId : 0,
  );

  const movie = data?.movie;

  const [activeTab, setActiveTab] = useState("CAST");
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const buttonTop = scrollY.interpolate({
    inputRange: [0, HEADER_THRESHOLD],
    outputRange: [insets.top + 20, insets.top],
    extrapolate: "clamp",
  });

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
            opacity: headerOpacity,
          },
        ]}
      >
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movie.title}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.backButton, { top: buttonTop }]}>
        <Pressable onPress={() => router.back()} style={styles.backPressable}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </Pressable>
      </Animated.View>

      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <MovieTrailer movie={movie} />
        <MovieActions movie={movie} onToggleWatched={() => {}} />
        {movie.full_synopsis ? (
          <MovieSynopsis synopsis={movie.full_synopsis} />
        ) : null}

        <MovieDetailTabs activeTab={activeTab} onTabPress={setActiveTab}>
          {activeTab === "CAST" && movie.cast_members ? (
            <MovieCast cast={movie.cast_members} />
          ) : null}
          {activeTab === "DETAILS" && (
            <View style={styles.detailsSection}>
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
                  <Text style={styles.detailLabel}>RATING</Text>
                  <Text style={styles.detailValue}>
                    {movie.vote_average.toFixed(1)} / 10 (
                    {movie.vote_count.toLocaleString()} votes)
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </MovieDetailTabs>
      </ScrollView>
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
    padding: 5,
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
