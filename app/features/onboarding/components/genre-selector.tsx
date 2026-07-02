import { useState, useCallback } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";
import type { Genre } from "../types/onboarding.type";

interface GenreSelectorProps {
  genres: Genre[];
  initialSelected: number[];
  onNext: (selectedIds: number[]) => void;
  onBack?: () => void;
  subtitle: string;
  buttonLabel: string;
}

export default function GenreSelector({
  genres,
  initialSelected,
  onNext,
  onBack,
  subtitle,
  buttonLabel,
}: GenreSelectorProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number[]>(initialSelected);

  const toggle = useCallback(
    (id: number) => {
      setSelected((prev) =>
        prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
      );
    },
    [setSelected],
  );

  const handleNext = () => {
    onNext(selected);
  };

  return (
    <View style={styles.container}>
      <Text
        variant="titleMedium"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
      >
        {subtitle}
      </Text>

      <ScrollView
        contentContainerStyle={styles.chipGrid}
        showsVerticalScrollIndicator={false}
      >
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          return (
            <Chip
              key={genre.id}
              mode="flat"
              selected={isSelected}
              onPress={() => toggle(genre.id)}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceVariant,
                },
              ]}
              textStyle={[
                styles.chipText,
                {
                  color: isSelected ? colors.onPrimary : colors.onSurface,
                },
              ]}
              showSelectedOverlay={false}
              showSelectedCheck={false}
            >
              {genre.name}
            </Chip>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <View style={styles.backButtonPlaceholder}>
          {onBack && (
            <Button
              variant="text"
              onPress={onBack}
              textColor={colors.onSurfaceVariant}
              haptic="light"
            >
              Back
            </Button>
          )}
        </View>
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={selected.length === 0}
          haptic="success"
        >
          {buttonLabel}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingBottom: 24,
  },
  chip: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    marginVertical: 8,
    marginHorizontal: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    borderTopWidth: 1,
  },
  backButtonPlaceholder: {
    minWidth: 80,
    marginLeft: -16,
  },
});
