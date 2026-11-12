import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { cn } from "@/lib/utils";
import { useMovieSources } from "../hooks/query/use-movie-sources";
import { SHOW_TORRENTS } from "../constants/movies.constants";
import { tmdbImage } from "../constants/images";
import type { TorrentSource, WatchProvider } from "../types/movies.type";
import { colors } from "@/lib/theme/tokens.generated";

const ProviderLogo = {
  width: 38,
  height: 38,
  borderRadius: 10,
};

interface WhereToWatchProps {
  movieId: number;
  movieTitle: string;
}

export default function WhereToWatch({ movieId, movieTitle }: WhereToWatchProps) {
  const { data, isPending, isError } = useMovieSources(movieId);

  const sources = data?.sources;
  const providers = sources?.providers;
  const flatrate = providers?.flatrate ?? [];
  const rent = providers?.rent ?? [];
  const torrents = sources?.torrents ?? [];
  const searchLinks = sources?.search_links;

  const activeProviders = flatrate.length > 0 ? flatrate : rent;
  const providerLabel = flatrate.length > 0 ? "STREAMING NOW" : "AVAILABLE TO RENT";

  const cleanProviders = useMemo(() => {
    const seen = new Set<string>();
    return activeProviders.filter((prov) => {
      // Normalize base service name (e.g. "HBO Max Amazon Channel" -> "HBO Max")
      const base = prov.name
        .replace(/\s+(Amazon|Apple\s*TV|Roku)\s+Channel.*/i, "")
        .trim();
      const key = base.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [activeProviders]);

  const handleOpenLink = async (url: string) => {
    if (!url) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Cannot Open Link",
        text2: "Unable to launch the requested source.",
      });
    }
  };

  const handleOpenMagnet = async (torrent: TorrentSource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Linking.openURL(torrent.magnet);
    } catch {
      handleShareMagnet(torrent);
    }
  };

  const handleShareMagnet = async (torrent: TorrentSource) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        title: `${movieTitle} (${torrent.quality}) Magnet Link`,
        message: torrent.magnet,
      });
    } catch (err) {
      if (err instanceof Error) {
        Toast.show({
          type: "error",
          text1: "Share Failed",
          text2: err.message,
        });
      }
    }
  };

  if (isPending) {
    return (
      <View className="items-center gap-2.5 py-7">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-[13px] font-brand text-zinc-500">
          Checking streaming availability...
        </Text>
      </View>
    );
  }

  if (isError || !sources) {
    return (
      <View className="items-center py-4">
        <Text className="text-[13px] font-brand text-zinc-500">
          Sources currently unavailable. Use universal search below.
        </Text>
      </View>
    );
  }

  return (
    <View className="mt-6 w-full px-5">
      <View className="mb-4 flex-row items-center gap-2">
        <MaterialCommunityIcons
          name="play-network-outline"
          size={18}
          color={colors.primary}
        />
        <Text className="text-[18px] tracking-[-0.3px] font-brandBold text-white">
          Where to Watch
        </Text>
      </View>

      {cleanProviders.length > 0 ? (
        <View className="mb-6">
          <Text className="mb-3 text-[11px] tracking-[1.2px] font-brandBold text-zinc-400">
            {providerLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 12,
              paddingRight: 20,
              paddingBottom: 4,
            }}
          >
            {cleanProviders.map((prov: WatchProvider) => {
              const logoUri = tmdbImage(prov.logo_path, "w185");
              return (
                <Pressable
                  key={prov.provider_id}
                  onPress={() =>
                    handleOpenLink(providers?.justwatch_link || searchLinks?.justwatch || "")
                  }
                  className="flex-row items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface-zinc-850 px-4 py-3 active:opacity-80"
                >
                  {logoUri ? (
                    <Image
                      source={{ uri: logoUri }}
                      style={ProviderLogo}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View className="h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-surface-zinc-800">
                      <MaterialCommunityIcons
                        name="movie-outline"
                        size={20}
                        color={colors.faintForeground}
                      />
                    </View>
                  )}
                  <View className="justify-center">
                    <Text
                      className="text-[13.5px] tracking-[0.1px] font-brandSemiBold text-white"
                      numberOfLines={1}
                    >
                      {prov.name}
                    </Text>
                    <Text className="mt-0.5 text-[11px] tracking-[0.2px] font-brandMedium text-zinc-400">
                      {providerLabel === "STREAMING NOW" ? "Stream" : "Rent"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View className="flex-row items-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-surface-zinc-900 px-3.5 py-3">
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={colors.faintForeground}
          />
          <Text className="flex-1 text-[12.5px] leading-[18px] font-brand text-zinc-500">
            Not currently available on major subscription platforms. Try the search links below.
          </Text>
        </View>
      )}

      {SHOW_TORRENTS ? (
      <View className="mb-6">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-[11px] tracking-[1.2px] font-brandBold text-zinc-400">
            TORRENTS & MAGNETS
          </Text>
          {torrents.length > 0 ? (
            <View className="flex-row items-center gap-[5px] rounded-[10px] bg-emerald-500/[0.12] px-2 py-[3px]">
              <View className="h-1.5 w-1.5 rounded-[3px] bg-emerald-500" />
              <Text className="text-[10px] tracking-[0.3px] font-brandSemiBold text-emerald-500">
                YTS Verified
              </Text>
            </View>
          ) : null}
        </View>

        {torrents.length > 0 ? (
          <View className="gap-2">
            {torrents.map((t, idx) => (
              <View
                key={`${t.quality}-${t.type}-${idx}`}
                className="flex-row items-center justify-between rounded-[14px] border border-white/[0.08] bg-surface-zinc-850 px-3.5 py-3"
              >
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <View
                      className={cn(
                        "rounded-[6px] px-[7px] py-0.5",
                        t.quality.includes("2160") || t.quality.includes("4K")
                          ? "bg-amber-500"
                          : "bg-white/[0.15]",
                      )}
                    >
                      <Text className="text-[11px] tracking-[0.5px] font-brandBold text-white">
                        {t.quality.toUpperCase()}
                      </Text>
                    </View>
                    <Text className="text-[12px] tracking-[0.5px] font-brandSemiBold text-zinc-400">
                      {t.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text className="mt-1 text-[12px] font-brand text-zinc-500">
                    {t.size} · {t.seeds} seeds
                  </Text>
                </View>

                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => handleShareMagnet(t)}
                    className="h-9 w-9 items-center justify-center rounded-[10px] border border-white/[0.08] bg-surface-zinc-800 active:opacity-70"
                    accessibilityLabel="Copy or share magnet"
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={16}
                      color={colors.white}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleOpenMagnet(t)}
                    className="h-9 flex-row items-center gap-[5px] rounded-[10px] bg-primary px-3 active:opacity-85"
                  >
                    <MaterialCommunityIcons
                      name="magnet"
                      size={15}
                      color={colors.white}
                    />
                    <Text className="text-[11px] tracking-[0.6px] font-brandBold text-white">
                      MAGNET
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="flex-row items-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-surface-zinc-900 px-3.5 py-3">
            <MaterialCommunityIcons
              name="cloud-search-outline"
              size={16}
              color={colors.faintForeground}
            />
            <Text className="flex-1 text-[12.5px] leading-[18px] font-brand text-zinc-500">
              No direct torrent releases indexed. Use universal web search below.
            </Text>
          </View>
        )}
      </View>
      ) : null}

      {searchLinks ? (
        <View className="mb-6">
          <Text className="mb-3 text-[11px] tracking-[1.2px] font-brandBold text-zinc-400">
            UNIVERSAL SEARCH
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingRight: 20,
              paddingBottom: 4,
            }}
          >
            {searchLinks.google ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.google)}
                className="flex-row items-center gap-2 rounded-[22px] border border-white/[0.08] bg-surface-zinc-850 px-[15px] py-2.5 active:opacity-75"
              >
                <MaterialCommunityIcons name="google" size={15} color={colors.white} />
                <Text className="text-[12.5px] tracking-[0.2px] font-brandSemiBold text-white">
                  Google
                </Text>
              </Pressable>
            ) : null}

            {searchLinks.justwatch ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.justwatch)}
                className="flex-row items-center gap-2 rounded-[22px] border border-white/[0.08] bg-surface-zinc-850 px-[15px] py-2.5 active:opacity-75"
              >
                <MaterialCommunityIcons name="play-box-outline" size={15} color={colors.gold} />
                <Text className="text-[12.5px] tracking-[0.2px] font-brandSemiBold text-white">
                  JustWatch
                </Text>
              </Pressable>
            ) : null}

            {searchLinks.letterboxd ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.letterboxd)}
                className="flex-row items-center gap-2 rounded-[22px] border border-white/[0.08] bg-surface-zinc-850 px-[15px] py-2.5 active:opacity-75"
              >
                <MaterialCommunityIcons name="filmstrip" size={15} color={colors.success} />
                <Text className="text-[12.5px] tracking-[0.2px] font-brandSemiBold text-white">
                  Letterboxd
                </Text>
              </Pressable>
            ) : null}

            {searchLinks.imdb ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.imdb)}
                className="flex-row items-center gap-2 rounded-[22px] border border-white/[0.08] bg-surface-zinc-850 px-[15px] py-2.5 active:opacity-75"
              >
                <MaterialCommunityIcons name="star-outline" size={15} color={colors.gold} />
                <Text className="text-[12.5px] tracking-[0.2px] font-brandSemiBold text-white">
                  IMDb
                </Text>
              </Pressable>
            ) : null}

            {searchLinks.netflix ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.netflix)}
                className="flex-row items-center gap-2 rounded-[22px] border border-white/[0.08] bg-surface-zinc-850 px-[15px] py-2.5 active:opacity-75"
              >
                <MaterialCommunityIcons name="netflix" size={15} color={colors.primary} />
                <Text className="text-[12.5px] tracking-[0.2px] font-brandSemiBold text-white">
                  Netflix
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}


