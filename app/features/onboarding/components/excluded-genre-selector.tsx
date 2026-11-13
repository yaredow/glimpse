import { useState, useCallback } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { XCircleIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import type { Genre } from "../types/onboarding.type";
import { getGenreIcon } from "../utils/genre-meta";
import { colors } from "@/lib/theme/tokens.generated";

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
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="flex-row flex-wrap gap-2.5 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {eligibleGenres.map((genre) => {
          const isExcluded = selected.includes(genre.id);
          const GenreIcon = getGenreIcon(genre.name);

          return (
            <Pressable
              key={genre.id}
              accessibilityRole="checkbox"
              accessibilityLabel={genre.name}
              accessibilityState={{ checked: isExcluded }}
              onPress={() => toggle(genre.id)}
              className={cn(
                "min-h-[44px] flex-row items-center rounded-3xl border-[1.5px] px-4 py-3",
                isExcluded
                  ? "border-destructive bg-danger-surface"
                  : "border-border bg-card",
              )}
            >
              <GenreIcon
                size={16}
                color={isExcluded ? colors.errorContainerForeground : colors.subtleForeground}
                weight="bold"
                style={{ marginRight: 8 }}
              />
              <Text
                className={cn(
                  "text-[14px]",
                  isExcluded
                    ? "text-red-300 font-brandBold line-through"
                    : "text-foreground font-brandSemiBold",
                )}
              >
                {genre.name}
              </Text>
              {isExcluded ? (
                <XCircleIcon
                  size={16}
                  color={colors.destructive}
                  weight="fill"
                  style={{ marginLeft: 8 }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Floating Bottom Action Area */}
      <View className="mt-auto gap-3 border-t border-hairline/10 pt-4">
        <View className="items-center">
          <Text className="font-brandSemiBold text-body-sm text-subtle-foreground">
            {selected.length > 0
              ? `${selected.length} ${
                  selected.length === 1 ? "genre" : "genres"
                } excluded`
              : "Nothing excluded"}
          </Text>
        </View>

        {selected.length > 0 ? (
          <Button
            size="xl"
            variant="primary"
            onPress={handleFinish}
            loading={isSubmitting}
            disabled={isSubmitting}
            haptic="success"
            className="w-full"
          >
            Exclude {selected.length}{" "}
            {selected.length === 1 ? "Genre" : "Genres"} & Complete
          </Button>
        ) : (
          <Button
            variant="primary"
            onPress={handleSkip}
            loading={isSubmitting}
            disabled={isSubmitting}
            haptic="success"
            className="w-full"
          >
            Continue
          </Button>
        )}
      </View>
    </View>
  );
}
