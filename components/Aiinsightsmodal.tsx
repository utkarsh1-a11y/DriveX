"use client";

import { useState, useEffect, useRef } from "react";
import { summarizeFile, generateTags } from "@/lib/actions/ai.actions";
import { Models } from "node-appwrite";

interface AIInsightsModalProps {
  file: Models.Document;
  mode: "summary" | "tags";
  onClose: () => void;
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

const AIInsightsModal = ({ file, mode, onClose }: AIInsightsModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [error, setError] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    const run = async () => {
      setIsLoading(true);
      try {
        if (mode === "summary") {
          const res = await summarizeFile(file.url, file.type, file.name);
          if (res.success) setSummary(res.result);
          else setError(res.result);
        } else {
          const res = await generateTags(file.url, file.type, file.name);
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
  }, [file, mode]);

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-[390px] rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #1a1a1a 0%, #111111 100%)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.07), 0 32px 64px rgba(0,0,0,0.7)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top accent — white gradient */}
      <div
        className="h-[2px] w-full"
        style={{
          background:
            "linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 60%, transparent 100%)",
        }}
      />

      {/* Header — no close button, no filename subtitle */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* White icon with red dot */}
        <div
          className="relative flex h-9 w-9 items-center justify-center rounded-xl"
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
          {mode === "summary" ? (
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
          ) : (
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
          )}
        </div>

        <span
          className="text-[15px] font-semibold"
          style={{ color: "rgba(255,255,255,0.92)" }}
        >
          {mode === "summary" ? "AI Summary" : "Smart Tags"}
        </span>
      </div>

      {/* Content */}
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
                {mode === "summary" ? "Analyzing document" : "Generating tags"}
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
          <div className="flex flex-col gap-1.5">{formatSummary(summary)}</div>
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
          </div>
        )}
      </div>

      {/* Footer — always shown, DriveX AI visible, big Dismiss button */}
      <div
        className="px-5 py-3.5 flex items-center justify-between"
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
    </div>
  );
};

export default AIInsightsModal;
