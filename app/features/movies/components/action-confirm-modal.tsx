import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Modal, Portal, Surface, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ConfirmableAction = "pick_tonight" | "watched" | "skipped";

interface ActionConfirmModalProps {
  visible: boolean;
  action: ConfirmableAction | null;
  movieTitle: string;
  syncsRemaining?: number;
  onConfirm: () => void;
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
    title: "Make this Tonight's Feature?",
    confirmText: "Confirm Feature",
    cancelText: "Keep Browsing",
    renderDescription: (_title, syncs = 3) => (
      <Text variant="bodyMedium" style={styles.description}>
        You have{" "}
        <Text style={styles.highlightText}>
          {syncs} {syncs === 1 ? "sync" : "syncs"}
        </Text>{" "}
        remaining today. You can still sync another set if you change your mind,
        or lock this in as your final watch.
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

  if (!action) return null;

  const config = ACTION_CONFIGS[action];

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onCancel}
        contentContainerStyle={styles.modalContentContainer}
      >
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
          {/* Top Drag Handle Indicator */}
          <View style={styles.dragHandle} />

          {/* Action Icon Badge */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={config.icon}
              size={26}
              color="#FFFFFF"
            />
          </View>

          {/* Title */}
          <Text variant="titleLarge" style={styles.title}>
            {config.title}
          </Text>

          {/* Description */}
          {config.renderDescription(movieTitle, syncsRemaining)}

          {/* Actions: Stacked Vertically */}
          <View style={styles.buttonStack}>
            <Button
              mode="contained"
              onPress={onConfirm}
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
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContentContainer: {
    justifyContent: "flex-end",
    margin: 0,
  },
  drawerSurface: {
    borderTopStartRadius: 28,
    borderTopEndRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 24,
    paddingTop: 12,
    alignItems: "center",
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 20,
    marginTop: 2,
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
