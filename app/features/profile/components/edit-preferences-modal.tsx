import { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import {
  XIcon,
  StarIcon,
  XCircleIcon,
  CheckIcon,
  CheckCircleIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePreferences } from "@/features/onboarding/services/onboarding.service";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { authKeys } from "@/features/auth/constants/auth.keys";
import { moviesKeys } from "@/features/movies/constants/movies.keys";
import type {
  UserPreference,
  FinishOnboardingPayload,
  Genre,
  EraPreset,
} from "@/features/onboarding/types/onboarding.type";
import { getErrorMessage } from "@/lib/error";
import { colors } from "@/lib/theme/tokens.generated";

interface EditPreferencesModalProps {
  visible: boolean;
  onClose: () => void;
  currentPreferences?: UserPreference;
}

const ERA_DESCRIPTIONS: Record<string, string> = {
  "Modern Hits (2015 – Present)": "Contemporary releases & recent cinema",
  "The New Millennium (2000 – 2014)": "Modern cinema from the turn of the century",
  "90s Nostalgia (1990 – 1999)": "Blockbusters & 90s indie explosion",
  "Retro Classics (1970 – 1989)": "New Hollywood & 80s classics",
  "Timeless Cinema (Pre-1970)": "Golden age classics & vintage cinema",
  Everything: "Any release year from cinema history",
};

const RATING_PRESETS = [
  { value: 0, label: "Any Rating" },
  { value: 6.0, label: "6.0+ ★" },
  { value: 7.0, label: "7.0+ ★" },
  { value: 8.0, label: "8.0+ 🏆" },
];

const DEFAULT_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "zh", label: "Chinese" },
];

export default function EditPreferencesModal({
  visible,
  onClose,
  currentPreferences,
}: EditPreferencesModalProps) {
  return (
    <Dialog open={visible} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="w-[92%] max-w-[420px] gap-4 rounded-[24px] p-5">
        <DialogTitle className="text-center text-[18px] leading-7">
          Film Preferences
        </DialogTitle>
        <ScrollView className="max-h-[70vh]">
          {visible ? (
            <EditPreferencesForm
              key={visible ? "open" : "closed"}
              currentPreferences={currentPreferences}
              onClose={onClose}
            />
          ) : null}
        </ScrollView>
      </DialogContent>
    </Dialog>
  );
}

function EditPreferencesForm({
  currentPreferences,
  onClose,
}: {
  currentPreferences?: UserPreference;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: onboardingData, isLoading: dataLoading } = useOnboardingData();

  const [genreTab, setGenreTab] = useState<"favorites" | "excluded">("favorites");
  const [favorites, setFavorites] = useState<number[]>(
    () => currentPreferences?.favorite_genres ?? [],
  );
  const [excluded, setExcluded] = useState<number[]>(
    () => currentPreferences?.excluded_genres ?? [],
  );
  const [minYear, setMinYear] = useState<number>(
    () => currentPreferences?.min_year ?? 1888,
  );
  const [maxYear, setMaxYear] = useState<number>(
    () => currentPreferences?.max_year ?? 2030,
  );
  const [minRating, setMinRating] = useState<number>(
    () => currentPreferences?.min_rating ?? 0,
  );
  const [languages, setLanguages] = useState<string[]>(
    () =>
      currentPreferences?.languages?.length
        ? currentPreferences.languages
        : ["en"],
  );

  const genres: Genre[] = useMemo(() => {
    return onboardingData?.genres ?? [];
  }, [onboardingData]);

  const eras: EraPreset[] = useMemo(() => {
    if (onboardingData?.eras?.length) {
      return onboardingData.eras;
    }
    const currentYear = new Date().getFullYear();
    return [
      { label: "Modern Hits (2015 – Present)", min_year: 2015, max_year: currentYear },
      { label: "The New Millennium (2000 – 2014)", min_year: 2000, max_year: 2014 },
      { label: "90s Nostalgia (1990 – 1999)", min_year: 1990, max_year: 1999 },
      { label: "Retro Classics (1970 – 1989)", min_year: 1970, max_year: 1989 },
      { label: "Timeless Cinema (Pre-1970)", min_year: 1888, max_year: 1969 },
      { label: "Everything", min_year: 1888, max_year: currentYear },
    ];
  }, [onboardingData]);

  const availableLanguages = useMemo(() => {
    if (onboardingData?.languages?.length) {
      return onboardingData.languages.map((l) => ({
        code: l.iso_639_1,
        label: l.english_name,
      }));
    }
    return DEFAULT_LANGUAGES;
  }, [onboardingData]);

  const { mutate: savePreferences, isPending } = useMutation({
    mutationFn: (payload: FinishOnboardingPayload) => updatePreferences(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: authKeys.preferences() }),
        queryClient.invalidateQueries({ queryKey: moviesKeys.todayGrid() }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({
        type: "success",
        text1: "Preferences updated",
        text2: "Your nightly curation has been updated.",
      });
      onClose();
    },
    onError: async (error: Error) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({
        type: "error",
        text1: "Failed to update preferences",
        text2: await getErrorMessage(error),
      });
    },
  });

  const toggleFavorite = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (favorites.includes(id)) {
      setFavorites((prev) => prev.filter((item) => item !== id));
    } else {
      setFavorites((prev) => [...prev, id]);
      if (excluded.includes(id)) {
        setExcluded((prev) => prev.filter((item) => item !== id));
      }
    }
  };

  const toggleExcluded = (id: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (excluded.includes(id)) {
      setExcluded((prev) => prev.filter((item) => item !== id));
    } else {
      setExcluded((prev) => [...prev, id]);
      if (favorites.includes(id)) {
        setFavorites((prev) => prev.filter((item) => item !== id));
      }
    }
  };

  const toggleLanguage = (code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguages((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== code);
      }
      return [...prev, code];
    });
  };

  const handleSave = () => {
    if (favorites.length === 0) {
      Toast.show({
        type: "info",
        text1: "Pick at least one favorite genre",
        text2: "Choose a genre to help curate your five films.",
      });
      return;
    }

    savePreferences({
      favorite_genres: favorites,
      excluded_genres: excluded,
      languages,
      min_rating: minRating,
      min_year: minYear,
      max_year: maxYear,
    });
  };

  return (
    <>
      <View className="flex-row items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
        <View>
          <Text className="text-[20px] tracking-[-0.3px] font-brandBold text-white">
            Film Preferences
          </Text>
          <Text className="mt-0.5 text-[12.5px] font-brand text-zinc-400">
            Tune your recommendation engine
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={12}
          className="h-8 w-8 items-center justify-center rounded-full bg-surface-5"
        >
          <XIcon
            size={16}
            color={colors.subtleForeground}
            weight="bold"
          />
        </Pressable>
      </View>

      {dataLoading ? (
        <View className="items-center justify-center gap-3 py-[60px]">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-[13px] font-brand text-zinc-500">
            Loading preferences...
          </Text>
        </View>
      ) : (
        <ScrollView
          className="max-h-[520px]"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
            gap: 22,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[14px] tracking-[0.2px] font-brandSemiBold text-white">
                Genre Filters
              </Text>
              <Text className="text-[12px] font-brandSemiBold text-zinc-500">
                {genreTab === "favorites"
                  ? `${favorites.length} selected`
                  : `${excluded.length} excluded`}
              </Text>
            </View>

            {/* Segmented Tab Switcher */}
            <View className="my-1 flex-row gap-1 rounded-[12px] border border-white/[0.08] bg-surface-5 p-[3px]">
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGenreTab("favorites");
                }}
                className={cn(
                  "flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] border border-transparent py-[9px]",
                  genreTab === "favorites" &&
                    "border-primary/45 bg-primary/[0.18]",
                )}
              >
                <StarIcon
                  size={14}
                  color={
                    genreTab === "favorites"
                      ? colors.primary
                      : colors.faintForeground
                  }
                  weight={genreTab === "favorites" ? "fill" : "regular"}
                />
                <Text
                  className={cn(
                    "text-[12.5px]",
                    genreTab === "favorites"
                      ? "font-brandSemiBold text-white"
                      : "font-brand text-zinc-400",
                  )}
                >
                  Favorite ({favorites.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGenreTab("excluded");
                }}
                className={cn(
                  "flex-1 flex-row items-center justify-center gap-1.5 rounded-[9px] border border-transparent py-[9px]",
                  genreTab === "excluded" &&
                    "border-destructive/40 bg-destructive/[0.15]",
                )}
              >
                <XCircleIcon
                  size={14}
                  color={
                    genreTab === "excluded"
                      ? colors.destructive
                      : colors.faintForeground
                  }
                  weight={genreTab === "excluded" ? "fill" : "regular"}
                />
                <Text
                  className={cn(
                    "text-[12.5px]",
                    genreTab === "excluded"
                      ? "font-brandSemiBold text-white"
                      : "font-brand text-zinc-400",
                  )}
                >
                  Excluded ({excluded.length})
                </Text>
              </Pressable>
            </View>

            <Text className="mb-1 text-[12px] leading-4 font-brand text-zinc-400">
              {genreTab === "favorites"
                ? "Select the genres you want prioritized in your nightly curation."
                : "Films tagged with these genres will never be suggested in your reel."}
            </Text>

            <View className="flex-row flex-wrap gap-2">
              {genres.map((genre) => {
                if (genreTab === "favorites") {
                  const isSelected = favorites.includes(genre.id);
                  const isExcluded = excluded.includes(genre.id);
                  return (
                    <Pressable
                      key={genre.id}
                      onPress={() => toggleFavorite(genre.id)}
                      className={cn(
                        "flex-row items-center gap-[5px] rounded-[10px] border px-[13px] py-[9px]",
                        isSelected
                          ? "border-[1.5px] border-primary bg-primary/[0.16]"
                          : "border border-white/[0.08] bg-surface-5",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[12.5px]",
                          isSelected
                            ? "font-brandSemiBold text-white"
                            : isExcluded
                              ? "font-brand text-zinc-500"
                              : "font-brand text-zinc-400",
                        )}
                      >
                        {genre.name}
                      </Text>
                      {isSelected ? (
                        <CheckIcon
                          size={13}
                          color={colors.primary}
                          weight="bold"
                          style={{ marginLeft: 2 }}
                        />
                      ) : null}
                    </Pressable>
                  );
                } else {
                  const isExcluded = excluded.includes(genre.id);
                  const isFav = favorites.includes(genre.id);
                  return (
                    <Pressable
                      key={genre.id}
                      onPress={() => toggleExcluded(genre.id)}
                      className={cn(
                        "flex-row items-center gap-[5px] rounded-[10px] border px-[13px] py-[9px]",
                        isExcluded
                          ? "border-[1.5px] border-destructive/40 bg-destructive/[0.12]"
                          : "border border-white/[0.08] bg-surface-5",
                      )}
                    >
                      <Text
                        className={cn(
                          "text-[12.5px]",
                          isExcluded
                            ? "font-brand text-destructive line-through"
                            : isFav
                              ? "font-brand text-zinc-500"
                              : "font-brand text-zinc-400",
                        )}
                      >
                        {genre.name}
                      </Text>
                      {isExcluded ? (
                        <XIcon
                          size={13}
                          color={colors.destructive}
                          weight="bold"
                          style={{ marginLeft: 2 }}
                        />
                      ) : null}
                    </Pressable>
                  );
                }
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[14px] tracking-[0.2px] font-brandSemiBold text-white">
              Release Era
            </Text>
            <Text className="mb-1 text-[12px] leading-4 font-brand text-zinc-400">
              Focus your reel on specific cinematic eras.
            </Text>
            <View className="gap-2">
              {eras.map((era) => {
                const isSelected =
                  (minYear === era.min_year && maxYear === era.max_year) ||
                  (era.label === "Everything" && minYear <= 1888 && maxYear >= 2024);
                const desc = ERA_DESCRIPTIONS[era.label] || `${era.min_year} – ${era.max_year}`;
                return (
                  <Pressable
                    key={era.label}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMinYear(era.min_year);
                      setMaxYear(era.max_year);
                    }}
                    className={cn(
                      "flex-row items-center justify-between rounded-[12px] border px-4 py-3",
                      isSelected
                        ? "border-[1.5px] border-primary bg-primary/[0.12]"
                        : "border border-white/[0.08] bg-surface-5",
                    )}
                  >
                    <View className="flex-1 pr-2">
                      <Text
                        className={cn(
                          "text-[13.5px]",
                          isSelected
                            ? "font-brandSemiBold text-white"
                            : "font-brand text-white",
                        )}
                      >
                        {era.label}
                      </Text>
                      <Text className="mt-0.5 text-[11px] font-brand text-zinc-500">
                        {desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <CheckCircleIcon
                        size={18}
                        color={colors.primary}
                        weight="fill"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[14px] tracking-[0.2px] font-brandSemiBold text-white">
              Minimum Rating
            </Text>
            <Text className="mb-1 text-[12px] leading-4 font-brand text-zinc-400">
              Set a quality threshold based on community and critic ratings.
            </Text>
            <View className="flex-row gap-2">
              {RATING_PRESETS.map((rating) => {
                const isSelected = minRating === rating.value;
                return (
                  <Pressable
                    key={rating.label}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMinRating(rating.value);
                    }}
                    className={cn(
                      "flex-1 items-center justify-center rounded-[10px] border py-[11px]",
                      isSelected
                        ? "border-[1.5px] border-amber-500 bg-amber-500/[0.15]"
                        : "border border-white/[0.08] bg-surface-5",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[12.5px]",
                        isSelected
                          ? "font-brandSemiBold text-white"
                          : "font-brand text-zinc-400",
                      )}
                    >
                      {rating.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[14px] tracking-[0.2px] font-brandSemiBold text-white">
              Languages
            </Text>
            <Text className="mb-1 text-[12px] leading-4 font-brand text-zinc-400">
              Select the original languages you prefer to watch.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {availableLanguages.map((lang) => {
                const isSelected = languages.includes(lang.code);
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => toggleLanguage(lang.code)}
                    className={cn(
                      "flex-row items-center gap-[5px] rounded-[10px] border px-[13px] py-[9px]",
                      isSelected
                        ? "border-[1.5px] border-primary bg-primary/[0.16]"
                        : "border border-white/[0.08] bg-surface-5",
                    )}
                  >
                    <Text
                      className={cn(
                        "text-[12.5px]",
                        isSelected
                          ? "font-brandSemiBold text-white"
                          : "font-brand text-zinc-400",
                      )}
                    >
                      {lang.label}
                    </Text>
                    {isSelected ? (
                      <CheckIcon
                        size={13}
                        color={colors.primary}
                        weight="bold"
                        style={{ marginLeft: 2 }}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      <View className="border-t border-white/[0.08] bg-surface-4 px-5 pt-3 pb-2">
        <Pressable
          onPress={handleSave}
          disabled={isPending || dataLoading}
          className={cn(
            "h-[50px] items-center justify-center rounded-[12px] bg-primary active:opacity-90",
            (isPending || dataLoading) && "opacity-60",
          )}
          accessibilityRole="button"
          accessibilityLabel="Save preferences"
          accessibilityState={{ disabled: isPending || dataLoading, busy: isPending }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text className="text-[13.5px] tracking-[0.6px] font-brandBold text-white">
              SAVE PREFERENCES
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

