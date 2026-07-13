import { useState, useCallback } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
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

  const handleOpenTrailer = useCallback(() => {
    setShowModal(true);
    setPlaying(true);
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setPlaying(false);
    setShowModal(false);
  }, []);

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

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
          <View style={styles.videoContainer}>
            {movie.trailer_key ? (
              <YoutubeIframe
                height={220}
                play={playing}
                videoId={movie.trailer_key}
                onChangeState={onStateChange}
              />
            ) : null}
          </View>

          <Pressable style={styles.closeButton} onPress={handleCloseTrailer}>
            <MaterialCommunityIcons name="close-circle" size={36} color="white" />
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
  },
  closeButton: {
    position: "absolute",
    top: 60,
    right: 20,
  },
});
