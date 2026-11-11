import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
import type { GridMovie } from "../types/movies.type";

interface PreShowBriefProps {
  movie: GridMovie;
  runtime?: number | null;
}

export default function PreShowBrief({ movie, runtime }: PreShowBriefProps) {
  const theme = useAppTheme();
  const hasRuntime = typeof runtime === "number" && runtime > 0;

  const runtimeFormatted = hasRuntime
    ? (() => {
        const hours = Math.floor(runtime / 60);
        const minutes = runtime % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
      })()
    : null;

  const estimatedEndTime = useMemo(() => {
    if (!hasRuntime) return null;

    const now = new Date();
    const finishDate = new Date(now.getTime() + runtime * 60 * 1000);
    return finishDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [hasRuntime, runtime]);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={18}
          color={theme.colors.gold}
        />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Pre-Show Brief
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level2,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        {hasRuntime ? (
          <View style={styles.timeRow}>
            <View style={styles.timeStat}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                RUNTIME
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
                {runtimeFormatted}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.outlineVariant }]} />

            <View style={styles.timeStat}>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
                ESTIMATED END
              </Text>
              <Text style={[styles.statValue, { color: theme.colors.gold }]}>
                {estimatedEndTime ? `~${estimatedEndTime}` : "—"}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={[styles.runtimeUnavailable, { color: theme.colors.textMuted }]}>
            Runtime unavailable
          </Text>
        )}

        {movie.tagline ? (
          <Text style={[styles.tagline, { color: theme.colors.textPrimary }]}>
            &ldquo;{movie.tagline}&rdquo;
          </Text>
        ) : null}

        {movie.vague_description ? (
          <Text style={[styles.synopsis, { color: theme.colors.textSecondary }]}>
            {movie.vague_description}
          </Text>
        ) : null}

        {movie.genres?.length > 0 ? (
          <View style={styles.genresRow}>
            {movie.genres.map((g) => (
              <View
                key={g}
                style={[
                  styles.genreBadge,
                  {
                    backgroundColor: theme.colors.elevation.level3,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <Text
                  style={[styles.genreBadgeText, { color: theme.colors.textSecondary }]}
                >
                  {g}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingBottom: 14,
  },
  timeStat: {
    alignItems: "center",
  },
  statLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  statValue: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 17,
  },
  runtimeUnavailable: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 13,
    textAlign: "center",
    paddingBottom: 14,
  },
  divider: {
    width: 1,
    height: 28,
  },
  tagline: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
    textAlign: "center",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  synopsis: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  genreBadgeText: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 11,
    letterSpacing: 0.2,
  },
});

