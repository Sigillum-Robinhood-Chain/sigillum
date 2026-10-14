/** Format angka untuk Weighhouse. Semua jumlah token sudah dalam satuan SGUM (bukan wei). */

const nf = (max: number, min = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: max, minimumFractionDigits: min });

export function fmtWage(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return nf(digits).format(n);
}

/** `1,234 SGUM` (brief §6: satuan setelah angka). */
export function fmtWageUnit(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${fmtWage(n, digits)} SGUM`;
}

export function fmtUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (Math.abs(n) >= 1000)
    return `$${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n)}`;
  return `$${nf(2).format(n)}`;
}

/** Harga token kecil butuh presisi: $0.00001234 -> `$0.0₄1234` terlalu cerdik, pakai angka signifikan. */
export function fmtPriceUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n === 0) return "$0";
  if (n >= 1) return `$${nf(4).format(n)}`;
  const digits = Math.min(12, Math.max(4, 2 - Math.floor(Math.log10(n)) + 2));
  return `$${n.toFixed(digits).replace(/0+$/, "")}`;
}

export function fmtPct(n: number | null | undefined, digits = 1): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${nf(digits, digits).format(n)}%`;
}

export function shortHash(h: string, head = 6, tail = 4): string {
  return h.length <= head + tail + 2 ? h : `${h.slice(0, head + 2)}…${h.slice(-tail)}`;
}

/** `5m ago`, `3h ago`, `2d ago`. */
export function ago(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "—";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
