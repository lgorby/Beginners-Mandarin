import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/dictionary";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ results: [] });
  }
  const results = search(q, 30).map((r) => ({
    traditional: r.traditional,
    simplified: r.simplified,
    pinyin: r.pinyin,
    pinyinMarked: r.pinyinMarked,
    definitions: r.definitions,
  }));
  return NextResponse.json({ results });
}
