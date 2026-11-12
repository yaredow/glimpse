import { Pressable, Text, View } from "react-native";
import { DETAIL_TABS } from "../constants/movies.constants";

interface MovieDetailTabsProps {
  activeTab: string;
  onTabPress: (tab: string) => void;
  children: React.ReactNode;
}

export default function MovieDetailTabs({ activeTab, onTabPress, children }: MovieDetailTabsProps) {
  return (
    <View>
      <View className="flex-row bg-surface-4 px-4" accessibilityRole="tablist">
        {DETAIL_TABS.map((tab) => (
          <Pressable
            key={tab}
            onPress={() => onTabPress(tab)}
            className="flex-1 items-center py-3"
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            accessibilityLabel={tab}
          >
            <Text
              className={
                activeTab === tab
                  ? "text-[13px] font-brandSemiBold text-white"
                  : "text-[13px] font-brandSemiBold text-zinc-400"
              }
            >
              {tab}
            </Text>
            {activeTab === tab ? (
              <View className="mt-1 h-[3px] w-full rounded-[2px] bg-primary" />
            ) : null}
          </Pressable>
        ))}
      </View>
      <View className="p-4">{children}</View>
    </View>
  );
}
