import type {
  Movie,
  MovieDetails,
  PageResult,
} from "../types";

/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE =
  (import.meta as ImportMeta & {
    env?: {
      VITE_API_BASE_URL?: string;
    };
  }).env?.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

/* =========================================================
   CACHE CONFIGURATION
========================================================= */

const DETAIL_CACHE_TTL = 5 * 60 * 1000;
const RECOMMENDATION_CACHE_TTL = 5 * 60 * 1000;

/* =========================================================
   CACHE TYPES
========================================================= */

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const movieCache = new Map<
  number,
  CacheEntry<MovieDetails>
>();

const recommendationCache = new Map<
  number,
  CacheEntry<Movie[]>
>();

/*
 * Keep track of requests already in progress.
 *
 * If multiple components request the same movie at almost
 * the same time, only one network request is created.
 */
const movieInFlight =
  new Map<number, Promise<MovieDetails>>();

const recommendationInFlight =
  new Map<number, Promise<Movie[]>>();

/* =========================================================
   GENERIC REQUEST HELPER
========================================================= */

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      "Unable to connect to the server. Please check your connection and try again.",
    );
  }

  /*
   * Some server/proxy errors may not return valid JSON.
   * In that case we still want a useful error message.
   */
  const body = await response
    .json()
    .catch(() => null);

  if (
    !response.ok ||
    body?.success === false
  ) {
    const message =
      body?.message ||
      body?.error?.message ||
      (response.status === 404
        ? "The requested resource was not found."
        : response.status === 429
          ? "Too many requests. Please wait a moment and try again."
          : response.status >= 500
            ? "The server is temporarily unavailable. Please try again."
            : "Request failed.");

    throw new Error(message);
  }

  return body.data as T;
}

/* =========================================================
   CACHE HELPERS
========================================================= */

function getFresh<T>(
  cache: Map<
    number,
    CacheEntry<T>
  >,
  id: number,
): T | undefined {
  const entry = cache.get(id);

  if (!entry) {
    return undefined;
  }

  /*
   * Remove expired entries immediately instead of
   * allowing stale data to remain in memory.
   */
  if (
    Date.now() >=
    entry.expiresAt
  ) {
    cache.delete(id);
    return undefined;
  }

  return entry.value;
}

function cacheValue<T>(
  cache: Map<
    number,
    CacheEntry<T>
  >,
  id: number,
  value: T,
  ttl: number,
) {
  cache.set(id, {
    value,
    expiresAt:
      Date.now() + ttl,
  });
}

/* =========================================================
   MOVIE DETAILS
========================================================= */

function getMovie(
  id: number,
): Promise<MovieDetails> {
  /*
   * 1. Try browser cache first.
   */
  const cached =
    getFresh(
      movieCache,
      id,
    );

  if (cached) {
    return Promise.resolve(
      cached,
    );
  }

  /*
   * 2. Reuse an existing request if one
   *    for the same movie is already running.
   */
  const existing =
    movieInFlight.get(id);

  if (existing) {
    return existing;
  }

  /*
   * 3. Fetch from the backend.
   *
   *    The browser talks only to our Node/Express API.
   *    The backend is responsible for communicating
   *    with TMDB.
   */
  const promise =
    request<MovieDetails>(
      `/movies/${id}`,
    )
      .then((result) => {
        cacheValue(
          movieCache,
          id,
          result,
          DETAIL_CACHE_TTL,
        );

        return result;
      })
      .finally(() => {
        movieInFlight.delete(id);
      });

  movieInFlight.set(
    id,
    promise,
  );

  return promise;
}

/* =========================================================
   RECOMMENDATIONS
========================================================= */

function getRecommendations(
  id: number,
): Promise<Movie[]> {
  /*
   * 1. Try browser cache first.
   */
  const cached =
    getFresh(
      recommendationCache,
      id,
    );

  if (cached) {
    return Promise.resolve(
      cached,
    );
  }

  /*
   * 2. Reuse an existing request if
   *    another component is already
   *    loading recommendations.
   */
  const existing =
    recommendationInFlight.get(
      id,
    );

  if (existing) {
    return existing;
  }

  /*
   * 3. Fetch recommendations through
   *    the Node/Express backend.
   */
  const promise =
    request<Movie[]>(
      `/movies/${id}/recommendations`,
    )
      .then((result) => {
        cacheValue(
          recommendationCache,
          id,
          result,
          RECOMMENDATION_CACHE_TTL,
        );

        return result;
      })
      .finally(() => {
        recommendationInFlight.delete(
          id,
        );
      });

  recommendationInFlight.set(
    id,
    promise,
  );

  return promise;
}

/* =========================================================
   PREFETCH MOVIE DATA
========================================================= */

/*
 * Warm the browser cache before a user opens
 * a movie details page.
 *
 * This is intentionally fire-and-forget.
 * A prefetch failure must never break the UI.
 */
function prefetchMovieData(
  id: number,
) {
  void getMovie(id).catch(
    () => {},
  );

  void getRecommendations(id).catch(
    () => {},
  );
}

/* =========================================================
   PUBLIC API
========================================================= */

export const api = {
  /* -------------------------------------------------------
     DISCOVER
  ------------------------------------------------------- */

  discover: (
    params: URLSearchParams,
  ) =>
    request<PageResult>(
      `/movies/discover?${params.toString()}`,
    ),

  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  search: (
    query: string,
    page: number,
  ) =>
    request<PageResult>(
      `/movies/search?query=${encodeURIComponent(
        query.trim(),
      )}&page=${page}`,
    ),

  /* -------------------------------------------------------
     GENRES
  ------------------------------------------------------- */

  genres: () =>
    request<
      {
        id: number;
        name: string;
      }[]
    >(
      "/movies/genres",
    ),

  /* -------------------------------------------------------
     MOVIE DETAILS
  ------------------------------------------------------- */

  movie: getMovie,

  /* -------------------------------------------------------
     RECOMMENDATIONS
  ------------------------------------------------------- */

  recommendations:
    getRecommendations,

  /* -------------------------------------------------------
     PREFETCH
  ------------------------------------------------------- */

  prefetchMovieData,

  /* -------------------------------------------------------
     WISHLIST / MY COLLECTION
  ------------------------------------------------------- */

  wishlist: (
    clientId: string,
  ) =>
    request<any[]>(
      "/wishlist",
      {
        headers: {
          "x-client-id":
            clientId,
        },
      },
    ),

  /* -------------------------------------------------------
     ADD TO WISHLIST
  ------------------------------------------------------- */

  addWishlist: (
    clientId: string,
    movie: Movie,
  ) =>
    request<any>(
      "/wishlist",
      {
        method: "POST",

        headers: {
          "x-client-id":
            clientId,
        },

        body: JSON.stringify({
          movieId: movie.id,
          title: movie.title,
          posterUrl:
            movie.posterUrl,
        }),
      },
    ),

  /* -------------------------------------------------------
     REMOVE FROM WISHLIST
  ------------------------------------------------------- */

  removeWishlist: (
    clientId: string,
    movieId: number,
  ) =>
    request<void>(
      `/wishlist/${movieId}`,
      {
        method: "DELETE",

        headers: {
          "x-client-id":
            clientId,
        },
      },
    ),
};