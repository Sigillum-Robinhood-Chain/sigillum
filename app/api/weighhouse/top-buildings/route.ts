import { getTopBuildings } from "@/lib/weighhouse/data";
import { cachedJson, failJson } from "@/lib/weighhouse/http";
import { parseWin } from "@/lib/weighhouse/metrics";

export async function GET(req: Request) {
  try {
    const win = parseWin(new URL(req.url).searchParams.get("window"));
    return cachedJson(await getTopBuildings(win), 60);
  } catch (e) {
    return failJson(e);
  }
}
