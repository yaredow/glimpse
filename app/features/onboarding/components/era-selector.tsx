import { useState } from "react";
import { ScrollView, View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CassetteTapeIcon,
  CheckCircleIcon,
  DiscIcon,
  FilmSlateIcon,
  GlobeIcon,
  RadioIcon,
  RocketIcon,
  type Icon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import type { EraPreset } from "../types/onboarding.type";
import { colors } from "@/lib/theme/tokens.generated";

interface EraSelectorProps {
  eras: EraPreset[];
  initialSelected: { min_year: number; max_year: number } | null;
  onNext: (min: number, max: number) => void;
  onBack?: () => void;
}

const ERA_ICONS: Record<string, Icon> = {
  "Modern Hits": RocketIcon,
  "The New Millennium": DiscIcon,
  "90s Nostalgia": CassetteTapeIcon,
  "Retro Classics": RadioIcon,
  "Timeless Cinema": FilmSlateIcon,
  Everything: GlobeIcon,
};

function widestEra(eras: EraPreset[]): EraPreset | undefined {
  return eras.reduce<EraPreset | undefined>((widest, era) => {
    if (!widest) return era;
    return era.max_year - era.min_year > widest.max_year - widest.min_year
      ? era
      : widest;
  }, undefined);
}

export default function EraSelector({
  eras,
  initialSelected,
  onNext,
  onBack,
}: EraSelectorProps) {
  const [selected, setSelected] = useState<EraPreset | null>(() => {
    if (!initialSelected) {
      return widestEra(eras) || eras[0] || null;
    }
    return (
      eras.find(
        (e) =>
          e.min_year === initialSelected.min_year &&
          e.max_year === initialSelected.max_year,
      ) ||
      eras[0] ||
      null
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

  const widestSpan = eras.reduce(
    (span, era) => Math.max(span, era.max_year - era.min_year),
    0,
  );
  const isAllTime = selected
    ? selected.max_year - selected.min_year === widestSpan
    : false;

  return (
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="gap-3 pb-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {eras.map((era) => {
          const isSelected =
            selected?.min_year === era.min_year &&
            selected?.max_year === era.max_year;

          const title = era.label.split(" (")[0];
          const EraIcon = ERA_ICONS[title] ?? FilmSlateIcon;

          return (
            <Pressable
              key={era.label}
              accessibilityRole="radio"
              accessibilityLabel={era.label}
              accessibilityState={{ selected: isSelected }}
              onPress={() => handleSelect(era)}
              className={cn(
                "rounded-lg border-[1.5px] p-4",
                isSelected
                  ? "border-primary bg-brand-surface"
                  : "border-zinc-800 bg-zinc-900",
              )}
            >
              <View className="mb-2 flex-row items-center justify-between">
                <View
                  className={cn(
                    "h-9 w-9 items-center justify-center rounded-sm",
                    isSelected ? "bg-primary/15" : "bg-zinc-800",
                  )}
                >
                  <EraIcon
                    size={20}
                    color={isSelected ? colors.primary : colors.subtleForeground}
                    weight="bold"
                  />
                </View>
                {isSelected && (
                  <CheckCircleIcon
                    size={18}
                    color={colors.primary}
                    weight="fill"
                  />
                )}
              </View>

              <Text
                className={cn(
                  "mb-1 text-[16px] font-brandBold",
                  isSelected ? "text-white" : "text-zinc-100",
                )}
              >
                {title}
              </Text>
              <Text
                className={cn(
                  "text-[13px] font-brandMedium",
                  isSelected ? "text-red-300" : "text-zinc-500",
                )}
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
      <View className="mt-auto gap-3 border-t border-zinc-800 pt-4">
        <View className="items-center">
          <Text className="font-brandSemiBold text-body-sm text-zinc-400">
            {selected
              ? isAllTime
                ? "All time"
                : `${selected.min_year} – ${selected.max_year}`
              : "Pick a range"}
          </Text>
        </View>

        <Button
          size="xl"
          variant="primary"
          onPress={handleNext}
          disabled={!selected}
          haptic="success"
          className="w-full"
        >
          Continue
        </Button>
      </View>
    </View>
  );
}
