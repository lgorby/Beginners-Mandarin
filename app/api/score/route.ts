import { NextRequest, NextResponse } from "next/server";
import { scorePronunciation } from "@/lib/pronounce";

/**
 * Score speech-recognition candidates against a target phrase by sound
 * (pinyin + tones) rather than characters. `heard` is |-separated.
 */
export async function GET(req: NextRequest) {
  const target = (req.nextUrl.searchParams.get("target") ?? "").trim();
  const heard = (req.nextUrl.searchParams.get("heard") ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
  if (!target || heard.length === 0) {
    return NextResponse.json({ transcript: "", score: 0, toneHint: false });
  }
  return NextResponse.json(scorePronunciation(target, heard));
}
