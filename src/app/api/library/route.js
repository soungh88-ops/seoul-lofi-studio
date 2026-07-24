import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  const outputDir = path.join(process.cwd(), "output");
  const libraryPath = path.join(outputDir, "library.json");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let library = [];
  if (fs.existsSync(libraryPath)) {
    try {
      library = JSON.parse(fs.readFileSync(libraryPath, "utf-8"));
    } catch (e) {
      library = [];
    }
  }

  // Auto-scan physical .mp4 files in output folder to populate library
  try {
    const files = fs.readdirSync(outputDir);
    let updated = false;

    files.forEach((file) => {
      if (file.endsWith(".mp4")) {
        const existsInLib = library.some((item) => item.name === file);
        if (!existsInLib) {
          const filePath = path.join(outputDir, file);
          const stats = fs.statSync(filePath);
          library.unshift({
            id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
            name: file,
            path: filePath,
            size: stats.size,
            createdAt: stats.mtime.toISOString(),
            duration: "01:00:00"
          });
          updated = true;
        }
      }
    });

    if (updated) {
      fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2), "utf-8");
    }
  } catch (e) {
    console.error("Failed to auto-sync MP4 files to library:", e);
  }

  return NextResponse.json(library);
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoName = searchParams.get("name");

    if (!videoName) {
      return NextResponse.json({ error: "Missing video name" }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "output");
    const videoPath = path.join(outputDir, videoName);
    const libraryPath = path.join(outputDir, "library.json");

    // Physical deletion of video file from disk
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Remove from library.json
    let updatedLibrary = [];
    if (fs.existsSync(libraryPath)) {
      const library = JSON.parse(fs.readFileSync(libraryPath, "utf-8"));
      updatedLibrary = library.filter((v) => v.name !== videoName);
      fs.writeFileSync(libraryPath, JSON.stringify(updatedLibrary, null, 2));
    }

    return NextResponse.json({ success: true, library: updatedLibrary });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
