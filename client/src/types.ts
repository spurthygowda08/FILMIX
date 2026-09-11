export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  backdropUrl: string | null;
  rating: number;
  voteCount?: number;
  releaseDate: string | null;
  genreIds: number[];
};

export type MovieDetails = Movie & {
  runtime: number | null;
  genres: { id: number; name: string }[];
  tagline: string | null;
  popularity: number;
};

export type PageResult = {
  page: number;
  totalPages: number;
  results: Movie[];
};
