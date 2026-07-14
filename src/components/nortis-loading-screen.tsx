"use client";

import { useEffect, useState } from "react";

const NAV_GREEN = "#22c55e";
const NAV_YELLOW = "#e8c000";

const DEFAULT_STEPS = [
  "Authenticating",
  "Loading accounts",
  "Syncing analytics",
  "Ready",
];

export function NortisLoadingScreen({
  steps = DEFAULT_STEPS,
}: {
  steps?: string[];
}) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const duration = 1500;
    const raf = () => {
      const pct = Math.min((Date.now() - start) / duration, 1);
      setProgress(Math.round((1 - Math.pow(1 - pct, 2.5)) * 100));
      if (pct < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);

    const dotInterval = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(dotInterval);
  }, []);

  const activeStep = Math.min(
    Math.floor(progress / (100 / steps.length)),
    steps.length - 1,
  );

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        fontFamily: "'Geist', system-ui, sans-serif",
        background:
          "radial-gradient(ellipse at 50% 40%, #1a1f2e 0%, #0d0f18 60%, #080b12 100%)",
      }}
    >
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Glow orbs */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{
          background: NAV_GREEN,
          top: "20%",
          left: "30%",
          transform: "translate(-50%,-50%)",
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full opacity-8 blur-3xl pointer-events-none"
        style={{
          background: NAV_YELLOW,
          top: "60%",
          right: "25%",
          transform: "translate(50%,-50%)",
        }}
      />

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-10">
        {/* Logo mark */}
        <div className="flex flex-col items-center gap-3">
          {/* Logo icon */}
          <div className="relative w-20 h-20 mb-2">
            <div
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                background: `linear-gradient(135deg, ${NAV_GREEN}20, ${NAV_YELLOW}20)`,
              }}
            />
            <img
              src="/logo.png"
              alt="Nortis Clipper AI"
              className="relative w-full h-full object-cover rounded-2xl"
            />
          </div>

          <div className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <span style={{ color: NAV_GREEN }}>Nortis</span>
            <span style={{ color: NAV_YELLOW }}>Clipper AI</span>
          </div>
          <p className="text-[11px] font-mono tracking-[0.2em] text-[#7a8090]">
            From raw footage to social hits.
          </p>
        </div>

        {/* Progress section */}
        <div className="w-72 flex flex-col gap-3">
          {/* Bar */}
          <div
            className="relative h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-150"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${NAV_GREEN}, ${NAV_YELLOW})`,
                boxShadow: `0 0 10px ${NAV_YELLOW}60`,
              }}
            />
          </div>

          {/* Step label */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-[#7a8090]">
              {steps[activeStep]}
              {".".repeat(dots)}
            </span>
            <span
              className="text-[11px] font-mono tabular-nums"
              style={{ color: NAV_YELLOW }}
            >
              {progress}%
            </span>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-3">
          {steps.map((s, i) => {
            const done = i < activeStep;
            const current = i === activeStep;
            return (
              <div key={s} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full transition-all duration-300"
                    style={{
                      background: done
                        ? NAV_GREEN
                        : current
                          ? NAV_YELLOW
                          : "rgba(255,255,255,0.12)",
                      boxShadow: current ? `0 0 8px ${NAV_YELLOW}80` : "none",
                      transform: current ? "scale(1.4)" : "scale(1)",
                    }}
                  />
                  <span
                    className="text-[9px] font-mono whitespace-nowrap hidden sm:block"
                    style={{
                      color: done
                        ? NAV_GREEN
                        : current
                          ? NAV_YELLOW
                          : "#3a3f52",
                    }}
                  >
                    {s.toUpperCase()}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="w-8 h-px mb-3 transition-all duration-500"
                    style={{
                      background: done ? NAV_GREEN : "rgba(255,255,255,0.08)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
