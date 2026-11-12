import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";
import { useGetHistory } from "@/features/movies/hooks/query/use-get-history";
import type { HistoryMovie } from "@/features/movies/types/movies.type";
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

  const cardWidth = (SCREEN_WIDTH - PADDING * 2 - COLUMN_GAP * 2) / 3;
  const cardHeight = cardWidth * 1.5;

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
        className="overflow-hidden rounded-md border border-white/[0.08] bg-surface-zinc-900 active:opacity-80"
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
            className="w-full items-center justify-center bg-surface-zinc-850 p-1.5"
            style={{ height: cardHeight }}
          >
            <MaterialCommunityIcons
              name="filmstrip"
              size={28}
              color={colors.faintForeground}
            />
            <Text
              className="mt-1 text-center text-[10px] font-brandSemiBold text-zinc-400"
              numberOfLines={2}
            >
              {item.title}
            </Text>
          </View>
        )}

        <View className="absolute left-1.5 right-1.5 top-1.5 flex-row justify-between">
          {item.vote_average > 0 ? (
            <View className="flex-row items-center gap-[3px] rounded-md bg-black/75 px-[5px] py-0.5">
              <MaterialCommunityIcons
                name="star"
                size={11}
                color={colors.gold}
              />
              <Text className="text-[9px] font-brandBold text-white">
                {item.vote_average.toFixed(1)}
              </Text>
            </View>
          ) : <View />}

          <View
            className={cn(
              "flex-row items-center gap-[3px] rounded-md px-[5px] py-0.5",
              item.action === "watched" ? "bg-emerald-500/85" : "bg-primary/85",
            )}
          >
            <MaterialCommunityIcons
              name={item.action === "watched" ? "check" : "bookmark"}
              size={10}
              color={colors.white}
            />
            <Text className="text-[9px] font-brandBold text-white">
              {formatDate(item.acted_at)}
            </Text>
          </View>
        </View>

        <View className="px-1.5 py-1.5">
          <Text
            className="text-[11px] font-brandSemiBold text-white"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {item.rating ? (
            <View className="mt-[3px] flex-row items-center gap-[3px]">
              <MaterialCommunityIcons
                name="star"
                size={9}
                color={colors.gold}
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
    <SafeAreaView className="flex-1 bg-surface-obsidian" edges={["top"]}>
      <View className="px-4 pb-3 pt-2">
        <View className="flex-row items-baseline gap-[3px]">
          <Text className="text-[22px] tracking-[2px] font-brandExtraBold text-white">
            JOURNAL
          </Text>
          <View className="mb-0.5 h-[5px] w-[5px] rounded-full bg-primary" />
        </View>
        <Text className="mt-0.5 text-[12px] font-brand text-zinc-400">
          Your lifetime cinema archive and history
        </Text>
      </View>

      <View className="mb-3 flex-row gap-2 px-4">
        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-zinc-850 px-2 py-2.5">
          <Text className="text-[17px] font-brandBold text-primary">
            {stats.watchedCount}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-zinc-400">
            Watched
          </Text>
        </View>

        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-zinc-850 px-2 py-2.5">
          <Text className="text-[17px] font-brandBold text-amber-500">
            {stats.picksCount}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-zinc-400">
            Picks
          </Text>
        </View>

        <View className="flex-1 items-center rounded-lg border border-white/[0.08] bg-surface-zinc-850 px-2 py-2.5">
          <Text
            className="text-[17px] font-brandBold text-white"
            numberOfLines={1}
          >
            {stats.topGenre}
          </Text>
          <Text className="mt-0.5 text-[10px] uppercase tracking-[0.5px] font-brandSemiBold text-zinc-400">
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
            "rounded-[18px] px-3.5 py-1.5",
            activeFilter === "all"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-zinc-850",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "all" ? "text-surface-obsidian" : "text-zinc-400",
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
            "rounded-[18px] px-3.5 py-1.5",
            activeFilter === "watched"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-zinc-850",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "watched" ? "text-surface-obsidian" : "text-zinc-400",
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
            "rounded-[18px] px-3.5 py-1.5",
            activeFilter === "pick_tonight"
              ? "bg-white"
              : "border border-white/[0.08] bg-surface-zinc-850",
          )}
        >
          <Text
            className={cn(
              "text-[12px] font-brandSemiBold",
              activeFilter === "pick_tonight" ? "text-surface-obsidian" : "text-zinc-400",
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
          <Text className="text-[14px] font-brand text-zinc-400">
            Loading cinema archive...
          </Text>
        </View>
      ) : filteredHistory.length === 0 ? (
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 60 }}
        >
          <MaterialCommunityIcons
            name="movie-open-outline"
            size={48}
            color={colors.faintForeground}
            style={{ marginBottom: 12 }}
          />
          <Text className="mb-1.5 text-center text-[17px] font-brandBold text-white">
            {activeFilter === "watched"
              ? "No watched films yet"
              : activeFilter === "pick_tonight"
              ? "No picks saved yet"
              : "Your journal is empty"}
          </Text>
          <Text className="mb-5 text-center text-[13px] leading-[19px] font-brand text-zinc-500">
            Movies you mark as watched or select as your daily pick will be collected here.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explore today's batch"
            onPress={() => router.push("/(app)/(tabs)")}
            className="rounded-lg border border-white/[0.08] bg-surface-zinc-800 px-[18px] py-2.5"
          >
            <Text className="text-[13px] font-brandSemiBold text-white">
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

