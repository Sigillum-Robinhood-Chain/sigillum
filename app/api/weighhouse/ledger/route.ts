import { getLedger } from "@/lib/weighhouse/data";
import { cachedJson, failJson } from "@/lib/weighhouse/http";

export async function GET(req: Request) {
  try {
    const limit = Number(new URL(req.url).searchParams.get("limit") ?? 50);
    return cachedJson(await getLedger(limit), 15);
  } catch (e) {
    return failJson(e);
  }
}
