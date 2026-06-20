import { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";
import type { EraPreset } from "../types/onboarding.type";

interface EraSelectorProps {
  eras: EraPreset[];
  initialSelected: { min_year: number; max_year: number } | null;
  onNext: (min: number, max: number) => void;
  onBack: () => void;
}

export default function EraSelector({
  eras,
  initialSelected,
  onNext,
  onBack,
}: EraSelectorProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<EraPreset | null>(() => {
    if (!initialSelected) return null;
    return (
      eras.find(
        (e) =>
          e.min_year === initialSelected.min_year &&
          e.max_year === initialSelected.max_year,
      ) || null
    );
  });

  const handleSelect = (era: EraPreset) => {
    setSelected(era);
  };

  const handleNext = () => {
    if (selected) {
      onNext(selected.min_year, selected.max_year);
    }
  };

  return (
    <View style={styles.container}>
      <Text
        variant="titleMedium"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
      >
        When was your favorite movie made?
      </Text>

      <View style={styles.grid}>
        {eras.map((era) => {
          const isSelected =
            selected?.min_year === era.min_year &&
            selected?.max_year === era.max_year;

          return (
            <Pressable
              key={era.label}
              onPress={() => handleSelect(era)}
              style={[
                styles.card,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : colors.surfaceVariant,
                  borderColor: isSelected ? colors.primary : colors.outline,
                },
              ]}
            >
              <Text
                variant="titleMedium"
                style={[
                  styles.label,
                  { color: isSelected ? colors.onPrimary : colors.onSurface },
                ]}
              >
                {era.label.split(" (")[0]}
              </Text>
              <Text
                variant="labelSmall"
                style={[
                  styles.years,
                  {
                    color: isSelected
                      ? colors.onPrimaryContainer
                      : colors.onSurfaceVariant,
                  },
                ]}
              >
                {era.min_year === 1888
                  ? "All Time"
                  : `${era.min_year} — ${era.max_year}`}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <Button
          variant="text"
          onPress={onBack}
          textColor={colors.onSurfaceVariant}
          haptic="light"
          style={styles.backButton}
        >
          Back
        </Button>

        <Button
          variant="primary"
          onPress={handleNext}
          disabled={!selected}
          haptic="success"
        >
          Next Step
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
  grid: {
    flexDirection: "column",
    gap: 12,
  },
  card: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  label: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  years: {
    letterSpacing: 1,
    opacity: 0.8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    borderTopWidth: 1,
    marginTop: "auto",
  },
  backButton: {
    marginLeft: -16,
  },
});
