import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useAppTheme } from "@/lib/theme";
import { useMovieSources } from "../hooks/query/use-movie-sources";
import { SHOW_TORRENTS } from "../consants/movies.constants";
import { tmdbImage } from "../consants/images";
import type { TorrentSource, WatchProvider } from "../types/movies.type";

interface WhereToWatchProps {
  movieId: number;
  movieTitle: string;
}

export default function WhereToWatch({ movieId, movieTitle }: WhereToWatchProps) {
  const theme = useAppTheme();
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
      <View style={styles.loadingBox}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.textMuted }]}>
          Checking streaming availability...
        </Text>
      </View>
    );
  }

  if (isError || !sources) {
    return (
      <View style={styles.errorBox}>
        <Text style={[styles.errorText, { color: theme.colors.textMuted }]}>
          Sources currently unavailable. Use universal search below.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name="play-network-outline"
          size={18}
          color={theme.colors.primary}
        />
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Where to Watch
        </Text>
      </View>

      {cleanProviders.length > 0 ? (
        <View style={styles.subSection}>
          <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
            {providerLabel}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.providerScroll}
          >
            {cleanProviders.map((prov: WatchProvider) => {
              const logoUri = tmdbImage(prov.logo_path, "w185");
              return (
                <Pressable
                  key={prov.provider_id}
                  onPress={() =>
                    handleOpenLink(providers?.justwatch_link || searchLinks?.justwatch || "")
                  }
                  style={({ pressed }) => [
                    styles.providerCard,
                    {
                      backgroundColor: theme.colors.elevation.level2,
                      borderColor: theme.colors.outlineVariant,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  {logoUri ? (
                    <Image
                      source={{ uri: logoUri }}
                      style={styles.providerLogo}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <View
                      style={[
                        styles.providerLogoFallback,
                        { backgroundColor: theme.colors.elevation.level3 },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="movie-outline"
                        size={20}
                        color={theme.colors.textMuted}
                      />
                    </View>
                  )}
                  <View style={styles.providerInfo}>
                    <Text
                      style={[styles.providerName, { color: theme.colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {prov.name}
                    </Text>
                    <Text
                      style={[
                        styles.providerActionText,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {providerLabel === "STREAMING NOW" ? "Stream" : "Rent"}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.colors.elevation.level1,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color={theme.colors.textMuted}
          />
          <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>
            Not currently available on major subscription platforms. Try the search links below.
          </Text>
        </View>
      )}

      {SHOW_TORRENTS ? (
      <View style={styles.subSection}>
        <View style={styles.subLabelRow}>
          <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
            TORRENTS & MAGNETS
          </Text>
          {torrents.length > 0 ? (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>YTS Verified</Text>
            </View>
          ) : null}
        </View>

        {torrents.length > 0 ? (
          <View style={styles.torrentList}>
            {torrents.map((t, idx) => (
              <View
                key={`${t.quality}-${t.type}-${idx}`}
                style={[
                  styles.torrentCard,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.torrentMeta}>
                  <View style={styles.qualityRow}>
                    <View
                      style={[
                        styles.qualityBadge,
                        t.quality.includes("2160") || t.quality.includes("4K")
                          ? styles.badge4K
                          : styles.badgeHD,
                      ]}
                    >
                      <Text style={styles.qualityText}>{t.quality.toUpperCase()}</Text>
                    </View>
                    <Text
                      style={[styles.torrentType, { color: theme.colors.textSecondary }]}
                    >
                      {t.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.torrentSize, { color: theme.colors.textMuted }]}
                  >
                    {t.size} · {t.seeds} seeds
                  </Text>
                </View>

                <View style={styles.torrentActions}>
                  <Pressable
                    onPress={() => handleShareMagnet(t)}
                    style={({ pressed }) => [
                      styles.iconActionBtn,
                      {
                        backgroundColor: theme.colors.elevation.level3,
                        borderColor: theme.colors.outlineVariant,
                      },
                      pressed && { opacity: 0.7 },
                    ]}
                    accessibilityLabel="Copy or share magnet"
                  >
                    <MaterialCommunityIcons
                      name="share-variant-outline"
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleOpenMagnet(t)}
                    style={({ pressed }) => [
                      styles.magnetBtn,
                      { backgroundColor: theme.colors.primary },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="magnet"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={styles.magnetBtnText}>MAGNET</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.noticeCard,
              {
                backgroundColor: theme.colors.elevation.level1,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="cloud-search-outline"
              size={16}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.noticeText, { color: theme.colors.textMuted }]}>
              No direct torrent releases indexed. Use universal web search below.
            </Text>
          </View>
        )}
      </View>
      ) : null}

      {searchLinks ? (
        <View style={styles.subSection}>
          <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
            UNIVERSAL SEARCH
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.searchPillsRow}
          >
            {searchLinks.google ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.google)}
                style={({ pressed }) => [
                  styles.searchPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <MaterialCommunityIcons name="google" size={15} color="#FFFFFF" />
                <Text style={styles.searchPillText}>Google</Text>
              </Pressable>
            ) : null}

            {searchLinks.justwatch ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.justwatch)}
                style={({ pressed }) => [
                  styles.searchPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <MaterialCommunityIcons name="play-box-outline" size={15} color="#F59E0B" />
                <Text style={styles.searchPillText}>JustWatch</Text>
              </Pressable>
            ) : null}

            {searchLinks.letterboxd ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.letterboxd)}
                style={({ pressed }) => [
                  styles.searchPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <MaterialCommunityIcons name="filmstrip" size={15} color="#10B981" />
                <Text style={styles.searchPillText}>Letterboxd</Text>
              </Pressable>
            ) : null}

            {searchLinks.imdb ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.imdb)}
                style={({ pressed }) => [
                  styles.searchPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <MaterialCommunityIcons name="star-outline" size={15} color="#F59E0B" />
                <Text style={styles.searchPillText}>IMDb</Text>
              </Pressable>
            ) : null}

            {searchLinks.netflix ? (
              <Pressable
                onPress={() => handleOpenLink(searchLinks.netflix)}
                style={({ pressed }) => [
                  styles.searchPill,
                  {
                    backgroundColor: theme.colors.elevation.level2,
                    borderColor: theme.colors.outlineVariant,
                  },
                  pressed && { opacity: 0.75 },
                ]}
              >
                <MaterialCommunityIcons name="netflix" size={15} color="#E50914" />
                <Text style={styles.searchPillText}>Netflix</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    letterSpacing: -0.3,
  },
  subSection: {
    marginBottom: 24,
  },
  subLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  subLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    color: "#10B981",
    letterSpacing: 0.3,
  },
  providerScroll: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 20,
    paddingBottom: 4,
  },
  providerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  providerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
  },
  providerLogoFallback: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  providerInfo: {
    justifyContent: "center",
  },
  providerName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13.5,
    letterSpacing: 0.1,
  },
  providerActionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12.5,
    lineHeight: 18,
    flex: 1,
  },
  torrentList: {
    gap: 8,
  },
  torrentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  torrentMeta: {
    flex: 1,
  },
  qualityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qualityBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badge4K: {
    backgroundColor: "#F59E0B",
  },
  badgeHD: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  qualityText: {
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  torrentType: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  torrentSize: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 4,
  },
  torrentActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  magnetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  magnetBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 11,
    letterSpacing: 0.6,
  },
  searchPillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 20,
    paddingBottom: 4,
  },
  searchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  searchPillText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12.5,
    letterSpacing: 0.2,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  errorBox: {
    paddingVertical: 16,
    alignItems: "center",
  },
  errorText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});

