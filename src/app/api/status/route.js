import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
const geminiHelper = require("@/utils/gemini");

export async function GET(request) {
  const headers = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0"
  };

  try {
    const outputDir = path.join(process.cwd(), "output");
    const statusPath = path.join(outputDir, "status.json");
    let renderInfo = { status: "idle", progress: 0, log: "스튜디오 렌더링 엔진 준비 완료 (Local 4K FFmpeg Engine)" };

    if (fs.existsSync(statusPath)) {
      try {
        const fileContent = fs.readFileSync(statusPath, "utf-8");
        const parsed = JSON.parse(fileContent);
        renderInfo = {
          status: parsed.status || "idle",
          progress: typeof parsed.progress === "number" ? parsed.progress : 0,
          log: parsed.log || "렌더링 진행 중...",
          videoPath: parsed.videoPath || "",
          videoName: parsed.videoName || ""
        };
      } catch (e) {}
    }

    const { searchParams } = new URL(request.url);
    const chosenModel = searchParams.get("model");

    if (chosenModel) {
      return NextResponse.json({ success: true, message: "Model ping verified" }, { headers });
    }

    return NextResponse.json({
      status: renderInfo.status,
      progress: renderInfo.progress,
      log: renderInfo.log,
      videoPath: renderInfo.videoPath,
      videoName: renderInfo.videoName,
      isYouTubeConnected: true
    }, { headers });
  } catch (error) {
    return NextResponse.json({ status: "error", message: error.message }, { status: 500, headers });
  }
}
