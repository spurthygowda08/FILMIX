import type { Movie, MovieDetails, PageResult } from "../types";

const API_BASE =
  (import.meta as ImportMeta & {
    env?: { VITE_API_BASE_URL?: string };
  }).env?.VITE_API_BASE_URL || "http://localhost:5000/api";

const DETAIL_CACHE_TTL = 5 * 60 * 1000;
const RECOMMENDATION_CACHE_TTL = 5 * 60 * 1000;

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const movieCache = new Map<number, CacheEntry<MovieDetails>>();
const recommendationCache = new Map<number, CacheEntry<Movie[]>>();

// Keep in-flight requests so multiple components/events asking for the same
// movie do not create duplicate network requests.
const movieInFlight = new Map<number, Promise<MovieDetails>>();
const recommendationInFlight = new Map<number, Promise<Movie[]>>();

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message || body?.error?.message || "Request failed",
    );
  }

  return body.data as T;
}

function getFresh<T>(
  cache: Map<number, CacheEntry<T>>,
  id: number,
): T | undefined {
  const entry = cache.get(id);

  if (!entry) {
    return undefined;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(id);
    return undefined;
  }

  return entry.value;
}

function cacheValue<T>(
  cache: Map<number, CacheEntry<T>>,
  id: number,
  value: T,
  ttl: number,
) {
  cache.set(id, {
    value,
    expiresAt: Date.now() + ttl,
  });
}

function getMovie(id: number): Promise<MovieDetails> {
  const cached = getFresh(movieCache, id);

  if (cached) {
    return Promise.resolve(cached);
  }

  const existing = movieInFlight.get(id);

  if (existing) {
    return existing;
  }

  const promise = request<MovieDetails>(`/movies/${id}`)
    .then((result) => {
      cacheValue(movieCache, id, result, DETAIL_CACHE_TTL);
      return result;
    })
    .finally(() => {
      movieInFlight.delete(id);
    });

  movieInFlight.set(id, promise);
  return promise;
}

function getRecommendations(id: number): Promise<Movie[]> {
  const cached = getFresh(recommendationCache, id);

  if (cached) {
    return Promise.resolve(cached);
  }

  const existing = recommendationInFlight.get(id);

  if (existing) {
    return existing;
  }

  const promise = request<Movie[]>(`/movies/${id}/recommendations`)
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
      recommendationInFlight.delete(id);
    });

  recommendationInFlight.set(id, promise);
  return promise;
}

/**
 * Warm the browser-side cache before the user opens a movie.
 * This is intentionally fire-and-forget and never blocks the UI.
 */
function prefetchMovieData(id: number) {
  void getMovie(id).catch(() => {});
  void getRecommendations(id).catch(() => {});
}

export const api = {
  discover: (params: URLSearchParams) =>
    request<PageResult>(`/movies/discover?${params}`),

  search: (query: string, page: number) =>
    request<PageResult>(
      `/movies/search?query=${encodeURIComponent(query)}&page=${page}`,
    ),

  genres: () =>
    request<{ id: number; name: string }[]>("/movies/genres"),

  movie: getMovie,

  recommendations: getRecommendations,

  prefetchMovieData,

  wishlist: (clientId: string) =>
    request<any[]>("/wishlist", {
      headers: { "x-client-id": clientId },
    }),

  addWishlist: (clientId: string, movie: Movie) =>
    request<any>("/wishlist", {
      method: "POST",
      headers: { "x-client-id": clientId },
      body: JSON.stringify({
        movieId: movie.id,
        title: movie.title,
        posterUrl: movie.posterUrl,
      }),
    }),

  removeWishlist: (clientId: string, movieId: number) =>
    request<void>(`/wishlist/${movieId}`, {
      method: "DELETE",
      headers: { "x-client-id": clientId },
    }),
};