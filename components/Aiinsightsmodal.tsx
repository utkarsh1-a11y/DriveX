"use client";

import { useState, useEffect, useRef } from "react";
import { summarizeFile, generateTags, askFile } from "@/lib/actions/ai.actions";
import { Models } from "node-appwrite";
import ReactMarkdown from "react-markdown";

interface AIInsightsModalProps {
  file: Models.Document;
  mode: "summary" | "tags" | "chat";
  onClose: () => void;
  documentId?: string;
  bucketFileId?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function formatSummary(text: string) {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  return lines.map((line, i) => {
    const headerMatch = line.match(/^\*{1,2}(.+?)\*{1,2}$/);
    if (headerMatch) {
      return (
        <div key={i} className="flex items-center gap-2 mt-5 mb-2 first:mt-0">
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {headerMatch[1]}
          </span>
          <div
            className="h-px flex-1"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }}
          />
        </div>
      );
    }
    if (/^[•\-\*]/.test(line)) {
      return (
        <div
          key={i}
          className="flex gap-3 items-start py-1.5 px-3 rounded-lg"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <div
            className="mt-[7px] h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: "rgba(239,68,68,0.8)" }}
          />
          <p
            className="text-[13px] leading-relaxed"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {line.replace(/^[•\-\*]\s*/, "")}
          </p>
        </div>
      );
    }
    return (
      <p
        key={i}
        className="text-[13px] leading-[1.75] px-1"
        style={{ color: "rgba(255,255,255,0.65)" }}
      >
        {line}
      </p>
    );
  });
}

const AIInsightsModal = ({
  file,
  mode,
  onClose,
  documentId,
  bucketFileId,
}: AIInsightsModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [usedRealContent, setUsedRealContent] = useState(false);
  const [error, setError] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (mode === "chat") {
      setIsLoading(false);
      setMessages([
        {
          role: "assistant",
          text: `Hi! I've read "${file.name}". Ask me anything about its content.`,
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const run = async () => {
      setIsLoading(true);
      try {
        if (mode === "summary") {
          const res = await summarizeFile(
            file.url,
            file.type,
            file.name,
            bucketFileId,
          );
          if (res.success) {
            setSummary(res.result);
            setUsedRealContent(res.usedRealContent ?? false);
          } else {
            setError(res.result);
          }
        } else {
          const res = await generateTags(
            file.url,
            file.type,
            file.name,
            documentId,
            bucketFileId,
          );
          if (res.success) setTags(res.tags);
          else setError("Failed to generate tags. Please try again.");
        }
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [file, mode, documentId, bucketFileId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const question = inputValue.trim();
    if (!question || isChatLoading) return;

    setInputValue("");
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setIsChatLoading(true);

    try {
      const res = await askFile(question, file.type, file.name, bucketFileId);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.success
            ? res.result
            : "Sorry, I couldn't answer that. Please try again.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Something went wrong. Please try again." },
      ]);
    } finally {
      setIsChatLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  const modeConfig = {
    summary: {
      label: "AI Summary",
      subtitle: usedRealContent
        ? "Analyzed from file content"
        : "Analyzed from filename",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <polyline
            points="14 2 14 8 20 8"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line
            x1="16"
            y1="13"
            x2="8"
            y2="13"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="16"
            y1="17"
            x2="8"
            y2="17"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    tags: {
      label: "Smart Tags",
      subtitle: "Analyzed from file content",
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="7" cy="7" r="1.5" fill="rgba(255,255,255,0.85)" />
        </svg>
      ),
    },
    chat: {
      label: "Ask File",
      subtitle: `Chatting about ${file.name}`,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path
            d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  };

  const config = modeConfig[mode];

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] rounded-2xl overflow-hidden flex flex-col"
      style={{
        width: mode === "chat" ? "420px" : "390px",
        maxHeight: mode === "chat" ? "520px" : "auto",
        background: "linear-gradient(160deg, #1a1a1a 0%, #111111 100%)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.07), 0 32px 64px rgba(0,0,0,0.7)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="h-[2px] w-full shrink-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 60%, transparent 100%)",
        }}
      />

      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="relative flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: "#ef4444" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: "#ef4444" }}
            />
          </span>
          {config.icon}
        </div>

        <div className="flex flex-col min-w-0">
          <span
            className="text-[15px] font-semibold"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            {config.label}
          </span>
          {!isLoading && !error && (
            <span
              className="text-[10px] truncate"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              {config.subtitle}
            </span>
          )}
        </div>
      </div>

      {mode === "chat" ? (
        <>
          <div
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,255,255,0.08) transparent",
              minHeight: 0,
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full shrink-0 mr-2 mt-0.5"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      border: "1px solid rgba(239,68,68,0.3)",
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <div
                  className="max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed"
                  style={
                    msg.role === "user"
                      ? {
                          background: "rgba(255,255,255,0.1)",
                          color: "rgba(255,255,255,0.9)",
                          borderBottomRightRadius: "4px",
                        }
                      : {
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.07)",
                          color: "rgba(255,255,255,0.75)",
                          borderBottomLeftRadius: "4px",
                        }
                  }
                >
                  {msg.role === "assistant" ? (
                    <div className="prose-chat">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex justify-start">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full shrink-0 mr-2 mt-0.5"
                  style={{
                    background: "rgba(239,68,68,0.15)",
                    border: "1px solid rgba(239,68,68,0.3)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                      stroke="#ef4444"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div
                  className="rounded-2xl px-4 py-3 flex gap-1 items-center"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderBottomLeftRadius: "4px",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full animate-bounce"
                      style={{
                        background: "rgba(255,255,255,0.4)",
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div
            className="px-4 py-3 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this file…"
                className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-[rgba(255,255,255,0.25)]"
                style={{ color: "rgba(255,255,255,0.85)" }}
                disabled={isChatLoading}
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isChatLoading}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition-all shrink-0"
                style={{
                  background:
                    inputValue.trim() && !isChatLoading
                      ? "rgba(255,255,255,0.88)"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"
                    stroke={
                      inputValue.trim() && !isChatLoading
                        ? "#111"
                        : "rgba(255,255,255,0.3)"
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div
          className="px-5 py-4 max-h-[360px] overflow-y-auto flex flex-col gap-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.08) transparent",
          }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-5">
              <div className="relative h-12 w-12">
                <svg
                  className="animate-spin w-full h-full"
                  viewBox="0 0 48 48"
                  fill="none"
                >
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3"
                  />
                  <path
                    d="M24 4a20 20 0 0120 20"
                    stroke="rgba(255,255,255,0.7)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{ background: "#ef4444" }}
                  />
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p
                  className="text-[13px] font-medium"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {mode === "summary"
                    ? "Analyzing document"
                    : "Generating tags"}
                </p>
                <p
                  className="text-[11px]"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  This may take a few seconds…
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M12 8v4M12 16h.01"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <p
                className="text-[13px] text-center leading-relaxed"
                style={{ color: "rgba(239,68,68,0.7)" }}
              >
                {error}
              </p>
            </div>
          ) : mode === "summary" ? (
            <div className="flex flex-col gap-1.5">
              {formatSummary(summary)}
            </div>
          ) : (
            <div className="flex flex-col gap-3 py-1">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                Generated Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      color: "rgba(255,255,255,0.65)",
                    }}
                  >
                    <span
                      style={{
                        color: "rgba(239,68,68,0.8)",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      #
                    </span>
                    {tag}
                  </span>
                ))}
              </div>
              {tags.length > 0 && documentId && (
                <p
                  className="text-[10px] mt-1"
                  style={{ color: "rgba(255,255,255,0.2)" }}
                >
                  ✓ Tags saved — they'll appear on the file card and power
                  search
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {mode !== "chat" && (
        <div
          className="px-5 py-3.5 flex items-center justify-between shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <span
            className="text-[12px] font-semibold tracking-wide"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            DriveX AI
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="text-[13px] font-medium px-5 py-1.5 rounded-full transition-all"
            style={{
              color: "#111111",
              background: "rgba(255,255,255,0.88)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {mode === "chat" && (
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-4 flex h-6 w-6 items-center justify-center rounded-full transition-all"
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AIInsightsModal;
