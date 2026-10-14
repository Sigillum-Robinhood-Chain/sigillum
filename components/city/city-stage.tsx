"use client";

import { useEffect, useRef } from "react";
import { cityBus } from "@/lib/city/bus";
import { createSigillumScene, type SceneHandle } from "@/lib/city/sigillum-scene";
import type { SceneDistrict, SceneMind } from "@/lib/city/scene-config";

const READY_TIMEOUT_MS = 8500; // sama dengan loader sigillum: 8 detik, lalu jatuh ke latar gradien

/** Kanvas kota 3D fixed penuh layar di belakang halaman (CP9). Hanya dimuat di klien
 *  (lihat city-shell.tsx: next/dynamic, ssr:false). Kanvas dibuat imperatif per mount agar
 *  aman terhadap React StrictMode (konteks WebGL yang sudah dilepas tak bisa dipakai ulang).
 *  Interaksi dengan kartu district/drawer lewat `cityBus`. */
export default function CityStage({
  minds,
  districts,
  onReady,
  onFail,
}: {
  minds: SceneMind[];
  districts: SceneDistrict[];
  onReady: () => void;
  onFail: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const cbRef = useRef({ onReady, onFail });
  useEffect(() => {
    cbRef.current = { onReady, onFail };
  });

  useEffect(() => {
    const host = hostRef.current, labelsEl = labelsRef.current, tipEl = tipRef.current;
    if (!host || !labelsEl || !tipEl) return;

    const canvas = document.createElement("canvas");
    canvas.className = "city-canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const html = document.documentElement;
    let handle: SceneHandle | null = null;
    let ready = false;
    let dead = false;

    const fail = () => {
      if (dead) return;
      dead = true;
      html.classList.remove("city-live");
      cityBus.register(null);
      handle?.dispose();
      handle = null;
      canvas.remove();
      cbRef.current.onFail();
    };

    try {
      handle = createSigillumScene({
        canvas,
        labelsEl,
        tipEl,
        districts,
        minds,
        onPickMind: (id) => cityBus.emitPickMind(id),
        onDistrict: (id) => cityBus.emitDistrict(id),
        onReady: () => {
          if (dead) return;
          ready = true;
          cbRef.current.onReady();
        },
        onFail: fail,
      });
    } catch (err) {
      console.error("[city] scene init failed", err);
      handle = null;
    }
    if (!handle) {
      if (!dead) fail();
      return;
    }

    html.classList.add("city-live");
    cityBus.register(handle);
    const timer = window.setTimeout(() => {
      if (!ready) fail();
    }, READY_TIMEOUT_MS);

    return () => {
      dead = true;
      clearTimeout(timer);
      html.classList.remove("city-live");
      cityBus.register(null);
      handle?.dispose();
      canvas.remove();
    };
  }, [minds, districts]);

  return (
    <>
      <div ref={hostRef} className="city-host" />
      <div ref={labelsRef} className="city-labels" />
      <div ref={tipRef} className="city-tip" role="presentation" />
    </>
  );
}
