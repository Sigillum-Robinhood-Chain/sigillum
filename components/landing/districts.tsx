"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { H2, Lede, Section } from "@/components/landing/section";
import { MindDrawer } from "@/components/landing/mind-drawer";
import { DISTRICTS } from "@/components/landing/copy";
import { cn } from "@/lib/cn";
import { cityBus } from "@/lib/city/bus";
import type { LandingMind } from "@/lib/landing-minds";
import { DISTRICT_ORDER, WARD_COLOR_HEX, type DistrictId } from "@/types/domain";

const DELAY = ["", "d1", "d2", "d3", "d4"];

/** 5 kartu district. Urutan = DISTRICT_ORDER, warna = WARD_COLOR_HEX, kunci = DistrictId di kode.
 *  CP5: klik judul/kartu menyorot district (yang lain meredup) + "Return to overview";
 *  tiap kartu mendaftar mind-nya (data Supabase); klik mind membuka drawer profil. */
export function Districts({ minds }: { minds: LandingMind[] }) {
  const [active, setActive] = useState<DistrictId | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = minds.find((m) => m.id === openId) ?? null;

  // Sorot district + arahkan kamera scene 3D (CP9). `null` = kembali ke tampilan awal.
  const select = useCallback((id: DistrictId | null) => {
    setActive(id);
    if (id) cityBus.focusDistrict(id);
    else cityBus.clearFocus();
  }, []);
  const openMind = useCallback((id: string) => {
    setOpenId(id);
    cityBus.focusMind(id);
  }, []);
  const close = useCallback(() => {
    setOpenId(null);
    // Drawer tutup: kembali ke district yang tadi disorot (atau overview).
    if (active) cityBus.focusDistrict(active);
    else cityBus.clearFocus();
  }, [active]);

  // Arah sebaliknya: klik menara / label district di scene.
  useEffect(() => {
    const offPick = cityBus.onPickMind((id) => {
      const m = minds.find((x) => x.id === id);
      if (!m) return;
      setActive(m.district);
      openMind(id);
    });
    const offDistrict = cityBus.onDistrict((id) => setActive(id));
    return () => {
      offPick();
      offDistrict();
    };
  }, [minds, openMind]);

  return (
    <>
      <Section id="districts">
        <Eyebrow className="rv">{DISTRICTS.eyebrow}</Eyebrow>
        <H2 parts={DISTRICTS.title} />
        <Lede parts={DISTRICTS.lede} />

        <div className="mt-8 h-9">
          {active && (
            <button
              type="button"
              onClick={() => select(null)}
              className="inline-flex items-center gap-2 rounded-full border border-line-2 px-4 py-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-2 transition-colors hover:border-gold hover:text-gold-2"
            >
              <span aria-hidden>←</span> Return to overview
            </button>
          )}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3.5 min-[560px]:grid-cols-2 min-[860px]:grid-cols-3 min-[1100px]:grid-cols-5">
          {DISTRICT_ORDER.map((id, i) => {
            const d = DISTRICTS.byId[id];
            const list = minds
              .filter((m) => m.district === id)
              .sort((a, b) => Number(b.isLead) - Number(a.isLead) || b.revenue - a.revenue);
            const on = active === id;
            const dim = active !== null && !on;
            return (
              <div key={id} className={cn("rv", DELAY[i])}>
                <article
                  style={{ "--c": WARD_COLOR_HEX[id] } as CSSProperties}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("button")) return;
                    select(on ? null : id);
                  }}
                  className={cn(
                    "panel-glass flex h-full min-h-[300px] cursor-pointer flex-col px-[22px] pt-6 pb-[22px] transition-[border-color,transform,background-color,opacity] duration-[400ms] hover:-translate-y-1 hover:border-[var(--c)] hover:bg-[rgba(10,14,22,0.78)]",
                    on && "border-[var(--c)] bg-[rgba(10,14,22,0.78)] shadow-[0_0_40px_-12px_var(--c)]",
                    dim && "opacity-45"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10.5px] tracking-[0.2em] text-ink-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="size-2 rounded-full bg-[var(--c)] shadow-[0_0_14px_var(--c)]"
                    />
                  </div>
                  <h3 className="mt-[22px] mb-1 font-display text-[32px] font-normal leading-none">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => select(on ? null : id)}
                      className="text-left"
                    >
                      {d.name}
                    </button>
                  </h3>
                  <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-3">
                    {d.was}
                  </div>
                  <p className="mt-3.5 mb-[18px] text-sm text-ink-2">{d.focus}</p>

                  {list.length > 0 && (
                    <ul className="mt-auto list-none border-t border-line-2 pt-3">
                      {list.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => openMind(m.id)}
                            aria-haspopup="dialog"
                            className="group flex w-full items-center gap-2.5 py-[7px] text-left text-[13px] text-ink-2 transition-colors hover:text-gold-2"
                          >
                            <i
                              aria-hidden
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                m.status === "idle"
                                  ? "bg-ink-4"
                                  : "animate-beacon bg-good shadow-[0_0_8px_var(--color-good)]"
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate">{m.name}</span>
                            {m.isLead && (
                              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
                                Steward
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            );
          })}
        </div>
      </Section>
      <MindDrawer mind={open} onClose={close} />
    </>
  );
}
