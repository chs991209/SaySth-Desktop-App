// src/app/api/stt/route.ts
import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_URL = "https://6a7d-39-122-179-149.ngrok-free.app/stt_base64";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(EXTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data);
}
