import React, { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import {
  ArrowsClockwiseIcon,
  DiceFiveIcon,
  FilmStripIcon,
  HeadCircuitIcon,
  PlayCircleIcon,
  SkullIcon,
  SmileyIcon,
  TargetIcon,
  type IconProps,
} from "phosphor-react-native";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme/tokens.generated";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

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
  Icon: React.ComponentType<IconProps>;
  description: string;
}

export const MOOD_OPTIONS: MoodOption[] = [
  {
    id: "surprise",
    label: "Surprise Me",
    Icon: DiceFiveIcon,
    description: "fresh mystery picks across all genres tailored to your taste",
  },
  {
    id: "horror",
    label: "Horror",
    Icon: SkullIcon,
    description: "pure horror films — supernatural dread, slashers, and terrifying tension",
  },
  {
    id: "action_crime",
    label: "Action & Crime",
    Icon: TargetIcon,
    description: "high-stakes action features, intense heists, and crime thrillers",
  },
  {
    id: "psychological",
    label: "Psychological & Mystery",
    Icon: HeadCircuitIcon,
    description: "cerebral puzzles, investigative mysteries, and psychological tension",
  },
  {
    id: "comedy",
    label: "Comedy",
    Icon: SmileyIcon,
    description: "laugh-out-loud comedies and sharp, witty cinema",
  },
  {
    id: "classics",
    label: "90s & Classics",
    Icon: FilmStripIcon,
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
  Icon: React.ComponentType<IconProps>;
  iconColor: string;
  title: string;
  confirmText: string;
  cancelText: string;
  renderDescription: (title: string, syncs?: number) => React.ReactNode;
}

const ACTION_CONFIGS: Record<ConfirmableAction, ActionModalConfig> = {
  locked_in: {
    Icon: PlayCircleIcon,
    iconColor: colors.primary,
    title: "Lock In Today's Movie?",
    confirmText: "Lock In Selection",
    cancelText: "Not Yet",
    renderDescription: (title) => (
      <Text className="text-center text-[14px] leading-[22px] font-brand text-subtle-foreground">
        <Text className="font-brandSemiBold text-white">
          &ldquo;{title}&rdquo;
        </Text>{" "}
        will be permanently locked as your movie for today. Once locked, your
        daily selection is final.
      </Text>
    ),
  },
  sync: {
    Icon: ArrowsClockwiseIcon,
    iconColor: colors.primary,
    title: "Sync a Fresh Batch?",
    confirmText: "Sync Fresh Reel",
    cancelText: "Keep Current",
    renderDescription: (_title, syncs = 3) => {
      const remainingAfter = Math.max(0, syncs - 1);
      return (
        <Text className="text-center text-[14px] leading-[22px] font-brand text-subtle-foreground">
          This will draw 5 fresh mystery picks tailored to your mood. You will
          have{" "}
          <Text className="font-brandSemiBold text-white">
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
    <Dialog open={visible} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[92%] max-w-[380px] gap-4 rounded-3xl p-5">
        <DialogTitle className="text-center text-[18px] leading-7">
          {config.title}
        </DialogTitle>

        <View className="items-center gap-3">
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${config.iconColor}18` }}
          >
            <config.Icon
              size={28}
              color={config.iconColor}
            />
          </View>

          {action === "sync" ? (
            <>
              {(() => {
                const activeMood =
                  MOOD_OPTIONS.find((m) => m.id === selectedMood) ??
                  MOOD_OPTIONS[0];

                return (
                  <Text className="text-center text-[14px] leading-[22px] font-brand text-subtle-foreground">
                    Draw 5 fresh mystery picks:{" "}
                    <Text className="font-brandSemiBold text-white">
                      {activeMood.description}
                    </Text>
                    .
                  </Text>
                );
              })()}

              <View className="w-full">
                <Text className="mb-2 text-[11px] tracking-[1.2px] font-brandBold text-faint-foreground uppercase">
                  CHOOSE A VIBE
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    flexDirection: "row",
                    gap: 8,
                    paddingVertical: 4,
                  }}
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
                        hitSlop={8}
                        className={cn(
                          "flex-row items-center rounded-2xl border px-3 py-1.5",
                          isSelected
                            ? "border-white bg-white"
                            : "border-white/[0.08] bg-surface-6",
                        )}
                      >
                        <mood.Icon
                          size={16}
                          color={isSelected ? colors.surface1 : colors.subtleForeground}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          className={cn(
                            "text-[12.5px] font-brandSemiBold",
                            isSelected
                              ? "text-surface-1"
                              : "text-subtle-foreground",
                          )}
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
        </View>

        <DialogFooter className="border-t border-white/[0.06] px-0 pt-3">
          <View className="flex-row justify-end gap-2">
            <Pressable
              onPress={onCancel}
              className="min-h-[44px] justify-center px-4"
              accessibilityRole="button"
              accessibilityLabel={config.cancelText}
            >
              <Text className="text-[13px] font-brandSemiBold text-subtle-foreground">
                {config.cancelText}
              </Text>
            </Pressable>
            <Pressable
              onPress={() =>
                onConfirm(action === "sync" ? selectedMood : undefined)
              }
              className="min-h-[44px] justify-center rounded-lg bg-primary px-4 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel={config.confirmText}
            >
              <Text className="text-[13px] font-brandBold text-white">
                {config.confirmText}
              </Text>
            </Pressable>
          </View>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
