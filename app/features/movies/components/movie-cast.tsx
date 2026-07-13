import { FlatList, StyleSheet, Text, View } from "react-native";
import PersonCard from "./person-card";
import type { CastMember } from "../types/movies.type";

interface MovieCastProps {
  cast: CastMember[];
}

export default function MovieCast({ cast }: MovieCastProps) {
  if (cast.length === 0) return null;

  const sorted = [...cast].sort((a, b) => a.order - b.order);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cast</Text>
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

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#E50914",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});
