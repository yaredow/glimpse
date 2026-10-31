import { useState, useCallback } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import YoutubeIframe from "react-native-youtube-iframe";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MovieHeader from "./movie-header";
import type { Movie } from "../types/movies.type";

interface MovieTrailerProps {
  movie: Movie;
}

export default function MovieTrailer({ movie }: MovieTrailerProps) {
  const [playing, setPlaying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);

  const handleOpenTrailer = useCallback(() => {
    setPlayerError(null);
    setShowModal(true);
    setPlaying(true);
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setPlaying(false);
    setShowModal(false);
    setPlayerError(null);
  }, []);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const handleOpenInYouTube = useCallback(() => {
    if (movie.trailer_key) {
      Linking.openURL(`https://www.youtube.com/watch?v=${movie.trailer_key}`);
    }
  }, [movie.trailer_key]);

  return (
    <>
      <MovieHeader movie={movie} onTrailerPress={handleOpenTrailer} />

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseTrailer}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.closeButton} onPress={handleCloseTrailer}>
            <MaterialCommunityIcons name="close-circle" size={36} color="white" />
          </Pressable>

          <View style={styles.videoContainer}>
            {movie.trailer_key && !playerError ? (
              <YoutubeIframe
                height={220}
                play={playing}
                videoId={movie.trailer_key}
                onChangeState={onStateChange}
                onError={(err: unknown) => {
                  console.warn("YouTube player error:", err);
                  setPlayerError(String(err));
                }}
              />
            ) : null}

            {playerError ? (
              <View style={styles.errorBox}>
                <MaterialCommunityIcons name="youtube" size={48} color="#E50914" />
                <Text style={styles.errorTitle}>Player Unavailable</Text>
                <Text style={styles.errorSubtitle}>
                  Watch the official trailer directly on YouTube
                </Text>
              </View>
            ) : null}
          </View>

          {movie.trailer_key ? (
            <Pressable style={styles.youtubeLinkButton} onPress={handleOpenInYouTube}>
              <MaterialCommunityIcons name="youtube" size={20} color="white" />
              <Text style={styles.youtubeLinkText}>Open in YouTube</Text>
            </Pressable>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
    justifyContent: "center",
  },
  errorBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },
  errorTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorSubtitle: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
  },
  youtubeLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E50914",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    gap: 8,
  },
  youtubeLinkText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
});
