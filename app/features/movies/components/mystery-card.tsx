import { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { FilmStripIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { tmdbImage } from "../constants/images";
import type { GridMovie } from "../types/movies.type";
import { curatorNote, structuredClues } from "../utils/deck";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";
import { shadows } from "@/lib/theme/shadows";

export type CardStamp = "PASSED" | "SEEN" | null;

interface MysteryCardProps {
  movie: GridMovie;
  index: number;
  total?: number;
  isInteractive: boolean;
  stamp?: CardStamp;
  onReveal?: () => void;
  onViewDetails?: () => void;
}

export default function MysteryCard({
  movie,
  index: _index,
  total: _total = 5,
  isInteractive,
  stamp = null,
  onViewDetails,
}: MysteryCardProps) {
  const [posterFailed, setPosterFailed] = useState(false);
  const posterSrc = tmdbImage(movie.poster_path || movie.backdrop_path, "w780");
  const note = curatorNote(movie);
  const clues = structuredClues(movie);

  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const metaParts: string[] = [];
  if (releaseYear) metaParts.push(String(releaseYear));
  if (movie.genres?.length > 0) metaParts.push(movie.genres[0]);
  if (movie.vote_average > 0) metaParts.push(`★ ${movie.vote_average.toFixed(1)}`);
  const metaLine = metaParts.join("  ·  ");

  const handlePress = () => {
    if (!isInteractive) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewDetails?.();
  };

  return (
    <View
      className="h-full w-full overflow-hidden rounded-3xl border border-white/[0.1] bg-card"
      style={{
        boxShadow: shadows.deck,
      }}
    >
      <Pressable
        onPress={handlePress}
        disabled={!isInteractive}
        className="flex-1"
        accessibilityRole="button"
        accessibilityLabel={`${movie.title}. Tap for details.`}
      >
        {/* Full-bleed poster image */}
        {posterSrc && !posterFailed ? (
          <Image
            source={{ uri: posterSrc }}
            style={StyleSheetAbsoluteFill}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <View className="absolute inset-0 items-center justify-center bg-card p-6">
            <FilmStripIcon
              size={56}
              color={colors.faintForeground}
            />
            <Text className="mt-3.5 text-center text-[20px] font-brandBold text-white">
              {movie.title}
            </Text>
          </View>
        )}

        {/* Resolved stamp overlay */}
        {stamp ? (
          <View
            className="absolute inset-0 z-10 bg-black/[0.45]"
            pointerEvents="none"
          />
        ) : null}

        {stamp ? (
          <View
            className="absolute top-0 left-0 z-[25] h-[88px] w-[88px] overflow-hidden rounded-tl-[23px]"
            pointerEvents="none"
          >
            <View
              className="absolute top-4 left-[-28px] h-[22px] w-[114px] items-center justify-center bg-white"
              style={{ transform: [{ rotate: "-45deg" }] }}
            >
              <Text className="text-center text-[9.5px] tracking-[1.2px] font-brandBold text-surface-1">
                {stamp}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Gradient Scrim & Info Overlay */}
        <LinearGradient
          colors={[
            "transparent",
            withAlpha(colors.background, 0.45),
            withAlpha(colors.background, 0.92),
            colors.background,
          ]}
          locations={[0, 0.25, 0.65, 1]}
          style={ScrimStyle}
        >
          {/* Genre / Vibe tags */}
          {clues.length > 0 ? (
            <View className="mb-1.5 flex-row gap-1.5">
              {clues.slice(0, 2).map((clue) => (
                <View
                  key={clue}
                  className="rounded border border-white/[0.18] bg-black/[0.65] px-2 py-1"
                >
                  <Text className="text-[10px] tracking-[0.3px] font-brandSemiBold text-white">
                    {clue}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Film Title */}
          <Text
            className="text-[22px] leading-[26px] tracking-[-0.4px] font-brandBold text-white"
            numberOfLines={2}
            style={TitleShadow}
          >
            {movie.title}
          </Text>

          {/* Metadata */}
          {metaLine.length > 0 ? (
            <Text
              className="mt-1 text-[12px] tracking-[0.2px] font-brandMedium text-white/[0.78]"
              numberOfLines={1}
              style={TextShadow}
            >
              {metaLine}
            </Text>
          ) : null}

          {/* Curator Note / Hook */}
          {note ? (
            <Text
              className="mt-1.5 text-[12.5px] leading-[17px] font-brand text-white/[0.85]"
              numberOfLines={2}
              style={TextShadow}
            >
              {note}
            </Text>
          ) : null}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const StyleSheetAbsoluteFill = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

const ScrimStyle = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: "48%" as const,
  paddingHorizontal: 18,
  paddingBottom: 18,
  justifyContent: "flex-end" as const,
};

const TitleShadow = {
  textShadowColor: "rgba(0, 0, 0, 0.95)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 6,
};

const TextShadow = {
  textShadowColor: "rgba(0, 0, 0, 0.95)",
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 4,
};
