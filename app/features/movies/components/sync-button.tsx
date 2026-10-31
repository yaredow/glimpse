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
}

export default function SyncButton({
  onSync,
  syncsRemaining = 3,
}: SyncButtonProps) {
  const rotation = useSharedValue(0);

  const handlePress = () => {
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
      <Pressable style={styles.button} onPress={handlePress}>
        <Animated.View style={animatedStyle}>
          <MaterialCommunityIcons name="sync" size={18} color="#E50914" />
        </Animated.View>
        <Text style={styles.label}>Sync Selection</Text>
      </Pressable>
      <Text style={styles.count}>{syncsRemaining} syncs remaining today</Text>
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
  label: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    color: "#E50914",
    textTransform: "uppercase",
  },
  count: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: "#666",
  },
});
