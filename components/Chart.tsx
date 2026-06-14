"use client";

import { calculatePercentage, convertFileSize } from "@/lib/utils";

const TOTAL = 2 * 1024 * 1024 * 1024;

export const Chart = ({ used = 0 }: { used: number }) => {
  const pct = used
    ? parseFloat(calculatePercentage(used).toString().replace(/^0+/, "") || "0")
    : 0;

  const freeBytes = Math.max(0, TOTAL - used);

  const R = 74;
  const circumference = 2 * Math.PI * R;
  const usedDash = (pct / 100) * circumference;
  const freeDash = circumference - usedDash;

  return (
    <div
      style={{
        background: "#0b0b0b",
        borderRadius: 22,
        padding: "32px 40px",
        display: "flex",
        alignItems: "center",
        gap: 44,
        width: "100%",
        height: 260,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {/* ── Ring ── */}
      <div
        style={{
          position: "relative",
          width: 180,
          height: 180,
          flexShrink: 0,
          zIndex: 1,
        }}
      >
        <svg
          width={180}
          height={180}
          viewBox="0 0 180 180"
          style={{ display: "block" }}
        >
          <defs>
            <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#444" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Outer decorative ring */}
          <circle
            cx={90}
            cy={90}
            r={82}
            fill="none"
            stroke="#1e1e1e"
            strokeWidth={1}
          />

          {/* Main track */}
          <circle
            cx={90}
            cy={90}
            r={R}
            fill="none"
            stroke="#222"
            strokeWidth={8}
            transform="rotate(-90 90 90)"
          />

          {/* Used arc */}
          <circle
            cx={90}
            cy={90}
            r={R}
            fill="none"
            stroke="url(#arcGrad)"
            strokeWidth={8}
            strokeDasharray={`${usedDash} ${freeDash}`}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
          />

          {/* Glow dot at top */}
          <circle cx={90} cy={16} r={3.5} fill="#fff" opacity={0.6} />
        </svg>

        {/* Centre text */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
          }}
        >
          <span
            style={{
              fontSize: 26,
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            {pct.toFixed(2)}%
          </span>
          <span
            style={{
              fontSize: 10,
              color: "#555",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Space used
          </span>
        </div>
      </div>

      {/* ── Right ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Title */}
        <span
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.3px",
          }}
        >
          Available Storage
        </span>

        {/* Used / Total */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: "#fff",
              letterSpacing: "-1px",
              lineHeight: 1,
            }}
          >
            {used ? convertFileSize(used) : "0 B"}
          </span>
          <span style={{ fontSize: 16, color: "#888", fontWeight: 500 }}>
            /
          </span>
          <span style={{ fontSize: 16, color: "#888", fontWeight: 500 }}>
            2GB
          </span>
        </div>

        {/* Bar */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div
            style={{
              background: "#1a1a1a",
              borderRadius: 99,
              height: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: 3,
                background: "linear-gradient(90deg, #2e2e2e 0%, #fff 100%)",
                borderRadius: 99,
                width: `${Math.max(pct, pct > 0 ? 0.3 : 0)}%`,
                minWidth: pct > 0 ? 4 : 0,
              }}
            />
          </div>

          {/* Bar labels */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "inline-block",
                  opacity: 0.7,
                }}
              />
              <span style={{ fontSize: 11, color: "#aaa", fontWeight: 500 }}>
                {used ? convertFileSize(used) : "0 B"}{" "}
                <span style={{ color: "#555" }}>used</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11, color: "#666", fontWeight: 500 }}>
                {convertFileSize(freeBytes)}{" "}
                <span style={{ color: "#444" }}>free</span>
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#333",
                  display: "inline-block",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
