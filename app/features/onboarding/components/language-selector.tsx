import { useState, useCallback } from "react";
import { StyleSheet, ScrollView, View } from "react-native";
import { Chip, Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";
import type { Language } from "../types/onboarding.type";

interface LanguageSelectorProps {
  languages: Language[];
  initialSelected: string[];
  onNext: (selectedCodes: string[]) => void;
  onBack: () => void;
}

export default function LanguageSelector({
  languages,
  initialSelected,
  onNext,
  onBack,
}: LanguageSelectorProps) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string[]>(initialSelected);

  const toggle = useCallback(
    (code: string) => {
      setSelected((prev) =>
        prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
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
        Choose the languages you prefer for movies.
      </Text>

      <ScrollView
        contentContainerStyle={styles.chipGrid}
        showsVerticalScrollIndicator={false}
      >
        {languages.map((lang) => {
          const isSelected = selected.includes(lang.iso_639_1);
          return (
            <Chip
              key={lang.iso_639_1}
              mode="flat"
              selected={isSelected}
              onPress={() => toggle(lang.iso_639_1)}
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
              {lang.english_name}
            </Chip>
          );
        })}
      </ScrollView>

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
          disabled={selected.length === 0}
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
  backButton: {
    marginLeft: -16,
  },
});
