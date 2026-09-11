FILMIX

Find What Moves You 🎬

FILMIX is a full-stack movie discovery application built with React, TypeScript, Node.js, Express, TMDB, and MongoDB.

Users can discover movies, search for titles, filter and sort results, view movie details and recommendations, and save movies to My Collection.

Features

Browse popular movies

Search movies

Filter by genre

Filter by release year

Sort by popularity, rating, or newest releases

Newest sort shows released movies only

Display N/A when rating votes are unavailable

View movie details and recommendations

Save and remove movies from My Collection

Anonymous browser-based collection using clientId

Responsive desktop and mobile UI

Load more movies

Tech Stack

Frontend

React

TypeScript

Vite

Tailwind CSS

Backend

Node.js

Express

TypeScript

API & Database

TMDB API

MongoDB

Application Architecture

FILMIX follows a client-server architecture.

React Client
React + TypeScript + Vite

↓ REST API

Express Server
Node.js + Express + TypeScript

↓

TMDB API — movie data

MongoDB — wishlist storage

The frontend communicates with the Express backend through REST API endpoints. The frontend does not call TMDB directly.

Project Structure

FILMIX/
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
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md

API Endpoints

Movie API

Method

Endpoint

Description

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

Wishlist API

Method

Endpoint

Description

GET

/api/wishlist

Get saved movies

POST

/api/wishlist

Save a movie

DELETE

/api/wishlist/:movieId

Remove a movie

Environment Variables

Create server/.env using server/.env.example as a reference.

PORT=5000
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_access_token
TMDB_BASE_URL=https://api.themoviedb.org/3
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
CACHE_TTL_SECONDS=300

Never commit your real .env file or API credentials to GitHub.

Getting Started

1. Clone the repository

git clone https://github.com/spurthygowda08/FILMIX.git
cd FILMIX

2. Install frontend dependencies

cd client
npm install

3. Install backend dependencies

In another terminal:

cd server
npm install

4. Configure environment variables

Create server/.env and add your TMDB and MongoDB configuration.

5. Start the backend

cd server
npm run dev

6. Start the frontend

cd client
npm run dev

Open the local Vite URL shown in the terminal.

Wishlist Design

FILMIX uses an anonymous browser-based collection without requiring user authentication.

A unique clientId is stored in localStorage and sent to the backend through the x-client-id request header.

The wishlist uses clientId and movieId to prevent duplicate saved movies for the same browser.

Responsive Design

FILMIX is designed for desktop and mobile screens, including:

Responsive navigation

Horizontal genre scrolling

Horizontal movie rails

Responsive movie grids

Mobile-friendly filters

Responsive movie details

Quality Checks

The application has been tested for:

Desktop UI

Mobile responsiveness

Genre filtering

Year filtering

Sorting

Newest released-only behavior

Rating and N/A handling

Search

Movie details

My Collection

Load More

Page refresh and routing

Browser console errors

Production build

The frontend production build completes successfully with Vite.

Future Improvements

User authentication and accounts

Personalized recommendations

Pagination or infinite scrolling

Watchlist categories

Advanced movie filters

Automated testing

Production deployment

Author

Spurthy Gowda

GitHub: https://github.com/spurthygowda08
