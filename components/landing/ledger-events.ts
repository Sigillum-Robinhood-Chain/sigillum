/** Event Ledger -> baris feed landing. Murni (tanpa React/Supabase), aman dipakai server & klien.
 *  Teks DIBANGUN dari `type` + judul job dengan istilah Sigillum; `note` dari DB (yang masih
 *  memuat istilah lama: Strongbox/Furnace/...) TIDAK ditampilkan, hanya diambil angkanya.
 *  Tipe yang tidak dikenal (reading_brief, drafting, error, dst.) disembunyikan dari preview. */

export interface LandingEvent {
  id: string;
  jobId: string;
  /** ISO timestamp (job_events.at). */
  at: string;
  type: string;
  note: string | null;
  /** Judul job, diisi bebas oleh user: selalu dirender sebagai teks (React meng-escape). */
  title: string;
}

export interface FeedLine {
  label: string;
  color: string;
  text: string;
}

const amount = (note: string | null, re: RegExp) => {
  const m = note?.match(re);
  return m ? `${m[1]} SGUM` : null;
};

export function describeEvent(e: LandingEvent): FeedLine | null {
  const q = `\u201C${e.title}\u201D`;
  switch (e.type) {
    case "job_created": {
      const a = amount(e.note, /(?:Wage of )?([\d.,]+) (?:SGUM|WAGE) locked/);
      return {
        label: "Vault",
        color: "var(--color-gold)",
        text: a ? `${a} locked in the Vault for ${q}.` : `SGUM locked in the Vault for ${q}.`,
      };
    }
    case "assigned":
      return { label: "Route", color: "var(--color-ice)", text: `A mind took on ${q}.` };
    case "submitted":
      return { label: "Review", color: "var(--color-lav)", text: `A mind delivered ${q}. Awaiting the Sigil.` };
    case "sent_back":
      return { label: "Revise", color: "#D4A07E", text: `Client sent ${q} back with a note. The mind is revising.` };
    case "sealed": {
      const a = amount(e.note, /([\d.,]+) (?:SGUM|WAGE) released/);
      return {
        label: "Sigil",
        color: "#9DBDB5",
        text: a ? `Sigil pressed on ${q}. ${a} released.` : `Sigil pressed on ${q}.`,
      };
    }
    case "burned": {
      const a = amount(e.note, /^([\d.,]+) (?:SGUM|WAGE)/);
      return {
        label: "Reactor",
        color: "var(--color-ember)",
        text: a ? `${a} burned in the Reactor from ${q}.` : `SGUM burned in the Reactor from ${q}.`,
      };
    }
    case "patrons_paid":
      return { label: "Patrons", color: "var(--color-gold-2)", text: `Patrons shared the patron portion of ${q}.` };
    case "split":
      return { label: "Split", color: "var(--color-ice)", text: `The Splitter shared the SGUM from ${q} on-chain.` };
    default:
      return null;
  }
}

/** HH:MM:SS dalam UTC: deterministik, jadi SSR dan klien menghasilkan teks yang sama
 *  (zona waktu lokal akan memicu hydration mismatch). */
export function formatClockUTC(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "--:--:--" : d.toISOString().slice(11, 19);
}

/** Versi LENGKAP untuk Ledger Wall di City Dashboard (CP8): semua tipe event punya baris,
 *  termasuk langkah kerja perantara yang disembunyikan di preview landing. Teks tetap dibangun
 *  dari `type` + judul job dengan istilah Sigillum; `note` dari DB tidak dipakai. */
export function describeWallEvent(e: LandingEvent): FeedLine {
  const known = describeEvent(e);
  if (known) return known;

  const q = `\u201C${e.title}\u201D`;
  const mind = { label: "Mind", color: "var(--color-lav)" };
  switch (e.type) {
    case "selecting":
      return { label: "Route", color: "var(--color-ice)", text: `The Steward is choosing a mind for ${q}.` };
    case "reading_brief":
      return { ...mind, text: `A mind is reading the brief of ${q}.` };
    case "drafting":
      return { ...mind, text: `A mind is drafting ${q}.` };
    case "checking":
      return { ...mind, text: `A mind is checking its work on ${q}.` };
    case "finalizing":
      return { ...mind, text: `A mind is finalizing ${q}.` };
    case "revision_started":
      return { label: "Revise", color: "#D4A07E", text: `A mind started revising ${q}.` };
    case "split_pending":
      return { label: "Split", color: "var(--color-ice)", text: `The Sigil is pressed on ${q}, but the on-chain split is still pending.` };
    case "split_record_failed":
    case "error":
      return { label: "System", color: "var(--color-ink-3)", text: `Something went wrong with ${q}.` };
    default:
      return { label: "Event", color: "var(--color-ink-3)", text: `${e.type.replace(/_/g, " ")} on ${q}.` };
  }
}
