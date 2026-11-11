import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { palette } from "@/lib/theme/colors";
import { typeClasses } from "@/lib/theme/typography";
import { cn } from "@/lib/utils";

interface RatingSelectorProps {
  initialRating: number;
  onFinish: (rating: number) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export default function RatingSelector({
  initialRating,
  onFinish,
  onBack,
  isSubmitting,
}: RatingSelectorProps) {
  const [rating, setRating] = useState(initialRating || 5);

  const handleRatingChange = (value: number) => {
    const rounded = Math.round(value * 10) / 10;
    if (rounded !== rating) {
      setRating(rounded);
    }
  };

  const handleFinish = () => {
    onFinish(rating);
  };

  return (
    <View className="flex-1">
      <Text
        className={cn(typeClasses.titleMedium, "mb-12 text-center")}
      >
        Only show movies with a rating above:
      </Text>

      <View className="mb-12 items-center">
        <Text
          className={cn(
            typeClasses.displayLarge,
            "text-[80px] leading-[80px] font-black",
          )}
          style={{ color: palette.cinemaRed }}
        >
          {rating.toFixed(1)}
        </Text>
        <Text className={typeClasses.labelLarge} style={{ color: palette.zinc400 }}>
          Minimum IMDb Rating
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3">
        {[0, 2.5, 5, 7.5, 9].map((val) => (
          <Button
            key={val}
            variant={rating === val ? "primary" : "outline"}
            size="small"
            onPress={() => handleRatingChange(val)}
            className="min-w-[80px]"
            haptic="light"
          >
            {val === 0 ? "Any" : `${val}+`}
          </Button>
        ))}
      </View>

      <View className="mt-auto flex-row items-center justify-between gap-3 border-t border-surface-zinc-750 pt-6">
        <Button
          variant="text"
          onPress={onBack}
          textColor={palette.zinc400}
          haptic="light"
          className="-ml-4"
        >
          Back
        </Button>
        <Button
          variant="primary"
          onPress={handleFinish}
          loading={isSubmitting}
          disabled={isSubmitting}
          haptic="success"
        >
          Finish Onboarding
        </Button>
      </View>
    </View>
  );
}
