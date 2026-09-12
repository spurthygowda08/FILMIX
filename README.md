# FILMIX

### Find What Moves You 🎬

FILMIX is a full-stack movie discovery application built as part of the **Trackzio Full-Stack Intern Assignment**.

The application allows users to discover movies without searching, filter and sort results, search for specific titles, view detailed movie information, explore recommendations, and save movies to a persistent personal collection.

---

## Overview

The goal of FILMIX was to build a movie discovery experience that feels like a real product rather than a simple third-party API demonstration.

The application uses **TMDB as the external movie data source**, while a **Node.js + Express backend** acts as the abstraction layer between the React frontend and TMDB.

The application also uses **MongoDB** to persist a user's movie collection.

### Core User Flow

1. Browse movies immediately from the home page.
2. Explore movies using genres, year, and sorting options.
3. Load more movies as the user continues exploring.
4. Search for a specific movie.
5. Open a movie to view detailed information.
6. Explore similar/recommended movies.
7. Add movies to **My Collection**.
8. Return to the collection later, including after refreshing or reopening the application.

---

# Features

### Movie Discovery

- Browse movies without performing a search.
- Featured movie section on the home page.
- Popular movie section.
- Discover/explore movie grid.
- Load More functionality for larger result sets.

### Search

- Search movies by title.
- Search requests are handled through the backend.
- Debounced search input helps avoid unnecessary API requests.
- Request cancellation helps handle rapid searches.

### Filters & Sorting

- Genre filtering.
- Year filtering.
- Sort by:
  - Popularity
  - Top Rated
  - Newest
- Filters can be combined to refine results.

### Movie Details

- Movie title
- Poster and backdrop
- Overview
- Release information
- Genres
- Rating
- Recommended movies

### My Collection

- Add movies to a personal collection.
- Remove movies from the collection.
- Collection persists using MongoDB.
- Anonymous browser identification allows the application to maintain separate collections without requiring authentication.

### Responsive Design

- Responsive desktop layout.
- Mobile-friendly movie grids.
- Horizontal scrolling for movie/category rails where appropriate.
- Responsive filtering controls.
- Layout adapts to different screen sizes.

### Edge Case Handling

- Loading states.
- Empty search results.
- Missing movie information.
- Movies without ratings.
- Movies that have not yet been released.
- External API failures.
- Slow or unavailable external services.
- Rapid search/filter changes.

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

## Backend

- Node.js
- Express
- TypeScript

## Database

- MongoDB

## External API

- TMDB API

---

# Approach Taken

The application was designed around the idea that the frontend should provide the user experience while the backend manages communication with external services and persistent data.

### Frontend

The React application is responsible for:

- Rendering the user interface.
- Managing filters and sorting.
- Handling search input.
- Displaying movie results.
- Managing navigation.
- Showing movie details.
- Managing the user's collection interface.

### Backend

The Node.js/Express backend is responsible for:

- Providing application-specific API endpoints.
- Communicating with TMDB.
- Transforming TMDB responses into the application's own movie format.
- Handling collection operations.
- Communicating with MongoDB.
- Handling external API errors and unexpected responses.

### Data Flow

TMDB movie data follows this flow:

```text
React Frontend
      ↓
Node.js / Express API
      ↓
TMDB API
```

Collection-related operations follow:

```text
React Frontend
      ↓
Node.js / Express API
      ↓
MongoDB
```

The frontend therefore does not communicate directly with TMDB.

---

# Important Technical Decisions

## 1. Backend as an API Abstraction Layer

The frontend communicates with the Node.js backend instead of calling TMDB directly.

This provides a clear separation between:

- UI logic
- Application logic
- External API communication
- Database operations

It also prevents the frontend from becoming tightly coupled to TMDB's response structure.

---

## 2. Normalizing Movie Data

TMDB responses are transformed by the backend into the application's own movie representation.

This allows the frontend to work with a consistent structure instead of depending directly on the external API response format.

It also makes it easier to handle incomplete information safely.

---

## 3. Search Debouncing

Search input is debounced so that the application does not send a request for every individual keystroke.

For example, instead of requesting:

```text
I
In
Int
Inte
Inter
Interstellar
```

the application waits briefly for the user to stop typing before making the search request.

This reduces unnecessary network requests and improves the overall experience.

---

## 4. Request Cancellation

Rapid changes in search or filters can result in multiple requests being in progress at the same time.

Request cancellation is used to reduce the possibility of an older response overriding a newer user request.

---

## 5. Pagination / Load More

Instead of loading an unnecessarily large number of movies at once, results are loaded progressively.

The **Load More** interaction allows users to continue exploring additional results when required.

This keeps the initial page manageable while allowing the application to support larger result sets.

---

## 6. Wishlist / Collection Persistence

The collection is stored in MongoDB rather than only in frontend state.

An anonymous `clientId` is stored in the browser and sent to the backend using the request header:

```text
x-client-id
```

This allows the backend to associate saved movies with the current browser without requiring user authentication.

A compound uniqueness constraint using:

```text
clientId + movieId
```

prevents the same movie from being added multiple times to the same collection.

---

## 7. Handling Incomplete Movie Data

External movie APIs may not always provide complete information.

FILMIX handles cases such as:

- Missing poster images.
- Missing release dates.
- Missing ratings.
- Movies that have not been released yet.

Movies without usable rating information are displayed as:

```text
N/A
```

Future releases are displayed as:

```text
Not released
```

rather than presenting misleading information.

---

## 8. Newest Movie Filtering

The "Newest" sorting option is designed to show released movies rather than future releases.

When a year is selected, the results are restricted to that year.

For the current year, future release dates are excluded.

This prevents unreleased movies from appearing as if they were already available.

---

## 9. Caching

The backend includes caching for repeated TMDB requests.

Caching helps reduce unnecessary calls to the external service when the same discovery information is requested repeatedly.

---

## 10. Error Handling

The application considers failures at multiple levels:

- External API failures.
- Invalid or incomplete API responses.
- Empty search results.
- Database-related failures.
- Network delays.

The UI provides appropriate feedback instead of assuming that every external request will succeed.

---

# Project Structure

```text
FILMIX/
│
├── client/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── utils/
│       ├── App.tsx
│       ├── main.tsx
│       ├── styles.css
│       └── types.ts
│
├── server/
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── models/
│       ├── types.ts
│       └── server.ts
│
├── .gitignore
├── .env.example
└── README.md
```

---

# API Endpoints

## Movies

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/movies/discover` | Discover movies using filters and sorting |
| GET | `/api/movies/trending` | Retrieve trending movie data |
| GET | `/api/movies/search` | Search movies by title |
| GET | `/api/movies/:movieId` | Retrieve movie details |
| GET | `/api/movies/genres` | Retrieve available movie genres |
| GET | `/api/movies/:movieId/recommendations` | Retrieve movie recommendations |

## Collection

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/wishlist` | Retrieve the current browser's collection |
| POST | `/api/wishlist` | Add a movie to the collection |
| DELETE | `/api/wishlist/:movieId` | Remove a movie from the collection |

---

# Database / Collection Design

The movie collection uses MongoDB.

Each saved movie is associated with an anonymous browser identifier.

Conceptually, the stored data contains:

```text
clientId
movieId
movie information / snapshot
```

The combination of:

```text
clientId + movieId
```

is treated as unique to prevent duplicate entries.

The application does not require user registration or authentication for the collection feature.

---

# Setup Instructions

## Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB
- A TMDB API access token

## 1. Clone the Repository

```bash
git clone https://github.com/spurthygowda08/FILMIX.git
cd FILMIX
```

## 2. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Example:

```env
PORT=5000
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_BASE_URL=your_tmdb_base_url
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
CACHE_TTL_SECONDS=300
```

Refer to `.env.example` for the required environment variable names.

> Do not commit the actual `.env` file or API credentials to GitHub.

## 3. Install Frontend Dependencies

```bash
cd client
npm install
```

## 4. Install Backend Dependencies

Open another terminal:

```bash
cd server
npm install
```

## 5. Start the Backend

From the `server` directory:

```bash
npm run dev
```

The backend runs on the configured port, typically:

```text
http://localhost:5000
```

## 6. Start the Frontend

From the `client` directory:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

Open that URL in your browser to use FILMIX.

---

# Assumptions

The following assumptions were made while implementing the assignment:

- TMDB is used as the external movie information provider.
- Authentication is not required for the assignment.
- The wishlist is designed as an anonymous browser-based collection.
- A browser-generated `clientId` is used to associate saved movies with the current browser.
- Clearing browser/site storage may remove the association with an anonymous collection.
- Movie information depends on the availability and quality of data returned by TMDB.
- The application should remain functional even when some optional movie information is unavailable.

---

# Known Limitations

### No User Authentication

FILMIX does not currently have user accounts or login functionality.

The collection is associated with an anonymous browser identifier.

### Browser-Based Collection

Because the collection is anonymous, clearing browser storage can prevent the user from accessing the previously associated collection.

### External API Dependency

Movie information depends on TMDB.

If TMDB is unavailable or changes its API behaviour, some movie-related functionality may be affected.

### Automated Testing

The current implementation focuses primarily on functional validation and manual testing. A larger automated unit/integration test suite could be added in a future iteration.

### Production Deployment

The project is currently provided as a source repository and local full-stack application rather than a production deployment.

---

# Testing & Quality Checks

The application was manually tested across the major user flows and edge cases.

### Tested Functionality

- Home page movie discovery
- Genre filtering
- Year filtering
- Sorting
- Newest released-only behaviour
- Search
- Movie details
- Recommendations
- Add to Collection
- Remove from Collection
- Collection persistence
- Load More
- Navigation
- Page refresh and routing
- Empty/no-result scenarios
- Missing ratings
- Future release status
- Responsive mobile layout
- Responsive filter controls
- Browser console error checks

The application was also checked on different screen sizes to ensure that the main discovery experience remains usable on mobile and desktop.

---

# AI Usage & Transparency

AI tools were used as a supporting development resource during the project.

I used **ChatGPT** to help with:

- Understanding and breaking down the assignment requirements.
- Understanding third-party API documentation and request handling.
- Troubleshooting implementation issues.
- Reviewing frontend and backend implementation details.
- Assisting with repetitive development tasks.
- Thinking through edge cases and implementation approaches.

The final application structure, technical decisions, behaviour, testing, and validation were reviewed and tested during development.

AI was used as a development aid rather than as a replacement for understanding the implementation.

---

# What I Would Improve With More Time

If the project were developed further, I would consider adding:

### Authentication & User Accounts

Introduce authentication so users can access their movie collections across multiple devices.

### Automated Testing

Add:

- Unit tests
- API integration tests
- Frontend component tests
- End-to-end tests

### Improved Caching

Introduce a more comprehensive caching strategy for frequently requested movie data and reduce unnecessary external API requests.

### Better Performance Optimization

Further optimize:

- Image loading
- Large movie lists
- API request management
- Client-side rendering performance

### Enhanced Accessibility

Improve keyboard navigation, screen-reader support, semantic markup, and accessibility testing across the application.

### Production Deployment

Deploy the frontend, backend, and database using production-ready infrastructure and add monitoring/logging.

### More Discovery Features

Potential future features include:

- More advanced filters
- Watchlist categories
- Personalized recommendations
- Additional movie metadata
- Improved discovery sections

---

# Why This Architecture?

The architecture was chosen to keep the application maintainable and to match the requirements of a real-world full-stack application.

The main principles were:

- Keep the frontend focused on presentation and user interaction.
- Keep external API communication inside the backend.
- Keep persistent collection data in MongoDB.
- Transform external data into an application-specific format.
- Avoid unnecessary API requests.
- Handle incomplete external data defensively.
- Design the UI to remain usable as the number of results increases.
- Consider mobile and desktop experiences from the beginning.

---

# Repository

GitHub:

https://github.com/spurthygowda08/FILMIX

---

# Author

**Spurthy Gowda**

MCA Graduate | Software Engineer / Full-Stack Developer

GitHub:  
https://github.com/spurthygowda08

LinkedIn:  
https://www.linkedin.com/in/spurthygowda0810

Portfolio:  
https://spurthygowda0810.github.io

---

# Acknowledgements

- **Trackzio** — for providing the Full-Stack Intern Assignment.
- **TMDB** — for providing movie data through its API.
- **MongoDB** — for database persistence.
