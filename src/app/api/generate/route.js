import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
// Next.js hot-reload cache buster: 2026-08-04T07:53:00
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
    log: "Starting Kaggle Cloud Rendering System...\n"
  };
  fs.writeFileSync(statusPath, JSON.stringify(initialStatus, null, 2), "utf-8");

  // Asynchronous background execution
  (async () => {
    const logs = [];
    const log = (text) => {
      console.log(text);
      logs.push(`[${new Date().toLocaleTimeString()}] ${text}`);
      if (logs.length > 150) logs.shift();

      const currentStatus = {
        status: "rendering",
        progress: initialStatus.progress,
        log: logs.join("\n")
      };
      try {
        fs.writeFileSync(statusPath, JSON.stringify(currentStatus, null, 2), "utf-8");
      } catch (e) {}
    };

    try {
      log(`Setting up Local FFmpeg 4K rendering pipeline.`);
      log(`Selected Genre: ${genre}, Theme: ${theme}`);

      const customTracks = body.customTracks || {};
      const totalTracks = isTestMode ? 2 : (trackCount || 20);
      const resolvedAudioPaths = [];

      for (let i = 0; i < totalTracks; i++) {
        const trackNum = i + 1;
        const numStr = String(trackNum).padStart(2, "0");
        const diskPath = path.join(process.cwd(), "public", "audio", `custom_track_${numStr}.mp3`);

        const customItem = customTracks[trackNum] || customTracks[String(trackNum)] || customTracks[i];
        let customUrl = null;
        if (typeof customItem === "string") {
          customUrl = customItem;
        } else if (customItem && typeof customItem === "object") {
          customUrl = customItem.url || customItem.data;
        }

        if (fs.existsSync(diskPath)) {
          resolvedAudioPaths.push(diskPath);
        } else if (customUrl && typeof customUrl === "string" && customUrl.startsWith("data:audio")) {
          const base64Clean = customUrl.replace(/^data:audio\/[a-zA-Z0-9]+;base64,/, "");
          fs.writeFileSync(diskPath, Buffer.from(base64Clean, "base64"));
          resolvedAudioPaths.push(diskPath);
        } else if (customUrl && typeof customUrl === "string" && customUrl.startsWith("http")) {
          resolvedAudioPaths.push(customUrl);
        } else {
          const sampleMp3 = path.join(process.cwd(), "public", "audio", `sample_track_${(i % 3) + 1}.mp3`);
          if (!fs.existsSync(sampleMp3)) {
            await generateSynthesizedTrack(sampleMp3, 180, i);
          }
          resolvedAudioPaths.push(sampleMp3);
        }
      }

      // Determine local visual background video
      const defaultVideo = path.join(process.cwd(), "public", "videos", "donggung_palace_rain_8s.mp4");
      const defaultImage = path.join(process.cwd(), "public", "donggung_palace_rain_master.jpg");
      const bgVisualPath = fs.existsSync(defaultVideo) ? defaultVideo : defaultImage;

      const outputFileName = `Seoul_Lofi_${Date.now()}.mp4`;
      const finalMp4Path = path.join(outputDir, outputFileName);

      const enableNeonDokkaebi = body.enableNeonDokkaebi !== false;
      log("Executing Local FFmpeg Seamless 4K Renderer...");
      await ffmpegHelper.renderVideo({
        imagePath: bgVisualPath,
        audioTracks: resolvedAudioPaths,
        ambientType: ambientType,
        ambientVolume: ambientVolume,
        audioEffect: audioEffect,
        enableNeonDokkaebi: enableNeonDokkaebi,
        outputPath: finalMp4Path,
        onProgress: (p) => {
          log(`Local Render Progress: ${p}%`);
        },
        onLog: (l) => log(l)
      });

      // Copy finished MP4 to public/videos/ for 100% instant native webview streaming
      const publicVideoPath = path.join(process.cwd(), "public", "videos", outputFileName);
      try {
        fs.copyFileSync(finalMp4Path, publicVideoPath);
      } catch (e) {
        console.warn("Failed to copy to public/videos:", e);
      }

      const finalStatus = {
        status: "success",
        progress: 100,
        videoPath: `/videos/${outputFileName}`,
        videoName: outputFileName,
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
      
      // Prevent duplicates by overwriting existing scanned entries of the same name
      const existingIndex = library.findIndex((item) => item.name === outputFileName);
      const newEntry = {
        id: existingIndex >= 0 ? library[existingIndex].id : Date.now().toString(),
        name: outputFileName,
        path: `/videos/${outputFileName}`,
        createdAt: new Date().toISOString(),
        genre,
        theme,
        duration: `${durationHours}:00:00`
      };
      
      if (existingIndex >= 0) {
        library[existingIndex] = newEntry;
      } else {
        library.unshift(newEntry);
      }
      fs.writeFileSync(libraryPath, JSON.stringify(library, null, 2), "utf-8");

    } catch (error) {
      log(`Error during Kaggle execution: ${error.message}`);
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
    message: "Kaggle rendering job successfully queued in background."
  });
}
