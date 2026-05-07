"use client";

const QUESTIONS = [
  "Why is this cluster scoring high?",
  "What charger should I install?",
  "How much will BESCOM approval cost?",
  "Is this location flood-prone?",
  "What's the ROI timeline?",
];

export function StarterQuestions({ onSelect }: { onSelect: (question: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          className="rounded-full border border-[var(--border-subtle)] px-3 py-2 text-left text-xs text-[var(--text-secondary)] transition hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
