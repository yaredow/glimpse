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
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { tmdbImage } from "../consants/images";
import { useGetMovie } from "../hooks/query/use-get-movie";
import { useMovieSources } from "../hooks/query/use-movie-sources";
import VerdictModal from "./verdict-modal";
import CinemaTrailerModal from "./cinema-trailer-modal";
import type { GridMovie, WatchProvider } from "../types/movies.type";

interface ShowtimeHubProps {
  movie: GridMovie;
  onLogWatched: (movie: GridMovie, rating: number) => void;
  onOpenDetails: (movie: GridMovie) => void;
}

const { width: SW } = Dimensions.get("window");
const HERO_H = Math.round(SW * 0.88);

export default function ShowtimeHub({
  movie,
  onLogWatched,
  onOpenDetails,
}: ShowtimeHubProps) {
  const theme = useAppTheme();
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
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. CINEMA HERO */}
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
            "rgba(18, 18, 18, 0.15)",
            "rgba(18, 18, 18, 0.65)",
            "#121212",
          ]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.heroContent}>
          <View style={styles.featureBadge}>
            <MaterialCommunityIcons
              name="movie-open-star"
              size={13}
              color="#121212"
            />
            <Text style={styles.featureBadgeText}>TONIGHT&apos;S FEATURE</Text>
          </View>

          <Text style={styles.movieTitle}>{movie.title}</Text>

          {metaString ? <Text style={styles.metaText}>{metaString}</Text> : null}
          {movieDetails?.director ? (
            <Text style={styles.directorText}>
              Directed by {movieDetails.director}
            </Text>
          ) : null}
        </View>
      </View>

      {/* 2. THE LAUNCHPAD (Primary Streaming Action) */}
      <View style={styles.launcherSection}>
        {primaryProvider ? (
          <Pressable
            onPress={handleOpenPrimaryProvider}
            style={({ pressed }) => [
              styles.primaryLaunchBtn,
              pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
            ]}
          >
            <View style={styles.playIconCircle}>
              <MaterialCommunityIcons name="play" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.launchBtnTexts}>
              <Text style={styles.launchBtnAction}>
                {isStreaming ? "STREAM NOW ON" : "RENT NOW ON"}
              </Text>
              <Text style={styles.launchBtnProvider}>
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
            style={({ pressed }) => [
              styles.primaryLaunchBtn,
              styles.launchFallbackBtn,
              pressed && { opacity: 0.9 },
            ]}
          >
            <MaterialCommunityIcons name="magnify" size={20} color="#FFFFFF" />
            <Text style={styles.launchFallbackText}>FIND WHERE TO WATCH</Text>
          </Pressable>
        )}

        {otherProviders.length > 0 ? (
          <View style={styles.otherProvidersRow}>
            <Text style={styles.otherProvidersLabel}>Also on:</Text>
            <View style={styles.otherProvidersList}>
              {otherProviders.map((prov) => (
                <Pressable
                  key={prov.provider_id}
                  onPress={() =>
                    handleOpenLink(
                      providers?.justwatch_link || searchLinks?.justwatch || "",
                    )
                  }
                  style={styles.otherProviderPill}
                >
                  <Text style={styles.otherProviderName}>{prov.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      {/* 3. SCHEDULE & PRE-SHOW BAR */}
      <View style={styles.scheduleCard}>
        <View style={styles.scheduleInfo}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color="#A1A1AA"
          />
          <View style={styles.scheduleTexts}>
            <Text style={styles.scheduleMain}>
              {runtimeFormatted ? `${runtimeFormatted}` : "Runtime TBA"}
              {estimatedEndTime ? ` · Finishes ~${estimatedEndTime}` : ""}
            </Text>
            <Text style={styles.scheduleSub}>Tonight&apos;s Feature Schedule</Text>
          </View>
        </View>

        {trailerKey ? (
          <Pressable
            onPress={handleOpenTrailer}
            style={({ pressed }) => [
              styles.preShowTrailerBtn,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityLabel="Play pre-show trailer"
          >
            <MaterialCommunityIcons
              name="play-circle-outline"
              size={15}
              color="#FFFFFF"
            />
            <Text style={styles.preShowTrailerText}>PRE-SHOW</Text>
          </Pressable>
        ) : null}
      </View>

      {/* 4. POST-SHOW RITUAL & VERDICT */}
      <View style={styles.verdictSection}>
        <View style={styles.verdictCard}>
          <View style={styles.verdictHeader}>
            <MaterialCommunityIcons
              name="star-box-multiple-outline"
              size={17}
              color={theme.colors.gold}
            />
            <Text style={styles.verdictTitle}>THE NIGHT&apos;S VERDICT</Text>
          </View>

          {movie.action === "watched" ? (
            <View style={styles.loggedState}>
              <View style={styles.loggedIconRow}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={22}
                  color={theme.colors.success}
                />
                <Text style={styles.loggedTitle}>Verdict Recorded</Text>
              </View>
              <Text style={styles.loggedSubtitle}>
                Saved to your Journal and added to your Taste DNA.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.verdictPrompt}>
                When the credits roll, rate tonight&apos;s feature to close the
                session and calibrate tomorrow&apos;s reel.
              </Text>
              <Pressable
                onPress={() => setShowVerdictModal(true)}
                style={({ pressed }) => [
                  styles.logVerdictBtn,
                  pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                ]}
              >
                <MaterialCommunityIcons
                  name="star-outline"
                  size={18}
                  color="#121212"
                />
                <Text style={styles.logVerdictBtnText}>
                  FINISHED WATCHING? RATE IT
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.countdownRow}>
          <MaterialCommunityIcons
            name="timer-sand"
            size={14}
            color="#71717A"
          />
          <Text style={styles.countdownText}>
            Next daily reel drops in {countdown}
          </Text>
        </View>

        <Pressable
          onPress={() => onOpenDetails(movie)}
          style={styles.detailsQuietLink}
        >
          <Text style={styles.detailsQuietText}>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#F59E0B",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
    marginBottom: 8,
  },
  featureBadgeText: {
    color: "#121212",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  movieTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 31,
    letterSpacing: -0.4,
  },
  metaText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 6,
    letterSpacing: 0.2,
  },
  directorText: {
    color: "#A1A1AA",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 3,
  },
  launcherSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  primaryLaunchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E50914",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: "#E50914",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  launchFallbackBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    gap: 8,
  },
  launchFallbackText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  playIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  launchBtnTexts: {
    flex: 1,
    marginLeft: 12,
  },
  launchBtnAction: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  launchBtnProvider: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  otherProvidersRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
    paddingHorizontal: 4,
  },
  otherProvidersLabel: {
    fontSize: 11,
    color: "#71717A",
    fontWeight: "500",
  },
  otherProvidersList: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  otherProviderPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  otherProviderName: {
    fontSize: 11,
    color: "#D4D4D8",
    fontWeight: "600",
  },
  scheduleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  scheduleTexts: {
    flex: 1,
  },
  scheduleMain: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  scheduleSub: {
    color: "#71717A",
    fontSize: 11,
    marginTop: 1,
  },
  preShowTrailerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  preShowTrailerText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  verdictSection: {
    paddingHorizontal: 16,
    marginTop: 16,
    alignItems: "center",
  },
  verdictCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  verdictHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  verdictTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#F59E0B",
  },
  verdictPrompt: {
    fontSize: 13,
    lineHeight: 19,
    color: "#A1A1AA",
    marginBottom: 14,
  },
  logVerdictBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    height: 46,
    borderRadius: 12,
    backgroundColor: "#F59E0B",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  logVerdictBtnText: {
    color: "#121212",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  loggedState: {
    paddingVertical: 6,
  },
  loggedIconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  loggedTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  loggedSubtitle: {
    color: "#71717A",
    fontSize: 12,
    lineHeight: 17,
  },
  countdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
  },
  countdownText: {
    fontSize: 12,
    color: "#71717A",
  },
  detailsQuietLink: {
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailsQuietText: {
    fontSize: 12,
    color: "#71717A",
    textDecorationLine: "underline",
  },
});
