import { useState } from "react";
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { tmdbImage } from "../consants/images";
import type { GridMovie } from "../types/movies.type";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - 40;
const POSTER_H = CARD_W * 1.35;

interface TonightHeroProps {
  movie: GridMovie;
  syncsRemaining: number;
  onLockIn: () => void;
  onSync: () => void;
  onViewDetails: () => void;
  isLockingIn?: boolean;
}

export default function TonightHero({
  movie,
  syncsRemaining,
  onLockIn,
  onSync,
  onViewDetails,
  isLockingIn = false,
}: TonightHeroProps) {
  const [posterError, setPosterError] = useState(false);
  const isLockedIn = movie.action === "locked_in";
  const posterSrc = tmdbImage(movie.poster_path || movie.backdrop_path, "w500");
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <View style={styles.container}>
      {/* Featured Card */}
      <Pressable onPress={onViewDetails} style={styles.card}>
        {posterSrc && !posterError ? (
          <Image
            source={{ uri: posterSrc }}
            style={styles.poster}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            onError={() => setPosterError(true)}
          />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderTitle}>{movie.title}</Text>
          </View>
        )}

        {/* Top Status Badge */}
        <View style={styles.badgeContainer} pointerEvents="none">
          {isLockedIn ? (
            <View style={[styles.badge, styles.lockedBadge]}>
              <MaterialCommunityIcons name="play-circle" size={14} color="#f59e0b" />
              <Text style={styles.lockedBadgeText}>NOW WATCHING</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.pickBadge]}>
              <MaterialCommunityIcons name="star" size={14} color="#f59e0b" />
              <Text style={styles.pickBadgeText}>TODAY&apos;S PICK</Text>
            </View>
          )}
        </View>

        {/* Bottom Details Gradient */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", "rgba(10,10,10,0.98)"]}
          locations={[0, 0.45, 1]}
          style={styles.gradient}
        >
          <View style={styles.cardInfo}>
            <Text style={styles.title} numberOfLines={2}>
              {movie.title}
            </Text>

            <View style={styles.metaRow}>
              {movie.vote_average > 0 ? (
                <View style={styles.ratingBadge}>
                  <MaterialCommunityIcons name="star" size={13} color="#FFD700" />
                  <Text style={styles.ratingText}>
                    {movie.vote_average.toFixed(1)}
                  </Text>
                </View>
              ) : null}

              {releaseYear ? (
                <Text style={styles.metaYear}>{releaseYear}</Text>
              ) : null}

              <Text style={styles.metaDot}>•</Text>
              <Text style={styles.metaSlot}>Slot #{movie.slot_number}</Text>
            </View>

            {movie.tagline ? (
              <Text style={styles.tagline} numberOfLines={2}>
                &ldquo;{movie.tagline}&rdquo;
              </Text>
            ) : movie.vague_description ? (
              <Text style={styles.tagline} numberOfLines={2}>
                {movie.vague_description}
              </Text>
            ) : null}

            {movie.genres.length > 0 ? (
              <View style={styles.genreRow}>
                {movie.genres.slice(0, 3).map((genre) => (
                  <View key={genre} style={styles.genreChip}>
                    <Text style={styles.genreText}>{genre}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <View style={styles.detailsPrompt}>
              <Text style={styles.detailsPromptText}>Tap card for full synopsis &amp; cast</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#888" />
            </View>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Action Controls */}
      <View style={styles.actionsContainer}>
        {isLockedIn ? (
          <View style={styles.celebrationBox}>
            <MaterialCommunityIcons name="popcorn" size={26} color="#f59e0b" />
            <View style={styles.celebrationTexts}>
              <Text style={styles.celebrationTitle}>Selection Locked For Today</Text>
              <Text style={styles.celebrationSubtitle}>
                Grab your popcorn and enjoy the movie!
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Primary: Lock In */}
            <Pressable
              style={[styles.lockInBtn, isLockingIn && styles.btnDisabled]}
              disabled={isLockingIn}
              onPress={onLockIn}
            >
              {isLockingIn ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <>
                  <MaterialCommunityIcons name="play-circle" size={20} color="#000" />
                  <Text style={styles.lockInBtnText}>Lock In for Today</Text>
                </>
              )}
            </Pressable>

            {/* Secondary: Sync Fresh Batch */}
            {syncsRemaining > 0 ? (
              <Pressable style={styles.syncBtn} onPress={onSync}>
                <MaterialCommunityIcons name="sync" size={16} color="#E50914" />
                <Text style={styles.syncBtnText}>
                  Sync Fresh Batch ({syncsRemaining} left)
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.noSyncsText}>No syncs remaining today</Text>
            )}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    width: CARD_W,
    height: POSTER_H,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#161616",
    borderWidth: 2,
    borderColor: "#f59e0b",
  },
  poster: {
    ...StyleSheet.absoluteFill,
  },
  placeholder: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#202020",
    padding: 20,
  },
  placeholderTitle: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "PlusJakartaSans_700Bold",
    textAlign: "center",
  },
  badgeContainer: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  pickBadge: {
    borderColor: "rgba(245, 158, 11, 0.6)",
  },
  pickBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.8,
  },
  lockedBadge: {
    borderColor: "rgba(245, 158, 11, 0.8)",
  },
  lockedBadgeText: {
    color: "#f59e0b",
    fontSize: 11,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.8,
  },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
  },
  cardInfo: {
    padding: 18,
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: -0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  metaYear: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
  },
  metaDot: {
    color: "#666",
    fontSize: 12,
  },
  metaSlot: {
    color: "#888",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  tagline: {
    color: "#ccc",
    fontSize: 13,
    fontStyle: "italic",
    fontFamily: "PlusJakartaSans_400Regular",
    lineHeight: 18,
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  genreChip: {
    backgroundColor: "rgba(245, 158, 11, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  genreText: {
    color: "#f59e0b",
    fontSize: 10,
    fontFamily: "PlusJakartaSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailsPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  detailsPromptText: {
    color: "#888",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  actionsContainer: {
    width: CARD_W,
    gap: 12,
    alignItems: "center",
  },
  lockInBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    borderRadius: 12,
  },
  lockInBtnText: {
    color: "#000",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(229, 9, 20, 0.5)",
    backgroundColor: "rgba(229, 9, 20, 0.08)",
  },
  syncBtnText: {
    color: "#E50914",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  noSyncsText: {
    color: "#666",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
  celebrationBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    borderRadius: 14,
    padding: 16,
  },
  celebrationTexts: {
    flex: 1,
    gap: 2,
  },
  celebrationTitle: {
    color: "#f59e0b",
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
  },
  celebrationSubtitle: {
    color: "#aaa",
    fontSize: 12,
    fontFamily: "PlusJakartaSans_400Regular",
  },
});
