import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
const youtubeHelper = require("@/utils/youtube-helper");

export async function POST(request) {
  try {
    const body = await request.json();
    const { videoName, title, description, tags = [], privacyStatus = "private", thumbnailName } = body;

    if (!videoName || !title || !description) {
      return NextResponse.json({ error: "Missing videoName, title, or description" }, { status: 400 });
    }

    const videoPath = path.join(process.cwd(), "output", videoName);
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: `Video file not found at ${videoPath}` }, { status: 404 });
    }

    let thumbnailPath = null;
    if (thumbnailName) {
      const candidatePath = path.join(process.cwd(), "output", thumbnailName);
      if (fs.existsSync(candidatePath)) {
        thumbnailPath = candidatePath;
      }
    }

    if (!youtubeHelper.isAuthenticated()) {
      return NextResponse.json({ error: "YouTube not authenticated. Please log in first." }, { status: 401 });
    }

    // Set up status files or stream progress
    const uploadStatusPath = path.join(process.cwd(), "output", "upload-status.json");
    fs.writeFileSync(
      uploadStatusPath,
      JSON.stringify({ status: "uploading", progress: 0, log: "Starting YouTube resumable upload..." }),
      "utf-8"
    );

    // Run upload in background (as large videos can take minutes)
    (async () => {
      try {
        console.log(`Starting YouTube upload for video: ${videoName}`);
        const response = await youtubeHelper.uploadVideo({
          videoPath,
          title,
          description,
          tags,
          privacyStatus,
          thumbnailPath,
          onProgress: (progress) => {
            fs.writeFileSync(
              uploadStatusPath,
              JSON.stringify({ status: "uploading", progress, log: `Uploading chunk: ${progress}% completed.` }),
              "utf-8"
            );
          }
        });

        fs.writeFileSync(
          uploadStatusPath,
          JSON.stringify({
            status: "success",
            progress: 100,
            log: "Upload completed successfully!",
            videoId: response.id
          }),
          "utf-8"
        );
      } catch (error) {
        console.error("YouTube upload failed:", error);
        fs.writeFileSync(
          uploadStatusPath,
          JSON.stringify({ status: "error", progress: 0, log: `Upload failed: ${error.message}` }),
          "utf-8"
        );
      }
    })();

    return NextResponse.json({
      success: true,
      message: "Resumable upload successfully queued in background."
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
