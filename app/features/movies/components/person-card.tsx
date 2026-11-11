import { useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { tmdbImage } from "../constants/images";

interface PersonCardProps {
  name: string;
  character: string;
  profilePath?: string | null;
}

export default function PersonCard({ name, character, profilePath }: PersonCardProps) {
  const { width } = useWindowDimensions();
  const [imageError, setImageError] = useState(false);
  const imageUri = tmdbImage(profilePath, "w185");

  return (
    <View className="items-center" style={{ width: width * 0.22, marginRight: 12 }}>
      <View className="h-20 w-20 overflow-hidden rounded-full border border-primary">
        {imageUri && !imageError ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <View
            className="items-center justify-center bg-surface-zinc-700"
            style={{ width: "100%", height: "100%" }}
          >
            <Text className="text-[24px] font-brandBold text-white">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>
        )}
      </View>
      <Text className="mt-2 text-center text-[12px] font-brandBold text-white" numberOfLines={1}>{name}</Text>
      <Text className="text-center text-[10px] text-primary" numberOfLines={1}>{character}</Text>
    </View>
  );
}
