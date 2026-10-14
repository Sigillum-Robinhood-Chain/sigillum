"use client";

import { useMemo } from "react";
import { fmtPriceUsd, fmtWage } from "./format";

/** Grafik SVG ringan tanpa dependensi (brief §6 mengizinkan library apa pun; ini menghindari
 *  paket tambahan di jalur build). Lebar mengikuti kontainer lewat viewBox + preserveAspectRatio. */

const W = 640;
const H = 180;
const PAD = { l: 8, r: 8, t: 10, b: 20 };

export interface BurnDay {
  /** Hari UTC `YYYY-MM-DD`. */
  day: string;
  burned: number;
  cumulative: number;
}

export function BurnChart({ data }: { data: BurnDay[] }) {
  const { bars, line, maxBurn, maxCum } = useMemo(() => {
    const maxBurn = Math.max(...data.map((d) => d.burned), 1);
    const maxCum = Math.max(...data.map((d) => d.cumulative), 1);
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const step = iw / data.length;
    const bw = Math.max(2, Math.min(28, step * 0.62));
    const bars = data.map((d, i) => {
      const h = (d.burned / maxBurn) * ih;
      return {
        x: PAD.l + i * step + (step - bw) / 2,
        y: PAD.t + ih - h,
        w: bw,
        h,
        d,
      };
    });
    const line = data
      .map((d, i) => {
        const x = PAD.l + i * step + step / 2;
        const y = PAD.t + ih - (d.cumulative / maxCum) * ih;
        return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
    return { bars, line, maxBurn, maxCum };
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[180px] w-full"
      role="img"
      aria-label={`SGUM burned per day, peak ${fmtWage(maxBurn)} SGUM, cumulative ${fmtWage(maxCum)} SGUM`}
    >
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={H - PAD.b}
        y2={H - PAD.b}
        stroke="currentColor"
        className="text-line"
      />
      {bars.map((b) => (
        <rect key={b.d.day} x={b.x} y={b.y} width={b.w} height={b.h} fill="#C98762" opacity={0.85}>
          <title>{`${b.d.day}: ${fmtWage(b.d.burned)} SGUM burned`}</title>
        </rect>
      ))}
      <path d={line} fill="none" stroke="#E6C36A" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      <text x={PAD.l} y={H - 5} className="fill-faint" fontSize={10}>
        {data[0]?.day}
      </text>
      <text x={W - PAD.r} y={H - 5} textAnchor="end" className="fill-faint" fontSize={10}>
        {data[data.length - 1]?.day}
      </text>
    </svg>
  );
}

export interface PricePoint {
  t: string;
  usd: number | null;
  eth: number | null;
}

/** Garis harga USD (jatuh ke ETH kalau USD belum ada). Garis vertikal di momen graduation
 *  bila jatuh di dalam rentang (brief §4E). */
export function PriceChart({
  points,
  graduatedAt,
}: {
  points: PricePoint[];
  graduatedAt?: string | null;
}) {
  const view = useMemo(() => {
    const useUsd = points.some((p) => p.usd != null);
    const pts = points
      .map((p) => ({ t: new Date(p.t).getTime(), v: useUsd ? p.usd : p.eth }))
      .filter((p): p is { t: number; v: number } => p.v != null && Number.isFinite(p.t));
    if (pts.length < 2) return null;
    const t0 = pts[0].t;
    const t1 = pts[pts.length - 1].t;
    const vmin = Math.min(...pts.map((p) => p.v));
    const vmax = Math.max(...pts.map((p) => p.v));
    const span = vmax - vmin || vmax || 1;
    const iw = W - PAD.l - PAD.r;
    const ih = H - PAD.t - PAD.b;
    const x = (t: number) => PAD.l + ((t - t0) / (t1 - t0 || 1)) * iw;
    const y = (v: number) => PAD.t + ih - ((v - vmin) / span) * ih;
    const path = pts.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
    const g = graduatedAt ? new Date(graduatedAt).getTime() : NaN;
    const gx = Number.isFinite(g) && g >= t0 && g <= t1 ? x(g) : null;
    return { path, gx, vmin, vmax, useUsd, t0, t1 };
  }, [points, graduatedAt]);

  if (!view) return null;
  const label = (v: number) => (view.useUsd ? fmtPriceUsd(v) : `${v.toPrecision(4)} ETH`);
  const d = (ms: number) => new Date(ms).toISOString().slice(5, 16).replace("T", " ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="h-[180px] w-full"
      role="img"
      aria-label={`Price from ${label(view.vmin)} to ${label(view.vmax)}`}
    >
      <path d={view.path} fill="none" stroke="#D6B676" strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
      {view.gx != null && (
        <g>
          <line x1={view.gx} x2={view.gx} y1={PAD.t} y2={H - PAD.b} stroke="#A47CFF" strokeDasharray="3 3" />
          <text x={view.gx + 4} y={PAD.t + 10} fontSize={10} fill="#A47CFF">
            graduated
          </text>
        </g>
      )}
      <text x={PAD.l} y={PAD.t + 9} fontSize={10} className="fill-faint">
        {label(view.vmax)}
      </text>
      <text x={PAD.l} y={H - PAD.b - 4} fontSize={10} className="fill-faint">
        {label(view.vmin)}
      </text>
      <text x={PAD.l} y={H - 5} fontSize={10} className="fill-faint">
        {d(view.t0)} UTC
      </text>
      <text x={W - PAD.r} y={H - 5} textAnchor="end" fontSize={10} className="fill-faint">
        {d(view.t1)} UTC
      </text>
    </svg>
  );
}
