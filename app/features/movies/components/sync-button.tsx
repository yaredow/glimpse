import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAppTheme } from "@/lib/theme";

interface SyncButtonProps {
  onSync: () => void;
  syncsRemaining?: number;
  isSyncing?: boolean;
}

export default function SyncButton({
  onSync,
  syncsRemaining = 3,
  isSyncing = false,
}: SyncButtonProps) {
  const theme = useAppTheme();
  const rotation = useSharedValue(0);
  const isDisabled = syncsRemaining <= 0 || isSyncing;

  const handlePress = () => {
    if (isDisabled) return;
    rotation.set(
      withTiming(rotation.get() + 360, { duration: 800 }, () => {
        rotation.set(0);
      }),
    );
    onSync();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: theme.colors.elevation.level1,
            borderColor: isDisabled ? "rgba(255, 255, 255, 0.08)" : theme.colors.outlineVariant,
          },
          isDisabled && styles.buttonDisabled,
          pressed && { opacity: 0.8 },
        ]}
        disabled={isDisabled}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <MaterialCommunityIcons
            name="sync"
            size={16}
            color={isDisabled ? theme.colors.textMuted : theme.colors.primary}
          />
        </Animated.View>
        <Text
          style={[
            styles.label,
            { color: isDisabled ? theme.colors.textMuted : theme.colors.textPrimary },
          ]}
        >
          {isSyncing ? "Syncing..." : `Sync Reel (${syncsRemaining} left)`}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
