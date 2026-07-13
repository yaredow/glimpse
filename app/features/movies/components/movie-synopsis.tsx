import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface MovieSynopsisProps {
  synopsis: string;
}

export default function MovieSynopsis({ synopsis }: MovieSynopsisProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong = synopsis.length > 250;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>SYNOPSIS</Text>
      <Text
        style={styles.content}
        numberOfLines={isExpanded ? undefined : 5}
      >
        {synopsis}
      </Text>
      {isLong && (
        <Pressable onPress={() => setIsExpanded(!isExpanded)}>
          <Text style={styles.toggle}>
            {isExpanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#E50914",
    marginBottom: 8,
  },
  content: {
    fontSize: 15,
    color: "#F0F0F0",
    lineHeight: 24,
  },
  toggle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "bold",
    color: "#E50914",
  },
});
