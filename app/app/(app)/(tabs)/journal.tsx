import { useCallback, useMemo, useState } from "react";
import {
  FlatList, Pressable, RefreshControl, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/ui/text";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import {
  BookmarkIcon,
  CheckIcon,
  FilmSlateIcon,
  FilmStripIcon,
  StarIcon,
} from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";
import { useGetHistory } from "@/features/movies/hooks/query/use-get-history";
import type { HistoryMovie } from "@/features/movies/types/movies.type";
import { isWatchedEntry } from "@/features/movies/utils/deck";
import { colors } from "@/lib/theme/tokens.generated";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w342";
const COLUMN_GAP = 10;
const PADDING = 16;

type FilterTab = "all" | "watched" | "pick_tonight";

export default function Journal() {
  const insets = useSafeAreaInsets();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const { data, isPending, refetch, isRefetching } = useGetHistory();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const cardWidth = (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP * 2) / 3;
  const cardHeight = cardWidth * 1.5;

  const allHistory = useMemo(() => data?.history ?? [], [data?.history]);

  const filteredHistory = useMemo(() => {
    if (activeFilter === "all") return allHistory;
    if (activeFilter === "watched") {
      return allHistory.filter((item) => isWatchedEntry(item.action));
    }
    return allHistory.filter(
      (item) =>
        item.action === "pick_tonight" || item.action === "watchlist_add",
    );
  }, [allHistory, activeFilter]);

  const stats = useMemo(() => {
    const watchedCount = allHistory.filter((i) =>
      isWatchedEntry(i.action),
    ).length;
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
    const isWatched = isWatchedEntry(item.action);
    const posterUri = item.poster_path
      ? item.poster_path.startsWith("http")
        ? item.poster_path
        : `${TMDB_IMAGE_BASE}${item.poster_path}`
      : null;

    return (
      <Pressable
        onPress={() => handleMoviePress(item)}
        style={{ width: cardWidth }}
        className="overflow-hidden rounded-md border border-white/[0.08] bg-card active:opacity-80"
        accessibilityRole="button"
        accessibilityLabel={item.title}
      >
        {posterUri ? (
          <Image
            source={{ uri: posterUri }}
            style={{ width: "100%", height: cardHeight }}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            className="w-full items-center justify-center bg-surface-5 p-1.5"
            style={{ height: cardHeight }}
          >
            <FilmStripIcon
              size={28}
              color={colors.faintForeground}
            />
            <Text
              className="mt-1 text-center text-[10px] font-brandSemiBold text-subtle-foreground"
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        )}

        <View className="absolute left-1.5 right-1.5 top-1.5 flex-row justify-between">
          {item.vote_average > 0 ? (
            <View className="flex-row items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5">
              <StarIcon
                size={11}
                color={colors.gold}
                weight="fill"
              />
              <Text className="text-[9px] font-brandBold text-white">
                {item.vote_average.toFixed(1)}
              </Text>
            </View>
          ) : <View />}

          <View
            className={cn(
              "flex-row items-center gap-1 rounded-md px-1.5 py-0.5",
              isWatched ? "bg-emerald-500/85" : "bg-primary/85",
            )}
          >
            {isWatched ? (
              <CheckIcon size={10} color={colors.white} />
            ) : (
              <BookmarkIcon size={10} color={colors.white} />
            )}
            <Text className="text-[9px] font-brandBold text-white">
              {formatDate(item.acted_at)}
            </Text>
          </View>
        </View>

        <View className="px-1.5 py-1.5">
          <Text
            className="text-[11px] font-brandSemiBold text-foreground"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.rating ? (
            <View className="mt-1 flex-row items-center gap-1">
              <StarIcon
                size={9}
                color={colors.gold}
                weight="fill"
              />
              <Text className="text-[9px] font-brandBold text-amber-500">
                {item.rating}/5
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="px-4 pb-3 pt-2">
        <View className="flex-row items-baseline gap-1">
          <Text className="text-[22px] tracking-[2px] font-brandExtraBold text-foreground">
            JOURNAL
          </Text>
          <View className="mb-0.5 h-[5px] w-[5px] rounded-full bg-primary" />
        </View>
        <Text className="mt-0.5 text-[12px] font-brand text-subtle-foreground">
          Your lifetime cinema archive and history
        </Text>
      </View>

      <View className="mb-3 flex-row gap-2 px-4">
        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-5 px-2 py-2.5">
          <Text className="text-[17px] font-brandBold text-primary">
            {stats.watchedCount}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-subtle-foreground">
            Watched
          </Text>
        </View>

        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-5 px-2 py-2.5">
          <Text className="text-[17px] font-brandBold text-amber-500">
            {stats.picksCount}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-subtle-foreground">
            Picks
          </Text>
        </View>

        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-5 px-2 py-2.5">
          <Text
            className="text-[17px] font-brandBold text-foreground"
            numberOfLines={1}
          >
            {stats.topGenre}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-subtle-foreground">
            Top Vibe
          </Text>
        </View>
      </View>

      <View className="mb-3 flex-row gap-2 px-4">
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === "all" }}
          accessibilityLabel={`All, ${allHistory.length} entries`}
          onPress={() => handleTabPress("all")}
          className={cn(
            "rounded-full px-3.5 py-1.5",
            activeFilter === "all"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-5",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "all" ? "text-surface-1" : "text-subtle-foreground",
            )}
          >
            All ({allHistory.length})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === "watched" }}
          accessibilityLabel={`Watched, ${stats.watchedCount} entries`}
          onPress={() => handleTabPress("watched")}
          className={cn(
            "rounded-full px-3.5 py-1.5",
            activeFilter === "watched"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-5",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "watched" ? "text-surface-1" : "text-subtle-foreground",
            )}
          >
            Watched ({stats.watchedCount})
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeFilter === "pick_tonight" }}
          accessibilityLabel={`Picks, ${stats.picksCount} entries`}
          onPress={() => handleTabPress("pick_tonight")}
          className={cn(
            "rounded-full px-3.5 py-1.5",
            activeFilter === "pick_tonight"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-5",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "pick_tonight" ? "text-surface-1" : "text-subtle-foreground",
            )}
          >
            Picks ({stats.picksCount})
          </Text>
        </Pressable>
      </View>

      {isPending ? (
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 60 }}
        >
          <Text className="text-[14px] font-brand text-subtle-foreground">
            Loading cinema archive...
          </Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 60 }}
        >
          <FilmSlateIcon
            size={48}
            color={colors.faintForeground}
            style={{ marginBottom: 12 }}
          />
          <Text className="mb-1.5 text-center text-[17px] font-brandBold text-foreground">
            {activeFilter === "watched"
              ? "No watched films yet"
              : activeFilter === "pick_tonight"
              ? "No picks saved yet"
              : "Your journal is empty"}
          </Text>
          <Text className="mb-5 text-center text-[13px] leading-[19px] font-brand text-faint-foreground">
            Movies you mark as watched or select as your daily pick will be collected here.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore today's batch"
            onPress={() => router.push("/(app)/(tabs)")}
            className="min-h-[44px] justify-center rounded-lg border border-white/[0.08] bg-surface-6 px-4 py-2.5"
          >
            <Text className="text-[13px] font-brandSemiBold text-foreground">
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
          columnWrapperStyle={{
            gap: COLUMN_GAP,
            paddingHorizontal: PADDING,
            marginBottom: 14,
          }}
          contentContainerStyle={{
            paddingTop: 4,
            paddingBottom: Math.max(insets.bottom, 16) + 80,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                refetch();
              }}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

