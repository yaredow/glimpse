import { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
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
import { useAppTheme } from "@/lib/theme";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { useLogout } from "@/features/auth/hooks/mutations/use-logout";
import EditPreferencesModal from "@/features/profile/components/edit-preferences-modal";

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
  const theme = useAppTheme();
  const { data: profileData, isPending: profileLoading } = useProfile(true);
  const { data: prefData, isPending: prefLoading } = useGetPreferences(true);
  const { mutate: logout, isPending: logoutPending } = useLogout();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const user = profileData?.user;
  const pref = prefData?.preference;
  const syncsRemaining = user?.syncs_remaining ?? 3;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Avatar */}
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.elevation.level2,
                borderColor: "rgba(229, 9, 20, 0.4)",
              },
            ]}
          >
            <Text style={styles.avatarText}>
              {user ? getInitials(user.name) : "?"}
            </Text>
          </View>

          {profileLoading ? (
            <View
              style={[
                styles.skeletonName,
                { backgroundColor: theme.colors.elevation.level2 },
              ]}
            />
          ) : (
            <>
              <Text
                style={[styles.userName, { color: theme.colors.textPrimary }]}
              >
                {user?.name}
              </Text>
              <Text
                style={[styles.userEmail, { color: theme.colors.textSecondary }]}
              >
                {user?.email}
              </Text>
              {user?.created_at ? (
                <View
                  style={[
                    styles.memberPill,
                    {
                      backgroundColor: theme.colors.elevation.level1,
                      borderColor: theme.colors.outlineVariant,
                    },
                  ]}
                >
                  <CalendarBlankIcon
                    size={12}
                    color={theme.colors.textMuted}
                  />
                  <Text
                    style={[styles.memberSince, { color: theme.colors.textMuted }]}
                  >
                    Member since {formatDate(user.created_at)}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </View>

        {/* Compact Daily Sync Allowance */}
        <View
          style={[
            styles.syncPill,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <LightningIcon
            size={14}
            color={theme.colors.gold}
            weight="fill"
          />
          <Text style={[styles.syncPillText, { color: theme.colors.textPrimary }]}>
            {syncsRemaining} of 3 syncs available
          </Text>
          <Text style={[styles.syncDot, { color: theme.colors.textMuted }]}>·</Text>
          <Text style={[styles.syncResetText, { color: theme.colors.textMuted }]}>
            Resets at midnight
          </Text>
        </View>

        {/* Film Preferences Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitle}>
              <SlidersHorizontalIcon
                size={16}
                color={theme.colors.primary}
                weight="bold"
              />
              <Text
                style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
              >
                Film Preferences
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsEditModalOpen(true);
              }}
              style={({ pressed }) => [
                styles.editBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
                pressed && { opacity: 0.7 },
              ]}
            >
              <PencilSimpleIcon
                size={13}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.editBtnText, { color: theme.colors.textSecondary }]}
              >
                Edit
              </Text>
            </Pressable>
          </View>

          {prefLoading ? (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              Loading preferences...
            </Text>
          ) : !pref ? (
            <Text style={[styles.emptyText, { color: theme.colors.textMuted }]}>
              No preferences set yet.
            </Text>
          ) : (
            <View style={styles.prefContent}>
              {pref.favorite_genres.length > 0 && (
                <View style={styles.prefSection}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
                  >
                    FAVORITE GENRES
                  </Text>
                  <View style={styles.chipRow}>
                    {pref.favorite_genres.map((id) => (
                      <View
                        key={id}
                        style={[
                          styles.chipFavorite,
                          {
                            backgroundColor: "rgba(229, 9, 20, 0.12)",
                            borderColor: "rgba(229, 9, 20, 0.35)",
                          },
                        ]}
                      >
                        <Text style={styles.chipFavoriteText}>
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pref.excluded_genres.length > 0 && (
                <View style={styles.prefSection}>
                  <Text
                    style={[styles.sectionLabel, { color: theme.colors.textMuted }]}
                  >
                    EXCLUDED GENRES
                  </Text>
                  <View style={styles.chipRow}>
                    {pref.excluded_genres.map((id) => (
                      <View
                        key={id}
                        style={[
                          styles.chipExcluded,
                          {
                            backgroundColor: theme.colors.elevation.level2,
                            borderColor: theme.colors.outlineVariant,
                          },
                        ]}
                      >
                        <XIcon
                          size={11}
                          color={theme.colors.textMuted}
                          weight="bold"
                        />
                        <Text
                          style={[
                            styles.chipExcludedText,
                            { color: theme.colors.textSecondary },
                          ]}
                        >
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Filter Metadata Row */}
              <View
                style={[
                  styles.metaRow,
                  {
                    borderTopColor: "rgba(255, 255, 255, 0.06)",
                  },
                ]}
              >
                <View style={styles.metaItem}>
                  <Text
                    style={[styles.metaLabel, { color: theme.colors.textMuted }]}
                  >
                    ERA
                  </Text>
                  <Text
                    style={[styles.metaValue, { color: theme.colors.textPrimary }]}
                  >
                    {pref.min_year <= 1888 && pref.max_year >= 2025
                      ? "All Time"
                      : `${pref.min_year} – ${pref.max_year}`}
                  </Text>
                </View>

                {pref.min_rating > 0 && (
                  <View style={styles.metaItem}>
                    <Text
                      style={[styles.metaLabel, { color: theme.colors.textMuted }]}
                    >
                      MIN RATING
                    </Text>
                    <View style={styles.ratingValueRow}>
                      <StarIcon
                        size={13}
                        color={theme.colors.gold}
                        weight="fill"
                      />
                      <Text
                        style={[
                          styles.metaValue,
                          { color: theme.colors.textPrimary },
                        ]}
                      >
                        {pref.min_rating.toFixed(1)}+
                      </Text>
                    </View>
                  </View>
                )}

                {pref.languages.length > 0 && (
                  <View style={styles.metaItem}>
                    <Text
                      style={[styles.metaLabel, { color: theme.colors.textMuted }]}
                    >
                      LANGUAGES
                    </Text>
                    <Text
                      style={[styles.metaValue, { color: theme.colors.textPrimary }]}
                    >
                      {pref.languages.map((l) => l.toUpperCase()).join(", ")}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Account Details */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
          >
            Account
          </Text>

          <View style={styles.accountRow}>
            <EnvelopeSimpleIcon
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.accountValue,
                { color: theme.colors.textSecondary },
              ]}
            >
              {user?.email}
            </Text>
          </View>

          <View style={styles.accountRow}>
            <FilmStripIcon
              size={16}
              color={theme.colors.textMuted}
            />
            <Text
              style={[
                styles.accountValue,
                { color: theme.colors.textMuted },
              ]}
            >
              Glimpse Cinema v1.0.0
            </Text>
          </View>

          <View
            style={[
              styles.separator,
              { backgroundColor: theme.colors.outlineVariant },
            ]}
          />

          <Button
            mode="contained"
            onPress={() => logout()}
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
            style={styles.logoutButton}
            contentStyle={styles.logoutContent}
            labelStyle={styles.logoutLabel}
            disabled={logoutPending}
            loading={logoutPending}
          >
            SIGN OUT
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 14,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 10,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  avatarText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    letterSpacing: 0.5,
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  memberSince: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
  },
  skeletonName: {
    width: 140,
    height: 22,
    borderRadius: 6,
    marginTop: 4,
  },
  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 7,
  },
  syncPillText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
  },
  syncDot: {
    fontSize: 12,
  },
  syncResetText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    paddingVertical: 6,
  },
  prefContent: {
    gap: 14,
  },
  prefSection: {
    gap: 8,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10.5,
    letterSpacing: 1.2,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chipFavorite: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipFavoriteText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  chipExcluded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipExcludedText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 18,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metaItem: {
    gap: 3,
  },
  metaLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
  },
  metaValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
  },
  ratingValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  accountValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  separator: {
    height: 1,
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 2,
  },
  logoutContent: {
    height: 44,
  },
  logoutLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
  },
});
