import { FlatList, Text, View } from "react-native";
import PersonCard from "./person-card";
import type { CastMember } from "../types/movies.type";

interface MovieCastProps {
  cast: CastMember[];
}

export default function MovieCast({ cast }: MovieCastProps) {
  if (cast.length === 0) return null;

  const sorted = [...cast].sort((a, b) => a.order - b.order);

  return (
    <View className="py-4">
      <Text className="mb-4 px-4 text-[16px] font-brandBold text-primary">
        Cast
      </Text>
      <FlatList
        data={sorted}
        renderItem={({ item }) => (
          <PersonCard
            name={item.name}
            character={item.character}
            profilePath={item.profile_path}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}
