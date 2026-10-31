import { useState } from "react";
import { StyleSheet, View, Pressable, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { Button } from "@/components/ui/button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { EraPreset } from "../types/onboarding.type";

interface EraSelectorProps {
  eras: EraPreset[];
  initialSelected: { min_year: number; max_year: number } | null;
  onNext: (min: number, max: number) => void;
  onBack?: () => void;
}

const ERA_ICONS: Record<string, string> = {
  "Modern Hits": "rocket-launch-outline",
  "The New Millennium": "disc",
  "90s Nostalgia": "cassette",
  "Retro Classics": "radio",
  "Timeless Cinema": "filmstrip",
  Everything: "earth",
};

export default function EraSelector({
  eras,
  initialSelected,
  onNext,
  onBack,
}: EraSelectorProps) {
  const [selected, setSelected] = useState<EraPreset | null>(() => {
    if (!initialSelected) {
      // Default to "Everything" or first
      return eras.find((e) => e.min_year === 1888) || eras[0] || null;
    }
    return (
      eras.find(
        (e) =>
          e.min_year === initialSelected.min_year &&
          e.max_year === initialSelected.max_year,
      ) || eras[0] || null
    );
  });

  const handleSelect = (era: EraPreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(era);
  };

  const handleNext = () => {
    if (selected) {
      onNext(selected.min_year, selected.max_year);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {eras.map((era) => {
          const isSelected =
            selected?.min_year === era.min_year &&
            selected?.max_year === era.max_year;

          const title = era.label.split(" (")[0];
          const icon = ERA_ICONS[title] || "movie-outline";

          return (
            <Pressable
              key={era.label}
              onPress={() => handleSelect(era)}
              style={[
                styles.card,
                isSelected ? styles.cardSelected : styles.cardUnselected,
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBox,
                    isSelected
                      ? styles.iconBoxSelected
                      : styles.iconBoxUnselected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={icon as any}
                    size={20}
                    color={isSelected ? "#E50914" : "#A1A1AA"}
                  />
                </View>
                {isSelected && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={18}
                    color="#E50914"
                  />
                )}
              </View>

              <Text
                style={[
                  styles.title,
                  isSelected ? styles.titleSelected : styles.titleUnselected,
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.years,
                  isSelected ? styles.yearsSelected : styles.yearsUnselected,
                ]}
              >
                {era.min_year === 1888
                  ? "All Time"
                  : `${era.min_year} – ${era.max_year}`}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={!selected}
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
  grid: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  cardUnselected: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  cardSelected: {
    backgroundColor: "#201012",
    borderColor: "#E50914",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxUnselected: {
    backgroundColor: "#27272A",
  },
  iconBoxSelected: {
    backgroundColor: "rgba(229, 9, 20, 0.15)",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  titleUnselected: {
    color: "#F4F4F5",
  },
  titleSelected: {
    color: "#FFFFFF",
  },
  years: {
    fontSize: 13,
    fontWeight: "500",
  },
  yearsUnselected: {
    color: "#71717A",
  },
  yearsSelected: {
    color: "#FCA5A5",
  },
  footer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#27272A",
    marginTop: "auto",
  },
  nextButton: {
    width: "100%",
    borderRadius: 8,
  },
});
