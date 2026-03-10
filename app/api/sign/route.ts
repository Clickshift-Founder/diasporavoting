import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, country, message } = await req.json();

    // Basic validation
    if (!name || !email || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Save to Airtable
    await base(process.env.AIRTABLE_TABLE_NAME!).create([
      {
        fields: {
          Name: name,
          Email: email,
          Country: country,
          Message: message || "",
          Source: "Landing Page",
        },
      },
    ]);

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Airtable error:", error);
    return NextResponse.json(
      { error: "Failed to save signature" },
      { status: 500 }
    );
  }
}