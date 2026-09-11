FILMIX

Find What Moves You 🎬

FILMIX is a full-stack movie discovery application built with React, TypeScript, Node.js, Express, TMDB, and MongoDB.

✨ Features

🎬 Browse popular movies

🔎 Search movies with debounced search

🎭 Filter by genre

📅 Filter by release year

⭐ Sort by popularity, rating, or newest releases

🚫 Newest sort shows released movies only

⭐ Shows N/A when a movie has no available rating votes

📖 View movie details

🎯 Explore recommendations

❤️ Save and remove movies from My Collection

💾 Anonymous browser-based wishlist using a clientId

📱 Responsive desktop and mobile UI

➕ Load more movies

🛠️ Tech Stack

Frontend

React · TypeScript · Vite · Tailwind CSS

Backend

Node.js · Express · TypeScript

APIs & Database

TMDB API · MongoDB

🏗️ Architecture

React Client (React + TypeScript + Vite)
                 │
                 │ REST API
                 ▼
Express Server (Node.js + TypeScript)
            ┌────┴────┐
            ▼         ▼
          TMDB     MongoDB
           API     Wishlist

The React frontend communicates with the Express backend. The frontend does not call TMDB directly.

📂 Project Structure

FILMIX/
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
├── server/
│   └── src/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── config.ts
│       ├── server.ts
│       └── types.ts
├── .gitignore
└── README.md

🔌 API Routes

Movies

Method

Endpoint

Purpose

GET

/api/movies/discover

Discover movies with filters and sorting

GET

/api/movies/trending

Get trending movies

GET

/api/movies/search

Search movies

GET

/api/movies/:movieId

Get movie details

GET

/api/movies/genres

Get movie genres

GET

/api/movies/:movieId/recommendations

Get recommendations

Wishlist

Method

Endpoint

Purpose

GET

/api/wishlist

Get saved movies

POST

/api/wishlist

Save a movie

DELETE

/api/wishlist/:movieId

Remove a movie

🔐 Environment Variables

Create server/.env using server/.env.example as a reference.

PORT=5000
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_BASE_URL=https://api.themoviedb.org/3
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
CACHE_TTL_SECONDS=300

Never commit your real .env file or API credentials to GitHub.

🚀 Getting Started

1. Clone

git clone https://github.com/spurthygowda08/FILMIX.git
cd FILMIX

2. Install frontend dependencies

cd client
npm install

3. Install backend dependencies

In another terminal:

cd server
npm install

4. Configure environment

Create server/.env and add your TMDB and MongoDB configuration.

5. Start backend

From server:

npm run dev

6. Start frontend

From client:

npm run dev

💡 Wishlist Design

FILMIX supports an anonymous browser-based collection without requiring user authentication.

A unique clientId is stored in localStorage and sent to the backend through the x-client-id header.

The wishlist uses clientId + movieId to prevent duplicate saved movies for the same browser.

📱 Responsive Experience

The UI is designed for desktop and mobile, including responsive navigation, horizontal genre/movie rails, movie grids, mobile-friendly filters, and responsive movie details.

🧪 Quality Checks

The application has been tested for:

Desktop UI

Mobile responsiveness

Genre and year filtering

Sorting and newest-release behavior

Rating and N/A handling

Search

Movie details

My Collection

Load More

Refresh/routing

Browser console errors

Production build

The frontend production build completes successfully with Vite.

📌 Future Improvements

User authentication and accounts

Personalized recommendations

Pagination/infinite scrolling

Watchlist categories

Advanced filters

Automated testing

Production deployment

👤 Author

Spurthy Gowda

GitHub: https://github.com/spurthygowda08
