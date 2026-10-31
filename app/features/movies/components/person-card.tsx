import { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { tmdbImage } from "../consants/images";

interface PersonCardProps {
  name: string;
  character: string;
  profilePath?: string | null;
}

const { width } = Dimensions.get("window");
const cardWidth = width * 0.22;

export default function PersonCard({ name, character, profilePath }: PersonCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUri = tmdbImage(profilePath, "w185");

  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        {imageUri && !imageError ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.character} numberOfLines={1}>{character}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    marginRight: 12,
    alignItems: "center",
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E50914",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  name: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  character: {
    fontSize: 10,
    color: "#E50914",
    textAlign: "center",
  },
});
