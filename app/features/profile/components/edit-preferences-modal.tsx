import { useState, useMemo } from "react";
import {
  Modal,
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { updatePreferences } from "@/features/onboarding/services/onboarding.service";
import { useOnboardingData } from "@/features/onboarding/hooks/queries/use-onboarding-data";
import { authKeys } from "@/features/auth/constants/auth.keys";
import { moviesKeys } from "@/features/movies/consants/movies.keys";
import type {
  UserPreference,
  FinishOnboardingPayload,
  Genre,
  EraPreset,
} from "@/features/onboarding/types/onboarding.type";
import { getErrorMessage } from "@/lib/error";

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
  const theme = useAppTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: theme.colors.elevation.level1 },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <View style={styles.dragHandle} />
            {visible ? (
              <EditPreferencesForm
                key={visible ? "open" : "closed"}
                currentPreferences={currentPreferences}
                onClose={onClose}
              />
            ) : null}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

function EditPreferencesForm({
  currentPreferences,
  onClose,
}: {
  currentPreferences?: UserPreference;
  onClose: () => void;
}) {
  const theme = useAppTheme();
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
      <View style={styles.header}>
        <View>
          <Text
            style={[styles.headerTitle, { color: theme.colors.textPrimary }]}
          >
            Film Preferences
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              { color: theme.colors.textSecondary },
            ]}
          >
            Tune your recommendation engine
          </Text>
        </View>

        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={[
            styles.closeButton,
            { backgroundColor: theme.colors.elevation.level2 },
          ]}
        >
          <MaterialCommunityIcons
            name="close"
            size={18}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>

      {dataLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={[styles.loadingText, { color: theme.colors.textMuted }]}
          >
            Loading preferences...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Genre Filters
              </Text>
              <Text
                style={[
                  styles.sectionCounter,
                  {
                    color: theme.colors.textMuted,
                  },
                ]}
              >
                {genreTab === "favorites"
                  ? `${favorites.length} selected`
                  : `${excluded.length} excluded`}
              </Text>
            </View>

            {/* Segmented Tab Switcher */}
            <View
              style={[
                styles.segmentContainer,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGenreTab("favorites");
                }}
                style={[
                  styles.segmentTab,
                  genreTab === "favorites" && [
                    styles.segmentTabActive,
                    {
                      backgroundColor: "rgba(229, 9, 20, 0.18)",
                      borderColor: "rgba(229, 9, 20, 0.45)",
                    },
                  ],
                ]}
              >
                <MaterialCommunityIcons
                  name="star"
                  size={14}
                  color={
                    genreTab === "favorites"
                      ? theme.colors.primary
                      : theme.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.segmentTabText,
                    {
                      color:
                        genreTab === "favorites"
                          ? "#FFFFFF"
                          : theme.colors.textSecondary,
                      fontFamily:
                        genreTab === "favorites"
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                    },
                  ]}
                >
                  Favorite ({favorites.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setGenreTab("excluded");
                }}
                style={[
                  styles.segmentTab,
                  genreTab === "excluded" && [
                    styles.segmentTabActive,
                    {
                      backgroundColor: "rgba(239, 68, 68, 0.15)",
                      borderColor: "rgba(239, 68, 68, 0.4)",
                    },
                  ],
                ]}
              >
                <MaterialCommunityIcons
                  name="cancel"
                  size={14}
                  color={
                    genreTab === "excluded"
                      ? theme.colors.error
                      : theme.colors.textMuted
                  }
                />
                <Text
                  style={[
                    styles.segmentTabText,
                    {
                      color:
                        genreTab === "excluded"
                          ? "#FFFFFF"
                          : theme.colors.textSecondary,
                      fontFamily:
                        genreTab === "excluded"
                          ? "Inter_600SemiBold"
                          : "Inter_400Regular",
                    },
                  ]}
                >
                  Excluded ({excluded.length})
                </Text>
              </Pressable>
            </View>

            <Text
              style={[
                styles.sectionHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              {genreTab === "favorites"
                ? "Select the genres you want prioritized in your nightly curation."
                : "Films tagged with these genres will never be suggested in your reel."}
            </Text>

            <View style={styles.chipGrid}>
              {genres.map((genre) => {
                if (genreTab === "favorites") {
                  const isSelected = favorites.includes(genre.id);
                  const isExcluded = excluded.includes(genre.id);
                  return (
                    <Pressable
                      key={genre.id}
                      onPress={() => toggleFavorite(genre.id)}
                      style={[
                        styles.chip,
                        isSelected
                          ? [
                              styles.chipActive,
                              {
                                borderColor: theme.colors.primary,
                                backgroundColor: "rgba(229, 9, 20, 0.16)",
                              },
                            ]
                          : [
                              styles.chipInactive,
                              {
                                borderColor: theme.colors.outlineVariant,
                                backgroundColor: theme.colors.elevation.level2,
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : isExcluded
                              ? theme.colors.textMuted
                              : theme.colors.textSecondary,
                            fontFamily: isSelected
                              ? "Inter_600SemiBold"
                              : "Inter_400Regular",
                          },
                        ]}
                      >
                        {genre.name}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={14}
                          color={theme.colors.primary}
                          style={styles.chipCheck}
                        />
                      )}
                    </Pressable>
                  );
                } else {
                  const isExcluded = excluded.includes(genre.id);
                  const isFav = favorites.includes(genre.id);
                  return (
                    <Pressable
                      key={genre.id}
                      onPress={() => toggleExcluded(genre.id)}
                      style={[
                        styles.chip,
                        isExcluded
                          ? [
                              styles.chipExcluded,
                              {
                                borderColor: "rgba(239, 68, 68, 0.4)",
                                backgroundColor: "rgba(239, 68, 68, 0.12)",
                              },
                            ]
                          : [
                              styles.chipInactive,
                              {
                                borderColor: theme.colors.outlineVariant,
                                backgroundColor: theme.colors.elevation.level2,
                              },
                            ],
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          {
                            color: isExcluded
                              ? theme.colors.error
                              : isFav
                              ? theme.colors.textMuted
                              : theme.colors.textSecondary,
                            textDecorationLine: isExcluded
                              ? "line-through"
                              : "none",
                          },
                        ]}
                      >
                        {genre.name}
                      </Text>
                      {isExcluded && (
                        <MaterialCommunityIcons
                          name="close"
                          size={14}
                          color={theme.colors.error}
                          style={styles.chipCheck}
                        />
                      )}
                    </Pressable>
                  );
                }
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Release Era
            </Text>
            <Text
              style={[
                styles.sectionHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              Focus your reel on specific cinematic eras.
            </Text>
            <View style={styles.pillList}>
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
                    style={[
                      styles.eraPill,
                      isSelected
                        ? [
                            styles.pillActive,
                            {
                              borderColor: theme.colors.primary,
                              backgroundColor: "rgba(229, 9, 20, 0.12)",
                            },
                          ]
                        : [
                            styles.pillInactive,
                            {
                              borderColor: theme.colors.outlineVariant,
                              backgroundColor: theme.colors.elevation.level2,
                            },
                          ],
                    ]}
                  >
                    <View style={styles.eraTextGroup}>
                      <Text
                        style={[
                          styles.pillLabel,
                          {
                            color: isSelected
                              ? "#FFFFFF"
                              : theme.colors.textPrimary,
                            fontFamily: isSelected
                              ? "Inter_600SemiBold"
                              : "Inter_400Regular",
                          },
                        ]}
                      >
                        {era.label}
                      </Text>
                      <Text
                        style={[
                          styles.pillDesc,
                          { color: theme.colors.textMuted },
                        ]}
                      >
                        {desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="radiobox-marked"
                        size={18}
                        color={theme.colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Minimum Rating
            </Text>
            <Text
              style={[
                styles.sectionHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              Set a quality threshold based on community and critic ratings.
            </Text>
            <View style={styles.rowGrid}>
              {RATING_PRESETS.map((rating) => {
                const isSelected = minRating === rating.value;
                return (
                  <Pressable
                    key={rating.label}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setMinRating(rating.value);
                    }}
                    style={[
                      styles.ratingPill,
                      isSelected
                        ? [
                            styles.pillActive,
                            {
                              borderColor: theme.colors.gold,
                              backgroundColor: "rgba(245, 158, 11, 0.15)",
                            },
                          ]
                        : [
                            styles.pillInactive,
                            {
                              borderColor: theme.colors.outlineVariant,
                              backgroundColor: theme.colors.elevation.level2,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.ratingLabel,
                        {
                          color: isSelected
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                          fontFamily: isSelected
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                        },
                      ]}
                    >
                      {rating.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Languages
            </Text>
            <Text
              style={[
                styles.sectionHint,
                { color: theme.colors.textSecondary },
              ]}
            >
              Select the original languages you prefer to watch.
            </Text>
            <View style={styles.chipGrid}>
              {availableLanguages.map((lang) => {
                const isSelected = languages.includes(lang.code);
                return (
                  <Pressable
                    key={lang.code}
                    onPress={() => toggleLanguage(lang.code)}
                    style={[
                      styles.chip,
                      isSelected
                        ? [
                            styles.chipActive,
                            {
                              borderColor: theme.colors.primary,
                              backgroundColor: "rgba(229, 9, 20, 0.16)",
                            },
                          ]
                        : [
                            styles.chipInactive,
                            {
                              borderColor: theme.colors.outlineVariant,
                              backgroundColor: theme.colors.elevation.level2,
                            },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected
                            ? "#FFFFFF"
                            : theme.colors.textSecondary,
                          fontFamily: isSelected
                            ? "Inter_600SemiBold"
                            : "Inter_400Regular",
                        },
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color={theme.colors.primary}
                        style={styles.chipCheck}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
          },
        ]}
      >
        <Pressable
          onPress={handleSave}
          disabled={isPending || dataLoading}
          style={({ pressed }) => [
            styles.saveButton,
            { backgroundColor: theme.colors.primary },
            pressed && { opacity: 0.9 },
            (isPending || dataLoading) && { opacity: 0.6 },
          ]}
        >
          {isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>SAVE PREFERENCES</Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  safeArea: {
    maxHeight: "100%",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  scroll: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 22,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    letterSpacing: 0.2,
  },
  sectionCounter: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  segmentContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
    gap: 4,
    marginVertical: 4,
  },
  segmentTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 9,
    gap: 6,
    borderWidth: 1,
    borderColor: "transparent",
  },
  segmentTabActive: {
    borderWidth: 1,
  },
  segmentTabText: {
    fontSize: 12.5,
  },
  sectionHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  chipActive: {
    borderWidth: 1.5,
  },
  chipExcluded: {
    borderWidth: 1.5,
  },
  chipInactive: {},
  chipText: {
    fontSize: 12.5,
  },
  chipCheck: {
    marginLeft: 2,
  },
  pillList: {
    gap: 8,
  },
  eraPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  eraTextGroup: {
    flex: 1,
    paddingRight: 8,
  },
  pillActive: {
    borderWidth: 1.5,
  },
  pillInactive: {},
  pillLabel: {
    fontSize: 13.5,
  },
  pillDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  rowGrid: {
    flexDirection: "row",
    gap: 8,
  },
  ratingPill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
  },
  ratingLabel: {
    fontSize: 12.5,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderTopWidth: 1,
  },
  saveButton: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 13.5,
    letterSpacing: 0.6,
  },
});
