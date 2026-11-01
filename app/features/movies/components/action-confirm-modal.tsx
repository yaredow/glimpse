import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  accentColor: string;
  bgGlow: string;
  borderGlow: string;
  title: string;
  confirmText: string;
  cancelText: string;
  renderDescription: (title: string, syncs?: number) => React.ReactNode;
}

const ACTION_CONFIGS: Record<ConfirmableAction, ActionModalConfig> = {
  pick_tonight: {
    icon: "star",
    accentColor: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.15)",
    borderGlow: "rgba(245, 158, 11, 0.35)",
    title: "Make this Tonight's Feature?",
    confirmText: "Confirm Pick",
    cancelText: "Keep Browsing",
    renderDescription: (_title, syncs = 3) => (
      <Text style={styles.modalBody}>
        You have{" "}
        <Text style={styles.highlightPick}>
          {syncs} {syncs === 1 ? "sync" : "syncs"}
        </Text>{" "}
        remaining today. You can still sync another set if you change your mind,
        or lock this in as your final watch.
      </Text>
    ),
  },
  watched: {
    icon: "check-circle",
    accentColor: "#22c55e",
    bgGlow: "rgba(34, 197, 94, 0.15)",
    borderGlow: "rgba(34, 197, 94, 0.35)",
    title: "Mark as Watched?",
    confirmText: "Mark as Watched",
    cancelText: "Cancel",
    renderDescription: (title) => (
      <Text style={styles.modalBody}>
        <Text style={styles.highlightTitle}>&ldquo;{title}&rdquo;</Text> will be
        permanently recorded in your watched history and locked for today. It
        will help tailor your future recommendations.
      </Text>
    ),
  },
  skipped: {
    icon: "close-circle",
    accentColor: "#ef4444",
    bgGlow: "rgba(239, 68, 68, 0.15)",
    borderGlow: "rgba(239, 68, 68, 0.35)",
    title: "Skip This Movie?",
    confirmText: "Skip Movie",
    cancelText: "Keep Browsing",
    renderDescription: (title) => (
      <Text style={styles.modalBody}>
        <Text style={styles.highlightTitle}>&ldquo;{title}&rdquo;</Text> will be
        skipped and permanently locked for today. You won&apos;t be able to open
        its details or undo this skip until tomorrow&apos;s batch.
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
  if (!action) return null;

  const config = ACTION_CONFIGS[action];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.modalDialog, { borderColor: config.borderGlow }]}
        >
          {/* Top Icon Badge */}
          <View
            style={[
              styles.modalIconContainer,
              { backgroundColor: config.bgGlow },
            ]}
          >
            <MaterialCommunityIcons
              name={config.icon}
              size={28}
              color={config.accentColor}
            />
          </View>

          {/* Dialog Title */}
          <Text style={styles.modalTitle}>{config.title}</Text>

          {/* Dialog Description */}
          {config.renderDescription(movieTitle, syncsRemaining)}

          {/* Action Buttons */}
          <View style={styles.modalButtons}>
            <Pressable
              style={[styles.modalBtn, styles.modalCancelBtn]}
              onPress={onCancel}
            >
              <Text style={styles.modalCancelText}>{config.cancelText}</Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalBtn,
                { backgroundColor: config.accentColor },
              ]}
              onPress={onConfirm}
            >
              <Text
                style={[
                  styles.modalConfirmText,
                  action === "pick_tonight"
                    ? styles.textDark
                    : styles.textLight,
                ]}
              >
                {config.confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalDialog: {
    width: "100%",
    backgroundColor: "#1c1c1e",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    gap: 12,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  modalBody: {
    color: "#bbb",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  highlightPick: {
    color: "#f59e0b",
    fontFamily: "Inter_700Bold",
  },
  highlightTitle: {
    color: "white",
    fontFamily: "Inter_600SemiBold",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  modalCancelText: {
    color: "#aaa",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  textDark: {
    color: "#000",
  },
  textLight: {
    color: "#fff",
  },
});
