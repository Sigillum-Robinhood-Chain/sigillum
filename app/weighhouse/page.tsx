import { WeighhouseClient } from '@/components/weighhouse/weighhouse-client';
import {
  getLedger,
  getPriceSeries,
  getSummary,
  getTopBuildings,
} from '@/lib/weighhouse/data';

// Data awal dirender di server; setelah mount, WeighhouseClient me-refresh
// lewat /api/weighhouse/* dan Supabase Realtime.
export const revalidate = 30;

export default async function WeighhousePage() {
  // Tiap query dibungkus supaya satu kegagalan (mis. tabel belum dimigrasi)
  // tidak menjatuhkan seluruh halaman -- client punya state kosong sendiri.
  const [summary, ledger, top, price] = await Promise.all([
    getSummary('7d').catch(() => null),
    getLedger(50).catch(() => []),
    getTopBuildings('7d').catch(() => []),
    getPriceSeries('7d').catch(() => null),
  ]);

  return (
    <WeighhouseClient
      initialSummary={summary}
      initialLedger={ledger}
      initialTop={top}
      initialPrice={price}
    />
  );
}
