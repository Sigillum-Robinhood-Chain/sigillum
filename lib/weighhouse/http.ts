import { NextResponse } from "next/server";

/** Respons JSON ber-cache CDN (brief §5.5). Error tidak di-cache. */
export function cachedJson(body: unknown, sMaxAge: number) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${sMaxAge}, stale-while-revalidate=${sMaxAge * 2}`,
    },
  });
}

export function failJson(e: unknown) {
  const message = e instanceof Error ? e.message : "unknown error";
  return NextResponse.json({ error: message }, { status: 500, headers: { "Cache-Control": "no-store" } });
}
