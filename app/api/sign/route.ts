import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, country, organization, message } = await req.json();

    if (!name || !email || !country) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }


    console.log("Sending to Airtable:", { name, email, country, organization, message });

    await base(process.env.AIRTABLE_TABLE_NAME!).create([
      {
        fields: {
          name: name,               // ← lowercase, matches Airtable
          email: email,             // ← lowercase
          country: country,         // ← lowercase
          organization: organization || "",  // ← lowercase, not Occupation
          message: message || "",   // ← lowercase
          source: "Landing Page",   // ← lowercase
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