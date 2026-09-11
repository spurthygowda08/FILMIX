import { config } from "../config.js";
import { Movie, MovieDetails } from "../types.js";
import { getCached, setCached } from "./cacheService.js";

const imageBase = "https://image.tmdb.org/t/p";

/*
 * Prevent duplicate TMDB requests.
 *
 * If multiple parts of the application request the same
 * resource at almost the same time, they share the same
 * Promise instead of creating multiple TMDB requests.
 */
const inFlightRequests = new Map<
  string,
  Promise<unknown>
>();

/*
 * Allow a small number of TMDB requests to run in parallel.
 *
 * This is much faster than the old one-request-at-a-time
 * queue while still protecting the API.
 */
const MAX_CONCURRENT_REQUESTS = 4;

let activeRequests = 0;

const pendingRequests: Array<() => void> = [];

/*
 * HTTP responses that can safely be retried.
 */
const RETRYABLE_STATUS_CODES = new Set([
  429,
  500,
  502,
  503,
  504,
]);

/*
 * Network requests can occasionally fail with ECONNRESET,
 * especially when a connection is interrupted.
 *
 * Give those requests several attempts before failing.
 */
const MAX_ATTEMPTS = 5;

/*
 * Give TMDB enough time to respond before aborting.
 */
const REQUEST_TIMEOUT_MS = 20000;

/*
 * Delay helper.
 */
function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/*
 * Identify temporary network errors.
 */
function isRetryableNetworkError(
  error: unknown,
) {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  const cause =
    error instanceof Error
      ? (
          error as Error & {
            cause?: unknown;
          }
        ).cause
      : undefined;

  const causeMessage =
    cause instanceof Error
      ? cause.message
      : String(cause ?? "");

  const combined =
    `${message} ${causeMessage}`.toLowerCase();

  return (
    /econnreset/.test(combined) ||
    /econnrefused/.test(combined) ||
    /etimedout/.test(combined) ||
    /enetwork/.test(combined) ||
    /enetunreach/.test(combined) ||
    /eai_again/.test(combined) ||
    /fetch failed/.test(combined) ||
    /und_err/.test(combined) ||
    /socket/.test(combined)
  );
}

/*
 * Controlled concurrency queue.
 *
 * Maximum 4 TMDB requests can run at the same time.
 */
function runThroughQueue<T>(
  task: () => Promise<T>,
): Promise<T> {
  return new Promise<T>(
    (resolve, reject) => {
      const execute = () => {
        activeRequests += 1;

        task()
          .then(resolve, reject)
          .finally(() => {
            activeRequests -= 1;

            const next =
              pendingRequests.shift();

            if (next) {
              next();
            }
          });
      };

      if (
        activeRequests <
        MAX_CONCURRENT_REQUESTS
      ) {
        execute();
      } else {
        pendingRequests.push(execute);
      }
    },
  );
}

/*
 * Calculate retry delay.
 *
 * Uses exponential backoff with a small amount
 * of randomness so repeated requests don't all
 * retry at exactly the same moment.
 */
function getRetryDelay(
  attempt: number,
) {
  const baseDelay =
    1000 *
    Math.pow(
      2,
      attempt - 1,
    );

  const jitter =
    Math.floor(
      Math.random() * 500,
    );

  return Math.min(
    baseDelay + jitter,
    10000,
  );
}

/*
 * Main TMDB request function.
 *
 * Handles:
 * - authentication
 * - request deduplication
 * - controlled concurrency
 * - timeout
 * - retries
 * - rate limiting
 * - ECONNRESET/network errors
 */
async function tmdbFetch<T>(
  path: string,
  params: Record<
    string,
    string | number | undefined
  > = {},
): Promise<T> {
  if (!config.tmdbToken) {
    throw new Error(
      "TMDB_READ_ACCESS_TOKEN is not configured.",
    );
  }

  const url = new URL(
    config.tmdbBaseUrl + path,
  );

  Object.entries(params).forEach(
    ([key, value]) => {
      if (
        value !== undefined &&
        value !== ""
      ) {
        url.searchParams.set(
          key,
          String(value),
        );
      }
    },
  );

  const requestKey =
    url.toString();

  /*
   * If exactly the same request is already
   * running, reuse it.
   */
  const existingRequest =
    inFlightRequests.get(
      requestKey,
    );

  if (existingRequest) {
    return existingRequest as Promise<T>;
  }

  /*
   * Put the request through the controlled
   * concurrency queue.
   */
  const request =
    runThroughQueue(async () => {
      let lastError: unknown;

      for (
        let attempt = 1;
        attempt <= MAX_ATTEMPTS;
        attempt += 1
      ) {
        let timeout:
          | ReturnType<typeof setTimeout>
          | undefined;

        try {
          const controller =
            new AbortController();

          timeout = setTimeout(
            () => {
              controller.abort();
            },
            REQUEST_TIMEOUT_MS,
          );

          const response =
            await fetch(url, {
              signal:
                controller.signal,

              headers: {
                Authorization: `Bearer ${config.tmdbToken}`,
                Accept:
                  "application/json",
              },
            });

          /*
           * Successful response.
           */
          if (response.ok) {
            return (await response.json()) as T;
          }

          /*
           * Read response body for a useful
           * error message.
           */
          const body =
            await response.text();

          const retryable =
            RETRYABLE_STATUS_CODES.has(
              response.status,
            );

          /*
           * Permanent HTTP error.
           */
          if (
            !retryable ||
            attempt === MAX_ATTEMPTS
          ) {
            throw new Error(
              `TMDB request failed (${response.status}): ${body.slice(
                0,
                300,
              )}`,
            );
          }

          /*
           * Respect TMDB Retry-After when available.
           */
          const retryAfterHeader =
            response.headers.get(
              "retry-after",
            );

          const retryAfterSeconds =
            Number(
              retryAfterHeader || 0,
            );

          const delayMs =
            retryAfterSeconds > 0
              ? Math.min(
                  retryAfterSeconds *
                    1000,
                  10000,
                )
              : getRetryDelay(
                  attempt,
                );

          await sleep(delayMs);
        } catch (error) {
          lastError = error;

          /*
           * Timeout.
           */
          if (
            error instanceof Error &&
            error.name ===
              "AbortError"
          ) {
            if (
              attempt ===
              MAX_ATTEMPTS
            ) {
              throw new Error(
                "TMDB request timed out after several attempts. Please try again.",
              );
            }

            await sleep(
              getRetryDelay(
                attempt,
              ),
            );

            continue;
          }

          /*
           * Temporary network error.
           *
           * This specifically handles errors such as:
           *
           * ECONNRESET
           * ECONNREFUSED
           * ETIMEDOUT
           * fetch failed
           */
          if (
            isRetryableNetworkError(
              error,
            )
          ) {
            if (
              attempt ===
              MAX_ATTEMPTS
            ) {
              throw new Error(
                "Unable to connect to TMDB right now. Please try again.",
              );
            }

            await sleep(
              getRetryDelay(
                attempt,
              ),
            );

            continue;
          }

          /*
           * Non-retryable error.
           */
          throw error;
        } finally {
          if (timeout) {
            clearTimeout(timeout);
          }
        }
      }

      throw lastError instanceof Error
        ? lastError
        : new Error(
            "Unable to complete the TMDB request.",
          );
    });

  /*
   * Store the Promise immediately so that
   * simultaneous identical requests share it.
   */
  inFlightRequests.set(
    requestKey,
    request,
  );

  try {
    return (await request) as T;
  } finally {
    inFlightRequests.delete(
      requestKey,
    );
  }
}

/*
 * Build TMDB image URL.
 */
function poster(
  path: string | null,
  size = "w500",
) {
  return path
    ? `${imageBase}/${size}${path}`
    : null;
}

/*
 * Convert TMDB movie data to our Movie type.
 */
function mapMovie(
  item: any,
): Movie {
  return {
    id: item.id,

    title:
      item.title ??
      item.name ??
      "Untitled",

    overview:
      item.overview ?? "",

    posterUrl: poster(
      item.poster_path,
    ),

    backdropUrl: poster(
      item.backdrop_path,
      "w1280",
    ),

    rating: Number(
      item.vote_average ?? 0,
    ),

    voteCount: Number(
      item.vote_count ?? 0,
    ),

    releaseDate:
      item.release_date ||
      null,

    genreIds:
      item.genre_ids ?? [],
  };
}

/*
 * =========================================================
 * DISCOVER MOVIES
 * =========================================================
 */
export async function discoverMovies(
  params: Record<
    string,
    string | number | undefined
  >,
) {
  const key = `discover:${JSON.stringify(
    params,
  )}`;

  /*
   * Return cached result when available.
   */
  const cached =
    getCached<any>(key);

  if (cached) {
    return cached;
  }

  /*
   * "Newest" means released movies only.
   *
   * If no year is selected, use the current year.
   * If a year is selected, limit the results to that year.
   * Future release dates are excluded.
   */
  const sort =
    params.sort ??
    "popularity.desc";

  const selectedYear =
    params.year !== undefined &&
    params.year !== ""
      ? Number(params.year)
      : new Date().getFullYear();

  const isNewest =
    sort === "primary_release_date.desc";

  const releaseDateGte =
    isNewest && Number.isFinite(selectedYear)
      ? `${selectedYear}-01-01`
      : undefined;

  const releaseDateLte =
    isNewest && Number.isFinite(selectedYear)
      ? selectedYear === new Date().getFullYear()
        ? new Date().toISOString().slice(0, 10)
        : `${selectedYear}-12-31`
      : undefined;

  const data =
    await tmdbFetch<any>(
      "/discover/movie",
      {
        page:
          params.page ?? 1,

        with_genres:
          params.genre,

        sort_by:
          sort,

        primary_release_year:
          params.year,

        "primary_release_date.gte":
          releaseDateGte,

        "primary_release_date.lte":
          releaseDateLte,
      },
    );

  const result = {
    page: data.page,

    totalPages:
      data.total_pages,

    results: (
      data.results ?? []
    ).map(mapMovie),
  };

  setCached(
    key,
    result,
    config.cacheTtlMs,
  );

  return result;
}

/*
 * =========================================================
 * SEARCH MOVIES
 * =========================================================
 */
export async function searchMovies(
  query: string,
  page = 1,
) {
  const key =
    `search:${query.toLowerCase()}:${page}`;

  /*
   * Return cached search results.
   */
  const cached =
    getCached<any>(key);

  if (cached) {
    return cached;
  }

  const data =
    await tmdbFetch<any>(
      "/search/movie",
      {
        query,
        page,
        include_adult: "false",
      },
    );

  const result = {
    page: data.page,

    totalPages:
      data.total_pages,

    results: (
      data.results ?? []
    ).map(mapMovie),
  };

  setCached(
    key,
    result,
    config.cacheTtlMs,
  );

  return result;
}

/*
 * =========================================================
 * GET GENRES
 * =========================================================
 */
export async function getGenres() {
  const key = "genres";

  /*
   * Genres rarely change, so cache them.
   */
  const cached =
    getCached<any>(key);

  if (cached) {
    return cached;
  }

  const data =
    await tmdbFetch<any>(
      "/genre/movie/list",
    );

  const result =
    data.genres ?? [];

  setCached(
    key,
    result,
    config.cacheTtlMs,
  );

  return result;
}

/*
 * =========================================================
 * GET MOVIE DETAILS
 * =========================================================
 */
export async function getMovie(
  id: number,
): Promise<MovieDetails> {
  const key = `movie:${id}`;

  /*
   * Return cached movie details.
   */
  const cached =
    getCached<MovieDetails>(
      key,
    );

  if (cached) {
    return cached;
  }

  const data =
    await tmdbFetch<any>(
      `/movie/${id}`,
    );

  const result: MovieDetails = {
    ...mapMovie(data),

    runtime:
      data.runtime ?? null,

    genres:
      data.genres ?? [],

    tagline:
      data.tagline || null,

    popularity: Number(
      data.popularity ?? 0,
    ),
  };

  setCached(
    key,
    result,
    config.cacheTtlMs,
  );

  return result;
}

/*
 * =========================================================
 * GET RECOMMENDATIONS
 * =========================================================
 */
export async function getRecommendations(
  id: number,
) {
  const key =
    `recommendations:${id}`;

  /*
   * Return cached recommendations.
   */
  const cached =
    getCached<any>(key);

  if (cached) {
    return cached;
  }

  const data =
    await tmdbFetch<any>(
      `/movie/${id}/recommendations`,
      {
        page: 1,
      },
    );

  const result =
    (data.results ?? []).map(
      mapMovie,
    );

  setCached(
    key,
    result,
    config.cacheTtlMs,
  );

  return result;
}