import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { LightningIcon } from "phosphor-react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";
import { colors } from "@/lib/theme/tokens.generated";
import GlimpseLogo from "@/components/ui/glimpse-logo";

interface ExploreHeaderProps {
  syncsRemaining?: number;
  onSyncPress?: () => void;
  isSyncing?: boolean;
  programTheme?: string;
}

export default function ExploreHeader({
  syncsRemaining = 3,
  onSyncPress,
  isSyncing = false,
  programTheme,
}: ExploreHeaderProps) {
  const handleSyncPress = () => {
    if (isSyncing) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSyncPress?.();
  };

  const todayDate = new Date()
    .toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
    .toUpperCase();

  return (
    <View className="flex-row items-center justify-between bg-transparent px-5 pt-2 pb-3.5">
      <View className="flex-1 justify-center mr-3">
        <GlimpseLogo size="medium" showMark={false} />
        <Text
          className="mt-1 text-[10.5px] tracking-[1.2px] font-brandSemiBold text-subtle-foreground"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {todayDate}
          {programTheme ? (
            <>
              {" · "}
              <Text className="text-amber-500">{`✦ ${programTheme}`}</Text>
            </>
          ) : null}
        </Text>
      </View>

      {onSyncPress ? (
        <Pressable
          onPress={handleSyncPress}
          disabled={isSyncing}
          className={cn(
            "flex-row items-center gap-[5px] rounded-[18px] border border-white/[0.08] bg-surface-5 px-3 py-[7px] active:opacity-75",
            isSyncing && "opacity-75",
          )}
          accessibilityRole="button"
          accessibilityLabel={`${syncsRemaining} syncs remaining. Tap to select mood and sync.`}
        >
          {isSyncing ? (
            <ActivityIndicator size={12} color={colors.primary} />
          ) : (
            <LightningIcon
              size={14}
              color={
                syncsRemaining > 0 ? colors.primary : colors.faintForeground
              }
            />
          )}
          <Text
            className={cn(
              "text-[11px] tracking-[0.6px] font-brandBold",
              syncsRemaining > 0 ? "text-white" : "text-faint-foreground",
            )}
          >
            {isSyncing
              ? "SYNCING"
              : syncsRemaining > 0
                ? `SYNC · ${syncsRemaining}`
                : "NO SYNCS"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
