import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Button } from "@/components/ui/button";
import { typeClasses } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import { CheckIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import type { Language } from "../types/onboarding.type";
import { colors } from "@/lib/theme/tokens.generated";

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
  { value: 7.0, label: "7.0+", desc: "Critically acclaimed" },
  { value: 8.0, label: "8.0+", desc: "Masterpieces only" },
];

export default function LanguageRatingSelector({
  languages,
  initialLanguages,
  initialRating,
  onNext,
  onBack,
}: LanguageRatingSelectorProps) {
  const [selectedLangs, setSelectedLangs] = useState<string[]>(() => {
    if (initialLanguages && initialLanguages.length > 0) {
      return initialLanguages;
    }
    return ["en"];
  });

  const [rating, setRating] = useState<number>(initialRating ?? 6.0);

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
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="gap-7 pb-6 pt-2"
      >
        {/* Section 1: Preferred Languages */}
        <View className="gap-2">
          <Text
            className={cn(
              typeClasses.default,
              "text-[16px] font-extrabold tracking-[-0.3px] text-white",
            )}
          >
            Movie Languages
          </Text>
          <Text
            className={cn(
              typeClasses.default,
              "mb-1.5 text-[13px] text-zinc-500",
            )}
          >
            Select the audio languages you enjoy watching
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {languages.map((lang) => {
              const isSelected = selectedLangs.includes(lang.iso_639_1);
              return (
                <Pressable
                  key={lang.iso_639_1}
              accessibilityRole="checkbox"
              accessibilityLabel={lang.name}
              accessibilityState={{ checked: isSelected }}
                  onPress={() => toggleLanguage(lang.iso_639_1)}
                  className={cn(
                    "flex-row items-center rounded-[20px] border-[1.5px] px-3.5 py-2.5",
                    isSelected
                      ? "border-primary bg-surface-brand"
                      : "border-zinc-800 bg-zinc-900",
                  )}
                >
                  <Text
                    className={cn(
                      typeClasses.default,
                      "text-[13px] font-semibold",
                      isSelected ? "text-white font-bold" : "text-zinc-300",
                    )}
                  >
                    {lang.english_name}
                  </Text>
                  {isSelected && (
                    <CheckIcon
                      size={14}
                      color={colors.primary}
                      weight="bold"
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Minimum Quality Standard */}
        <View className="gap-2">
          <Text
            className={cn(
              typeClasses.default,
              "text-[16px] font-extrabold tracking-[-0.3px] text-white",
            )}
          >
            Minimum Quality
          </Text>
          <Text
            className={cn(
              typeClasses.default,
              "mb-1.5 text-[13px] text-zinc-500",
            )}
          >
            Filter out low-rated films on IMDb
          </Text>

          <View className="flex-row flex-wrap gap-2.5">
            {RATING_PRESETS.map((preset) => {
              const isSelected = rating === preset.value;
              return (
                <Pressable
                  key={preset.value}
              accessibilityRole="radio"
accessibilityLabel={"{preset.label}"}
              accessibilityState={{ selected: isSelected }}
                  onPress={() => selectRating(preset.value)}
                  className={cn(
                    "w-[48%] rounded-lg border-[1.5px] p-3.5",
                    isSelected
                      ? "border-primary bg-surface-brand"
                      : "border-zinc-800 bg-zinc-900",
                  )}
                >
                  <Text
                    className={cn(
                      typeClasses.default,
                      "mb-1 text-[15px] font-extrabold",
                      isSelected ? "text-white" : "text-zinc-100",
                    )}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    className={cn(
                      typeClasses.default,
                      "text-[12px]",
                      isSelected ? "text-red-300" : "text-zinc-500",
                    )}
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
      <View className="mt-auto gap-3 border-t border-zinc-800 pt-4">
        <View className="items-center">
          <Text
            className={cn(typeClasses.bodySmall, "text-zinc-400 font-semibold")}
          >
            {`${selectedLangs.length} ${
              selectedLangs.length === 1 ? "language" : "languages"
            } · ${rating > 0 ? `${rating.toFixed(1)}+ rating` : "Any rating"}`}
          </Text>
        </View>

        <Button
          size="xl"
          variant="primary"
          onPress={handleNext}
          disabled={selectedLangs.length === 0}
          haptic="success"
          className="w-full"
        >
          Continue
        </Button>
      </View>
    </View>
  );
}
