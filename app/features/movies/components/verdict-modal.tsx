import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { CheckCircleIcon, StarIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { colors } from "@/lib/theme/tokens.generated";
import { withAlpha } from "@/lib/theme/color";

interface VerdictModalProps {
  visible: boolean;
  movieTitle: string;
  onConfirm: (rating: number) => void;
  onCancel: () => void;
}

export default function VerdictModal({
  visible,
  movieTitle,
  onConfirm,
  onCancel,
}: VerdictModalProps) {
  const [rating, setRating] = useState<number>(4);
  const [lastVisible, setLastVisible] = useState(visible);

  if (visible !== lastVisible) {
    setLastVisible(visible);
    if (visible) {
      setRating(4);
    }
  }

  const handleSelectRating = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(val);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(rating);
  };

  return (
    <Dialog open={visible} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[92%] max-w-[380px] gap-4 rounded-3xl p-5">
        <DialogTitle className="text-center text-[18px] leading-7">
          Movie Finished?
        </DialogTitle>

        <View className="items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-500/[0.15]">
            <CheckCircleIcon
              size={30}
              color={colors.success}
            />
          </View>

          <Text className="text-center text-[14px] leading-[21px] font-brand text-subtle-foreground">
            Log your verdict for{" "}
            <Text className="font-brandSemiBold text-white">
              &ldquo;{movieTitle}&rdquo;
            </Text>{" "}
            to log it and it lands in your Journal.
          </Text>

          <View className="flex-row justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= rating;
              return (
                <Pressable
                  key={star}
                  onPress={() => handleSelectRating(star)}
                  className="p-1"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isFilled }}
                  accessibilityLabel={`Rate ${star} of 5 stars`}
                >
                  <StarIcon
                    size={36}
                    weight={isFilled ? "fill" : "regular"}
                    color={
                      isFilled ? colors.gold : withAlpha(colors.white, 0.2)
                    }
                  />
                </Pressable>
              );
            })}
          </View>

          <Text className="text-[13px] font-brandSemiBold text-white">
            {rating === 5
              ? "Masterpiece 🏆"
              : rating === 4
                ? "Really Good 🔥"
                : rating === 3
                  ? "Worth a Watch 👍"
                  : rating === 2
                    ? "Disappointing 😕"
                    : "Not for Me 👎"}
          </Text>
        </View>

        <DialogFooter className="border-t border-white/[0.06] px-0 pt-3">
          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={onCancel}
              className="min-h-[44px] justify-center px-4"
              accessibilityRole="button"
              accessibilityLabel="Not yet, cancel verdict"
            >
              <Text className="text-[13px] font-brandSemiBold text-subtle-foreground">
                Not Yet
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="min-h-[44px] justify-center rounded-lg bg-emerald-500 px-4 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel="Log verdict to journal"
            >
              <Text className="text-[13px] font-brandBold text-white">
                Log to Journal
              </Text>
            </Pressable>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
