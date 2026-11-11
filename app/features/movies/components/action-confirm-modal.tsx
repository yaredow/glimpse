import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppTheme } from "@/lib/theme";

export type ConfirmableAction = "locked_in" | "sync";

export type SyncMood =
  | "surprise"
  | "horror"
  | "action_crime"
  | "psychological"
  | "comedy"
  | "classics";

export interface MoodOption {
  id: SyncMood;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "surprise",
    label: "Surprise Me",
    icon: "dice-multiple-outline",
    description: "fresh mystery picks across all genres tailored to your taste",
  },
  {
    id: "horror",
    label: "Horror",
    icon: "skull-outline",
    description: "pure horror films — supernatural dread, slashers, and terrifying tension",
  },
  {
    id: "action_crime",
    label: "Action & Crime",
    icon: "target",
    description: "high-stakes action features, intense heists, and crime thrillers",
  },
  {
    id: "psychological",
    label: "Psychological & Mystery",
    icon: "head-cog-outline",
    description: "cerebral puzzles, investigative mysteries, and psychological tension",
  },
  {
    id: "comedy",
    label: "Comedy",
    icon: "emoticon-happy-outline",
    description: "laugh-out-loud comedies and sharp, witty cinema",
  },
  {
    id: "classics",
    label: "90s & Classics",
    icon: "filmstrip",
    description: "retro classics and cinema landmarks released between 1975 and 1999",
  },
];

interface ActionConfirmModalProps {
  visible: boolean;
  action: ConfirmableAction | null;
  movieTitle: string;
  syncsRemaining?: number;
  onConfirm: (mood?: SyncMood) => void;
  onCancel: () => void;
}

interface ActionModalConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  title: string;
  confirmText: string;
  cancelText: string;
  renderDescription: (title: string, syncs?: number) => React.ReactNode;
}

const ACTION_CONFIGS: Record<ConfirmableAction, ActionModalConfig> = {
  locked_in: {
    icon: "movie-play-outline",
    iconColor: "#E50914",
    title: "Lock In Today's Movie?",
    confirmText: "Lock In Selection",
    cancelText: "Not Yet",
    renderDescription: (title) => (
      <Text style={styles.description}>
        <Text style={styles.highlightText}>&ldquo;{title}&rdquo;</Text> will be
        permanently locked as your movie for today. Once locked, your daily
        selection is final.
      </Text>
    ),
  },
  sync: {
    icon: "sync",
    iconColor: "#E50914",
    title: "Sync a Fresh Batch?",
    confirmText: "Sync Fresh Reel",
    cancelText: "Keep Current",
    renderDescription: (_title, syncs = 3) => {
      const remainingAfter = Math.max(0, syncs - 1);
      return (
        <Text style={styles.description}>
          This will draw 5 fresh mystery picks tailored to your mood. You will have{" "}
          <Text style={styles.highlightText}>
            {remainingAfter} {remainingAfter === 1 ? "sync" : "syncs"}
          </Text>{" "}
          remaining today.
        </Text>
      );
    },
  },
};

export default function ActionConfirmModal({
  visible,
  action,
  movieTitle,
  syncsRemaining,
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) {
  const theme = useAppTheme();
  const [selectedMood, setSelectedMood] = useState<SyncMood>("surprise");
  const [prevVisible, setPrevVisible] = useState(visible);

  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setSelectedMood("surprise");
    }
  }

  if (!action) return null;

  const config = ACTION_CONFIGS[action];

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
              { backgroundColor: `${config.iconColor}18` },
            ]}
          >
            <MaterialCommunityIcons
              name={config.icon}
              size={28}
              color={config.iconColor}
            />
          </View>
        </View>

        <Dialog.Title style={styles.title}>{config.title}</Dialog.Title>

        <Dialog.Content style={styles.content}>
          {action === "sync" ? (
            <>
              {(() => {
                const activeMood =
                  MOOD_OPTIONS.find((m) => m.id === selectedMood) ??
                  MOOD_OPTIONS[0];

                return (
                  <View style={styles.syncDescriptionContainer}>
                    <Text style={styles.description}>
                      Draw 5 fresh mystery picks:{" "}
                      <Text style={styles.highlightText}>
                        {activeMood.description}
                      </Text>
                      .
                    </Text>
                  </View>
                );
              })()}

              <View style={styles.moodSection}>
                <Text style={styles.moodHeader}>CHOOSE A VIBE</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.moodScrollContent}
                >
                  {MOOD_OPTIONS.map((mood) => {
                    const isSelected = selectedMood === mood.id;
                    return (
                      <Pressable
                        key={mood.id}
                        onPress={() => setSelectedMood(mood.id)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={mood.label}
                        style={[
                          styles.moodChip,
                          isSelected
                            ? styles.moodChipSelected
                            : styles.moodChipUnselected,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={mood.icon}
                          size={16}
                          color={isSelected ? "#121212" : "#A1A1AA"}
                          style={styles.moodIcon}
                        />
                        <Text
                          style={[
                            styles.moodLabel,
                            isSelected
                              ? styles.moodLabelSelected
                              : styles.moodLabelUnselected,
                          ]}
                        >
                          {mood.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            </>
          ) : (
            config.renderDescription(movieTitle, syncsRemaining)
          )}
        </Dialog.Content>

        <Dialog.Actions style={styles.actions}>
          <Button
            mode="text"
            onPress={onCancel}
            textColor={theme.colors.textSecondary}
            labelStyle={styles.cancelBtnLabel}
          >
            {config.cancelText}
          </Button>
          <Button
            mode="contained"
            onPress={() =>
              onConfirm(action === "sync" ? selectedMood : undefined)
            }
            buttonColor={theme.colors.primary}
            textColor="#FFFFFF"
            style={styles.confirmBtn}
            labelStyle={styles.confirmBtnLabel}
          >
            {config.confirmText}
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
    maxWidth: 380,
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
  },
  description: {
    color: "#A1A1AA",
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
  },
  highlightText: {
    color: "#FFFFFF",
    fontFamily: "PlusJakartaSans_600SemiBold",
  },
  syncDescriptionContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  moodSection: {
    width: "100%",
    marginTop: 6,
    marginBottom: 4,
  },
  moodHeader: {
    color: "#71717A",
    fontFamily: "PlusJakartaSans_600SemiBold",
    letterSpacing: 1.2,
    fontSize: 11,
    marginBottom: 8,
    paddingHorizontal: 2,
    textTransform: "uppercase",
  },
  moodScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  moodChipUnselected: {
    backgroundColor: "#222225",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  moodChipSelected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  moodIcon: {
    marginRight: 6,
  },
  moodLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12.5,
  },
  moodLabelUnselected: {
    color: "#A1A1AA",
  },
  moodLabelSelected: {
    color: "#121212",
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
    paddingHorizontal: 4,
  },
  confirmBtnLabel: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
