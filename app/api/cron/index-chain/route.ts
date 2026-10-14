import { NextResponse } from "next/server";
import {
  backfillChainJobIds,
  indexChainEvents,
  snapshotPrice,
  snapshotSupply,
} from "@/lib/weighhouse/indexer";

// Cron indexer Weighhouse (brief §5.1/5.3). Panggil tiap 1 menit: lihat vercel.json.example.
// Vercel Cron mengirim `Authorization: Bearer $CRON_SECRET`; pemanggil lain (GitHub Actions,
// cron-job.org) memakai header yang sama. Tanpa CRON_SECRET endpoint menolak semua permintaan.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const report: Record<string, unknown> = {};
  const step = async (name: string, fn: () => Promise<unknown>) => {
    try {
      report[name] = await fn();
    } catch (e) {
      report[name] = { error: e instanceof Error ? e.message : String(e) };
    }
  };

  await step("jobs", () => backfillChainJobIds());
  await step("events", () => indexChainEvents());
  await step("supply", () => snapshotSupply());
  await step("price", () => snapshotPrice());

  const failed = Object.values(report).some((v) => typeof v === "object" && v !== null && "error" in v);
  return NextResponse.json(report, { status: failed ? 207 : 200 });
}
