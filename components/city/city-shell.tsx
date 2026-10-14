"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Loader } from "@/components/loader";
import { DISTRICTS } from "@/components/landing/copy";
import { DISTRICT_ORDER, WARD_COLOR_HEX } from "@/types/domain";
import type { SceneDistrict, SceneMind } from "@/lib/city/scene-config";
import type { LandingMind } from "@/lib/landing-minds";

// three.js + post-processing hanya dimuat di klien dan tidak ikut bundle awal.
const CityStage = dynamic(() => import("@/components/city/city-stage"), { ssr: false });

const DISTRICT_LIST: SceneDistrict[] = DISTRICT_ORDER.map((id) => ({
  id,
  name: DISTRICTS.byId[id].name,
  color: WARD_COLOR_HEX[id],
}));

/** Latar kota 3D untuk `/` (CP9): loader, kanvas, veil, dan fallback gradien (sigillum: body.no-webgl)
 *  bila WebGL gagal / timeout. Menggantikan <Loader /> + gradien sementara di app/page.tsx. */
export function CityShell({ minds }: { minds: LandingMind[] }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const sceneMinds = useMemo<SceneMind[]>(
    () =>
      minds.map((m) => ({
        id: m.id,
        name: m.name,
        code: m.code,
        district: m.district,
        isLead: m.isLead,
        revenue: m.revenue,
        status: m.status,
      })),
    [minds]
  );

  return (
    <>
      <Loader ready={ready || failed} />
      {/* Latar gradien: terlihat bila 3D belum siap atau gagal. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-20"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 40%, rgba(214,182,118,.14), transparent 70%), radial-gradient(50% 40% at 30% 70%, rgba(168,196,222,.08), transparent 70%)",
        }}
      />
      {!failed && (
        <>
          <CityStage
            minds={sceneMinds}
            districts={DISTRICT_LIST}
            onReady={() => setReady(true)}
            onFail={() => setFailed(true)}
          />
          <div aria-hidden className="veil-landing" />
        </>
      )}
    </>
  );
}
