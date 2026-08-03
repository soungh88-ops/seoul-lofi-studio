const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

class FFmpegHelper {
  constructor() {
    this.ffmpegPath = "ffmpeg"; // Assume in PATH by default
  }

  /**
   * Checks if FFmpeg is installed and accessible.
   */
  async checkFFmpeg() {
    return new Promise((resolve) => {
      exec(`${this.ffmpegPath} -version`, (error, stdout) => {
        if (error) {
          console.warn("FFmpeg not found in system PATH. Attempting to look for local binaries...");
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
   * Applies Slowed + Reverb effect to an audio file
   * Slows tempo to 88% (and lowers pitch), then applies a warm retro echo.
   */
  getSlowedReverbFilter() {
    // asetrate: slows down sample rate (lowers pitch and speed)
    // aresample: resamples back to standard 44.1kHz
    // aecho: adds room reverb (in_gain, out_gain, delay, decay)
    return "asetrate=44100*0.88,aresample=44100,aecho=0.8:0.88:60:0.4";
  }

  /**
   * Applies Bass Boost effect to an audio file
   */
  getBassBoostFilter() {
    // bass=g=10: boost low-end frequencies by 10dB
    return "bass=g=10:f=80:w=0.5";
  }

  /**
   * Renders the final video.
   * Steps:
   * 1. Concatenates music tracks with crossfades.
   * 2. Mixes in ambient background audio (at 12% volume).
   * 3. Loops background image/video.
   * 4. Renders output MP4.
   */
  renderVideo({
    imagePath,
    audioTracks, // Array of absolute file paths to MP3s
    ambientType, // 'rain', 'crackle', 'city', 'cafe', 'shaman', or 'none'
    ambientVolume = 0.12,
    audioEffect = "none", // 'none', 'slowed', 'bass'
    enablePingPongLoop = true, // 1등 추천: 핑퐁 리버스 (0초->8초->0초) 무한 무절단 루프 엔진
    enableNeonDokkaebi = true, // 👹 오디오 반응형 네온 도깨비 스티커
    outputPath,
    onProgress, // callback(percentage)
    onLog // callback(logText)
  }) {
    return new Promise(async (resolve, reject) => {
      const isAvailable = await this.checkFFmpeg();
      if (!isAvailable) {
        return reject(new Error("FFmpeg is not installed or not found in system PATH. Please install FFmpeg to render videos."));
      }

      if (!audioTracks || audioTracks.length === 0) {
        return reject(new Error("No audio tracks provided."));
      }

      onLog("Starting video rendering process (with 핑퐁 리버스 Seamless Loop Engine)...");

      // Calculate exact total duration to prevent infinite loops from hanging -shortest
      let totalDuration = 3600; // default 1 hour fallback
      try {
        onLog("Calculating audio track durations via ffprobe...");
        const durations = await Promise.all(audioTracks.map(track => {
          return new Promise((res) => {
            exec(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${track}"`, (err, stdout) => {
              if (err) res(180);
              else {
                const val = parseFloat(stdout.trim());
                res(isNaN(val) ? 180 : val);
              }
            });
          });
        }));
        const sumDurations = durations.reduce((a, b) => a + b, 0);
        const crossfadeOverlap = (audioTracks.length - 1) * 3;
        totalDuration = Math.max(Math.round(sumDurations - crossfadeOverlap), 1);
        onLog(`Total calculated music length: ${totalDuration}s`);
      } catch (durationErr) {
        onLog(`Warning: Failed to parse durations, falling back to 3600s: ${durationErr.message}`);
      }

      // 1. Resolve ambient track path
      let ambientPath = null;
      if (ambientType && ambientType !== "none") {
        const publicAudioDir = path.join(process.cwd(), "public", "audio");
        ambientPath = path.join(publicAudioDir, `${ambientType}.mp3`);
        
        // Ensure ambient track exists, if not, write a dummy silence or fallback
        if (!fs.existsSync(ambientPath)) {
          onLog(`Ambient sound "${ambientType}" not found at ${ambientPath}. Skipping ambient layer.`);
          ambientPath = null;
        }
      }

      // 2. Build FFmpeg command
      let cmdInputs = [];
      
      // Ensure background image/video exists
      if (!fs.existsSync(imagePath)) {
        onLog(`Warning: Background visual at ${imagePath} not found. Falling back to default logo...`);
        const defaultLogo = path.join(process.cwd(), "public", "dokkaebi_logo.png");
        if (fs.existsSync(defaultLogo)) {
          fs.copyFileSync(defaultLogo, imagePath);
        } else {
          return reject(new Error(`Background visual file not found: ${imagePath}`));
        }
      }

      // Input 0: Background Visual (Image, GIF, or Video Loop)
      const isVideoInput = imagePath.toLowerCase().endsWith(".mp4") || imagePath.toLowerCase().endsWith(".webm") || imagePath.toLowerCase().endsWith(".gif");
      if (isVideoInput) {
        if (enablePingPongLoop) {
          cmdInputs.push(`-i "${imagePath}"`);
        } else {
          cmdInputs.push(`-stream_loop -1 -i "${imagePath}"`);
        }
      } else {
        cmdInputs.push(`-loop 1 -r 2 -i "${imagePath}"`);
      }

      // Inputs 1..N: Audio Tracks (Preserve strict track order)
      audioTracks.forEach((track) => {
        cmdInputs.push(`-i "${track}"`);
      });

      // Optional Input: Ambient Audio
      let ambientInputIndex = -1;
      if (ambientPath) {
        cmdInputs.push(`-stream_loop -1 -i "${ambientPath}"`);
        ambientInputIndex = 1 + audioTracks.length;
      }

      // Optional Input: Dokkaebi Mascot Sticker Logo
      const dokkaebiLogoPath = path.join(process.cwd(), "public", "dokkaebi_logo.png");
      let dokkaebiInputIndex = -1;
      if (fs.existsSync(dokkaebiLogoPath)) {
        cmdInputs.push(`-i "${dokkaebiLogoPath}"`);
        dokkaebiInputIndex = 1 + audioTracks.length + (ambientPath ? 1 : 0);
      }

      // Build filter_complex
      let filterComplex = "";
      let baseVideoLabel = "0:v";

      // Video Ping-Pong Seamless Reverse Loop filter if video input
      if (isVideoInput && enablePingPongLoop) {
        filterComplex += `[0:v]split[v_fwd][v_tmp]; [v_tmp]reverse[v_rev]; [v_fwd][v_rev]concat=n=2:v=1:a=0[v_pingpong]; [v_pingpong]loop=loop=-1:size=32767:start=0[v_base]; `;
        baseVideoLabel = "[v_base]";
      }

      let finalVideoLabel = baseVideoLabel;

      const trackCount = audioTracks.length;

      // Concatenate audio tracks sequentially with crossfades
      if (trackCount === 1) {
        filterComplex += `[1:a]`;
      } else {
        const firstOutputLabel = trackCount === 2 ? "[music_concat]" : "[c1]";
        filterComplex += `[1:a][2:a]acrossfade=d=3${firstOutputLabel};`;
        for (let i = 2; i < trackCount; i++) {
          const prevLabel = `[c${i - 1}]`;
          const nextInput = `[${i + 1}:a]`;
          const nextLabel = i === trackCount - 1 ? "[music_concat]" : `[c${i}]`;
          filterComplex += ` ${prevLabel}${nextInput}acrossfade=d=3${nextLabel};`;
        }
      }

      const musicLabel = trackCount === 1 ? "[1:a]" : "[music_concat]";
      let finalAudioLabel = musicLabel;

      if (audioEffect === "slowed") {
        filterComplex += ` ${musicLabel}${this.getSlowedReverbFilter()}[fx_audio];`;
        finalAudioLabel = "[fx_audio]";
      } else if (audioEffect === "bass") {
        filterComplex += ` ${musicLabel}${this.getBassBoostFilter()}[fx_audio];`;
        finalAudioLabel = "[fx_audio]";
      }

      if (ambientPath) {
        const ambVolumeFilter = `[${ambientInputIndex}:a]volume=${ambientVolume}[amb_vol]`;
        filterComplex += ` ${ambVolumeFilter}; ${finalAudioLabel}volume=1.0[mus_vol]; [mus_vol][amb_vol]amix=inputs=2:duration=first[mixed_audio]`;
        finalAudioLabel = "[mixed_audio]";
      }

      let mappedAudioLabel = finalAudioLabel;
      if (enableNeonDokkaebi && dokkaebiInputIndex !== -1) {
        // Split final audio: one for final render, one for driving showwaves visual
        filterComplex += `; ${finalAudioLabel}asplit=2[audio_out][audio_wave]`;
        mappedAudioLabel = "[audio_out]";

        // Generate glowing neon audio spectrum wave (centered line mode, green/cyan glow)
        filterComplex += `; [audio_wave]showwaves=s=160x160:mode=cline:colors=0x00FF66|0x00FFFF:draw=full[wave]`;
        filterComplex += `; [wave]format=rgba,colorchannelmixer=aa=0.45[wave_trans]`;
        
        // Scale logo & Overlay the pulsing wave and then the logo
        filterComplex += `; [${dokkaebiInputIndex}:v]scale=160:160[dok_scaled]`;
        filterComplex += `; ${baseVideoLabel}[wave_trans]overlay=40:40[v_wave_over]`;
        filterComplex += `; [v_wave_over][dok_scaled]overlay=40:40[v_dok_over]`;
        finalVideoLabel = "[v_dok_over]";
      } else if (dokkaebiInputIndex !== -1) {
        // Simple static overlay if neon is disabled
        filterComplex += `; [${dokkaebiInputIndex}:v]scale=160:160[dok_scaled]; ${baseVideoLabel}[dok_scaled]overlay=40:40[v_dok_over]`;
        finalVideoLabel = "[v_dok_over]";
      }

      const complexOption = `-filter_complex "${filterComplex.trim()}"`;
      
      const cmd = [
        this.ffmpegPath,
        cmdInputs.join(" "),
        complexOption,
        `-map "${finalVideoLabel}"`,
        `-map "${mappedAudioLabel}"`,
        `-c:v libx264`,
        `-tune stillimage`,
        `-pix_fmt yuv420p`,
        `-movflags +faststart`,
        `-c:a aac`,
        `-b:a 192k`,
        `-t ${totalDuration}`,
        `-y`,
        `"${outputPath}"`
      ].join(" ");

      onLog(`Running FFmpeg command:\n${cmd}`);

      const proc = exec(cmd, { maxBuffer: 1024 * 1024 * 50 });

      proc.stdout.on("data", (data) => {
        onLog(data.toString());
      });

      proc.stderr.on("data", (data) => {
        const text = data.toString();
        
        // Log progress without clogging status file
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseInt(timeMatch[3], 10);
          const currentSeconds = hours * 3600 + minutes * 60 + seconds;
          
          const totalEstimate = Math.max(totalDuration, 1);
          const percentage = Math.min(Math.round((currentSeconds / totalEstimate) * 100), 99);
          onProgress(percentage);
        } else {
          onLog(text);
        }
      });

      proc.on("close", (code) => {
        const fileCreatedSuccessfully = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 100000;

        if (code === 0 && fileCreatedSuccessfully) {
          onProgress(100);
          onLog("FFmpeg video rendering completed successfully!");
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });
    });
  }
}

module.exports = new FFmpegHelper();
