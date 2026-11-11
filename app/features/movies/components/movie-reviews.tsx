import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useMovieReviews } from "../hooks/query/use-movie-reviews";
import type { MovieReview } from "../types/movies.type";

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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.authorGroup}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(review.author?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>
          <View style={styles.authorMeta}>
            <Text style={styles.authorName} numberOfLines={1}>
              {review.author}
            </Text>
            {dateFormatted ? (
              <Text style={styles.reviewDate}>{dateFormatted}</Text>
            ) : null}
          </View>
        </View>

        {typeof review.rating === "number" && review.rating > 0 ? (
          <View style={styles.ratingBadge}>
            <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
            <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      <Text
        style={styles.content}
        numberOfLines={isExpanded ? undefined : 4}
      >
        {review.content.trim()}
      </Text>

      {isLong ? (
        <Pressable
          onPress={() => setIsExpanded(!isExpanded)}
          style={styles.expandPressable}
        >
          <Text style={styles.expandText}>
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
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#E50914" />
        <Text style={styles.loadingText}>Fetching community reviews...</Text>
      </View>
    );
  }

  if (isError && reviews.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={24}
          color="#EF4444"
        />
        <Text style={styles.emptyTitle}>Couldn&apos;t load reviews</Text>
        <Text style={styles.emptySubtitle}>
          Something went wrong fetching the community take.
        </Text>
        <Pressable
          onPress={() => {
            refetch();
          }}
          style={styles.retryButton}
          accessibilityRole="button"
          accessibilityLabel="Retry loading reviews"
        >
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (reviews.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <MaterialCommunityIcons
          name="comment-text-outline"
          size={24}
          color="#71717A"
        />
        <Text style={styles.emptyTitle}>No community reviews yet</Text>
        <Text style={styles.emptySubtitle}>
          Be the first to log your thoughts after tonight&apos;s feature.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isError ? (
        <View style={styles.staleBanner}>
          <Text style={styles.staleBannerText}>
            Couldn&apos;t refresh - showing saved reviews.
          </Text>
          <Pressable
            onPress={() => {
              refetch();
            }}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Retry loading reviews"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}
      {reviews.slice(0, 6).map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  centerContainer: {
    paddingVertical: 28,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#71717A",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#D4D4D8",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#71717A",
    textAlign: "center",
    lineHeight: 18,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#E50914",
  },
  staleBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
  },
  staleBannerText: {
    flex: 1,
    fontSize: 12,
    color: "#FCA5A5",
    lineHeight: 17,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  authorGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D4D4D8",
  },
  authorMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  reviewDate: {
    fontSize: 10,
    color: "#71717A",
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#F59E0B",
  },
  content: {
    fontSize: 13,
    lineHeight: 20,
    color: "#D4D4D8",
  },
  expandPressable: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  expandText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E50914",
  },
});

