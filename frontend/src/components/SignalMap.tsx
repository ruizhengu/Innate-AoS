"use client";

import { useEffect, useRef } from "react";
import type { TriageAnalysis, TriageCategory } from "@/types/message";

interface SignalMapProps {
  analyses: TriageAnalysis[];
  decisionCount: number;
}

const lanes: Record<TriageCategory, { color: string; yRatio: number }> = {
  Decide: { color: "#ff7a8c", yRatio: 0.33 },
  Delegate: { color: "#82a8ff", yRatio: 0.55 },
  Ignore: { color: "#8fd8bf", yRatio: 0.74 },
};

export function SignalMap({ analyses, decisionCount }: SignalMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => drawSignalMap(canvas, analyses);
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [analyses]);

  return (
    <section className="signal-panel">
      <canvas ref={canvasRef} aria-label="Message signal map" />
      <div className="signal-overlay">
        <span>{decisionCount}</span>
        <small>decisions</small>
      </div>
    </section>
  );
}

function drawSignalMap(canvas: HTMLCanvasElement, analyses: TriageAnalysis[]) {
  const context = canvas.getContext("2d");
  if (!context) return;

  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  context.scale(ratio, ratio);

  const width = rect.width;
  const height = rect.height;
  context.clearRect(0, 0, width, height);

  Object.values(lanes).forEach((lane) => {
    const y = height * lane.yRatio;
    context.globalAlpha = 0.2;
    context.beginPath();
    context.moveTo(30, y);
    context.lineTo(width - 30, y);
    context.strokeStyle = lane.color;
    context.lineWidth = 1;
    context.stroke();
  });
  context.globalAlpha = 1;

  analyses.forEach((item, index) => {
    const lane = lanes[item.category];
    const x = 42 + (index / Math.max(1, analyses.length - 1)) * (width - 84);
    const y = height * lane.yRatio + Math.sin(index * 1.7) * 18;
    const radius = item.category === "Decide" ? 8 : item.category === "Delegate" ? 6 : 4;

    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = lane.color;
    context.fill();

    if (item.flag) {
      context.beginPath();
      context.arc(x, y, radius + 8, 0, Math.PI * 2);
      context.strokeStyle = "rgba(255, 211, 116, 0.78)";
      context.lineWidth = 2;
      context.stroke();
    }
  });

  context.fillStyle = "rgba(255,255,255,0.68)";
  context.font = "700 12px Inter, sans-serif";
  context.fillText("Decide", 30, height * lanes.Decide.yRatio - 16);
  context.fillText("Delegate", 30, height * lanes.Delegate.yRatio - 16);
  context.fillText("Ignore", 30, height * lanes.Ignore.yRatio - 16);
}
