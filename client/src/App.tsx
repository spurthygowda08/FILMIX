import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Routes,
  Route,
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import MovieCard from "./components/MovieCard";

import {
  EmptyState,
  ErrorState,
  LoadingGrid,
} from "./components/States";

import { api } from "./services/api";

import type {
  Movie,
  MovieDetails,
} from "./types";

import { useDebounce } from "./hooks/useDebounce";
import { getClientId } from "./utils/clientId";


/* =========================================================
   MOVIE DISPLAY HELPERS
========================================================= */

function hasRating(movie: Pick<Movie, "rating" | "voteCount">) {
  return (
    Number(movie.voteCount ?? 0) > 0 &&
    Number(movie.rating ?? 0) > 0
  );
}

function formatRating(movie: Pick<Movie, "rating" | "voteCount">) {
  return hasRating(movie)
    ? movie.rating.toFixed(1)
    : "N/A";
}

function formatRelease(movie: Pick<Movie, "releaseDate">) {
  if (!movie.releaseDate) {
    return "—";
  }

  const releaseDate = new Date(
    `${movie.releaseDate}T00:00:00`,
  );

  return releaseDate > new Date()
    ? "Not released"
    : movie.releaseDate.slice(0, 4);
}



/* =========================================================
   WISHLIST / MY COLLECTION
========================================================= */

function useWishlist() {
  const clientId = useMemo(
    getClientId,
    []
  );

  const [ids, setIds] =
    useState<Set<number>>(
      new Set()
    );

  const [items, setItems] =
    useState<any[]>([]);


  /* -------------------------------------------------------
     LOAD COLLECTION
  ------------------------------------------------------- */

  const refresh = async () => {
    try {
      const data =
        await api.wishlist(
          clientId
        );

      setItems(data);

      setIds(
        new Set(
          data.map(
            (item: any) =>
              item.movieId
          )
        )
      );
    } catch {
      /*
       * Collection errors should not
       * prevent movie browsing.
       */
    }
  };


  /* -------------------------------------------------------
     INITIAL LOAD
  ------------------------------------------------------- */

  useEffect(() => {
    refresh();
  }, []);


  /* -------------------------------------------------------
     ADD / REMOVE
  ------------------------------------------------------- */

  const toggle = async (
    movie: Movie
  ) => {
    try {
      if (
        ids.has(movie.id)
      ) {
        await api.removeWishlist(
          clientId,
          movie.id
        );
      } else {
        await api.addWishlist(
          clientId,
          movie
        );
      }

      await refresh();
    } catch {
      /*
       * Keep the UI usable even if
       * collection requests fail.
       */
    }
  };


  return {
    ids,
    items,
    toggle,
  };
}


/* =========================================================
   SEARCH BAR
========================================================= */

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (
    value: string
  ) => void;
  onSubmit: (
    event: FormEvent
  ) => void;
}) {
  return (
    <form
      className="search-panel"
      onSubmit={onSubmit}
    >

      <div className="search-panel-copy">

        <p className="eyebrow">
          SEARCH FILMIX
        </p>

        <h2>
          What do you want to watch?
        </h2>

        <p>
          Search titles, stories and
          movies worth discovering.
        </p>

      </div>


      <div className="search-field">

        <span
          aria-hidden="true"
          className="search-icon"
        />

        <input
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          placeholder="Search movies, titles, stories..."
          aria-label="Search movies"
        />

        <button type="submit">
          Search
        </button>

      </div>

    </form>
  );
}


/* =========================================================
   RESPONSIVE FILTER DROPDOWN
========================================================= */

type FilterOption = {
  value: string;
  label: string;
};

function ResponsiveFilter({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!target?.closest?.(".responsive-filter")) {
        setOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selected =
    options.find((option) => option.value === value) || options[0];

  return (
    <div className={`responsive-filter ${open ? "open" : ""}`}>
      <button
        type="button"
        className="responsive-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label}</span>
        <span className="responsive-filter-arrow" aria-hidden="true">
          <span />
        </span>
      </button>

      {open && (
        <div
          className="responsive-filter-menu"
          role="listbox"
          aria-label={ariaLabel}
        >
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              key={option.value}
              className={`responsive-filter-option ${
                option.value === value ? "active" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.value === value && (
                <span className="responsive-filter-check" aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* =========================================================
   DISCOVER / HOME PAGE
========================================================= */

function DiscoverPage() {

  const [
    params,
    setParams,
  ] = useSearchParams();

  const navigate =
    useNavigate();


  /* -------------------------------------------------------
     URL STATE
  ------------------------------------------------------- */

  const query =
    params.get("q") || "";

  const genre =
    params.get("genre") || "";

  const sort =
    params.get("sort") ||
    "popularity.desc";

  const year =
    params.get("year") ||
    "";

  /* -------------------------------------------------------
     SEARCH STATE
  ------------------------------------------------------- */

  const [input, setInput] =
    useState(query);

  const debounced =
    useDebounce(input);


  /* -------------------------------------------------------
     MOVIE STATE
  ------------------------------------------------------- */

  const [movies, setMovies] =
    useState<Movie[]>([]);


  /*
   * Dynamic hero movie.
   *
   * The hero is separate from the movie
   * grid so it can randomly select one
   * movie from the first few results.
   */

  const [featured, setFeatured] =
    useState<Movie | undefined>(
      undefined
    );


  /* -------------------------------------------------------
     OTHER STATE
  ------------------------------------------------------- */

  const [genres, setGenres] =
    useState<
      {
        id: number;
        name: string;
      }[]
    >([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [
    totalPages,
    setTotalPages,
  ] = useState(1);


  /* -------------------------------------------------------
     COLLECTION
  ------------------------------------------------------- */

  const {
    ids,
    toggle,
  } = useWishlist();


  /* =======================================================
     LOAD GENRES
  ======================================================= */

  useEffect(() => {

    api
      .genres()
      .then(setGenres)
      .catch(() => {});

  }, []);


  /* =======================================================
     KEEP SEARCH INPUT IN SYNC WITH URL
  ======================================================= */

  useEffect(() => {

    setInput(query);

  }, [query]);


  /* =======================================================
     DEBOUNCED SEARCH
  ======================================================= */

  useEffect(() => {

    const clean =
      debounced.trim();

    const current =
      params.get("q") || "";


    if (
      clean === current
    ) {
      return;
    }


    const next =
      new URLSearchParams(
        params
      );


    if (clean) {

      next.set(
        "q",
        clean
      );

    } else {

      next.delete("q");

    }


    setParams(
      next,
      {
        replace: true,
      }
    );


    setPage(1);

  }, [debounced]);


  /* =======================================================
     LOAD MOVIES
  ======================================================= */

  useEffect(() => {

    let cancelled = false;


    setLoading(true);
    setError("");


    /*
     * Search results should not show
     * a random featured movie.
     */

    if (query) {
      setFeatured(
        undefined
      );
    }


    const load =
      async () => {

        try {

          const result =
            query
              ? await api.search(
                  query,
                  page
                )
              : await api.discover(
                  new URLSearchParams({
                    page: String(
                      page
                    ),
                    genre,
                    sort,
                    year,
                  })
                );


          if (cancelled) {
            return;
          }


          /* ---------------------------------------------
             FIRST PAGE
          --------------------------------------------- */

          if (page === 1) {

            /*
             * Replace the current results
             * when loading the first page.
             */

            setMovies(
              result.results
            );


            /*
             * DYNAMIC FILMIX PICK
             *
             * Pick one movie from the
             * first 8 results.
             */

            if (
              !query &&
              result.results.length >
                0
            ) {

              const candidates =
                result.results.slice(
                  0,
                  Math.min(
                    8,
                    result.results.length
                  )
                );


              const randomIndex =
                Math.floor(
                  Math.random() *
                    candidates.length
                );


              setFeatured(
                candidates[
                  randomIndex
                ]
              );

            }

          } else {

            /* -------------------------------------------
               LOAD MORE
            ------------------------------------------- */

            /*
             * Append the newly loaded page
             * to the existing movie list.
             *
             * This is what makes Load More
             * work without replacing page 1.
             */

            setMovies(
              (previous) => [
                ...previous,
                ...result.results,
              ]
            );

          }


          setTotalPages(
            result.totalPages
          );

        } catch (e: any) {

          if (!cancelled) {

            setError(
              e.message ||
                "Unable to load movies."
            );

          }

        } finally {

          if (!cancelled) {
            setLoading(false);
          }

        }

      };


    load();


    return () => {
      cancelled = true;
    };

  }, [
    query,
    genre,
    sort,
    year,
    page,
  ]);


  /* =======================================================
     CHANGE FILTER
  ======================================================= */

  const changeFilter = (
    key: string,
    value: string
  ) => {

    const next =
      new URLSearchParams(
        params
      );


    if (value) {

      next.set(
        key,
        value
      );

    } else {

      next.delete(key);

    }


    /*
     * Changing a discovery filter
     * clears an active search.
     */

    next.delete("q");


    setParams(next);

    setInput("");

    setPage(1);

  };


  /* =======================================================
     SEARCH SUBMIT
  ======================================================= */

  const submitSearch = (
    event: FormEvent
  ) => {

    event.preventDefault();


    const value =
      input.trim();


    if (!value) {
      return;
    }


    navigate(
      `/?q=${encodeURIComponent(
        value
      )}`
    );

  };


  /* -------------------------------------------------------
     YEAR OPTIONS
  ------------------------------------------------------- */

  const currentYear =
    new Date().getFullYear();

  const yearOptions =
    Array.from(
      { length: currentYear - 1950 + 1 },
      (_, index) =>
        String(currentYear - index)
    );


  /* =======================================================
     MOVIES TO DISPLAY
  ======================================================= */

  /*
   * IMPORTANT:
   *
   * We display ALL movies currently stored
   * in the `movies` state.
   *
   * Page 1:
   *   movies = first page
   *
   * Load More:
   *   movies = page 1 + page 2
   *
   * Load More again:
   *   movies = page 1 + page 2 + page 3
   *
   * Previously this used slice(0, 10),
   * which hid all movies after the first 10.
   */

  /* =======================================================
     DISPLAY MOVIES

   * On the homepage, the first 6 movies are already shown in
   * the "Trending now" rail, so we skip those in "Explore movies"
   * to avoid displaying the same movies twice.
   *
   * When the user searches, show all matching results.
   *
   * Load More still works because `movies` contains all loaded pages.
   */

  const displayMovies = query
    ? movies
    : movies.slice(6);


  /* =======================================================
     HERO BACKGROUND
  ======================================================= */

  const heroStyle =
    featured?.backdropUrl
      ? {
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(4,6,10,.98) 0%,
              rgba(4,6,10,.86) 38%,
              rgba(4,6,10,.34) 70%,
              rgba(4,6,10,.78) 100%
            ),
            linear-gradient(
              0deg,
              rgba(4,6,10,.96) 0%,
              transparent 35%
            ),
            url(${featured.backdropUrl})
          `,
        }
      : undefined;


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>

      {/* =================================================
          CINEMATIC HERO
      ================================================= */}

      <section
        className={`hero ${
          featured
            ? "has-feature"
            : ""
        }`}
        style={heroStyle}
      >

        <div className="hero-glow" />


        <div className="container hero-content">

          <div className="hero-copy-block">

            {/* -------------------------------------------
                SEARCH RESULTS HERO
            ------------------------------------------- */}

            {query ? (

              <>

                <p className="eyebrow">
                  SEARCHING FILMIX
                </p>

                <h1>
                  Find your next
                  <br />
                  <em>
                    favorite story.
                  </em>
                </h1>

              </>


            ) : featured ? (

              /* -------------------------------------------
                 DYNAMIC FILMIX PICK
              ------------------------------------------- */

              <>

                <div className="hero-badge">

                  <span />

                  A FILMIX PICK

                </div>


                <p className="eyebrow">
                  FEATURED MOVIE
                </p>


                <h1>
                  {featured.title}
                </h1>


                <div className="hero-meta">

                  <span className="hero-rating">

                    ★{" "}{formatRating(featured)}

                  </span>


                  <span>

                    {
                      featured.releaseDate
                        ?.slice(
                          0,
                          4
                        ) ||
                      "—"
                    }

                  </span>

                </div>


                <p className="hero-copy">

                  {featured.overview ||
                    "A story worth discovering. Explore the latest movies and find what moves you."}

                </p>


                <div className="hero-actions">

                  {/* EXPLORE MOVIE */}

                  <Link
                    to={`/movie/${featured.id}`}
                    className="primary-btn"
                  >

                    Explore movie

                    <span>
                      →
                    </span>

                  </Link>


                  {/* MY COLLECTION */}

                  <button
                    className={`secondary-btn ${
                      ids.has(
                        featured.id
                      )
                        ? "saved"
                        : ""
                    }`}
                    onClick={() =>
                      toggle(
                        featured
                      )
                    }
                  >

                    {ids.has(
                      featured.id
                    )
                      ? "♥ In collection"
                      : "♡ Add to collection"}

                  </button>

                </div>

              </>


            ) : (

              /* -------------------------------------------
                 FALLBACK HERO
              ------------------------------------------- */

              <>

                <p className="eyebrow">
                  MOVIE DISCOVERY
                </p>

                <h1>

                  Find what

                  <br />

                  <em>
                    moves you.
                  </em>

                </h1>

              </>

            )}

          </div>

        </div>


        {/* SCROLL INDICATOR */}

        {!query &&
          featured && (

            <div className="hero-scroll">

              Scroll to explore

              <span>
                ↓
              </span>

            </div>

          )}

      </section>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        className="container main-content"
        id="discover"
      >


        {/* =================================================
            SEARCH BAR
        ================================================= */}

        <SearchBar
          value={input}
          onChange={setInput}
          onSubmit={submitSearch}
        />


        {/* =================================================
            TRENDING NOW
        ================================================= */}

        {!query &&
          !loading &&
          movies.length > 1 && (

            <section className="rail-section">

              <div className="section-heading rail-heading">

                <div>

                  <p className="eyebrow">
                    CURATED FOR YOU
                  </p>

                  <h2>
                    Trending now
                  </h2>

                </div>


                <span className="rail-note">

                  Fresh picks from TMDB

                </span>

              </div>


              <div className="movie-rail">

                {movies
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (movie) => (

                      <MovieCard
                        key={
                          movie.id
                        }

                        movie={
                          movie
                        }

                        wishlisted={
                          ids.has(
                            movie.id
                          )
                        }

                        onWishlist={
                          toggle
                        }

                        compact
                      />

                    )
                  )}

              </div>

            </section>

          )}


        {/* =================================================
            DISCOVER SECTION
        ================================================= */}

        <section className="discover-section">

          <div className="section-heading discover-heading">

            <div>

              <p className="eyebrow">

                {query
                  ? "SEARCH RESULTS"
                  : "DISCOVER"}

              </p>


              <h2>

                {query
                  ? `Results for “${query}”`
                  : "Explore movies"}

              </h2>

            </div>


            <span className="result-count">

              {movies.length
                ? `${movies.length}${
                    page <
                    totalPages
                      ? "+"
                      : ""
                  } movies`
                : ""}

            </span>

          </div>


          {/* =================================================
              FILTER BAR
          ================================================= */}

          <div className="filter-bar">

            <div className="genre-scroll">

              {/* ALL */}

              <button
                className={`filter-chip ${
                  !genre
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  changeFilter(
                    "genre",
                    ""
                  )
                }
              >
                All
              </button>


              {/* GENRES */}

              {genres
                .slice(
                  0,
                  9
                )
                .map(
                  (g) => (

                    <button
                      key={
                        g.id
                      }
                      className={`filter-chip ${
                        genre ===
                        String(
                          g.id
                        )
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        changeFilter(
                          "genre",
                          String(
                            g.id
                          )
                        )
                      }
                    >
                      {g.name}
                    </button>

                  )
                )}

            </div>

            {/* SORT */}
            <ResponsiveFilter
              value={sort}
              onChange={(value) => changeFilter("sort", value)}
              ariaLabel="Sort movies"
              options={[
                { value: "popularity.desc", label: "Most popular" },
                { value: "vote_average.desc", label: "Top rated" },
                { value: "primary_release_date.desc", label: "Newest" },
                { value: "revenue.desc", label: "Highest revenue" },
              ]}
            />

            {/* YEAR */}
            <ResponsiveFilter
              value={year}
              onChange={(value) => changeFilter("year", value)}
              ariaLabel="Select release year"
              options={[
                { value: "", label: "Select a year" },
                ...yearOptions.map((optionYear) => ({
                  value: optionYear,
                  label: optionYear,
                })),
              ]}
            />

          </div>


          {/* =================================================
              LOADING
          ================================================= */}

          {loading &&
          page === 1 ? (

            <LoadingGrid />

          ) : error ? (

            <ErrorState
              message={error}
              onRetry={() =>
                setPage(1)
              }
            />

          ) : movies.length ===
            0 ? (

            <EmptyState
              text="Try a different title, genre or filter."
            />

          ) : (

            <>

              {/* =================================================
                  MOVIE GRID
              ================================================= */}

              <div className="movie-grid">

                {displayMovies.map(
                  (movie) => (

                    <MovieCard
                      key={`${movie.id}-${movie.title}`}
                      movie={
                        movie
                      }
                      wishlisted={
                        ids.has(
                          movie.id
                        )
                      }
                      onWishlist={
                        toggle
                      }
                    />

                  )
                )}

              </div>


              {/* =================================================
                  LOAD MORE
              ================================================= */}

              {page <
                totalPages && (

                <div className="load-more">

                  <button
                    className="outline-btn"
                    disabled={
                      loading
                    }
                    onClick={() =>
                      setPage(
                        (current) =>
                          current + 1
                      )
                    }
                  >

                    {loading
                      ? "Loading..."
                      : "Load more movies"}

                    <span>
                      ↓
                    </span>

                  </button>

                </div>

              )}

            </>

          )}

        </section>

      </main>

    </>
  );
}


/* =========================================================
   MOVIE DETAILS PAGE
========================================================= */

function MovieDetailsPage() {

  const { id } =
    useParams();


  const [movie, setMovie] =
    useState<
      MovieDetails | null
    >(null);


  const [
    recommendations,
    setRecommendations,
  ] = useState<Movie[]>([]);


  const [error, setError] =
    useState("");


  const {
    ids,
    toggle,
  } = useWishlist();


  /* =======================================================
     LOAD MOVIE DETAILS
  ======================================================= */

  useEffect(() => {

    if (!id) {
      return;
    }


    setMovie(null);

    setRecommendations([]);

    setError("");


    const movieId =
      Number(id);


    let cancelled = false;


    /* MOVIE */

    api
      .movie(movieId)

      .then((result) => {

        if (!cancelled) {

          setMovie(
            result
          );

        }

      })

      .catch((e) => {

        if (!cancelled) {

          setError(
            e.message ||
              "Unable to load movie."
          );

        }

      });


    /* RECOMMENDATIONS */

    api
      .recommendations(
        movieId
      )

      .then((result) => {

        if (!cancelled) {

          setRecommendations(
            result
          );

        }

      })

      .catch(() => {

        if (!cancelled) {

          setRecommendations(
            []
          );

        }

      });


    return () => {
      cancelled = true;
    };

  }, [id]);


  /* =======================================================
     SCROLL TO TOP
  ======================================================= */

  useEffect(() => {

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

  }, [id]);


  /* =======================================================
     STATES
  ======================================================= */

  if (error) {

    return (

      <main className="container page-pad">

        <ErrorState
          message={error}
        />

      </main>

    );

  }


  if (!movie) {

    return (

      <main className="container page-pad">

        <LoadingGrid />

      </main>

    );

  }


  /* =======================================================
     DETAIL BACKGROUND
  ======================================================= */

  const detailStyle =
    movie.backdropUrl
      ? {
          backgroundImage: `
            linear-gradient(
              90deg,
              rgba(4,6,10,.99) 8%,
              rgba(4,6,10,.84) 46%,
              rgba(4,6,10,.54) 100%
            ),
            linear-gradient(
              0deg,
              #07090e 0%,
              transparent 45%
            ),
            url(${movie.backdropUrl})
          `,
        }
      : undefined;


  return (

    <main>

      {/* =================================================
          DETAILS HERO
      ================================================= */}

      <section
        className="detail-hero"
        style={
          detailStyle
        }
      >

        <div className="container detail-content">

          <Link
            to="/"
            className="back-link"
          >
            ← Back to discover
          </Link>


          <div className="detail-grid">

            {/* POSTER */}

            <div className="detail-poster-wrap">

              {movie.posterUrl ? (

                <img
                  className="detail-poster"
                  src={
                    movie.posterUrl
                  }
                  alt={
                    movie.title
                  }
                />

              ) : (

                <div className="detail-poster detail-poster-fallback">
                  FILMIX
                </div>

              )}

            </div>


            {/* DETAILS */}

            <div className="detail-copy">

              <p className="eyebrow">
                MOVIE DETAILS
              </p>


              <h1>
                {movie.title}
              </h1>


              {movie.tagline && (

                <p className="tagline">

                  “{movie.tagline}”

                </p>

              )}


              <div className="detail-meta">

                <span className="detail-rating">

                  ★{" "}{formatRating(movie)}

                </span>


                <span>

                  {
                    movie.releaseDate
                      ?.slice(
                        0,
                        4
                      ) ||
                    "—"
                  }

                </span>


                <span>

                  {movie.runtime
                    ? `${movie.runtime} min`
                    : "—"}

                </span>

              </div>


              {/* GENRES */}

              <div className="tags">

                {movie.genres.map(
                  (g) => (

                    <span
                      key={
                        g.id
                      }
                    >
                      {g.name}
                    </span>

                  )
                )}

              </div>


              {/* OVERVIEW */}

              <p className="overview">

                {movie.overview ||
                  "No overview available."}

              </p>


              {/* COLLECTION */}

              <button
                className={`primary-btn detail-save ${
                  ids.has(
                    movie.id
                  )
                    ? "saved"
                    : ""
                }`}
                onClick={() =>
                  toggle(
                    movie
                  )
                }
              >

                {ids.has(
                  movie.id
                )
                  ? "♥ In your collection"
                  : "♡ Add to collection"}

              </button>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          RECOMMENDATIONS
      ================================================= */}

      <section className="container section-pad recommendations-section">

        <div className="section-heading">

          <div>

            <p className="eyebrow">
              KEEP EXPLORING
            </p>

            <h2>
              You might also like
            </h2>

          </div>

        </div>


        {recommendations.length ? (

          <div className="movie-grid recommendation-grid">

            {recommendations
              .slice(
                0,
                8
              )
              .map(
                (m) => (

                  <MovieCard
                    key={
                      m.id
                    }
                    movie={
                      m
                    }
                    wishlisted={
                      ids.has(
                        m.id
                      )
                    }
                    onWishlist={
                      toggle
                    }
                  />

                )
              )}

          </div>

        ) : (

          <EmptyState
            text="No recommendations are available for this movie yet."
          />

        )}

      </section>

    </main>
  );
}


/* =========================================================
   MY COLLECTION PAGE
========================================================= */

function WishlistPage() {

  const {
    items,
    ids,
    toggle,
  } = useWishlist();

  /* -------------------------------------------------------
     LOAD FULL MOVIE DATA FOR COLLECTION

     Wishlist records currently store the movie id, title,
     and poster. The MovieCard also displays rating/year, so
     fetch the cached movie details here instead of showing
     a hard-coded 0.0 rating.
  ------------------------------------------------------- */

  const [collectionDetails, setCollectionDetails] =
    useState<Record<number, MovieDetails>>({});

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      if (!items.length) {
        setCollectionDetails({});
        return;
      }

      const entries = await Promise.all(
        items.map(async (item: any) => {
          const movieId = Number(item.movieId);

          try {
            const details = await api.movie(movieId);
            return [movieId, details] as const;
          } catch {
            return null;
          }
        })
      );

      if (cancelled) {
        return;
      }

      const next: Record<number, MovieDetails> = {};

      entries.forEach((entry) => {
        if (entry) {
          next[entry[0]] = entry[1];
        }
      });

      setCollectionDetails(next);
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [items]);


  return (

    <main className="container page-pad collection-page">

      {/* =================================================
          COLLECTION HEADER
      ================================================= */}

      <div className="collection-hero">

        <div>

          <p className="eyebrow">
            YOUR COLLECTION
          </p>


          <h1>

            Movies you want

            <br />

            <em>
              to remember.
            </em>

          </h1>


          <p>

            Keep your discoveries in
            one place and come back
            whenever you're ready.

          </p>

        </div>


        {/* COUNT */}

        <div className="collection-count">

          <strong>
            {items.length}
          </strong>

          <span>
            saved
          </span>

        </div>

      </div>


      {/* =================================================
          EMPTY COLLECTION
      ================================================= */}

      {items.length === 0 ? (

        <EmptyState
          text="Save movies from Discover or a movie details page and they will appear here."
        />

      ) : (

        <div className="movie-grid">

          {items.map(
            (item) => (

              <MovieCard
                key={
                  item.movieId
                }

                movie={{
                  id:
                    item.movieId,

                  title:
                    collectionDetails[item.movieId]?.title ||
                    item.title,

                  overview:
                    collectionDetails[item.movieId]?.overview ||
                    "",

                  posterUrl:
                    collectionDetails[item.movieId]?.posterUrl ||
                    item.posterUrl,

                  backdropUrl:
                    collectionDetails[item.movieId]?.backdropUrl ||
                    null,

                  rating:
                    collectionDetails[item.movieId]?.rating ??
                    Number(item.rating ?? 0),

                  voteCount:
                    collectionDetails[item.movieId]?.voteCount ??
                    Number(item.voteCount ?? 0),

                  releaseDate:
                    collectionDetails[item.movieId]?.releaseDate ||
                    item.releaseDate ||
                    null,

                  genreIds:
                    collectionDetails[item.movieId]?.genreIds ||
                    item.genreIds ||
                    [],
                }}

                wishlisted={
                  ids.has(
                    item.movieId
                  )
                }

                onWishlist={
                  toggle
                }

              />

            )
          )}

        </div>

      )}

    </main>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {

  return (

    <div className="app">

      <Navbar />


      <Routes>

        {/* HOME */}

        <Route
          path="/"
          element={
            <DiscoverPage />
          }
        />


        {/* MOVIE DETAILS */}

        <Route
          path="/movie/:id"
          element={
            <MovieDetailsPage />
          }
        />


        {/* MY COLLECTION */}

        <Route
          path="/wishlist"
          element={
            <WishlistPage />
          }
        />

      </Routes>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <div className="footer-inner">

          <div>

            <strong>
              FILMIX
            </strong>

            <span>
              Find What Moves You.
            </span>

          </div>


          <p>

            © 2026 FILMIX · Movie
            discovery powered by TMDB

          </p>

        </div>

      </footer>

    </div>
  );
}