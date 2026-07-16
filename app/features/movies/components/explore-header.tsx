import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function ExploreHeader() {
  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <View style={styles.avatarInner}>
          <MaterialCommunityIcons name="account" size={22} color="white" />
        </View>
      </View>

      <Text style={styles.logo}>GLIMPSE</Text>

      <View style={styles.bellButton}>
        <MaterialCommunityIcons name="bell-outline" size={22} color="white" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    fontFamily: "Inter_700Bold",
    fontSize: 24,
    color: "#E50914",
    letterSpacing: -0.5,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
