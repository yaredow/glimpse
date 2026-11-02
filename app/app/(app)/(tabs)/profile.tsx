import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
import { useOnboardingStore } from "@/features/onboarding/store/onboarding.store";
import { useLogout } from "@/features/auth/hooks/mutations/use-logout";

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Science Fiction",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
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
  const hydrateFromPreference = useOnboardingStore(
    (s) => s.hydrateFromPreference,
  );
  const setMode = useOnboardingStore((s) => s.setMode);
  const { mutate: logout, isPending: logoutPending } = useLogout();

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
        <View style={styles.avatarSection}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.outlineVariant,
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
                <Text
                  style={[styles.memberSince, { color: theme.colors.textMuted }]}
                >
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={12}
                    color={theme.colors.textMuted}
                    style={styles.calendarIcon}
                  />
                  Member since {formatDate(user.created_at)}
                </Text>
              ) : null}
            </>
          )}
        </View>

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
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={18}
                color={theme.colors.gold}
              />
              <Text
                style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
              >
                Daily Sync Allowance
              </Text>
            </View>
            <View
              style={[
                styles.syncBadge,
                {
                  backgroundColor:
                    syncsRemaining > 0
                      ? theme.colors.elevation.level3
                      : theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <Text
                style={[
                  styles.syncBadgeText,
                  {
                    color:
                      syncsRemaining > 0
                        ? theme.colors.gold
                        : theme.colors.textMuted,
                  },
                ]}
              >
                {syncsRemaining} of 3 Available
              </Text>
            </View>
          </View>

          <Text
            style={[styles.syncSubtext, { color: theme.colors.textSecondary }]}
          >
            Your Daily Five resets at midnight. Syncs refresh automatically each day.
          </Text>
        </View>

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
              <MaterialCommunityIcons
                name="dna"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.cardTitle, { color: theme.colors.textPrimary }]}
              >
                Taste DNA
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (!pref) return;
                hydrateFromPreference(pref);
                setMode("edit");
                router.push("/(onboarding)");
              }}
              style={[
                styles.editBtn,
                {
                  backgroundColor: theme.colors.elevation.level2,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="pencil-outline"
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
            <Text
              style={[styles.emptyText, { color: theme.colors.textMuted }]}
            >
              Loading taste profile...
            </Text>
          ) : !pref ? (
            <Text
              style={[styles.emptyText, { color: theme.colors.textMuted }]}
            >
              No taste preferences set yet.
            </Text>
          ) : (
            <View style={styles.prefContent}>
              {pref.favorite_genres.length > 0 && (
                <View style={styles.prefRow}>
                  <Text
                    style={[styles.label, { color: theme.colors.primary }]}
                  >
                    FAVORITE GENRES
                  </Text>
                  <View style={styles.chipRow}>
                    {pref.favorite_genres.map((id) => (
                      <View
                        key={id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.cinemaRedMuted,
                            borderColor: "rgba(229, 9, 20, 0.3)",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: theme.colors.primary },
                          ]}
                        >
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pref.excluded_genres.length > 0 && (
                <View style={styles.prefRow}>
                  <Text
                    style={[styles.label, { color: theme.colors.textMuted }]}
                  >
                    EXCLUDED GENRES
                  </Text>
                  <View style={styles.chipRow}>
                    {pref.excluded_genres.map((id) => (
                      <View
                        key={id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: theme.colors.elevation.level2,
                            borderColor: theme.colors.outlineVariant,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
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

              {pref.languages.length > 0 && (
                <View style={styles.prefRow}>
                  <Text
                    style={[styles.label, { color: theme.colors.textMuted }]}
                  >
                    LANGUAGES
                  </Text>
                  <Text
                    style={[styles.value, { color: theme.colors.textPrimary }]}
                  >
                    {pref.languages.join("  \u00B7  ")}
                  </Text>
                </View>
              )}

              {(pref.min_year > 1888 || pref.max_year < 2100) && (
                <View style={styles.prefRow}>
                  <Text
                    style={[styles.label, { color: theme.colors.textMuted }]}
                  >
                    YEAR RANGE
                  </Text>
                  <Text
                    style={[styles.value, { color: theme.colors.textPrimary }]}
                  >
                    {pref.min_year} – {pref.max_year}
                  </Text>
                </View>
              )}

              {pref.min_rating > 0 && (
                <View style={styles.prefRow}>
                  <Text
                    style={[styles.label, { color: theme.colors.textMuted }]}
                  >
                    MINIMUM RATING
                  </Text>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color={theme.colors.gold}
                    />
                    <Text
                      style={[styles.value, { color: theme.colors.textPrimary }]}
                    >
                      {pref.min_rating.toFixed(1)} and above
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

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
            Account & Session
          </Text>

          <View style={styles.accountRow}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
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
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
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
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: "#FFFFFF",
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    letterSpacing: -0.3,
    textAlign: "center",
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: 2,
    textAlign: "center",
  },
  memberSince: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 8,
    alignItems: "center",
  },
  calendarIcon: {
    marginRight: 4,
  },
  skeletonName: {
    width: 120,
    height: 24,
    borderRadius: 6,
    marginTop: 8,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  cardHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
    letterSpacing: 0.3,
  },
  syncBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncBadgeText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  syncSubtext: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 18,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontStyle: "italic",
  },
  prefContent: {
    gap: 14,
  },
  prefRow: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  accountValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  logoutButton: {
    borderRadius: 10,
    marginTop: 4,
  },
  logoutContent: {
    height: 44,
  },
  logoutLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 13,
    letterSpacing: 1,
  },
});
