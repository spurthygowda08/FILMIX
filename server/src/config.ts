import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 5000),
  tmdbToken: process.env.TMDB_READ_ACCESS_TOKEN || "",
  tmdbBaseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
  mongoUri: process.env.MONGODB_URI || "",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  cacheTtlMs: Number(process.env.CACHE_TTL_SECONDS || 300) * 1000,
};
