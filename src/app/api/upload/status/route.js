import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const uploadStatusPath = path.join(process.cwd(), "output", "upload-status.json");

  if (!fs.existsSync(uploadStatusPath)) {
    return NextResponse.json({
      status: "idle",
      progress: 0,
      log: "No YouTube upload has been started yet."
    });
  }

  try {
    const statusData = JSON.parse(fs.readFileSync(uploadStatusPath, "utf-8"));
    return NextResponse.json(statusData);
  } catch (error) {
    return NextResponse.json({ status: "error", log: error.message });
  }
}
export async function DELETE() {
  const uploadStatusPath = path.join(process.cwd(), "output", "upload-status.json");
  if (fs.existsSync(uploadStatusPath)) {
    fs.unlinkSync(uploadStatusPath);
  }
  return NextResponse.json({ success: true });
}
