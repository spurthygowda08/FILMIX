import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Movie } from "../types";
import { api } from "../services/api";

type Props = {
  movie: Movie;
  wishlisted?: boolean;
  onWishlist?: (movie: Movie) => void;
  compact?: boolean;
};

export default function MovieCard({
  movie,
  wishlisted,
  onWishlist,
  compact = false,
}: Props) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}#discover`;

  const prefetchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const startPrefetch = () => {
    if (prefetchTimer.current) {
      window.clearTimeout(prefetchTimer.current);
    }

    // Wait briefly so simply moving the mouse across the grid does not
    // trigger a request for every card. A deliberate hover warms both
    // the movie-details and recommendations caches.
    prefetchTimer.current = window.setTimeout(() => {
      api.prefetchMovieData(movie.id);
    }, 350);
  };

  const cancelPrefetch = () => {
    if (prefetchTimer.current) {
      window.clearTimeout(prefetchTimer.current);
      prefetchTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (prefetchTimer.current) {
        window.clearTimeout(prefetchTimer.current);
      }
    };
  }, []);

  return (
    <article
      className={`movie-card ${compact ? "compact" : ""}`}
      onMouseEnter={startPrefetch}
      onMouseLeave={cancelPrefetch}
      onFocusCapture={startPrefetch}
      onBlurCapture={cancelPrefetch}
    >
      <div className="poster-wrap">
        <Link
          to={`/movie/${movie.id}`}
          state={{ from: returnTo }}
          className="poster-link"
          aria-label={`Open ${movie.title}`}
        >
          {movie.posterUrl || movie.backdropUrl ? (
            <img
              src={movie.posterUrl || movie.backdropUrl || ""}
              alt={movie.title}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="poster-fallback">
              <strong>FILMIX</strong>
              <span>No poster available</span>
            </div>
          )}

          <div className="poster-overlay" aria-hidden="true">
            <span>View details</span>
          </div>
        </Link>

        {onWishlist && (
          <button
            type="button"
            className={`poster-wish ${wishlisted ? "active" : ""}`}
            onClick={() => onWishlist(movie)}
            aria-label={
              wishlisted
                ? `Remove ${movie.title} from collection`
                : `Save ${movie.title} to collection`
            }
            title={
              wishlisted
                ? "Remove from collection"
                : "Add to collection"
            }
          >
            {wishlisted ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="movie-info">
        <Link
          to={`/movie/${movie.id}`}
          state={{ from: returnTo }}
          className="movie-title"
          title={movie.title}
        >
          {movie.title}
        </Link>

        <div className="movie-meta">
          <span className="rating">
            <span>★</span>{" "}
            {movie.voteCount &&
            movie.voteCount > 0 &&
            movie.rating > 0
              ? movie.rating.toFixed(1)
              : "N/A"}
          </span>

          <span>
            {movie.releaseDate
              ? new Date(`${movie.releaseDate}T00:00:00`) >
                new Date()
                ? "Not released"
                : movie.releaseDate.slice(0, 4)
              : "—"}
          </span>
        </div>
      </div>
    </article>
  );
}