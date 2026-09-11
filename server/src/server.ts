import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./config.js";
import movieRoutes from "./routes/movieRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, service: "cinescope-api", status: "ok" });
});

app.use("/api/movies", movieRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(502).json({
    success: false,
    error: {
      code: "UPSTREAM_OR_SERVER_ERROR",
      message: "Unable to complete the request right now.",
    },
  });
});

async function start() {
  if (config.mongoUri) {
    await mongoose.connect(config.mongoUri);
    console.log("MongoDB connected");
  } else {
    console.warn("MONGODB_URI is not configured. Wishlist routes will not work until MongoDB is configured.");
  }

  app.listen(config.port, () => {
    console.log(`CineScope API running on http://localhost:${config.port}`);
  });
}

start().catch((error) => {
  console.error("Server startup failed:", error);
  process.exit(1);
});
