import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import { tmdbImage } from "../consants/images";
import { useGetMovie } from "../hooks/query/use-get-movie";
import WhereToWatch from "./where-to-watch";
import PreShowBrief from "./pre-show-brief";
import VerdictModal from "./verdict-modal";
import CinemaTrailerModal from "./cinema-trailer-modal";
import type { GridMovie } from "../types/movies.type";

interface ShowtimeHubProps {
  movie: GridMovie;
  onLogWatched: (movie: GridMovie, rating: number) => void;
  onOpenDetails: (movie: GridMovie) => void;
}

const { width: SW } = Dimensions.get("window");
const HERO_H = Math.round(SW * 0.95);

export default function ShowtimeHub({
  movie,
  onLogWatched,
  onOpenDetails,
}: ShowtimeHubProps) {
  const theme = useAppTheme();
  const { data: detailData } = useGetMovie(movie.movie_id);
  const movieDetails = detailData?.movie;

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
    if (runtime) {
      const h = Math.floor(runtime / 60);
      const m = runtime % 60;
      parts.push(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    if (movie.genres?.length > 0) parts.push(movie.genres[0]);
    if (movie.vote_average > 0) parts.push(`★ ${movie.vote_average.toFixed(1)}`);
    return parts.join("  ·  ");
  }, [movie.genres, movie.vote_average, releaseYear, runtime]);

  const handleOpenTrailer = () => {
    if (trailerKey) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setShowTrailerModal(true);
    }
  };

  const handleCloseTrailer = () => {
    setShowTrailerModal(false);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroContainer}>
        {backdropSrc ? (
          <Image
            source={{ uri: backdropSrc }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1c1c1f" }]} />
        )}

        <LinearGradient
          colors={[
            "rgba(18, 18, 18, 0.2)",
            "rgba(18, 18, 18, 0.6)",
            "#121212",
          ]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroContent}>
          <View style={styles.featureBadge}>
            <MaterialCommunityIcons
              name="movie-open-star"
              size={14}
              color="#121212"
            />
            <Text style={styles.featureBadgeText}>TONIGHT&apos;S FEATURE</Text>
          </View>

          <Text style={styles.movieTitle}>{movie.title}</Text>

          {metaString ? <Text style={styles.metaText}>{metaString}</Text> : null}

          <View style={styles.heroButtonsRow}>
            {trailerKey ? (
              <Pressable
                onPress={handleOpenTrailer}
                style={({ pressed }) => [
                  styles.trailerBtn,
                  { backgroundColor: theme.colors.primary },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
                <Text style={styles.trailerBtnText}>WATCH TRAILER</Text>
              </Pressable>
            ) : null}

            <Pressable
              onPress={() => onOpenDetails(movie)}
              style={({ pressed }) => [
                styles.detailsBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.8 },
              ]}
              accessibilityLabel="View full details"
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={theme.colors.textPrimary}
              />
              <Text style={styles.detailsBtnText}>DETAILS</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PreShowBrief movie={movie} runtime={runtime} />

      <WhereToWatch movieId={movie.movie_id} movieTitle={movie.title} />

      <View style={styles.postShowSection}>
        {movie.action === "watched" ? (
          <View
            style={[
              styles.verdictCtaBtn,
              {
                backgroundColor: theme.colors.elevation.level2,
                borderColor: theme.colors.outlineVariant,
                borderWidth: 1,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={18}
              color={theme.colors.success}
            />
            <Text
              style={[
                styles.verdictCtaText,
                { color: theme.colors.textPrimary },
              ]}
            >
              VERDICT LOGGED · ADDED TO JOURNAL
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => setShowVerdictModal(true)}
            style={({ pressed }) => [
              styles.verdictCtaBtn,
              { backgroundColor: theme.colors.success },
              pressed && { opacity: 0.85 },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.verdictCtaText}>FINISHED WATCHING? LOG VERDICT</Text>
          </Pressable>
        )}

        <View style={styles.countdownBox}>
          <MaterialCommunityIcons
            name="timer-sand"
            size={14}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.countdownText, { color: theme.colors.textMuted }]}>
            Next daily reel drops in {countdown}
          </Text>
        </View>
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

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  heroContainer: {
    width: SW,
    height: HERO_H,
    justifyContent: "flex-end",
    position: "relative",
  },
  heroContent: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  featureBadgeText: {
    color: "#121212",
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
  },
  movieTitle: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  metaText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    marginTop: 6,
    letterSpacing: 0.2,
  },
  heroButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  trailerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    height: 42,
    borderRadius: 12,
  },
  trailerBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  detailsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailsBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  postShowSection: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 28,
    alignItems: "center",
  },
  verdictCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 48,
    borderRadius: 14,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  verdictCtaText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.6,
  },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
  },
  countdownText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12.5,
  },
});
