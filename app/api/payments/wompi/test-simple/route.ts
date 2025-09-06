import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Simple test working",
    timestamp: new Date().toISOString(),
  })
}
