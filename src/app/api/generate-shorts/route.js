import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ffmpegHelper = require("@/utils/ffmpeg-helper");
const youtubeHelper = require("@/utils/youtube-helper");

export async function POST(request) {
  try {
    const body = await request.json();
    const { videoName, theme, enHookTitle } = body;

    if (!videoName) {
      return NextResponse.json({ error: "Missing videoName" }, { status: 400 });
    }

    const outputDir = path.join(process.cwd(), "output");
    const longVideoPath = path.join(outputDir, videoName);

    if (!fs.existsSync(longVideoPath)) {
      return NextResponse.json({ error: `Original long-form video not found at ${longVideoPath}` }, { status: 404 });
    }

    const isYouTubeConnected = youtubeHelper.isAuthenticated();
    if (!isYouTubeConnected) {
      return NextResponse.json({ error: "YouTube not authenticated. Connect account first." }, { status: 401 });
    }

    const shortsStatusPath = path.join(outputDir, "shorts-status.json");

    // Initialize status
    fs.writeFileSync(
      shortsStatusPath,
      JSON.stringify({ status: "rendering", progress: 0, log: "Initializing 24-Hour Shorts Clipper System...\n" }, null, 2),
      "utf-8"
    );

    // Asynchronous background generator
    (async () => {
      const logs = [];
      const log = (text) => {
        console.log(`[Shorts] ${text}`);
        logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
        try {
          fs.writeFileSync(
            shortsStatusPath,
            JSON.stringify({
              status: "rendering",
              progress: 0,
              log: logs.join("\n")
            }, null, 2),
            "utf-8"
          );
        } catch (e) {}
      };

      try {
        const cleanTitleBase = (enHookTitle || theme || "Aesthetic Korean Lofi")
          .replace(/[\[\]]/g, "")
          .substring(0, 50);

        // Define the 3 shorts details
        const shortsPlans = [
          {
            num: 1,
            startTime: 0, // Track 1
            hookText: "for your deep focus...",
            title: `[Shorts] ${cleanTitleBase} - Part 1 🎵`,
            publishOffsetHours: 2 // 2 hours later
          },
          {
            num: 2,
            startTime: 1260, // Track 8 (~21 mins)
            hookText: "feel the rhythm...",
            title: `[Shorts] ${cleanTitleBase} - Part 2 ☕`,
            publishOffsetHours: 14 // Tomorrow morning
          },
          {
            num: 3,
            startTime: 2520, // Track 15 (~42 mins)
            hookText: "relax your mind...",
            title: `[Shorts] ${cleanTitleBase} - Part 3 💤`,
            publishOffsetHours: 18 // Tomorrow lunch
          }
        ];

        const generatedShortsPaths = [];

        // 1. Generate the 3 shorts vertical videos locally
        for (const plan of shortsPlans) {
          const shortFileName = `Seoul_Lofi_Short_${plan.num}_${Date.now()}.mp4`;
          const shortOutPath = path.join(outputDir, "temp", shortFileName);
          
          log(`Generating Short ${plan.num}/3 (Segment: ${plan.startTime}s - 15s)...`);
          
          await ffmpegHelper.renderShortVideo({
            longVideoPath,
            startTime: plan.startTime,
            duration: 15,
            hookText: plan.hookText,
            outputPath: shortOutPath,
            onProgress: (p) => {
              // Update overall progress slightly
              const overallProgress = Math.round(((plan.num - 1) * 33) + (p * 0.33));
              try {
                fs.writeFileSync(
                  shortsStatusPath,
                  JSON.stringify({
                    status: "rendering",
                    progress: overallProgress,
                    log: logs.join("\n") + `\nRendering Short ${plan.num}: ${p}%`
                  }, null, 2),
                  "utf-8"
                );
              } catch (e) {}
            },
            onLog: (l) => console.log(l)
          });

          generatedShortsPaths.push({
            path: shortOutPath,
            title: plan.title,
            publishAt: new Date(Date.now() + plan.publishOffsetHours * 60 * 60 * 1000).toISOString()
          });

          log(`Short ${plan.num} vertical rendering completed!`);
        }

        // 2. Upload and Schedule the 3 shorts to YouTube
        log("All 3 vertical videos rendered. Initiating YouTube Scheduler...");

        for (let i = 0; i < generatedShortsPaths.length; i++) {
          const short = generatedShortsPaths[i];
          const shortNum = i + 1;
          log(`Uploading & Scheduling Short ${shortNum}/3: "${short.title}"...`);
          log(`Scheduled publication time (24h loop): ${new Date(short.publishAt).toLocaleString()}`);

          await youtubeHelper.uploadVideo({
            videoPath: short.path,
            title: short.title,
            description: `Experience authentic Korean lofi beats.\nOriginal long-form mix: ${enHookTitle || theme}\n\n#Shorts #lofi #studybeats #koreanlofi`,
            tags: ["Shorts", "lofi", "studybeats", "koreanlofi"],
            privacyStatus: "private", // Overridden by publishAt anyway
            publishAt: short.publishAt,
            onProgress: (p) => {
              const overallProgress = Math.round(50 + (shortNum - 1) * 16 + (p * 0.16));
              try {
                fs.writeFileSync(
                  shortsStatusPath,
                  JSON.stringify({
                    status: "uploading",
                    progress: overallProgress,
                    log: logs.join("\n") + `\nUploading Short ${shortNum}: ${p}%`
                  }, null, 2),
                  "utf-8"
                );
              } catch (e) {}
            }
          });

          // Clean up local temp short file
          try {
            fs.unlinkSync(short.path);
          } catch (e) {}

          log(`Short ${shortNum}/3 successfully scheduled in YouTube Cloud!`);
        }

        log("🎉 [Success] All 3 Shorts have been successfully created and scheduled over the next 24 hours!");
        fs.writeFileSync(
          shortsStatusPath,
          JSON.stringify({
            status: "success",
            progress: 100,
            log: logs.join("\n")
          }, null, 2),
          "utf-8"
        );

      } catch (err) {
        log(`Fatal Error in Shorts generation pipeline: ${err.message}`);
        fs.writeFileSync(
          shortsStatusPath,
          JSON.stringify({
            status: "error",
            progress: 0,
            log: logs.join("\n") + `\nFatal Error: ${err.message}`
          }, null, 2),
          "utf-8"
        );
      }
    })();

    return NextResponse.json({
      success: true,
      message: "3-Shorts generation pipeline successfully queued in background."
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
