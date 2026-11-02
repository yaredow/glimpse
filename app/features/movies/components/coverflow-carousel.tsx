import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";
import MysteryCard from "./mystery-card";
import type { GridMovie } from "../types/movies.type";

export interface CoverflowCarouselHandle {
  scrollToIndex: (index: number) => void;
}

interface CoverflowCarouselProps {
  movies: GridMovie[];
  currentPickId?: number;
  onReveal: (movie: GridMovie) => void;
  onPickTonight?: (movie: GridMovie) => void;
  onSeen?: (movie: GridMovie) => void;
  onSkip?: (movie: GridMovie) => void;
  onViewDetails?: (movie: GridMovie) => void;
}

const { width: SW } = Dimensions.get("window");
const CARD_W = Math.round(SW * 0.78);
const CARD_H = Math.round(CARD_W * 1.54);
const SPACING = 16;
const ITEM_W = CARD_W + SPACING;
const INSET = Math.round((SW - CARD_W) / 2);

const CoverflowCarousel = forwardRef<CoverflowCarouselHandle, CoverflowCarouselProps>(
  function CoverflowCarousel(
    {
      movies,
      currentPickId,
      onReveal,
      onPickTonight,
      onSeen,
      onSkip,
      onViewDetails,
    },
    ref,
  ) {
    const theme = useAppTheme();
    const flatListRef = useRef<FlatList<GridMovie>>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const scrollX = useSharedValue(0);

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollX.value = event.contentOffset.x;
      },
    });

    const handleMomentumScrollEnd = (
      event: NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
      const rawIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_W);
      const clampedIndex = Math.max(0, Math.min(rawIndex, movies.length - 1));
      if (clampedIndex !== currentIndex) {
        setCurrentIndex(clampedIndex);
        Haptics.selectionAsync();
      }
    };

    const scrollToIndex = (index: number) => {
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_W,
        animated: true,
      });
      setCurrentIndex(index);
      Haptics.selectionAsync();
    };

    useImperativeHandle(ref, () => ({
      scrollToIndex,
    }));

    const renderItem = ({ item, index }: { item: GridMovie; index: number }) => {
      return (
        <CardSlot
          movie={item}
          index={index}
          total={movies.length}
          scrollX={scrollX}
          isCenter={index === currentIndex}
          currentPickId={currentPickId}
          onPressAdjacent={() => scrollToIndex(index)}
          onReveal={() => onReveal(item)}
          onPickTonight={() => onPickTonight?.(item)}
          onSeen={() => onSeen?.(item)}
          onSkip={() => onSkip?.(item)}
          onViewDetails={() => onViewDetails?.(item)}
        />
      );
    };

    return (
      <View style={styles.container}>
        <Animated.FlatList
          ref={flatListRef}
          data={movies}
          keyExtractor={(item) => item.movie_id.toString()}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_W}
          decelerationRate="fast"
          bounces={false}
          contentContainerStyle={styles.listContent}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />

        <View style={styles.pagerContainer}>
          {movies.map((m, i) => {
            const isActive = i === currentIndex;
            return (
              <Pressable
                key={m.movie_id}
                onPress={() => scrollToIndex(i)}
                style={({ pressed }) => [
                  styles.pagerDot,
                  isActive
                    ? [styles.pagerDotActive, { backgroundColor: theme.colors.primary }]
                    : [styles.pagerDotInactive],
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityLabel={`Go to Reel ${i + 1}`}
              />
            );
          })}
        </View>
      </View>
    );
  },
);

export default CoverflowCarousel;

function CardSlot({
  movie,
  index,
  total,
  scrollX,
  isCenter,
  currentPickId,
  onPressAdjacent,
  onReveal,
  onPickTonight,
  onSeen,
  onSkip,
  onViewDetails,
}: {
  movie: GridMovie;
  index: number;
  total: number;
  scrollX: SharedValue<number>;
  isCenter: boolean;
  currentPickId?: number;
  onPressAdjacent: () => void;
  onReveal: () => void;
  onPickTonight: () => void;
  onSeen: () => void;
  onSkip: () => void;
  onViewDetails: () => void;
}) {
  const isResolved =
    movie.action === "watched" ||
    movie.action === "skipped" ||
    movie.action === "seen_before" ||
    movie.action === "pick_tonight" ||
    movie.action === "watchlist_add" ||
    movie.action === "locked_in";
  const isRevealed =
    Boolean(movie.is_revealed) || movie.action === "revealed" || isResolved;

  const animatedStyle = useAnimatedStyle(() => {
    const centerOffset = index * ITEM_W;
    const distance = scrollX.value - centerOffset;
    const absDist = Math.abs(distance);

    const scale = interpolate(
      absDist,
      [0, ITEM_W * 0.9, ITEM_W * 1.8],
      [1, 0.92, 0.88],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      absDist,
      [0, ITEM_W * 0.8, ITEM_W * 1.8],
      [1, 0.65, 0.4],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }],
      opacity,
      zIndex: isCenter ? 20 : 1,
    };
  });

  return (
    <Animated.View style={[styles.cardSlot, animatedStyle]}>
      {isCenter ? (
        <MysteryCard
          movie={movie}
          index={index}
          total={total}
          isCenter={isCenter}
          currentPickId={currentPickId}
          onReveal={onReveal}
          onPickTonight={onPickTonight}
          onSeen={onSeen}
          onSkip={onSkip}
          onViewDetails={onViewDetails}
        />
      ) : (
        <Pressable onPress={onPressAdjacent} style={styles.adjacentPressable}>
          <MysteryCard
            movie={movie}
            index={index}
            total={total}
            isCenter={isCenter}
            currentPickId={currentPickId}
            onReveal={onReveal}
            onPickTonight={onPickTonight}
            onSeen={onSeen}
            onSkip={onSkip}
            onViewDetails={onViewDetails}
          />
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: INSET,
    paddingTop: 10,
    paddingBottom: 16,
  },
  cardSlot: {
    width: CARD_W,
    height: CARD_H,
    marginRight: SPACING,
  },
  adjacentPressable: {
    flex: 1,
  },
  pagerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  pagerDot: {
    height: 4,
    borderRadius: 2,
  },
  pagerDotActive: {
    width: 20,
  },
  pagerDotInactive: {
    width: 5,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});
