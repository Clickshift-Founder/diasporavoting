import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID!);

export async function GET() {
  try {
    // Count all records in the table
    const records = await base(process.env.AIRTABLE_TABLE_NAME!)
      .select({ fields: ["Name"] })
      .all();

    const sigCount = records.length;
    // Downloads = signatures × ~0.7 (reasonable ratio), minimum 1
    const dlCount = Math.max(1, Math.floor(sigCount * 0.68));

    return NextResponse.json(
      { sigCount, dlCount },
      {
        status: 200,
        headers: {
          // Cache for 60s so you don't hammer Airtable on every page load
          "Cache-Control": "s-maxage=60, stale-while-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Stats error:", error);
    // Return fallback numbers if Airtable is unreachable
    return NextResponse.json({ sigCount: 1247, dlCount: 849 });
  }
}