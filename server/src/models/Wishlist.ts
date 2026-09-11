import mongoose, { Schema } from "mongoose";

const wishlistSchema = new Schema(
  {
    clientId: { type: String, required: true, index: true },
    movieId: { type: Number, required: true },
    title: { type: String, required: true },
    posterUrl: { type: String, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

wishlistSchema.index({ clientId: 1, movieId: 1 }, { unique: true });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
