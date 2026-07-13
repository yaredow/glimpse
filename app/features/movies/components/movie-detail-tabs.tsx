import { Pressable, StyleSheet, Text, View } from "react-native";
import { DETAIL_TABS } from "../consants/movies.constants";

interface MovieDetailTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  children: React.ReactNode;
}

export default function MovieDetailTabs({ activeTab, onTabPress, children }: MovieDetailTabsProps) {
  return (
    <View>
      <View style={styles.tabBar}>
        {DETAIL_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabPress(tab)}
            style={styles.tab}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.indicator} />}
          </Pressable>
        ))}
      </View>
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    backgroundColor: "#1A1A1A",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#999",
  },
  activeTabText: {
    color: "white",
  },
  indicator: {
    marginTop: 4,
    width: "100%",
    height: 3,
    backgroundColor: "#E50914",
    borderRadius: 2,
  },
  content: {
    padding: 16,
  },
});
