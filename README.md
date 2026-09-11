# CineScope

A full-stack movie discovery application built for the Trackzio Full Stack Development assignment.

## Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: MongoDB
- External API: TMDB
- Styling: CSS

## Architecture

React -> Express API -> TMDB
                    -> MongoDB (wishlist)
                    -> in-memory cache

The TMDB credential stays on the backend.

## Features in this starter
- Movie discovery
- Search
- Genre filtering
- Sort options
- Pagination / Load More
- Movie details
- Recommendations
- Anonymous-client wishlist persistence
- Backend caching
- Debounced search
- Loading, empty and error states
- Responsive layout

## Setup

### 1. Backend

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Linux/macOS:
```bash
cp .env.example .env
```

Fill in:
- `TMDB_READ_ACCESS_TOKEN`
- `MONGODB_URI`

### 2. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000`.

## Environment

Never commit `.env`.

## Assignment notes

The frontend communicates only with the Express backend. The backend maps TMDB responses into an application-level movie model so the UI is not coupled directly to TMDB response shapes.

Wishlist data is owned by the application and stored in MongoDB using an anonymous browser `clientId`. No login system is required for this assignment.
