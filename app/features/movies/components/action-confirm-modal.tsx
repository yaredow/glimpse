import React, { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Button, Surface, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ConfirmableAction =
  | "pick_tonight"
  | "watched"
  | "skipped"
  | "locked_in"
  | "sync";

export type SyncMood =
  | "surprise"
  | "spooky"
  | "mind_bender"
  | "feel_good"
  | "adrenaline"
  | "nostalgia";

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
    description: "pure algorithmic serendipity based on your overall taste",
  },
  {
    id: "spooky",
    label: "Spooky & Dark",
    icon: "candle",
    description: "spine-chilling horror, dark thrillers, and mysterious suspense",
  },
  {
    id: "mind_bender",
    label: "Mind-Benders",
    icon: "brain",
    description: "thought-provoking sci-fi puzzles and twist-heavy mysteries",
  },
  {
    id: "feel_good",
    label: "Feel-Good",
    icon: "popcorn",
    description: "lighthearted comedies, heartwarming animations, and comfort escapes",
  },
  {
    id: "adrenaline",
    label: "Adrenaline",
    icon: "lightning-bolt-outline",
    description: "high-octane action, daring adventures, and gritty crime heists",
  },
  {
    id: "nostalgia",
    label: "Nostalgia",
    icon: "filmstrip",
    description: "retro cinema classics and gems released between 1975 and 1999",
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
  title: string;
  confirmText: string;
  cancelText: string;
  renderDescription: (title: string, syncs?: number) => React.ReactNode;
}

const ACTION_CONFIGS: Record<ConfirmableAction, ActionModalConfig> = {
  pick_tonight: {
    icon: "star-outline",
    title: "Make this Today's Pick?",
    confirmText: "Confirm Today's Pick",
    cancelText: "Keep Browsing",
    renderDescription: (title, syncs = 3) => (
      <Text variant="bodyMedium" style={styles.description}>
        <Text style={styles.highlightText}>&ldquo;{title}&rdquo;</Text> will be
        selected as your movie for today. You will have{" "}
        <Text style={styles.highlightText}>
          {syncs} {syncs === 1 ? "sync" : "syncs"}
        </Text>{" "}
        remaining if you decide to sync a fresh batch.
      </Text>
    ),
  },
  locked_in: {
    icon: "play-circle-outline",
    title: "Lock In Today's Movie?",
    confirmText: "Lock In Selection",
    cancelText: "Not Yet",
    renderDescription: (title) => (
      <Text variant="bodyMedium" style={styles.description}>
        <Text style={styles.highlightText}>&ldquo;{title}&rdquo;</Text> will be
        permanently locked as your movie for today. Once locked, your daily
        selection is final and you won&apos;t be able to sync or change it.
      </Text>
    ),
  },
  watched: {
    icon: "check-circle-outline",
    title: "Mark as Watched?",
    confirmText: "Mark as Watched",
    cancelText: "Cancel",
    renderDescription: (title) => (
      <Text variant="bodyMedium" style={styles.description}>
        <Text style={styles.highlightText}>&ldquo;{title}&rdquo;</Text> will be
        permanently recorded in your watched history and locked for today. It
        will help tailor your future recommendations.
      </Text>
    ),
  },
  skipped: {
    icon: "close-circle-outline",
    title: "Skip This Movie?",
    confirmText: "Skip Movie",
    cancelText: "Keep Browsing",
    renderDescription: (title) => (
      <Text variant="bodyMedium" style={styles.description}>
        <Text style={styles.highlightText}>&ldquo;{title}&rdquo;</Text> will be
        skipped and locked for today. You won&apos;t be able to open its details
        or undo this skip until tomorrow&apos;s batch.
      </Text>
    ),
  },
  sync: {
    icon: "sync",
    title: "Sync a Fresh Batch?",
    confirmText: "Sync Fresh Batch",
    cancelText: "Keep Current Movies",
    renderDescription: (_title, syncs = 3) => {
      const remainingAfter = Math.max(0, syncs - 1);
      return (
        <Text variant="bodyMedium" style={styles.description}>
          This will eliminate your current selection and draw 5 fresh mystery
          movies. You will have{" "}
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
  const theme = useTheme();
  const insets = useSafeAreaInsets();
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
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop tap to dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation drawer"
        />

        {/* Bottom Drawer Surface */}
        <Surface
          elevation={3}
          style={[
            styles.drawerSurface,
            {
              backgroundColor: theme.colors.elevation.level2,
              paddingBottom: Math.max(insets.bottom + 12, 28),
            },
          ]}
        >
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={config.icon}
              size={26}
              color="#FFFFFF"
            />
          </View>

          <Text variant="titleLarge" style={styles.title}>
            {config.title}
          </Text>

          {action === "sync" ? (
            <>
              {(() => {
                const remainingAfter = Math.max(0, (syncsRemaining ?? 3) - 1);
                const activeMood =
                  MOOD_OPTIONS.find((m) => m.id === selectedMood) ??
                  MOOD_OPTIONS[0];

                return (
                  <View style={styles.syncDescriptionContainer}>
                    <Text variant="bodyMedium" style={styles.description}>
                      Eliminate your current selection and draw 5 fresh mystery
                      movies tailored for{" "}
                      <Text style={styles.highlightText}>
                        {activeMood.description}
                      </Text>
                      .
                    </Text>
                    <Text variant="bodySmall" style={styles.syncRemainingText}>
                      You will have{" "}
                      <Text style={styles.highlightText}>
                        {remainingAfter}{" "}
                        {remainingAfter === 1 ? "sync" : "syncs"}
                      </Text>{" "}
                      remaining today.
                    </Text>
                  </View>
                );
              })()}

              <View style={styles.moodSection}>
                <Text variant="labelSmall" style={styles.moodHeader}>
                  CHOOSE A VIBE
                </Text>
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
                          size={18}
                          color={isSelected ? "#121212" : "#A1A1AA"}
                          style={styles.moodIcon}
                        />
                        <Text
                          variant="labelMedium"
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

          <View style={styles.buttonStack}>
            <Button
              mode="contained"
              onPress={() =>
                onConfirm(action === "sync" ? selectedMood : undefined)
              }
              buttonColor="#FFFFFF"
              textColor="#121212"
              style={styles.confirmBtn}
              contentStyle={styles.btnContent}
              labelStyle={styles.confirmBtnLabel}
            >
              {config.confirmText}
            </Button>

            <Button
              mode="text"
              onPress={onCancel}
              textColor="#A1A1AA"
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
              labelStyle={styles.cancelBtnLabel}
            >
              {config.cancelText}
            </Button>
          </View>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  drawerSurface: {
    width: "100%",
    borderTopStartRadius: 28,
    borderTopEndRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: "center",
  },
  dragHandleContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 4,
  },
  title: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    color: "#A1A1AA",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  highlightText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  syncDescriptionContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  syncRemainingText: {
    color: "#71717A",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    marginTop: -16,
    marginBottom: 8,
    lineHeight: 18,
  },
  moodSection: {
    width: "100%",
    marginTop: 10,
    marginBottom: 24,
  },
  moodHeader: {
    color: "#71717A",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    fontSize: 11,
    marginBottom: 10,
    paddingHorizontal: 4,
    textTransform: "uppercase",
  },
  moodScrollContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  moodChipUnselected: {
    backgroundColor: "#1E1E1E",
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
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  moodLabelUnselected: {
    color: "#A1A1AA",
  },
  moodLabelSelected: {
    color: "#121212",
  },
  buttonStack: {
    width: "100%",
    gap: 4,
  },
  confirmBtn: {
    borderRadius: 12,
    width: "100%",
  },
  cancelBtn: {
    borderRadius: 12,
    width: "100%",
  },
  btnContent: {
    paddingVertical: 6,
  },
  confirmBtnLabel: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    letterSpacing: 0.2,
  },
  cancelBtnLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
