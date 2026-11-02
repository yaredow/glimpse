import { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import { useGetHistory } from "@/features/movies/hooks/query/use-get-history";
import type { HistoryMovie } from "@/features/movies/types/movies.type";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 10;
const PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP * 2) / 3;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

type FilterTab = "all" | "watched" | "pick_tonight";

export default function Journal() {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const { data, isPending, refetch, isRefetching } = useGetHistory();

  const allHistory = useMemo(() => data?.history ?? [], [data?.history]);

  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") return allHistory;
    return allHistory.filter(
      (item) =>
        item.action === activeFilter ||
        (activeFilter === "pick_tonight" && item.action === "watchlist_add"),
    );
  }, [allHistory, activeFilter]);

  const stats = useMemo(() => {
    const watchedCount = allHistory.filter((i) => i.action === "watched").length;
    const picksCount = allHistory.filter(
      (i) => i.action === "pick_tonight" || i.action === "watchlist_add",
    ).length;

    const genreCounts: Record<string, number> = {};
    for (const item of allHistory) {
      for (const g of item.genres ?? []) {
        genreCounts[g] = (genreCounts[g] ?? 0) + 1;
      }
    }

    let topGenre = "—";
    let topCount = 0;
    for (const [g, count] of Object.entries(genreCounts)) {
      if (count > topCount) {
        topCount = count;
        topGenre = g;
      }
    }

    return { watchedCount, picksCount, topGenre };
  }, [allHistory]);

  const handleTabPress = (tab: FilterTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(tab);
  };

  const handleMoviePress = (movie: HistoryMovie) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: "/(app)/movies/[id]",
      params: { id: movie.movie_id },
    });
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }: { item: HistoryMovie }) => {
    const posterUri = item.poster_path
      ? item.poster_path.startsWith("http")
        ? item.poster_path
        : `${TMDB_IMAGE_BASE}${item.poster_path}`
      : null;

    return (
      <Pressable
        onPress={() => handleMoviePress(item)}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: theme.colors.outlineVariant,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.posterPlaceholder,
              { backgroundColor: theme.colors.elevation.level2 },
            ]}
          >
            <MaterialCommunityIcons
              name="filmstrip"
              size={28}
              color={theme.colors.textMuted}
            />
            <Text
              style={[styles.placeholderTitle, { color: theme.colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        )}

        <View style={styles.badgeRow}>
          {item.vote_average > 0 ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: "rgba(0, 0, 0, 0.75)" },
              ]}
            >
              <MaterialCommunityIcons
                name="star"
                size={11}
                color={theme.colors.gold}
              />
              <Text style={styles.badgeText}>
                {item.vote_average.toFixed(1)}
              </Text>
            </View>
          ) : <View />}

          <View
            style={[
              styles.badge,
              {
                backgroundColor:
                  item.action === "watched"
                    ? "rgba(16, 185, 129, 0.85)"
                    : "rgba(229, 9, 20, 0.85)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={item.action === "watched" ? "check" : "bookmark"}
              size={10}
              color="#FFFFFF"
            />
            <Text style={styles.badgeText}>{formatDate(item.acted_at)}</Text>
          </View>
        </View>

        <View style={styles.cardInfo}>
          <Text
            style={[styles.movieTitle, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.rating ? (
            <View style={styles.userRatingRow}>
              <MaterialCommunityIcons
                name="star"
                size={9}
                color={theme.colors.gold}
              />
              <Text
                style={[styles.userRatingText, { color: theme.colors.gold }]}
              >
                {item.rating}/5
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: theme.colors.textPrimary }]}>
            JOURNAL
          </Text>
          <View style={[styles.brandDot, { backgroundColor: theme.colors.primary }]} />
        </View>
        <Text style={[styles.screenSubtitle, { color: theme.colors.textSecondary }]}>
          Your lifetime cinema archive and history
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {stats.watchedCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Watched
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.statValue, { color: theme.colors.gold }]}>
            {stats.picksCount}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Picks
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            {
              backgroundColor: theme.colors.elevation.level2,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text
            style={[styles.statValue, { color: theme.colors.textPrimary }]}
            numberOfLines={1}
          >
            {stats.topGenre}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
            Top Vibe
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <Pressable
          onPress={() => handleTabPress("all")}
          style={[
            styles.filterPill,
            activeFilter === "all"
              ? [styles.filterPillActive, { backgroundColor: theme.colors.textPrimary }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  activeFilter === "all"
                    ? theme.colors.inverseOnSurface
                    : theme.colors.textSecondary,
              },
            ]}
          >
            All ({allHistory.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleTabPress("watched")}
          style={[
            styles.filterPill,
            activeFilter === "watched"
              ? [styles.filterPillActive, { backgroundColor: theme.colors.textPrimary }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  activeFilter === "watched"
                    ? theme.colors.inverseOnSurface
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Watched ({stats.watchedCount})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleTabPress("pick_tonight")}
          style={[
            styles.filterPill,
            activeFilter === "pick_tonight"
              ? [styles.filterPillActive, { backgroundColor: theme.colors.textPrimary }]
              : [
                  styles.filterPillInactive,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ],
          ]}
        >
          <Text
            style={[
              styles.filterText,
              {
                color:
                  activeFilter === "pick_tonight"
                    ? theme.colors.inverseOnSurface
                    : theme.colors.textSecondary,
              },
            ]}
          >
            Picks ({stats.picksCount})
          </Text>
        </Pressable>
      </View>

      {isPending ? (
        <View style={styles.centered}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading cinema archive...
          </Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="movie-open-outline"
            size={48}
            color={theme.colors.textMuted}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: theme.colors.textPrimary }]}>
            {activeFilter === "watched"
              ? "No watched films yet"
              : activeFilter === "pick_tonight"
              ? "No picks saved yet"
              : "Your journal is empty"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Movies you mark as watched or select as your daily pick will be collected here.
          </Text>
          <Pressable
            onPress={() => router.push("/(app)/(tabs)")}
            style={[
              styles.exploreBtn,
              { backgroundColor: theme.colors.elevation.level3, borderColor: theme.colors.outlineVariant },
            ]}
          >
            <Text style={[styles.exploreBtnText, { color: theme.colors.textPrimary }]}>
              Explore Today&apos;s Batch
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => `${item.movie_id}-${item.action}-${item.acted_at}`}
          renderItem={renderItem}
          numColumns={3}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={theme.colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  screenTitle: {
    fontFamily: "Inter_900Black",
    fontSize: 22,
    letterSpacing: 2,
  },
  brandDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 2,
  },
  screenSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  statValue: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  statLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
    textTransform: "uppercase",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  filterPillActive: {},
  filterPillInactive: {
    borderWidth: 1,
  },
  filterText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },
  columnWrapper: {
    gap: COLUMN_GAP,
    paddingHorizontal: PADDING,
    marginBottom: 14,
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 32,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
  },
  poster: {
    width: "100%",
    height: CARD_HEIGHT,
  },
  posterPlaceholder: {
    width: "100%",
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  placeholderTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  badgeRow: {
    position: "absolute",
    top: 6,
    left: 6,
    right: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 9,
  },
  cardInfo: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },
  movieTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
  },
  userRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 3,
  },
  userRatingText: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  emptyIcon: {
    marginBottom: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 17,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
  },
  exploreBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  exploreBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
