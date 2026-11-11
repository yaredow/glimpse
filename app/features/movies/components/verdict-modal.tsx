import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAppTheme } from "@/lib/theme";

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

  const handleSelectRating = (val: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(val);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm(rating);
  };

  return (
    <Portal>
      <Dialog
        visible={visible}
        onDismiss={onCancel}
        style={[
          styles.dialog,
          {
            backgroundColor: "#18181B",
            borderColor: "rgba(255, 255, 255, 0.1)",
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: "rgba(16, 185, 129, 0.15)" },
            ]}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={30}
              color={theme.colors.success}
            />
          </View>
        </View>

        <Dialog.Title style={styles.title}>Movie Finished?</Dialog.Title>

        <Dialog.Content style={styles.content}>
          <Text style={styles.description}>
            Log your verdict for{" "}
            <Text style={styles.highlightText}>&ldquo;{movieTitle}&rdquo;</Text> to
            log it and it lands in your Journal.
          </Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= rating;
              return (
                <Pressable
                  key={star}
                  onPress={() => handleSelectRating(star)}
                  style={styles.starPressable}
                  accessibilityLabel={`Rate ${star} of 5 stars`}
                >
                  <MaterialCommunityIcons
                    name={isFilled ? "star" : "star-outline"}
                    size={36}
                    color={isFilled ? theme.colors.gold : "rgba(255, 255, 255, 0.2)"}
                  />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.ratingHint}>
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
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="text"
            onPress={onCancel}
            textColor={theme.colors.textSecondary}
            labelStyle={styles.cancelBtnLabel}
          >
            Not Yet
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            buttonColor={theme.colors.success}
            textColor="#FFFFFF"
            style={styles.confirmBtn}
            labelStyle={styles.confirmBtnLabel}
          >
            Log to Journal
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 4,
    maxWidth: 360,
    alignSelf: "center",
    width: "92%",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 20,
    textAlign: "center",
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    alignItems: "center",
  },
  description: {
    color: "#A1A1AA",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  highlightText: {
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  starsRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 8,
  },
  starPressable: {
    padding: 4,
  },
  ratingHint: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  cancelBtnLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
  },
  confirmBtn: {
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  confirmBtnLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});

