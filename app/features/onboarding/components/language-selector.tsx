import { useState, useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { palette } from "@/lib/theme/colors";
import { typeClasses } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
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
    <View className="flex-1">
      <Text
        className={cn(typeClasses.titleMedium, "mb-8 text-center")}
        style={{ color: palette.zinc400 }}
      >
        Choose the languages you prefer for movies.
      </Text>

      <ScrollView
        contentContainerClassName="flex-row flex-wrap gap-3 pb-6"
        showsVerticalScrollIndicator={false}
      >
        {languages.map((lang) => {
          const isSelected = selected.includes(lang.iso_639_1);
          return (
            <Pressable
              key={lang.iso_639_1}
              onPress={() => toggle(lang.iso_639_1)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              className={cn(
                "rounded-sm",
                isSelected ? "bg-primary" : "bg-surface-zinc-850",
              )}
            >
              <Text
                className={cn(
                  typeClasses.default,
                  "mx-3 my-2 text-[14px] font-semibold",
                  isSelected ? "text-white" : "text-off-white",
                )}
              >
                {lang.english_name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="flex-row items-center justify-between gap-3 border-t border-surface-zinc-750 pt-6">
        <Button
          variant="text"
          onPress={onBack}
          textColor={palette.zinc400}
          haptic="light"
          className="-ml-4"
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

