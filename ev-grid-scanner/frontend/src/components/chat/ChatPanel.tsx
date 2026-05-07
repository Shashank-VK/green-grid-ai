"use client";

import { MessageCircle, Send, Trash2, X } from "lucide-react";
import { useState } from "react";

import { ChatMessage, type UiChatMessage } from "@/components/chat/ChatMessage";
import { StarterQuestions } from "@/components/chat/StarterQuestions";
import { useGridStore } from "@/store/gridStore";

export function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const sessionId = useGridStore((state) => state.analysisResult?.session_id);

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || !sessionId) {
      return;
    }

    const nextMessages: UiChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: trimmed,
          history: messages.map((message) => ({ role: message.role, content: message.content })),
        }),
      });
      const data = (await response.json()) as { reply?: string };
      if (!response.ok) {
        throw new Error("Chat failed");
      }
      setMessages([...nextMessages, { role: "assistant", content: data.reply ?? "I could not form a response." }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "I could not reach the assistant. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open AI assistant"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[var(--bg-primary)] shadow-2xl transition hover:bg-[var(--brand-hover)] md:right-[340px]"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
      {open ? (
        <aside className="fixed bottom-0 right-0 z-50 flex h-[60vh] w-full flex-col border-t border-[var(--border-subtle)] bg-[var(--bg-secondary)] shadow-2xl md:bottom-0 md:top-0 md:h-screen md:w-[400px] md:border-l md:border-t-0">
          <header className="flex items-center justify-between border-b border-[var(--border-subtle)] p-4">
            <div>
              <h2 className="font-display text-lg font-semibold">AI Assistant</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Powered by OpenRouter</p>
            </div>
            <div className="flex gap-1">
              <button type="button" aria-label="Clear chat" onClick={() => setMessages([])} className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                <Trash2 className="h-4 w-4" />
              </button>
              <button type="button" aria-label="Close chat" onClick={() => setOpen(false)} className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? <StarterQuestions onSelect={(question) => void sendMessage(question)} /> : null}
            {messages.map((message, index) => (
              <ChatMessage key={`${message.role}-${index}`} message={message} />
            ))}
            {isTyping ? (
              <div className="flex gap-1 rounded-2xl rounded-bl-md bg-[var(--bg-tertiary)] px-3 py-3 w-fit">
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:120ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--text-tertiary)] [animation-delay:240ms]" />
              </div>
            ) : null}
          </div>

          <form
            className="flex gap-2 border-t border-[var(--border-subtle)] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage();
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={sessionId ? "Ask about this analysis..." : "Run an analysis first..."}
              disabled={!sessionId}
              className="min-w-0 flex-1 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm outline-none focus:border-[var(--brand-primary)] disabled:opacity-50"
            />
            <button type="submit" disabled={!sessionId || isTyping} className="rounded-md bg-[var(--brand-primary)] px-3 text-[var(--bg-primary)] disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </aside>
      ) : null}
    </>
  );
}
