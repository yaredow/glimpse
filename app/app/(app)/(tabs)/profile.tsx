import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  View,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CalendarBlankIcon,
  LightningIcon,
  SlidersHorizontalIcon,
  PencilSimpleIcon,
  XIcon,
  StarIcon,
  EnvelopeSimpleIcon,
  FilmStripIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { useLogout } from "@/features/auth/hooks/mutations/use-logout";
import EditPreferencesModal from "@/features/profile/components/edit-preferences-modal";
import { colors } from "@/lib/theme/tokens.generated";

const GENRE_NAMES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function genreName(id: number): string {
  return GENRE_NAMES[id] ?? `Genre ${id}`;
}

export default function Profile() {
  const insets = useSafeAreaInsets();
  const { data: profileData, isPending: profileLoading } = useProfile(true);
  const { data: prefData, isPending: prefLoading } = useGetPreferences(true);
  const { mutate: logout, isPending: logoutPending } = useLogout();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const user = profileData?.user;
  const pref = prefData?.preference;
  const syncsRemaining = user?.syncs_remaining ?? 3;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <ScrollView
        contentContainerClassName="flex-grow gap-3.5 px-4 pt-3"
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 16) + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Avatar */}
        <View className="items-center py-2.5">
          <View className="mb-2.5 h-16 w-16 items-center justify-center rounded-full border-[1.5px] border-primary/40 bg-surface-5">
            <Text className="text-[22px] tracking-[0.5px] font-brandBold text-white">
              {user ? getInitials(user.name) : "?"}
            </Text>
          </View>

          {profileLoading ? (
            <View className="mt-1 h-[22px] w-[140px] rounded bg-surface-5" />
          ) : (
            <>
              <Text className="text-[20px] leading-[26px] tracking-[-0.3px] font-brandBold text-white">
                {user?.name}
              </Text>
              <Text className="mt-0.5 text-[13px] leading-[18px] font-brand text-subtle-foreground">
                {user?.email}
              </Text>
              {user?.created_at ? (
                <View className="mt-2 flex-row items-center gap-1 rounded-full border border-white/[0.08] bg-card px-2.5 py-1">
                  <CalendarBlankIcon
                    size={12}
                    color={colors.faintForeground}
                  />
                  <Text className="text-[11px] font-brand text-faint-foreground">
                    Member since {formatDate(user.created_at)}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* Compact Daily Sync Allowance */}
        <View className="flex-row items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-card px-3.5 py-2">
          <LightningIcon
            size={14}
            color={colors.gold}
            weight="fill"
          />
          <Text className="text-[12.5px] font-brandSemiBold text-white">
            {syncsRemaining} of 3 syncs available
          </Text>
          <Text className="text-[12px] font-brand text-faint-foreground">·</Text>
          <Text className="text-[12px] font-brand text-faint-foreground">
            Resets at midnight
          </Text>
        </View>

        {/* Film Preferences Card */}
        <View className="gap-3.5 rounded-2xl border border-white/[0.08] bg-card p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <SlidersHorizontalIcon
                size={16}
                color={colors.primary}
                weight="bold"
              />
              <Text className="text-[15px] tracking-[0.2px] font-brandBold text-white">
                Film Preferences
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditModalOpen(true);
              }}
              className="flex-row items-center gap-1 rounded-sm border border-white/[0.08] bg-surface-5 px-2.5 py-1 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Edit film preferences"
            >
              <PencilSimpleIcon
                size={13}
                color={colors.subtleForeground}
              />
              <Text className="text-[12px] font-brandSemiBold text-subtle-foreground">
                Edit
              </Text>
            </Pressable>
          </View>

          {prefLoading ? (
            <Text className="py-1.5 text-[13px] font-brand text-faint-foreground">
              Loading preferences...
            </Text>
          ) : !pref ? (
            <Text className="py-1.5 text-[13px] font-brand text-faint-foreground">
              No preferences set yet.
            </Text>
          ) : (
            <View className="gap-3.5">
              {pref.favorite_genres.length > 0 && (
                <View className="gap-2">
                  <Text className="text-[10.5px] tracking-[1.2px] font-brandSemiBold text-faint-foreground">
                    FAVORITE GENRES
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {pref.favorite_genres.map((id) => (
                      <View
                        key={id}
                        className="rounded-sm border border-primary/35 bg-primary/[0.12] px-3 py-1"
                      >
                        <Text className="text-[12px] font-brandSemiBold text-white">
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pref.excluded_genres.length > 0 && (
                <View className="gap-2">
                  <Text className="text-[10.5px] tracking-[1.2px] font-brandSemiBold text-faint-foreground">
                    EXCLUDED GENRES
                  </Text>
                  <View className="flex-row flex-wrap gap-1.5">
                    {pref.excluded_genres.map((id) => (
                      <View
                        key={id}
                        className="flex-row items-center gap-1 rounded-sm border border-white/[0.08] bg-surface-5 px-2.5 py-1"
                      >
                        <XIcon
                          size={11}
                          color={colors.faintForeground}
                          weight="bold"
                        />
                        <Text className="text-[12px] font-brand text-subtle-foreground">
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Filter Metadata Row */}
              <View className="flex-row flex-wrap items-start gap-4 border-t border-t-white/[0.06] pt-3">
                <View className="gap-1">
                  <Text className="text-[10px] tracking-[1px] font-brandSemiBold text-faint-foreground">
                    ERA
                  </Text>
                  <Text className="text-[12.5px] font-brandSemiBold text-white">
                    {pref.min_year <= 1888 && pref.max_year >= 2025
                      ? "All Time"
                      : `${pref.min_year} – ${pref.max_year}`}
                  </Text>
                </View>

                {pref.min_rating > 0 && (
                  <View className="gap-1">
                    <Text className="text-[10px] tracking-[1px] font-brandSemiBold text-faint-foreground">
                      MIN RATING
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <StarIcon
                        size={13}
                        color={colors.gold}
                        weight="fill"
                      />
                      <Text className="text-[12.5px] font-brandSemiBold text-white">
                        {pref.min_rating.toFixed(1)}+ / 10
                      </Text>
                    </View>
                  </View>
                )}

                {pref.languages.length > 0 && (
                  <View className="gap-1">
                    <Text className="text-[10px] tracking-[1px] font-brandSemiBold text-faint-foreground">
                      LANGUAGES
                    </Text>
                    <Text className="text-[12.5px] font-brandSemiBold text-white">
                      {pref.languages.map((l) => l.toUpperCase()).join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Account Details */}
        <View className="gap-3.5 rounded-2xl border border-white/[0.08] bg-card p-4">
          <Text className="text-[15px] tracking-[0.2px] font-brandBold text-white">
            Account
          </Text>

          <View className="flex-row items-center gap-2.5">
            <EnvelopeSimpleIcon
              size={16}
              color={colors.faintForeground}
            />
            <Text className="text-[13px] font-brand text-subtle-foreground">
              {user?.email}
            </Text>
          </View>

          <View className="flex-row items-center gap-2.5">
            <FilmStripIcon
              size={16}
              color={colors.faintForeground}
            />
            <Text className="text-[13px] font-brand text-faint-foreground">
              Glimpse Cinema v1.0.0
            </Text>
          </View>

          <View className="h-px bg-hairline/10" />

          <Button
            variant="primary"
            size="lg"
            onPress={() => logout()}
            disabled={logoutPending}
            className="mt-0.5 w-full"
          >
            <View className="flex-row items-center gap-2">
              {logoutPending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : null}
              <Text className="text-[13px] tracking-[0.8px] font-brandBold text-white">
                SIGN OUT
              </Text>
            </View>
          </Button>
        </View>
      </ScrollView>

      {/* Edit Preferences Modal */}
      <EditPreferencesModal
        visible={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentPreferences={pref}
      />
    </SafeAreaView>
  );
}
