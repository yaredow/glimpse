import { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SyncButtonProps {
  onSync: () => void;
}

export default function SyncButton({ onSync }: SyncButtonProps) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      spinAnim.setValue(0);
    });
    onSync();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handlePress}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialCommunityIcons name="sync" size={18} color="#E50914" />
        </Animated.View>
        <Text style={styles.label}>Sync Selection</Text>
      </Pressable>
      <Text style={styles.count}>3 syncs remaining today</Text>
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
