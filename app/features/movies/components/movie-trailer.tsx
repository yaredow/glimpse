import { useCallback, useState } from "react";
import MovieHeader from "./movie-header";
import CinemaTrailerModal from "./cinema-trailer-modal";
import type { Movie } from "../types/movies.type";

interface MovieTrailerProps {
  movie: Movie;
}

export default function MovieTrailer({ movie }: MovieTrailerProps) {
  const [showModal, setShowModal] = useState(false);

  const handleOpenTrailer = useCallback(() => {
    setShowModal(true);
  }, []);

  const handleCloseTrailer = useCallback(() => {
    setShowModal(false);
  }, []);

  return (
    <>
      <MovieHeader movie={movie} onTrailerPress={handleOpenTrailer} />

      <CinemaTrailerModal
        visible={showModal}
        trailerKey={movie.trailer_key}
        movieTitle={movie.title}
        backdropPath={movie.backdrop_path}
        posterPath={movie.poster_path}
        onClose={handleCloseTrailer}
      />
    </>
  );
}
