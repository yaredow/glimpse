import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { CompassIcon, SparkleIcon } from "phosphor-react-native";
import type { Movie } from "../types/movies.type";
import { curatorNote, whyThisIsHere } from "../utils/deck";
import { colors } from "@/lib/theme/tokens.generated";

interface CuratorPitchCardProps {
  movie: Movie;
}

export default function CuratorPitchCard({ movie }: CuratorPitchCardProps) {
  const pitch = curatorNote(movie);
  const rationale = whyThisIsHere(movie);

  return (
    <View className="mx-4 mt-3.5 mb-2 rounded-[14px] border border-primary/[0.2] bg-primary/[0.04] p-4">
      <View className="mb-2.5 flex-row items-center gap-2">
        <View className="h-[22px] w-[22px] items-center justify-center rounded-[11px] bg-primary/[0.12]">
          <CompassIcon
            size={14}
            color={colors.primary}
          />
        </View>
        <Text className="flex-1 text-[11px] tracking-[1px] font-brandBold text-primary">
          CURATOR&apos;S TAKE
        </Text>
        <View className="rounded-[6px] bg-white/[0.06] px-2 py-0.5">
          <Text className="text-[9px] tracking-[0.6px] font-brandSemiBold text-zinc-400">
            TONIGHT&apos;S REEL
          </Text>
        </View>
      </View>

      <Text className="text-[14px] leading-[21px] italic text-off-white">
        &ldquo;{pitch}&rdquo;
      </Text>

      {rationale ? (
        <View className="mt-2.5 flex-row items-center gap-1.5 border-t border-white/[0.06] pt-2.5">
          <SparkleIcon
            size={12}
            color={colors.subtleForeground}
          />
          <Text className="flex-1 text-[12px] text-zinc-400">{rationale}</Text>
        </View>
      ) : null}
    </View>
  );
}
