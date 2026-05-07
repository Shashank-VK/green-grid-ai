export function Header() {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[rgba(14,13,12,0.88)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-secondary)]">
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--brand-primary)]">
              GG
            </span>
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              greengrid
            </p>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-tertiary)]">
              Phase 1 Foundation
            </p>
          </div>
        </div>
        <span className="rounded-full border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.1)] px-3 py-1 text-xs font-medium text-[var(--brand-primary)]">
          Bangalore
        </span>
      </div>
    </header>
  );
}
