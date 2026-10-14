"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Panel } from "@/components/ui/panel";
import { buttonClasses, ButtonArrow } from "@/components/ui/button";
import { H2, Lede, Section } from "@/components/landing/section";
import { LEDGER } from "@/components/landing/copy";
import {
  describeEvent,
  formatClockUTC,
  type LandingEvent,
} from "@/components/landing/ledger-events";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeChanges } from "@/lib/supabase/realtime";
import { WAGE_SPLIT, WAGE_UNIT } from "@/lib/currency";

const MAX_ROWS = 6;
const { sampleJob: JOB, sampleWage: WAGE } = LEDGER;
const Q = `\u201C${JOB}\u201D`;
const burned = ((WAGE * WAGE_SPLIT.furnacePct) / 100).toFixed(1);

/** Contoh bila belum ada event nyata (database kosong / Supabase tak terjangkau). */
const SAMPLE = [
  { time: "14:21:09", label: "Reactor", color: "var(--color-ember)", text: `${burned} ${WAGE_UNIT} burned in the Reactor from ${Q}.` },
  {
    time: "14:21:09",
    label: "Sigil",
    color: "#9DBDB5",
    text: `Sigil pressed on ${Q}. ${WAGE} ${WAGE_UNIT} released: ${WAGE_SPLIT.patronsPct}% patrons, ${WAGE_SPLIT.lampOilPct}% grid, ${WAGE_SPLIT.tithePct}% civic, ${WAGE_SPLIT.furnacePct}% burned.`,
  },
  { time: "14:19:42", label: "Review", color: "var(--color-lav)", text: `A mind delivered ${Q}. Awaiting the Sigil.` },
  { time: "14:12:05", label: "Revise", color: "#D4A07E", text: `Client sent ${Q} back with a note. The mind is revising.` },
  { time: "14:03:27", label: "Route", color: "var(--color-ice)", text: `The district Steward routed ${Q} to a mind.` },
  { time: "14:03:26", label: "Vault", color: "var(--color-gold)", text: `Wage of ${WAGE} ${WAGE_UNIT} locked in the Vault for ${Q}.` },
];

const byNewest = (a: LandingEvent, b: LandingEvent) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
const visible = (e: LandingEvent) => describeEvent(e) !== null;

/** Feed Ledger di landing: event nyata dari server (listRecentEvents) + Supabase Realtime
 *  (hook `useRealtimeChanges` yang sudah ada). Kosong -> contoh statis berlabel "Sample". */
export function LedgerPreview({ initialEvents }: { initialEvents: LandingEvent[] }) {
  const [events, setEvents] = useState(() =>
    initialEvents.filter(visible).sort(byNewest).slice(0, MAX_ROWS)
  );
  const supabase = useMemo(() => createClient(), []);
  const titles = useRef(new Map(initialEvents.map((e) => [e.jobId, e.title])));
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useRealtimeChanges("job_events", (payload) => {
    if (payload.eventType !== "INSERT") return; // event tidak pernah di-update/dihapus
    const row = payload.new;
    const known = titles.current.get(row.job_id);
    const next: LandingEvent = {
      id: row.id,
      jobId: row.job_id,
      at: row.at,
      type: row.type,
      note: row.note,
      title: known ?? "a job",
    };
    if (!visible(next)) return;
    setEvents((prev) =>
      prev.some((e) => e.id === next.id) ? prev : [next, ...prev].sort(byNewest).slice(0, MAX_ROWS)
    );
    if (known) return;
    // Payload Realtime hanya membawa job_id: ambil judulnya sekali, lalu perbarui baris itu.
    void supabase
      .from("jobs")
      .select("title")
      .eq("id", row.job_id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.title || !alive.current) return;
        titles.current.set(row.job_id, data.title);
        setEvents((prev) =>
          prev.map((e) => (e.jobId === row.job_id && e.title === "a job" ? { ...e, title: data.title } : e))
        );
      });
  });

  const live = events.length > 0;
  const rows = live
    ? events.map((e) => {
        const line = describeEvent(e)!;
        return { key: e.id, time: formatClockUTC(e.at), ...line };
      })
    : SAMPLE.map((s, i) => ({ key: String(i), ...s }));

  return (
    <Section id="ledger">
      <div className="grid grid-cols-1 items-center gap-[clamp(30px,5vw,80px)] min-[1100px]:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Eyebrow className="rv">{LEDGER.eyebrow}</Eyebrow>
          <H2 parts={LEDGER.title} />
          <Lede parts={LEDGER.lede} />
          <div className="rv d2 mt-[30px] flex flex-wrap gap-3">
            <Link href="/jobs" className={buttonClasses({ variant: "ghost", size: "large" })}>
              {LEDGER.cta} <ButtonArrow />
            </Link>
          </div>
        </div>

        <Panel ticks className="rv d1 min-h-[440px]">
          <div className="py-2">
            <div className="flex items-center justify-between border-b border-line-2 px-6 py-4">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.24em] text-ink-3">
                {live ? "Ledger · live feed · UTC" : LEDGER.feedTitle}
              </span>
              <span className="inline-flex items-center gap-[7px] font-mono text-[10px] uppercase tracking-[0.2em] text-ice">
                <i aria-hidden className="size-1.5 animate-beacon rounded-full bg-ice shadow-[0_0_10px_var(--color-ice)]" />
                {live ? "Streaming" : "Sample"}
              </span>
            </div>
            <ol className="list-none">
              {rows.map((e) => (
                <li
                  key={e.key}
                  style={{ "--c": e.color } as CSSProperties}
                  className="grid grid-cols-1 gap-1.5 border-b border-line-2 px-6 py-[15px] text-[13.5px] text-ink-2 min-[560px]:grid-cols-[62px_82px_1fr] min-[560px]:gap-3.5"
                >
                  <time className="pt-0.5 font-mono text-[11px] text-ink-3">{e.time}</time>
                  <span className="self-start justify-self-start rounded-full border border-[color-mix(in_srgb,var(--c)_40%,transparent)] px-2.5 py-[3px] text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-[var(--c)] min-[560px]:w-full min-[560px]:justify-self-auto min-[560px]:px-0">
                    {e.label}
                  </span>
                  <span>{e.text}</span>
                </li>
              ))}
            </ol>
          </div>
        </Panel>
      </div>
    </Section>
  );
}
