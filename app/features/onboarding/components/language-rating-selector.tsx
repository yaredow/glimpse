import { useState, useCallback } from "react";
import { StyleSheet, ScrollView, View, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { Button } from "@/components/ui/button";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Language } from "../types/onboarding.type";

interface LanguageRatingSelectorProps {
  languages: Language[];
  initialLanguages: string[];
  initialRating: number;
  onNext: (selectedCodes: string[], rating: number) => void;
  onBack?: () => void;
}

const RATING_PRESETS = [
  { value: 0, label: "Any Rating", desc: "No minimum filter" },
  { value: 6.0, label: "6.0+", desc: "Above average" },
  { value: 7.0, label: "7.0+ ★", desc: "Critically acclaimed" },
  { value: 8.0, label: "8.0+ 🏆", desc: "Masterpieces only" },
];

export default function LanguageRatingSelector({
  languages,
  initialLanguages,
  initialRating,
  onNext,
  onBack,
}: LanguageRatingSelectorProps) {
  // Default to English if none selected
  const [selectedLangs, setSelectedLangs] = useState<string[]>(() => {
    if (initialLanguages && initialLanguages.length > 0) {
      return initialLanguages;
    }
    return ["en"];
  });

  const [rating, setRating] = useState<number>(initialRating || 6.0);

  const toggleLanguage = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLangs((prev) =>
      prev.includes(code)
        ? prev.length > 1
          ? prev.filter((c) => c !== code)
          : prev // keep at least 1
        : [...prev, code],
    );
  }, []);

  const selectRating = useCallback((val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(val);
  }, []);

  const handleNext = () => {
    onNext(selectedLangs, rating);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Preferred Languages */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Movie Languages</Text>
          <Text style={styles.sectionSubtitle}>
            Select the audio languages you enjoy watching
          </Text>

          <View style={styles.langGrid}>
            {languages.map((lang) => {
              const isSelected = selectedLangs.includes(lang.iso_639_1);
              return (
                <Pressable
                  key={lang.iso_639_1}
                  onPress={() => toggleLanguage(lang.iso_639_1)}
                  style={[
                    styles.langChip,
                    isSelected
                      ? styles.langChipSelected
                      : styles.langChipUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.langText,
                      isSelected
                        ? styles.langTextSelected
                        : styles.langTextUnselected,
                    ]}
                  >
                    {lang.english_name}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check"
                      size={14}
                      color="#E50914"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Minimum Quality Standard */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Minimum Quality</Text>
          <Text style={styles.sectionSubtitle}>
            Filter out low-rated films on IMDb
          </Text>

          <View style={styles.ratingGrid}>
            {RATING_PRESETS.map((preset) => {
              const isSelected = rating === preset.value;
              return (
                <Pressable
                  key={preset.value}
                  onPress={() => selectRating(preset.value)}
                  style={[
                    styles.ratingCard,
                    isSelected
                      ? styles.ratingCardSelected
                      : styles.ratingCardUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.ratingValue,
                      isSelected
                        ? styles.ratingValueSelected
                        : styles.ratingValueUnselected,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.ratingDesc,
                      isSelected
                        ? styles.ratingDescSelected
                        : styles.ratingDescUnselected,
                    ]}
                  >
                    {preset.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <View style={styles.footer}>
        <Button
          variant="primary"
          onPress={handleNext}
          disabled={selectedLangs.length === 0}
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
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 28,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#71717A",
    marginBottom: 6,
  },
  langGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  langChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  langChipUnselected: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  langChipSelected: {
    backgroundColor: "#201012",
    borderColor: "#E50914",
  },
  langText: {
    fontSize: 13,
    fontWeight: "600",
  },
  langTextUnselected: {
    color: "#D4D4D8",
  },
  langTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  ratingCard: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  ratingCardUnselected: {
    backgroundColor: "#18181B",
    borderColor: "#27272A",
  },
  ratingCardSelected: {
    backgroundColor: "#201012",
    borderColor: "#E50914",
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  ratingValueUnselected: {
    color: "#F4F4F5",
  },
  ratingValueSelected: {
    color: "#FFFFFF",
  },
  ratingDesc: {
    fontSize: 12,
  },
  ratingDescUnselected: {
    color: "#71717A",
  },
  ratingDescSelected: {
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

