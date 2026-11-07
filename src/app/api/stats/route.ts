import { NextResponse } from "next/server";
import { computeStats, getPetani } from "../petani/route";

export async function GET() {
  try {
    const data = await getPetani();
    const stats = computeStats(data);
    return NextResponse.json({ success: true, stats });
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
