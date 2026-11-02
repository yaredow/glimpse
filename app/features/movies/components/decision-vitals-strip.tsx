import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Movie } from "../types/movies.type";
import {
  formatEndTime,
  formatLanguage,
  formatRuntime,
  ratingBand,
} from "../utils/deck";

interface DecisionVitalsStripProps {
  movie: Movie;
}

export default function DecisionVitalsStrip({ movie }: DecisionVitalsStripProps) {
  const runtimeFormatted = formatRuntime(movie.runtime);
  const endTime = formatEndTime(movie.runtime);

  const hasScore =
    typeof movie.vote_average === "number" && movie.vote_average > 0;
  const score = hasScore ? `${movie.vote_average.toFixed(1)} ★` : "—";
  const scoreBand = hasScore
    ? ratingBand(movie.vote_average) ?? "Audience Rated"
    : "Unrated";

  const language = formatLanguage(movie.original_language);
  const isEnglish = (movie.original_language || "en").toLowerCase() === "en";
  const audioSubtext = isEnglish ? "Original audio" : "Subtitled";

  return (
    <View style={styles.container}>
      {/* 1. Schedule & Runtime */}
      <View style={styles.column}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#71717A" />
          <Text style={styles.label}>TIME</Text>
        </View>
        <Text style={styles.primaryText} numberOfLines={1}>
          {runtimeFormatted}
        </Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {endTime ?? "Tonight's feature"}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 2. Rating & Consensus */}
      <View style={styles.column}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="star" size={13} color="#F59E0B" />
          <Text style={styles.label}>CONSENSUS</Text>
        </View>
        <Text style={styles.primaryText} numberOfLines={1}>
          {score}
        </Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {scoreBand}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* 3. Language & Audio */}
      <View style={styles.column}>
        <View style={styles.headerRow}>
          <MaterialCommunityIcons name="translate" size={13} color="#71717A" />
          <Text style={styles.label}>AUDIO</Text>
        </View>
        <Text style={styles.primaryText} numberOfLines={1}>
          {language}
        </Text>
        <Text style={styles.secondaryText} numberOfLines={1}>
          {audioSubtext}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  column: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#71717A",
    textTransform: "uppercase",
  },
  primaryText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  secondaryText: {
    fontSize: 11,
    color: "#A1A1AA",
    marginTop: 2,
  },
});

