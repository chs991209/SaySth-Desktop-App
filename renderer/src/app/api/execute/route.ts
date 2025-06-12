import { NextRequest, NextResponse } from "next/server";

const EXTERNAL_URL = "https://5735-59-1-100-185.ngrok-free.app/execute";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const res = await fetch(EXTERNAL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  console.log(data);
  return NextResponse.json(data);
}
