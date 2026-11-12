import React from "react";
import { Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Movie } from "../types/movies.type";
import {
  formatEndTime,
  formatLanguage,
  formatRuntime,
  ratingBand,
} from "../utils/deck";
import { colors } from "@/lib/theme/tokens.generated";

interface DecisionVitalsStripProps {
  movie: Movie;
}

export default function DecisionVitalsStrip({ movie }: DecisionVitalsStripProps) {
  const runtimeFormatted = formatRuntime(movie.runtime);
  const endTime = formatEndTime(movie.runtime);

  const hasScore =
    typeof movie.vote_average === "number" && movie.vote_average > 0;
  const score = hasScore ? `${movie.vote_average.toFixed(1)} ★` : "—";
  const scoreBand = hasScore
    ? ratingBand(movie.vote_average) ?? "Audience Rated"
    : "Unrated";

  const language = formatLanguage(movie.original_language);
  const isEnglish = (movie.original_language || "en").toLowerCase() === "en";
  const audioSubtext = isEnglish ? "Original audio" : "Subtitled";

  return (
    <View className="mx-4 mt-3 mb-2 flex-row items-center border-y border-white/[0.06] px-1 py-3">
      {/* 1. Schedule & Runtime */}
      <View className="flex-1 items-center justify-center px-1">
        <View className="mb-1 flex-row items-center gap-1">
          <MaterialCommunityIcons name="clock-outline" size={13} color={colors.faintForeground} />
          <Text className="text-[10px] tracking-[0.8px] font-brandSemiBold text-zinc-500 uppercase">
            TIME
          </Text>
        </View>
        <Text className="text-[14px] tracking-[-0.2px] font-brandBold text-white" numberOfLines={1}>
          {runtimeFormatted}
        </Text>
        <Text className="mt-0.5 text-[11px] text-zinc-400" numberOfLines={1}>
          {endTime ?? "Tonight's feature"}
        </Text>
      </View>

      <View className="h-7 w-px bg-white/[0.07]" />

      {/* 2. Rating & Consensus */}
      <View className="flex-1 items-center justify-center px-1">
        <View className="mb-1 flex-row items-center gap-1">
          <MaterialCommunityIcons name="star-outline" size={13} color={colors.faintForeground} />
          <Text className="text-[10px] tracking-[0.8px] font-brandSemiBold text-zinc-500 uppercase">
            RATING
          </Text>
        </View>
        <Text className="text-[14px] tracking-[-0.2px] font-brandBold text-white" numberOfLines={1}>
          {score}
        </Text>
        <Text className="mt-0.5 text-[11px] text-zinc-400" numberOfLines={1}>
          {scoreBand}
        </Text>
      </View>

      <View className="h-7 w-px bg-white/[0.07]" />

      {/* 3. Language & Audio */}
      <View className="flex-1 items-center justify-center px-1">
        <View className="mb-1 flex-row items-center gap-1">
          <MaterialCommunityIcons name="translate" size={13} color={colors.faintForeground} />
          <Text className="text-[10px] tracking-[0.8px] font-brandSemiBold text-zinc-500 uppercase">
            AUDIO
          </Text>
        </View>
        <Text className="text-[14px] tracking-[-0.2px] font-brandBold text-white" numberOfLines={1}>
          {language}
        </Text>
        <Text className="mt-0.5 text-[11px] text-zinc-400" numberOfLines={1}>
          {audioSubtext}
        </Text>
      </View>
    </View>
  );
}
