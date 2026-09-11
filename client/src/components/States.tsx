export function LoadingGrid() {
  return <div className="movie-grid">{Array.from({ length: 8 }).map((_, i) => <div className="skeleton" key={i} />)}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="state">
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && <button className="primary-btn" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <div className="state"><h3>No results</h3><p>{text}</p></div>;
}
