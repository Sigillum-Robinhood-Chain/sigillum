import { getPriceSeries } from "@/lib/weighhouse/data";
import { cachedJson, failJson } from "@/lib/weighhouse/http";
import { parseRange } from "@/lib/weighhouse/metrics";

export async function GET(req: Request) {
  try {
    const range = parseRange(new URL(req.url).searchParams.get("range"));
    return cachedJson(await getPriceSeries(range), 60);
  } catch (e) {
    return failJson(e);
  }
}
