import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const theme = useAppTheme();
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
      <DialogContent className="w-[92%] max-w-[380px] gap-4 rounded-[24px] p-5">
        <DialogTitle className="text-center text-[18px] leading-7">
          Movie Finished?
        </DialogTitle>

        <View className="items-center gap-4">
          <View className="h-14 w-14 items-center justify-center rounded-[28px] bg-emerald-500/[0.15]">
            <MaterialCommunityIcons
              name="check-circle"
              size={30}
              color={theme.colors.success}
            />
          </View>

          <Text className="text-center text-[14px] leading-[21px] font-brand text-zinc-400">
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
                  <MaterialCommunityIcons
                    name={isFilled ? "star" : "star-outline"}
                    size={36}
                    color={
                      isFilled ? theme.colors.gold : "rgba(255, 255, 255, 0.2)"
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
            >
              <Text className="text-[13px] font-brandSemiBold text-zinc-400">
                Not Yet
              </Text>
            </Pressable>
            <Pressable
              onPress={handleConfirm}
              className="min-h-[44px] justify-center rounded-[12px] bg-emerald-500 px-4 active:opacity-90"
              accessibilityRole="button"
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
