import { useState, useCallback } from "react";
import { ScrollView, Text, View, Pressable } from "react-native";
import { Button } from "@/components/ui/button";
import { typeClasses } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";
import { CheckIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import type { Genre } from "../types/onboarding.type";
import { getGenreIcon } from "../utils/genre-meta";
import { colors } from "@/lib/theme/tokens.generated";

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
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="flex-row flex-wrap gap-2.5 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {genres.map((genre) => {
          const isSelected = selected.includes(genre.id);
          const GenreIcon = getGenreIcon(genre.name);

          return (
            <Pressable
              key={genre.id}
              accessibilityRole="checkbox"
              accessibilityLabel={genre.name}
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggle(genre.id)}
              className={cn(
                "flex-row items-center rounded-3xl border-[1.5px] px-4 py-3",
                isSelected
                  ? "border-primary bg-surface-brand"
                  : "border-zinc-800 bg-zinc-900",
              )}
            >
              <GenreIcon
                size={16}
                color={isSelected ? colors.white : colors.subtleForeground}
                weight="bold"
                style={{ marginRight: 8 }}
              />
              <Text
                className={cn(
                  typeClasses.default,
                  "text-[14px] font-semibold tracking-[0.2px]",
                  isSelected ? "text-white font-bold" : "text-zinc-300",
                )}
              >
                {genre.name}
              </Text>
              {isSelected && (
                <CheckIcon
                  size={16}
                  color={colors.primary}
                  weight="bold"
                  style={{ marginLeft: 6 }}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View className="mt-auto gap-3 border-t border-zinc-800 pt-4">
        <View className="items-center">
          <Text
            className={cn(typeClasses.bodySmall, "text-zinc-400 font-semibold")}
          >
            {selected.length >= minSelection
              ? `${selected.length} genres selected`
              : `Select at least ${remaining} more`}
          </Text>
        </View>

        <Button
          size="xl"
          variant="primary"
          onPress={handleNext}
          disabled={selected.length < minSelection}
          haptic="success"
          className="w-full"
        >
          Continue
        </Button>
      </View>
    </View>
  );
}
