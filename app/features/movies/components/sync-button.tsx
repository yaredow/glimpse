import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
        style={[styles.button, isDisabled && styles.buttonDisabled]}
        disabled={isDisabled}
        onPress={handlePress}
      >
        <Animated.View style={animatedStyle}>
          <MaterialCommunityIcons
            name="sync"
            size={18}
            color={isDisabled ? "#666" : "#E50914"}
          />
        </Animated.View>
        <Text style={[styles.label, isDisabled && styles.labelDisabled]}>
          {isSyncing ? "Syncing..." : "Sync Selection"}
        </Text>
      </Pressable>
      <Text style={styles.count}>
        {syncsRemaining <= 0
          ? "No syncs remaining today"
          : `${syncsRemaining} ${syncsRemaining === 1 ? "sync" : "syncs"} remaining today`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 4,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E50914",
  },
  buttonDisabled: {
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "transparent",
    opacity: 0.6,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#E50914",
    textTransform: "uppercase",
  },
  labelDisabled: {
    color: "#777",
  },
  count: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#666",
  },
});
