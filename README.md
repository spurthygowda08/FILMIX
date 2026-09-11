# FILMIX

## Find What Moves You 🎬

FILMIX is a full-stack movie discovery application built with React,
TypeScript, Node.js, Express, TMDB, and MongoDB.

The application allows users to browse movies without searching, search
for specific titles, filter and sort results, view movie details and
recommendations, and save movies to a persistent My Collection.

------------------------------------------------------------------------

## Features

-   Browse movies without searching
-   Search movies by title
-   Filter movies by genre
-   Filter movies by release year
-   Sort by popularity, rating, or newest releases
-   Newest sorting shows released movies only
-   Display `N/A` when rating information is unavailable
-   View detailed movie information
-   Explore movie recommendations
-   Save and remove movies from My Collection
-   Persistent anonymous wishlist using a browser-based `clientId`
-   Load more movies as users continue exploring
-   Responsive desktop and mobile interface
-   Friendly loading, empty-result, and error states
-   Preserve search/filter context while navigating between movies and
    recommendations

------------------------------------------------------------------------

## Tech Stack

### Frontend

-   React
-   TypeScript
-   Vite
-   CSS3
-   React Router

### Backend

-   Node.js
-   Express
-   TypeScript

### External API & Database

-   TMDB API
-   MongoDB
-   Mongoose

------------------------------------------------------------------------

## Application Architecture

FILMIX follows a client-server architecture.

``` text
React Client
React + TypeScript + Vite
        │
        │ REST API
        ▼
Node.js + Express Backend
        │
        ├──────────────► TMDB API
        │
        └──────────────► MongoDB
                         Wishlist
```

The React frontend communicates only with the Node.js/Express backend.

The frontend does not call TMDB directly. The backend acts as an
abstraction layer between the application and the external movie API.

This keeps the external API credentials on the server and allows
external movie data to be mapped into the application's own data
structure.

------------------------------------------------------------------------

# Approach

The application was designed as a real movie discovery product rather
than a simple API demonstration.

The main approach was to separate responsibilities between the frontend,
backend, external movie service, and database.

### Frontend

The React application manages:

-   User interactions
-   Search and filtering
-   Sorting
-   Pagination through Load More
-   Movie browsing
-   Navigation between pages
-   Wishlist interactions
-   Responsive UI states

Search and filter state is reflected in the URL where appropriate. This
allows users to navigate between movie pages and return to the same
browsing context.

### Backend

The Node.js/Express backend provides application-specific REST
endpoints.

It handles:

-   Requests from the React client
-   Communication with TMDB
-   External data mapping
-   Caching
-   Retry and timeout handling
-   Wishlist operations
-   MongoDB persistence

### Database

MongoDB is used for the My Collection feature.

Authentication was intentionally not added because it was not required
for the assignment. Instead, each browser receives an anonymous
`clientId`.

------------------------------------------------------------------------

# Important Technical Decisions

## 1. Backend abstraction for TMDB

The frontend never communicates directly with TMDB.

Instead:

``` text
React → Express → TMDB
```

This provides a single backend layer where external API handling, error
handling, caching, and data transformation can be managed.

------------------------------------------------------------------------

## 2. URL-based browsing state

Search, genre, year, and sorting state are represented through URL
parameters.

For example:

``` text
/?q=batman
```

or:

``` text
/?genre=28&sort=vote_average.desc&year=2024
```

This makes browsing state shareable and allows the application to
preserve context when navigating between movie details and
recommendations.

------------------------------------------------------------------------

## 3. Anonymous wishlist persistence

FILMIX does not require users to create an account.

A unique browser `clientId` is stored in `localStorage` and sent to the
backend using the:

``` text
x-client-id
```

request header.

The wishlist uses both:

``` text
clientId + movieId
```

to identify a saved movie and prevent duplicate entries for the same
browser.

------------------------------------------------------------------------

## 4. Handling incomplete movie data

External API data may not always contain complete information.

The application therefore handles cases such as:

-   Missing poster images
-   Missing movie overviews
-   Missing rating information
-   Movies without rating votes
-   Future/unreleased movies

For movies without usable rating votes, the interface displays:

``` text
N/A
```

rather than presenting an incorrect rating.

------------------------------------------------------------------------

## 5. Newest release handling

When users select the newest sorting option, the backend applies
release-date boundaries.

Future release dates are excluded so that unreleased movies are not
presented as already released movies.

------------------------------------------------------------------------

## 6. Performance and repeated requests

The application considers repeated requests and rapid user interactions.

The backend includes:

-   Response caching
-   In-flight request deduplication
-   Controlled concurrency
-   Request timeout handling
-   Retry handling for transient API failures
-   Handling of rate-limit responses

The frontend also uses client-side caching for movie detail and
recommendation data where appropriate.

------------------------------------------------------------------------

## 7. Navigation context

Movie navigation preserves the user's browsing context.

For example:

``` text
Search Batman
      ↓
Movie A
      ↓
Recommendation
      ↓
Movie B
      ↓
Back
      ↓
Movie A
      ↓
Back
      ↓
Batman search results
```

This prevents users from losing the results they were exploring.

------------------------------------------------------------------------

# API Endpoints

## Movie API

  ----------------------------------------------------------------------------------------
  Method                  Endpoint                                 Description
  ----------------------- ---------------------------------------- -----------------------
  GET                     `/api/movies/discover`                   Discover movies with
                                                                   filters and sorting

  GET                     `/api/movies/search`                     Search movies

  GET                     `/api/movies/:movieId`                   Get movie details

  GET                     `/api/movies/genres`                     Get available movie
                                                                   genres

  GET                     `/api/movies/:movieId/recommendations`   Get movie
                                                                   recommendations
  ----------------------------------------------------------------------------------------

## Wishlist API

  Method   Endpoint                   Description
  -------- -------------------------- ------------------------------------------
  GET      `/api/wishlist`            Get saved movies for the current browser
  POST     `/api/wishlist`            Save a movie
  DELETE   `/api/wishlist/:movieId`   Remove a movie

------------------------------------------------------------------------

# Project Structure

``` text
FILMIX/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── styles.css
│   │   └── types.ts
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── config.ts
│   │   ├── server.ts
│   │   └── types.ts
│   │
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

------------------------------------------------------------------------

# Assumptions

The following assumptions were made while implementing the application:

-   TMDB is used as the external source for movie information.
-   User authentication was not required for the assignment.
-   My Collection is scoped to an anonymous browser using `clientId`.
-   Movie metadata is retrieved from TMDB rather than permanently
    storing the full movie catalogue in MongoDB.
-   MongoDB is primarily used for wishlist persistence.
-   The application is intended as a movie discovery experience and does
    not provide movie streaming.
-   The application relies on the availability and response limits of
    the external TMDB service.

------------------------------------------------------------------------

# Error Handling & Edge Cases

The application handles several real-world scenarios including:

### No search results

A clear empty state is shown when a search does not return any movies.

### Backend unavailable

If the backend cannot be reached, the application displays a
user-friendly error message with a retry option.

### External API issues

The backend includes timeout, retry, caching, and transient failure
handling for TMDB requests.

### Missing movie information

Missing ratings, posters, overviews, and other incomplete fields are
handled with appropriate fallbacks.

### Unreleased movies

Future release dates are handled separately from released movies.

### Rapid search/filter changes

The frontend prevents stale responses from replacing newer search
results when users change searches quickly.

------------------------------------------------------------------------

# Responsive Design

FILMIX is designed for different screen sizes, including desktop and
mobile devices.

The interface includes:

-   Responsive navigation
-   Mobile-friendly filters
-   Horizontal genre scrolling
-   Horizontal movie rails
-   Responsive movie grids
-   Responsive movie details
-   Flexible poster layouts
-   Handling for long movie titles

------------------------------------------------------------------------

# Getting Started

## Prerequisites

Make sure the following are installed:

-   Node.js
-   npm
-   MongoDB
-   TMDB API credentials

------------------------------------------------------------------------

## 1. Clone the repository

``` bash
git clone https://github.com/spurthygowda08/FILMIX.git
cd FILMIX
```

------------------------------------------------------------------------

## 2. Install frontend dependencies

``` bash
cd client
npm install
```

------------------------------------------------------------------------

## 3. Install backend dependencies

Open another terminal:

``` bash
cd server
npm install
```

------------------------------------------------------------------------

## 4. Configure environment variables

Create:

``` text
server/.env
```

using:

``` text
server/.env.example
```

as a reference.

Example:

``` env
PORT=5000
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_BASE_URL=https://api.themoviedb.org/3
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
CACHE_TTL_SECONDS=300
```

Do not commit the real `.env` file or API credentials to GitHub.

------------------------------------------------------------------------

## 5. Start the backend

``` bash
cd server
npm run dev
```

The backend runs on port `5000` by default.

------------------------------------------------------------------------

## 6. Start the frontend

In another terminal:

``` bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal.

------------------------------------------------------------------------

# Known Limitations

-   The application currently uses anonymous browser-based collections
    rather than authenticated user accounts.
-   Wishlist data is tied to the browser's `clientId`.
-   If the browser's local storage is cleared, the anonymous identity is
    lost.
-   Movie data depends on the availability and rate limits of TMDB.
-   Recommendations are provided by the external movie service.
-   Automated frontend and backend test suites are not currently
    included.
-   Production deployment and monitoring are outside the scope of this
    assignment.

------------------------------------------------------------------------

# Quality Checks

The application was manually tested for:

-   Movie browsing
-   Search
-   Genre filtering
-   Year filtering
-   Sorting
-   Newest release behavior
-   Rating and `N/A` handling
-   Load More
-   Movie details
-   Recommendations
-   My Collection
-   Add/remove wishlist functionality
-   Page refresh
-   Direct movie URLs
-   Navigation context preservation
-   No-result states
-   Backend failure handling
-   Retry/recovery behavior
-   Mobile responsiveness
-   Desktop responsiveness
-   Rapid search changes

------------------------------------------------------------------------

# AI-Assisted Development

AI tools were used during development for brainstorming, debugging, code
refinement, and reviewing implementation approaches.

AI assistance was used to help identify potential issues, improve
implementation details, and reason about edge cases and user experience.

All generated suggestions were reviewed, adapted, tested, and integrated
manually. The final implementation and design decisions were verified
against the project requirements.

------------------------------------------------------------------------

# What I Would Improve With Additional Time

With additional development time, I would consider:

-   Adding automated frontend and backend tests
-   Adding user authentication and account-based collections
-   Improving request cancellation for rapidly changing searches
-   Adding more advanced filtering options
-   Improving pagination/infinite scrolling for very large result sets
-   Adding more comprehensive API monitoring and logging
-   Adding production deployment and environment configuration
-   Improving accessibility testing and keyboard navigation
-   Adding performance monitoring for real-world network conditions

------------------------------------------------------------------------

# Author

**Spurthy Gowda**

GitHub: https://github.com/spurthygowda08
