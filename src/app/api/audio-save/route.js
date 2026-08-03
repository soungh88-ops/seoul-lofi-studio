import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MANIFEST_PATH = path.join(process.cwd(), "output", "custom_tracks_manifest.json");
const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

function ensureDirs() {
  const outputDir = path.join(process.cwd(), "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function readManifest() {
  ensureDirs();
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const content = fs.readFileSync(MANIFEST_PATH, "utf-8");
      return JSON.parse(content);
    } catch (e) {
      return {};
    }
  }
  return {};
}

function writeManifest(data) {
  ensureDirs();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const manifest = readManifest();
  return NextResponse.json({ success: true, tracks: manifest });
}

export async function POST(request) {
  try {
    ensureDirs();
    const body = await request.json();
    const { trackNum, name, base64Data, duration } = body;

    if (!trackNum || !name || !base64Data) {
      return NextResponse.json({ error: "Missing trackNum, name, or base64Data" }, { status: 400 });
    }

    const numStr = String(trackNum).padStart(2, "0");
    const extMatch = name.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1] : "mp3";
    const fileName = `custom_track_${numStr}.${ext}`;
    const filePath = path.join(AUDIO_DIR, fileName);

    // Strip Base64 prefix
    const base64Clean = base64Data.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, "").replace(/^data:application\/[a-zA-Z0-9]+;base64,/, "");
    const buffer = Buffer.from(base64Clean, "base64");

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/audio/${fileName}`;
    const manifest = readManifest();
    manifest[trackNum] = {
      name: name,
      fileName: fileName,
      url: publicUrl,
      duration: duration || 180,
      savedAt: new Date().toISOString()
    };
    writeManifest(manifest);

    return NextResponse.json({
      success: true,
      message: `Track ${numStr} saved to disk!`,
      track: manifest[trackNum]
    });
  } catch (error) {
    console.error("Failed to save audio to disk:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackNum = searchParams.get("trackNum");

    if (!trackNum) {
      return NextResponse.json({ error: "Missing trackNum" }, { status: 400 });
    }

    const manifest = readManifest();
    if (manifest[trackNum]) {
      const fileName = manifest[trackNum].fileName;
      if (fileName) {
        const filePath = path.join(AUDIO_DIR, fileName);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
      delete manifest[trackNum];
      writeManifest(manifest);
    }

    return NextResponse.json({ success: true, message: `Track ${trackNum} deleted from disk.` });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
