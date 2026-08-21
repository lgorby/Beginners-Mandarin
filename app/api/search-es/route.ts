import { NextRequest, NextResponse } from "next/server";
import { searchSpanish } from "@/lib/spanishDictionary";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }
  const results = searchSpanish(q, 30).map((r) => ({
    word: r.word,
    pos: r.pos,
    translations: r.translations,
  }));
  return NextResponse.json({ results });
}
