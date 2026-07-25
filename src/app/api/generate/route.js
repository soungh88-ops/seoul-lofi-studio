import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
const ffmpegHelper = require("@/utils/ffmpeg-helper");
const geminiHelper = require("@/utils/gemini");
import { aiVideoHelper } from "@/utils/ai-video";

// Helper to download a URL to a local file
async function downloadFile(url, destPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(destPath, buffer);
}

// Fetch real, high-quality Lofi Chillhop & Korean aesthetic MP3 audio tracks
async function generateSynthesizedTrack(outputPath, duration = 30, index = 0) {
  // Real royalty-free Lofi MP3 track CDN URLs
  const realLofiTracks = [
    "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
    "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3",
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a77d54.mp3?filename=lofi-hip-hop-10332.mp3"
  ];
  const targetUrl = realLofiTracks[index % realLofiTracks.length];
  
  try {
    // Attempt to download genuine high-quality Lofi MP3 track
    await downloadFile(targetUrl, outputPath);
  } catch (err) {
    console.error("Failed to download real Lofi MP3 track, synthesizing pentatonic chord fallback:", err.message);
    // Offline fallback: pentatonic Korean chord
    const cmd = `ffmpeg -f lavfi -i "aevalsrc=(sin(2*PI*293.66*t)+sin(2*PI*329.63*t)+sin(2*PI*392.00*t)+sin(2*PI*440.00*t)+sin(2*PI*493.88*t))/5:d=${duration}" -af "apulsator=hz=0.3:amount=0.5,tremolo=f=4:d=0.3" -y "${outputPath}"`;
    await new Promise((resolve, reject) => {
      exec(cmd, (error) => (error ? reject(error) : resolve(outputPath)));
    });
  }
}

// Generate simple white noise / rain sound using FFmpeg if no ambient file exists
function generateSynthesizedAmbient(outputPath, duration = 60) {
  return new Promise((resolve, reject) => {
    // Generates pink noise (sounds like rain/wind)
    const cmd = `ffmpeg -f lavfi -i "anoisesrc=d=${duration}:color=pink" -y "${outputPath}"`;
    exec(cmd, (error) => {
      if (error) reject(error);
      else resolve(outputPath);
    });
  });
}

export async function POST(request) {
  const outputDir = path.join(process.cwd(), "output");
  const tempDir = path.join(outputDir, "temp");
  const publicAudioDir = path.join(process.cwd(), "public", "audio");
  const statusPath = path.join(outputDir, "status.json");

  // 1. Ensure directories exist
  [outputDir, tempDir, publicAudioDir].forEach((dir) => {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn("Failed to create folder on read-only system:", e.message);
    }
  });

  // 2. Clear any old status file to prepare for new render
  if (fs.existsSync(statusPath)) {
    try {
      fs.unlinkSync(statusPath);
    } catch (e) {
      console.warn("Failed to delete status file on read-only system:", e.message);
    }
  }

  // 3. Parse parameters
  const body = await request.json();
  const {
    genre,
    theme,
    modelName,
    chatHistory,
    ambientType = "rain",
    ambientVolume = 0.12,
    audioEffect = "none",
    trackCount = 20,
    durationHours = 1,
    isTestMode = true // Default to true to prevent rendering 1-hour video during test
  } = body;

  // Real-time AI Producer Chat Handler
  if (genre === "chat") {
    try {
      const genAI = geminiHelper.getGenAI();
      if (!genAI) {
        return NextResponse.json({ 
          log: "🤖 [구글 제미나이 연결 오류] 스튜디오 상단에서 구글 제미나이 모델 연결(🔌 선택한 모델로 스튜디오 연결 버튼)을 먼저 클릭하여 완료해 주세요!" 
        });
      }

      const model = modelName
        ? genAI.getGenerativeModel({ model: modelName })
        : await geminiHelper.getWorkingGenerativeModel(genAI);

      const prompt = `
        You are an elite YouTube Music Producer & Lofi Algorithm Expert. 
        You are currently coaching the channel's Director (총감독님) to build the ultimate Lofi channel.
        Address them respectfully as "총감독님" in Korean, and write in a friendly, encouraging, and highly professional Korean tone with emojis.
        
        You have the power to update/edit the active theme (topTrendingTheme), the 30-day calendar (calendarThemes), and all music rendering/visual configurations (options) of the studio dashboard.
        
        If the user (총감독님) asks to change the active theme, modify the calendar topics, make topics more upbeat/exciting/varied, edit any music/visual settings (e.g. change rain volume, switch ambient sound, toggle film grain or neon sticker, change equalizer style/color, adjust video length hours), OR complains that the 20 music prompts or 5 visual prompts are "weird" / "repetitive" / "similar" and wants them recreated (e.g., "태평소 위주로 비트감 있는 신나는 국악으로 기획 다 고쳐줘"), you MUST reply with a JSON object.
        
        Output JSON structure:
        {
          "log": "Text reply to 총감독님 in friendly Korean tone explaining what changes you made to the dashboard settings or why you recreated the track/visual prompts",
          "updateTheme": {
            "title": "Updated active theme title",
            "desc": "Updated description",
            "viewPotential": "🔥 예상 조회수: Top 1%",
            "targetInstruments": "가야금, 해금 등",
            "brainwave": "알파파 9.5Hz + 432Hz"
          },
          "updateCalendar": [
            { "day": "Day 01 (월)", "title": "Updated title", "inst": "instrument", "wave": "frequency wave" }
            ... (provide all 30 days if updating the calendar)
          ],
          "updateMusicPrompts": [
            {
              "trackNumber": 1,
              "title": "트랙 01: [Korean Title]",
              "bpm": "78 BPM",
              "mood": "Upbeat Coding Beats",
              "promptKo": "[Korean description: 태평소와 꽹과리를 사용한 비트감 넘치는 집중력 국악 로파이]",
              "promptEn": "[English prompt for Suno/Udio: 3-minute full length instrumental composition, 180 seconds duration, fast 78 BPM, traditional Korean Taepyeongso wind instrument lead, energetic Jing percussion, lofi hip hop beat, 432Hz]"
            }
            ... (exactly 20 tracks)
          ],
          "updateVisualPrompts": [
            {
              "id": 1,
              "title": "후보 1: [Korean Title]",
              "prompt": "[Korean thumbnail description]",
              "promptEn": "[English static image prompt for Midjourney: 4k cinematic lofi anime aesthetic, aspect ratio 16:9]",
              "videoPromptEn": "[English video loop prompt for Runway: A seamless loop video, static locked-off camera, NO camera movement, NO zoom, cozy cyber-shamanism lofi room, [character/action details], soft rain falling outside, neon lights reflecting on wet streets of futuristic Seoul, warm ambient lighting, 4k resolution, smooth motion, perfect repeating loop]"
            }
            ... (exactly 5 candidates)
          ],
          "updateOptions": {
            "targetDurationHours": 2, // integer (1, 2, or 3 hours)
            "ambientType": "snow", // 'rain' | 'snow' | 'ocean' | 'city' | 'none'
            "ambientVolume": 0.2, // float (0.0 to 1.0)
            "audioEffect": "cassette", // 'none' | 'cassette' | 'reverb' | 'lowpass'
            "enableNeonDokkaebi": true, // boolean
            "enableCameraBreathing": true, // boolean
            "enableRainParticles": true, // boolean
            "enableDayToNight": true, // boolean
            "enableFilmGrain": true, // boolean
            "enableSmartTitle": true, // boolean
            "eqStyle": "circle", // 'bar' | 'circle' | 'wave' | 'none'
            "eqColor": "sunset" // 'cyberpunk' | 'sunset' | 'rain'
          }
        }
        
        If no dashboard settings need to be modified, just return a regular conversational text reply (not JSON) answering their question.
        
        Recent chat history:
        ${chatHistory}
        
        User's latest request:
        "${theme}"
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let reply = response.text().trim();
      if (reply.startsWith("```")) {
        reply = reply.replace(/^```json/, "").replace(/```$/, "").trim();
      }
      return NextResponse.json({ log: reply });
    } catch (e) {
      console.error("Chat generation failed:", e);
      return NextResponse.json({ 
        log: `🤖 [AI 응답 실패]: 구글 API 키 또는 연결 상태를 점검해 주세요. 에러: ${e.message}` 
      });
    }
  }

  // Initialize status file
  const initialStatus = {
    status: "rendering",
    progress: 0,
    log: "Starting video generation wizard...\n"
  };
  fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2), "utf-8");

  // Asynchronous background execution
  (async () => {
    const logs = [];
    const log = (text) => {
      console.log(text);
      logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
      if (logs.length > 150) logs.shift(); // Keep logs buffer light (<50KB)

      const currentStatus = {
        status: "rendering",
        progress: initialStatus.progress,
        log: logs.join("\n")
      };
      try {
        fs.writeFileSync(statusPath, JSON.stringify(currentStatus, null, 2), "utf-8");
      } catch (e) {}
    };

    const updateProgress = (pct) => {
      initialStatus.progress = pct;
      const currentStatus = {
        status: "rendering",
        progress: pct,
        log: logs.join("\n")
      };
      try {
        fs.writeFileSync(statusPath, JSON.stringify(currentStatus, null, 2), "utf-8");
      } catch (e) {}
    };

    try {
      log(`Setting up ${durationHours}-hour video rendering pipeline.`);
      log(`Selected Genre: ${genre}, Theme: ${theme}`);

      // 4. Resolve Background Visual via AI Video Generator
      log("Calling AI Video Generator for 8-sec anime video loop...");
      const bgPrompt = `A 16:9 lo-fi anime illustration of ${theme}, warm lighting, aesthetic, 4k, looping`;
      const aiVideoResult = await aiVideoHelper.generateVideoLoop({ theme, prompt: bgPrompt });
      
      let visualUrl = body.customVisualUrl || aiVideoResult.url;
      const isVideo = visualUrl.endsWith(".mp4") || visualUrl.endsWith(".webm") || visualUrl.endsWith(".gif") || visualUrl.includes("video");
      const ext = isVideo ? ".mp4" : ".jpg";
      const imagePath = path.join(tempDir, `background${ext}`);

      log(`Securing AI-generated video loop from: ${visualUrl}`);
      try {
        if (visualUrl.startsWith("data:")) {
          log("Processing custom base64 visual data...");
          const base64Data = visualUrl.split(";base64,").pop();
          if (base64Data) {
            fs.writeFileSync(imagePath, Buffer.from(base64Data, "base64"));
          }
        } else if (visualUrl.startsWith("blob:")) {
          log("Blob URL detected. Falling back to local default logo...");
          const fallbackLogoPath = path.join(process.cwd(), "public", "dokkaebi_logo.png");
          if (fs.existsSync(fallbackLogoPath)) {
            fs.copyFileSync(fallbackLogoPath, imagePath);
          }
        } else if (visualUrl.startsWith("/")) {
          const localSourcePath = path.join(process.cwd(), "public", visualUrl);
          if (fs.existsSync(localSourcePath)) {
            fs.copyFileSync(localSourcePath, imagePath);
          } else {
            throw new Error(`Local video file not found: ${localSourcePath}`);
          }
        } else {
          await downloadFile(visualUrl, imagePath);
        }
      } catch (downloadError) {
        log(`Download failed: ${downloadError.message}. Using local fallback visual...`);
        const fallbackLocalPath = path.join(process.cwd(), "public", "videos", "rain_loop.mp4");
        const fallbackLogoPath = path.join(process.cwd(), "public", "dokkaebi_logo.png");
        
        if (fs.existsSync(fallbackLocalPath)) {
          fs.copyFileSync(fallbackLocalPath, imagePath);
        } else if (fs.existsSync(fallbackLogoPath)) {
          fs.copyFileSync(fallbackLogoPath, imagePath);
        } else {
          const synthesizeCmd = `ffmpeg -f lavfi -i "color=c=0x0a0612:s=1280x720:d=8" -vframes 1 -y "${imagePath}"`;
          await new Promise((res, rej) => exec(synthesizeCmd, (err) => (err ? rej(err) : res())));
        }
      }
      
      if (!fs.existsSync(imagePath)) {
        const fallbackLogoPath = path.join(process.cwd(), "public", "dokkaebi_logo.png");
        if (fs.existsSync(fallbackLogoPath)) {
          fs.copyFileSync(fallbackLogoPath, imagePath);
        }
      }
      log("AI Video Loop secured.");

      // 5. Prepare Ambient Track
      const ambientPath = path.join(publicAudioDir, `${ambientType}.mp3`);
      if (ambientType !== "none" && !fs.existsSync(ambientPath)) {
        log(`Generating synthesized ambient sound layer (${ambientType})...`);
        await generateSynthesizedAmbient(ambientPath, 120);
        log("Ambient layer synthesized.");
      }

      // 6. Prepare Music Tracks in Strict 1..20 Order
      log("Preparing audio compilation in strict 1..20 track order...");
      const baseTracks = [];
      const customTracks = body.customTracks || {}; // Map of { 1: base64/url, 2: base64/url... }
      const totalTracksToBuild = isTestMode ? 2 : 20;

      for (let i = 0; i < totalTracksToBuild; i++) {
        const trackNum = i + 1;
        const trackPath = path.join(tempDir, `track_${i}.mp3`);
        const customData = customTracks[trackNum] || customTracks[i];

        if (customData) {
          log(`Using custom uploaded audio for Track ${String(trackNum).padStart(2, "0")}...`);
          try {
            if (customData.startsWith("data:")) {
              const base64Audio = customData.split(";base64,").pop();
              fs.writeFileSync(trackPath, Buffer.from(base64Audio, "base64"));
            } else if (customData.startsWith("http")) {
              await downloadFile(customData, trackPath);
            } else if (fs.existsSync(customData)) {
              fs.copyFileSync(customData, trackPath);
            }
          } catch (e) {
            log(`Failed to process custom audio for Track ${trackNum}: ${e.message}. Synthesizing fallback...`);
            await generateSynthesizedTrack(trackPath, 180, i);
          }
        } else {
          log(`Synthesizing Lofi Track ${String(trackNum).padStart(2, "0")}/20...`);
          const duration = isTestMode ? 45 : 70;
          await generateSynthesizedTrack(trackPath, duration, i);

          if (!isTestMode) {
            const loopedTrackPath = path.join(tempDir, `track_${i}_looped.mp3`);
            const loopCmd = `ffmpeg -i "concat:${trackPath}|${trackPath}|${trackPath}" -acodec copy -y "${loopedTrackPath}"`;
            await new Promise((res, rej) => {
              exec(loopCmd, (err) => (err ? rej(err) : res()));
            });
            fs.copyFileSync(loopedTrackPath, trackPath);
          }
        }
        baseTracks.push(trackPath);
      }

      // Multi-hour sequence repetition: 1hr -> 1x (1..20), 2hr -> 2x (1..20, 1..20), 3hr -> 3x
      let finalTracks = [];
      const repeatCount = Math.max(parseInt(durationHours, 10) || 1, 1);
      for (let r = 0; r < repeatCount; r++) {
        finalTracks = finalTracks.concat(baseTracks);
      }
      log(`Compiled ${finalTracks.length} track(s) for ${repeatCount}-hour video rendering.`);

      // 7. Render Video via FFmpeg
      const videoName = `Seoul_Lofi_${Date.now()}.mp4`;
      const videoPath = path.join(outputDir, videoName);

      log("Executing FFmpeg render engine. Please wait, compiling streams...");
      await ffmpegHelper.renderVideo({
        imagePath,
        audioTracks: finalTracks,
        ambientType,
        ambientVolume,
        audioEffect,
        outputPath: videoPath,
        onProgress: (pct) => {
          updateProgress(pct);
        },
        onLog: (text) => {
          log(text);
        }
      });

      // 8. Write final success status
      log("Rendering complete!");
      const finalStatus = {
        status: "success",
        progress: 100,
        videoPath: videoPath,
        videoName: videoName,
        log: logs.join("\n")
      };
      fs.writeFileSync(statusPath, JSON.stringify(finalStatus, null, 2), "utf-8");

      // Save to library file
      const libraryPath = path.join(outputDir, "library.json");
      let library = [];
      if (fs.existsSync(libraryPath)) {
        try {
          library = JSON.parse(fs.readFileSync(libraryPath, "utf-8"));
        } catch (e) {
          library = [];
        }
      }
      library.unshift({
        id: Date.now().toString(),
        name: videoName,
        path: videoPath,
        createdAt: new Date().toISOString(),
        genre,
        theme,
        duration: isTestMode ? "00:01:30" : `${durationHours}:00:00`
      });
      fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2), "utf-8");

    } catch (error) {
      log(`Error during rendering: ${error.message}`);
      const errStatus = {
        status: "error",
        progress: 0,
        log: logs.join("\n") + `\nFatal Error: ${error.message}`
      };
      fs.writeFileSync(statusPath, JSON.stringify(errStatus, null, 2), "utf-8");
    }
  })();

  return NextResponse.json({
    success: true,
    message: "Video rendering job successfully queued in background."
  });
}
