"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useGridStore } from "@/store/gridStore";

type ZoneChatProps = {
  variant: "full" | "compact";
};

const STARTER_QUESTIONS = [
  "Why did this zone score this way?",
  "What's the expected ROI timeline?",
  "Compare this with Electronic City",
  "What's the fastest BESCOM approval path?",
];

function buildContextLabel(locationName?: string, rtoCode?: string, score?: number): string {
  if (!locationName || !rtoCode || typeof score !== "number") {
    return "Run an analysis first to enable zone-specific insights";
  }
  return `Context loaded: ${locationName} (${rtoCode}) · Score ${score.toFixed(1)}`;
}

function formatTimestamp(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ZoneChat({ variant }: ZoneChatProps) {
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const analysisResult = useGridStore((state) => state.analysisResult);
  const chatMessages = useGridStore((state) => state.chatMessages);
  const appendChatMessage = useGridStore((state) => state.appendChatMessage);
  const clearChat = useGridStore((state) => state.clearChat);

  const sessionId = analysisResult?.session_id;
  const locationName = analysisResult?.location?.name;
  const rtoCode = analysisResult?.rto_zone?.code;
  const contextualScore = analysisResult?.top_clusters?.[0]?.avg_score;
  const contextLabel = buildContextLabel(locationName, rtoCode, contextualScore);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isTyping]);

  function resizeTextarea() {
    if (!textareaRef.current) {
      return;
    }
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`;
  }

  async function sendMessage(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || !sessionId) {
      return;
    }

    const nextHistory = [...chatMessages, { role: "user" as const, content: text }];
    appendChatMessage({ role: "user", content: text });
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "38px";
    }
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          history: nextHistory.map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const data = (await response.json()) as {
        reply?: string;
        detail?: { message?: string } | string;
      };
      if (!response.ok) {
        const detailMessage =
          typeof data.detail === "string"
            ? data.detail
            : data.detail?.message ?? "Chat provider is unavailable right now.";
        throw new Error(detailMessage);
      }
      appendChatMessage({
        role: "assistant",
        content: data.reply ?? "I could not form a response for this query.",
      });
    } catch (error) {
      appendChatMessage({
        role: "assistant",
        content:
          error instanceof Error
            ? `I could not reach the assistant right now. ${error.message}`
            : "I could not reach the assistant right now. Please try again.",
      });
    } finally {
      setIsTyping(false);
    }
  }

  const containerClassName =
    variant === "full"
      ? "flex h-full flex-col bg-[var(--bg-page)]"
      : "flex h-full min-h-[250px] flex-col bg-white";

  const contextBarClassName =
    variant === "full"
      ? "flex h-12 items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-card-inner)] px-6"
      : "flex h-9 items-center justify-between border-b border-[var(--brand-border)] bg-[var(--brand-subtle)] px-4";

  const feedClassName =
    variant === "full"
      ? "flex-1 overflow-y-auto px-6 py-5"
      : "flex-1 overflow-y-auto px-4 py-3";

  return (
    <section className={containerClassName}>
      <div className={contextBarClassName}>
        <div className="flex items-center gap-2">
          <span className="text-[var(--brand-primary)]">⚡</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--brand-primary)]">
            {contextLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="rounded-full border border-[var(--border-subtle)] px-3 py-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--text-tertiary)] transition duration-150 hover:border-[var(--brand-border)] hover:text-[var(--brand-primary)]"
        >
          Clear
        </button>
      </div>

      <div className={feedClassName}>
        {chatMessages.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-subtle)] text-lg text-[var(--brand-primary)]">
              ⚡
            </div>
            <p className="font-display text-[18px] font-semibold text-[var(--text-primary)]">Ask about this zone</p>
            <p className="mt-2 max-w-[60ch] font-body text-[12px] text-[var(--text-secondary)]">
              Get instant AI insight on scores, costs, cluster strengths, and deployment strategy.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {STARTER_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void sendMessage(question)}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card-inner)] px-4 py-2 font-body text-[12px] text-[var(--text-secondary)] transition duration-150 hover:border-[var(--brand-border)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {chatMessages.map((message, index) => {
              const key = `${message.role}-${index}-${message.created_at}`;
              return message.role === "user" ? (
                <div key={key} className="ml-auto max-w-[78%]">
                  <div className="rounded-[16px_16px_4px_16px] bg-[var(--brand-primary)] px-3 py-2 font-body text-[13px] leading-6 text-white">
                    {message.content}
                  </div>
                  <p className="mt-1 text-right font-mono text-[9px] text-[var(--text-tertiary)]">
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
              ) : (
                <div key={key} className="max-w-[82%]">
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                    greengrid
                  </p>
                  <div className="rounded-[4px_16px_16px_16px] border border-[var(--border-subtle)] border-l-[3px] border-l-[var(--brand-primary)] bg-[var(--bg-card-inner)] px-3 py-2 font-body text-[13px] leading-6 text-[var(--text-primary)]">
                    {message.content}
                  </div>
                  <p className="mt-1 font-mono text-[9px] text-[var(--text-tertiary)]">
                    {formatTimestamp(message.created_at)}
                  </p>
                </div>
              );
            })}

            {isTyping ? (
              <div className="max-w-[82%]">
                <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                  greengrid
                </p>
                <div className="flex w-fit items-center gap-1 rounded-[4px_16px_16px_16px] border border-[var(--border-subtle)] border-l-[3px] border-l-[var(--brand-primary)] bg-[var(--bg-card-inner)] px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--brand-primary)]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--brand-primary)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--brand-primary)] [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border-subtle)] bg-white px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            disabled={!sessionId || isTyping}
            placeholder="Ask about this zone..."
            onChange={(event) => {
              setInput(event.target.value);
              resizeTextarea();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            className="min-h-[38px] max-h-[120px] w-full resize-none rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card-inner)] px-3 py-2 font-body text-[13px] text-[var(--text-primary)] outline-none transition duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-coral)] disabled:opacity-60"
          />
          <button
            type="button"
            aria-label="Send chat message"
            disabled={!sessionId || !input.trim() || isTyping}
            onClick={() => void sendMessage()}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white transition duration-150 hover:bg-[var(--brand-hover)] disabled:bg-[var(--bg-card-inner)] disabled:text-[var(--text-tertiary)]"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
