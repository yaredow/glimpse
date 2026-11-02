import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Movie } from "../types/movies.type";
import { curatorNote, whyThisIsHere } from "../utils/deck";

interface CuratorPitchCardProps {
  movie: Movie;
}

export default function CuratorPitchCard({ movie }: CuratorPitchCardProps) {
  const pitch = curatorNote(movie);
  const rationale = whyThisIsHere(movie);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="compass-outline"
            size={14}
            color="#E50914"
          />
        </View>
        <Text style={styles.title}>CURATOR&apos;S TAKE</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>TONIGHT&apos;S REEL</Text>
        </View>
      </View>

      <Text style={styles.pitch}>&ldquo;{pitch}&rdquo;</Text>

      {rationale ? (
        <View style={styles.rationaleRow}>
          <MaterialCommunityIcons
            name="star-four-points"
            size={12}
            color="#A1A1AA"
          />
          <Text style={styles.rationaleText}>{rationale}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(229, 9, 20, 0.04)",
    borderColor: "rgba(229, 9, 20, 0.2)",
    borderWidth: 1,
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(229, 9, 20, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#E50914",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.6,
    color: "#A1A1AA",
  },
  pitch: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: "italic",
    color: "#F5F5F1",
  },
  rationaleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  rationaleText: {
    fontSize: 12,
    color: "#A1A1AA",
    flex: 1,
  },
});
