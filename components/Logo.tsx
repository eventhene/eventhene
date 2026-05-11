export function Logo({ className = "", showTagline = false }: { className?: string; showTagline?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-display text-2xl font-bold tracking-tight text-primary">
        Event<span className="text-ink">Hene</span>
        <span className="text-accent ml-0.5" aria-hidden>♛</span>
      </span>
      {showTagline && (
        <span className="hidden sm:inline text-xs text-ink-muted ml-2 border-l border-border pl-2">
          Run a kingly event
        </span>
      )}
    </div>
  );
}
