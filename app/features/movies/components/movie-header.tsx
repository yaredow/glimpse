import { LinearGradient } from "expo-linear-gradient";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Image } from "expo-image";
import { FilmStripIcon, PlayIcon } from "phosphor-react-native";
import { tmdbImage } from "../constants/images";
import type { Movie } from "../types/movies.type";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";

interface MovieHeaderProps {
  movie: Movie;
  onTrailerPress: () => void;
}

const backdropUrl = (path?: string | null) =>
  tmdbImage(path, "w780") ?? undefined;
const posterUrl = (path?: string | null) =>
  tmdbImage(path, "w500") ?? undefined;

export default function MovieHeader({ movie, onTrailerPress }: MovieHeaderProps) {
  const year = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  const backdropSrc = backdropUrl(movie.backdrop_path || movie.poster_path);
  const posterSrc = posterUrl(movie.poster_path);

  return (
    <View className="h-[350px] w-full">
      {backdropSrc ? (
        <Image
          source={{ uri: backdropSrc }}
          style={StyleSheetAbsoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : (
        <View className="absolute inset-0 bg-surface-5" />
      )}
      <LinearGradient
        colors={["transparent", withAlpha(colors.card, 0.65), colors.background]}
        locations={[0, 0.6, 1]}
        style={StyleSheetAbsoluteFill}
        pointerEvents="none"
      />

      <View className="flex-1 flex-row items-end px-4 pb-4 pt-20">
        <View className="flex-1 justify-end mr-3.5">
          {movie.genres && movie.genres.length > 0 ? (
            <View className="mb-2 flex-row items-center gap-1.5">
              {movie.genres.slice(0, 2).map((genre) => (
                <View
                  key={genre}
                  className="rounded border border-white/[0.12] bg-white/[0.08] px-2 py-0.5"
                >
                  <Text className="text-[10px] tracking-[0.3px] font-brandBold text-foreground">
                    {genre}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text className="mb-1.5 text-[24px] leading-[29px] font-brandBold text-white" numberOfLines={2}>
            {movie.title}
          </Text>

          <View className="mb-2.5 flex-row flex-nowrap items-center">
            {year ? (
              <Text className="text-[13px] font-brandSemiBold text-foreground">
                {year}
              </Text>
            ) : null}
            {year && movie.director ? (
              <Text className="mx-1.5 text-[13px] text-faint-foreground">•</Text>
            ) : null}
            {movie.director ? (
              <Text className="shrink text-[13px] font-brandMedium text-subtle-foreground" numberOfLines={1}>
                Dir. {movie.director}
              </Text>
            ) : null}
          </View>

          {movie.trailer_key ? (
            <Pressable
              className="flex-row items-center gap-1 self-start rounded-sm bg-primary/[0.9] px-3 py-1.5 active:opacity-80"
              onPress={onTrailerPress}
              accessibilityRole="button"
              accessibilityLabel="Watch trailer"
              hitSlop={10}
            >
              <PlayIcon size={14} color={colors.white} />
              <Text className="text-[11px] tracking-[0.6px] font-brandBold text-white">
                TRAILER
              </Text>
            </Pressable>
          ) : null}
        </View>

        {posterSrc ? (
          <Image
            source={{ uri: posterSrc }}
            style={PosterStyle}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
        ) : (
          <View className="h-36 w-24 items-center justify-center rounded-sm border border-white/[0.2] bg-surface-6">
            <FilmStripIcon size={32} color={colors.faintForeground} />
          </View>
        )}
      </View>
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

const PosterStyle = {
  width: 96,
  height: 144,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: withAlpha(colors.white, 0.2),
};
