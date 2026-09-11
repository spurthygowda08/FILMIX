import { Router } from "express";
import {
  discoverMovies,
  getGenres,
  getMovie,
  getRecommendations,
  searchMovies,
} from "../services/tmdbService.js";

const router = Router();

router.get("/discover", async (req, res, next) => {
  try {
    const result = await discoverMovies({
      page: Number(req.query.page || 1),
      genre: String(req.query.genre || ""),
      sort: String(req.query.sort || "popularity.desc"),
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.status(400).json({ success: false, message: "Search query is required." });

    const result = await searchMovies(query, Number(req.query.page || 1));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get("/genres", async (_req, res, next) => {
  try {
    res.json({ success: true, data: await getGenres() });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/recommendations", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getRecommendations(Number(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    res.json({ success: true, data: await getMovie(Number(req.params.id)) });
  } catch (error) {
    next(error);
  }
});

export default router;
