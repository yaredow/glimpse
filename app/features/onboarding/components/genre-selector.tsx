import { useState, useCallback } from "react";
import { StyleSheet, ScrollView, View, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Genre } from "../types/onboarding.type";
import { getGenreMeta } from "../utils/genre-meta";

interface GenreSelectorProps {
  genres: Genre[];
  initialSelected: number[];
  onNext: (selectedIds: number[]) => void;
  onBack?: () => void;
  minSelection?: number;
}

export default function GenreSelector({
  genres,
  initialSelected,
  onNext,
  onBack,
  minSelection = 2,
}: GenreSelectorProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number[]>(initialSelected);

  const toggle = useCallback((id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }, []);

  const handleNext = () => {
    onNext(selected);
  };

  const remaining = Math.max(0, minSelection - selected.length);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.chipGrid}
        showsVerticalScrollIndicator={false}
      >
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          const meta = getGenreMeta(genre.name);

          return (
            <Pressable
              key={genre.id}
              onPress={() => toggle(genre.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
            >
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  isSelected
                    ? styles.chipTextSelected
                    : styles.chipTextUnselected,
                ]}
              >
                {genre.name}
              </Text>
              {isSelected && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color="#E50914"
                  style={styles.checkIcon}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Bar with Dynamic Counter */}
      <View style={[styles.footer, { borderTopColor: "#27272A" }]}>
        <View style={styles.counterRow}>
          <Text variant="bodySmall" style={styles.counterText}>
            {selected.length >= minSelection
              ? `${selected.length} genres selected`
              : `Select at least ${remaining} more`}
          </Text>
        </View>

        <Button
          variant="primary"
          onPress={handleNext}
          disabled={selected.length < minSelection}
          haptic="success"
          style={styles.nextButton}
        >
          Continue
        </Button>
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
  chipUnselected: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  chipSelected: {
    backgroundColor: "#201012",
    borderColor: "#E50914",
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  chipTextUnselected: {
    color: "#D4D4D8",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  checkIcon: {
    marginLeft: 6,
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: "auto",
    gap: 12,
  },
  counterRow: {
    alignItems: "center",
  },
  counterText: {
    color: "#A1A1AA",
    fontWeight: "600",
  },
  nextButton: {
    width: "100%",
    borderRadius: 8,
  },
});
