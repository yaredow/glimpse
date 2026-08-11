import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useProfile } from "@/features/profile/hooks/use-profile";
import { useGetPreferences } from "@/features/onboarding/hooks/queries/use-get-preferences";
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
  const { colors } = useTheme();
  const { data: profileData, isPending: profileLoading } = useProfile(true);
  const { data: prefData, isPending: prefLoading } = useGetPreferences(true);
  const { mutate: logout, isPending: logoutPending } = useLogout();

  const user = profileData?.user;
  const pref = prefData?.preference;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + User Info */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? getInitials(user.name) : "?"}
            </Text>
          </View>

          {profileLoading ? (
            <View style={styles.skeletonName} />
          ) : (
            <>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {user?.created_at ? (
                <Text style={styles.memberSince}>
                  <MaterialCommunityIcons
                    name="calendar-blank-outline"
                    size={12}
                    color="#666"
                    style={{ marginRight: 4 }}
                  />
                  Member since {formatDate(user.created_at)}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Preferences Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preferences</Text>

          {prefLoading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : !pref ? (
            <Text style={styles.emptyText}>Not set yet</Text>
          ) : (
            <View style={styles.prefContent}>
              {pref.favorite_genres.length > 0 && (
                <View style={styles.prefRow}>
                  <Text style={styles.label}>FAVORITE GENRES</Text>
                  <View style={styles.chipRow}>
                    {pref.favorite_genres.map((id) => (
                      <View key={id} style={styles.chip}>
                        <Text style={styles.chipText}>{genreName(id)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pref.excluded_genres.length > 0 && (
                <View style={styles.prefRow}>
                  <Text style={styles.label}>EXCLUDED GENRES</Text>
                  <View style={styles.chipRow}>
                    {pref.excluded_genres.map((id) => (
                      <View key={id} style={[styles.chip, styles.chipExcluded]}>
                        <Text style={[styles.chipText, styles.chipTextExcluded]}>
                          {genreName(id)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {pref.languages.length > 0 && (
                <View style={styles.prefRow}>
                  <Text style={styles.label}>LANGUAGES</Text>
                  <Text style={styles.value}>
                    {pref.languages.join("  \u00B7  ")}
                  </Text>
                </View>
              )}

              {(pref.min_year > 1888 || pref.max_year < 2100) && (
                <View style={styles.prefRow}>
                  <Text style={styles.label}>YEAR RANGE</Text>
                  <Text style={styles.value}>
                    {pref.min_year} – {pref.max_year}
                  </Text>
                </View>
              )}

              {pref.min_rating > 0 && (
                <View style={styles.prefRow}>
                  <Text style={styles.label}>MINIMUM RATING</Text>
                  <View style={styles.ratingRow}>
                    <MaterialCommunityIcons
                      name="star"
                      size={14}
                      color="#FFD700"
                    />
                    <Text style={styles.value}>
                      {pref.min_rating.toFixed(1)} and above
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Account Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <View style={styles.accountRow}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color="#999"
            />
            <Text style={styles.accountValue}>{user?.email}</Text>
          </View>

          <View style={styles.separator} />

          <Button
            mode="contained"
            onPress={() => logout()}
            buttonColor="#E50914"
            textColor="white"
            style={styles.logoutButton}
            contentStyle={styles.logoutContent}
            labelStyle={styles.logoutLabel}
            disabled={logoutPending}
            loading={logoutPending}
          >
            LOGOUT
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
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 20,
  },

  avatarSection: {
    alignItems: "center",
    paddingBottom: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E50914",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "white",
  },
  userName: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "white",
    letterSpacing: -0.4,
    textAlign: "center",
  },
  userEmail: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  memberSince: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#666",
    marginTop: 10,
  },
  skeletonName: {
    width: 120,
    height: 24,
    backgroundColor: "#1A1A1A",
    borderRadius: 6,
    marginTop: 8,
  },

  card: {
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 20,
  },
  cardTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 14,
    color: "white",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },

  prefContent: {
    gap: 16,
  },
  prefRow: {
    gap: 6,
  },
  label: {
    fontFamily: "Inter_900Black",
    fontSize: 11,
    color: "#E50914",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  value: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "white",
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    backgroundColor: "rgba(229,9,20,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(229,9,20,0.2)",
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    color: "#E50914",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipExcluded: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipTextExcluded: {
    color: "#999",
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
    paddingVertical: 4,
  },
  accountValue: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#999",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 16,
  },
  logoutButton: {
    borderRadius: 8,
  },
  logoutContent: {
    height: 48,
  },
  logoutLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
