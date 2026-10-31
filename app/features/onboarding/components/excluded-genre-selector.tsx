import { useState, useCallback } from "react";
import { StyleSheet, ScrollView, View, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Genre } from "../types/onboarding.type";
import { getGenreMeta } from "../utils/genre-meta";

interface ExcludedGenreSelectorProps {
  genres: Genre[];
  initialSelected: number[];
  favoriteGenreIds: number[];
  onFinish: (excludedIds: number[]) => void;
  isSubmitting?: boolean;
}

export default function ExcludedGenreSelector({
  genres,
  initialSelected,
  favoriteGenreIds,
  onFinish,
  isSubmitting = false,
}: ExcludedGenreSelectorProps) {
  const [selected, setSelected] = useState<number[]>(initialSelected);

  // Filter out genres the user already picked as favorites
  const eligibleGenres = genres.filter((g) => !favoriteGenreIds.includes(g.id));

  const toggle = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }, []);

  const handleFinish = () => {
    onFinish(selected);
  };

  const handleSkip = () => {
    onFinish([]);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.chipGrid}
        showsVerticalScrollIndicator={false}
      >
        {eligibleGenres.map((genre) => {
          const isExcluded = selected.includes(genre.id);
          const meta = getGenreMeta(genre.name);

          return (
            <Pressable
              key={genre.id}
              onPress={() => toggle(genre.id)}
              style={[
                styles.chip,
                isExcluded ? styles.chipExcluded : styles.chipNeutral,
              ]}
            >
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  isExcluded
                    ? styles.chipTextExcluded
                    : styles.chipTextNeutral,
                ]}
              >
                {genre.name}
              </Text>
              {isExcluded ? (
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color="#EF4444"
                  style={styles.actionIcon}
                />
              ) : (
                <MaterialCommunityIcons
                  name="plus"
                  size={16}
                  color="#52525B"
                  style={styles.actionIcon}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Action Area */}
      <View style={styles.footer}>
        {selected.length > 0 ? (
          <Button
            variant="primary"
            onPress={handleFinish}
            loading={isSubmitting}
            disabled={isSubmitting}
            haptic="success"
            style={styles.mainButton}
          >
            Exclude {selected.length} {selected.length === 1 ? "Genre" : "Genres"} & Complete
          </Button>
        ) : (
          <Button
            variant="primary"
            onPress={handleSkip}
            loading={isSubmitting}
            disabled={isSubmitting}
            haptic="success"
            style={styles.mainButton}
          >
            No Dealbreakers — Start Discovering
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 8,
    paddingBottom: 24,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  chipNeutral: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  chipExcluded: {
    backgroundColor: "#200E10",
    borderColor: "#EF4444",
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipTextNeutral: {
    color: "#D4D4D8",
  },
  chipTextExcluded: {
    color: "#FCA5A5",
    textDecorationLine: "line-through",
    fontWeight: "700",
  },
  actionIcon: {
    marginLeft: 8,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
    marginTop: "auto",
  },
  mainButton: {
    width: "100%",
    borderRadius: 8,
  },
});

