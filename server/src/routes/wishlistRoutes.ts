import { Router } from "express";
import { Wishlist } from "../models/Wishlist.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const clientId = String(req.header("x-client-id") || "");
    if (!clientId) return res.status(400).json({ success: false, message: "x-client-id is required." });

    const items = await Wishlist.find({ clientId }).sort({ addedAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const clientId = String(req.header("x-client-id") || "");
    const { movieId, title, posterUrl } = req.body;

    if (!clientId || !movieId || !title) {
      return res.status(400).json({ success: false, message: "clientId header, movieId and title are required." });
    }

    const item = await Wishlist.findOneAndUpdate(
      { clientId, movieId },
      { $setOnInsert: { clientId, movieId, title, posterUrl: posterUrl ?? null } },
      { upsert: true, new: true }
    ).lean();

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

router.delete("/:movieId", async (req, res, next) => {
  try {
    const clientId = String(req.header("x-client-id") || "");
    await Wishlist.deleteOne({ clientId, movieId: Number(req.params.movieId) });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
