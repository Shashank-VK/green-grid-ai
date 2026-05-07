"use client";

import { Copy } from "lucide-react";

export type UiChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function ChatMessage({ message }: { message: UiChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-6 ${
          isUser
            ? "rounded-br-md bg-[var(--brand-primary)] text-[var(--bg-primary)]"
            : "rounded-bl-md bg-[var(--bg-tertiary)] text-[var(--text-primary)]"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {!isUser ? (
          <button
            type="button"
            aria-label="Copy AI response"
            onClick={() => void navigator.clipboard.writeText(message.content)}
            className="mt-1 hidden items-center gap-1 text-[10px] text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] group-hover:flex"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        ) : null}
      </div>
    </div>
  );
}
