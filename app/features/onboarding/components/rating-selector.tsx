import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Button } from "@/components/ui/button";

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
  const { colors } = useTheme();
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
    <View style={styles.container}>
      <Text
        variant="titleMedium"
        style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
      >
        Only show movies with a rating above:
      </Text>

      <View style={styles.ratingContainer}>
        <Text variant="displayLarge" style={[styles.ratingText, { color: colors.primary }]}>
          {rating.toFixed(1)}
        </Text>
        <Text variant="labelLarge" style={{ color: colors.onSurfaceVariant }}>
          Minimum IMDb Rating
        </Text>
      </View>

      <View style={styles.buttonGrid}>
         {[0, 2.5, 5, 7.5, 9].map((val) => (
           <Button 
            key={val}
            variant={rating === val ? "primary" : "outline"} 
            size="small"
            onPress={() => handleRatingChange(val)}
            style={styles.ratingButton}
            haptic="light"
           >
             {val === 0 ? "Any" : `${val}+`}
           </Button>
         ))}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.outline }]}>
        <Button
          variant="text"
          onPress={onBack}
          textColor={colors.onSurfaceVariant}
          haptic="light"
          style={styles.backButton}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 48,
  },
  ratingContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  ratingText: {
    fontWeight: "900",
    fontSize: 80,
    lineHeight: 80,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center'
  },
  ratingButton: {
    minWidth: 80
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 24,
    borderTopWidth: 1,
    marginTop: "auto",
  },
  backButton: {
    marginLeft: -16,
  },
});
