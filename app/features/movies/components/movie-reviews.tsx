import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
} from "react-native";
import { Text } from "@/components/ui/text";
import {
  ChatTextIcon,
  StarIcon,
  WarningCircleIcon,
} from "phosphor-react-native";
import { useMovieReviews } from "../hooks/query/use-movie-reviews";
import type { MovieReview } from "../types/movies.type";
import { colors } from "@/lib/theme/tokens.generated";

interface MovieReviewsProps {
  movieId: number;
}

function ReviewCard({ review }: { review: MovieReview }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = review.content.length > 220;

  const dateFormatted = review.created_at
    ? new Date(review.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
      })
    : null;

  return (
    <View className="rounded-[12px] border border-white/[0.07] bg-white/[0.03] p-3.5">
      <View className="mb-2.5 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center gap-2">
          <View className="h-7 w-7 items-center justify-center rounded-[14px] bg-white/[0.08]">
            <Text className="text-[12px] font-brandBold text-zinc-300">
              {(review.author?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-brandBold text-white" numberOfLines={1}>
              {review.author}
            </Text>
            {dateFormatted ? (
              <Text className="mt-px text-[10px] text-zinc-500">{dateFormatted}</Text>
            ) : null}
          </View>
        </View>

        {typeof review.rating === "number" && review.rating > 0 ? (
          <View className="flex-row items-center gap-[3px] rounded-[6px] bg-amber-500/[0.12] px-[7px] py-0.5">
            <StarIcon size={12} color={colors.gold} />
            <Text className="text-[11px] font-brandBold text-amber-500">
              {review.rating.toFixed(1)}
            </Text>
          </View>
        ) : null}
      </View>

      <Text
        className="text-[13px] leading-5 text-zinc-300"
        numberOfLines={isExpanded ? undefined : 4}
      >
        {review.content.trim()}
      </Text>

      {isLong ? (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          className="mt-1.5 self-start"
        >
          <Text className="text-[12px] font-brandBold text-primary">
            {isExpanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function MovieReviews({ movieId }: MovieReviewsProps) {
  const { data, isPending, isError, refetch } = useMovieReviews(movieId);
  const reviews = data?.reviews ?? [];

  if (isPending) {
    return (
      <View className="items-center gap-2 py-7">
        <ActivityIndicator size="small" color={colors.primary} />
        <Text className="text-[12px] text-zinc-500">
          Fetching community reviews...
        </Text>
      </View>
    );
  }

  if (isError && reviews.length === 0) {
    return (
      <View className="items-center justify-center gap-1.5 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-5 py-8">
        <WarningCircleIcon
          size={24}
          color={colors.destructive}
        />
        <Text className="mt-1 text-[14px] font-brandBold text-zinc-300">
          Couldn&apos;t load reviews
        </Text>
        <Text className="text-center text-[12px] leading-[18px] text-zinc-500">
          Something went wrong fetching the community take.
        </Text>
        <Pressable
          onPress={() => {
            refetch();
          }}
          className="min-h-[44px] justify-center px-4"
          accessibilityRole="button"
          accessibilityLabel="Retry loading reviews"
        >
          <Text className="text-[13px] font-brandBold text-primary">
            Try again
          </Text>
        </Pressable>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View className="items-center justify-center gap-1.5 rounded-[12px] border border-white/[0.06] bg-white/[0.02] px-5 py-8">
        <ChatTextIcon
          size={24}
          color={colors.faintForeground}
        />
        <Text className="mt-1 text-[14px] font-brandBold text-zinc-300">
          No community reviews yet
        </Text>
        <Text className="text-center text-[12px] leading-[18px] text-zinc-500">
          Be the first to log your thoughts after tonight&apos;s feature.
        </Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {isError ? (
        <View className="flex-row items-center justify-between gap-3 rounded-[10px] border border-destructive/25 bg-destructive/[0.08] px-3 py-2.5">
          <Text className="flex-1 text-[12px] leading-[17px] text-error-container">
            Couldn&apos;t refresh - showing saved reviews.
          </Text>
          <Pressable
            onPress={() => {
              refetch();
            }}
            className="min-h-[44px] justify-center px-4"
            accessibilityRole="button"
            accessibilityLabel="Retry loading reviews"
          >
            <Text className="text-[13px] font-brandBold text-primary">Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {reviews.slice(0, 6).map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}
