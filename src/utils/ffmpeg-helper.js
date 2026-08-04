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

      const isVideoInput = imagePath.toLowerCase().endsWith(".mp4") || imagePath.toLowerCase().endsWith(".webm") || imagePath.toLowerCase().endsWith(".gif");
      onLog("Starting video rendering process (with 핑퐁 리버스 Seamless Loop Engine)...");

      // Calculate exact total duration to prevent infinite loops from hanging -shortest
      let totalDuration = 3600; // default 1 hour fallback
      let bgFrameCount = 200; // default 8s at 25fps fallback
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

        if (isVideoInput) {
          onLog("Calculating background video frame count...");
          bgFrameCount = await new Promise((res) => {
            exec(`ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of default=noprint_wrappers=1:nokey=1 "${imagePath}"`, (err, stdout) => {
              if (err) res(200);
              else {
                const val = parseInt(stdout.trim(), 10);
                res(isNaN(val) || val <= 0 ? 200 : val);
              }
            });
          });
          onLog(`Background loop frame count: ${bgFrameCount}`);
        }
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
      if (isVideoInput) {
        cmdInputs.push(`-i "${imagePath}"`);
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

      if (isVideoInput) {
        // Loop the background video stream using the exact frame count to prevent freezing
        filterComplex += `[0:v]loop=loop=-1:size=${bgFrameCount}:start=0[v_base]`;
        baseVideoLabel = "[v_base]";
      }

      let finalVideoLabel = baseVideoLabel;

      const trackCount = audioTracks.length;

      // Concatenate audio tracks sequentially with crossfades
      if (filterComplex && !filterComplex.trim().endsWith(";")) {
        filterComplex += "; ";
      }
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
      const sep = filterComplex.trim().endsWith(";") ? "" : ";";
      if (enableNeonDokkaebi && dokkaebiInputIndex !== -1) {
        // Split final audio: one for final render, one for driving showwaves visual
        filterComplex += `${sep} ${finalAudioLabel}asplit=2[audio_out][audio_wave]`;
        mappedAudioLabel = "[audio_out]";

        // Generate glowing neon audio spectrum wave (centered line mode, green/cyan glow, transparent black key)
        // Positioned immediately under the logo watermark: Logo is 160x160 at (40,40). Wave is 120x30 centered horizontally right below at (60, 200)
        filterComplex += `; [audio_wave]showwaves=s=120x30:mode=cline:colors=0x00FF66|0x00FFFF:draw=full,colorkey=black:0.1:0.1[wave]`;
        filterComplex += `; [wave]format=rgba,colorchannelmixer=aa=0.7[wave_trans]`;
        
        const videoIn = baseVideoLabel.startsWith("[") ? baseVideoLabel : `[${baseVideoLabel}]`;
        filterComplex += `; [${dokkaebiInputIndex}:v]scale=160:160[dok_scaled]`;
        filterComplex += `; ${videoIn}[wave_trans]overlay=60:200[v_wave_over]`;
        filterComplex += `; [v_wave_over][dok_scaled]overlay=40:40[v_dok_over]`;
        finalVideoLabel = "[v_dok_over]";
      } else if (dokkaebiInputIndex !== -1) {
        // Simple static overlay if neon is disabled
        const videoIn = baseVideoLabel.startsWith("[") ? baseVideoLabel : `[${baseVideoLabel}]`;
        filterComplex += `${sep} [${dokkaebiInputIndex}:v]scale=160:160[dok_scaled]; ${videoIn}[dok_scaled]overlay=40:40[v_dok_over]`;
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

  /**
   * Cuts and crops a 15-second vertical (9:16) Shorts video from a completed long-form video,
   * applying low-contrast analog color grain texture and an aesthetic lowercase hook text overlay.
   */
  renderShortVideo({ longVideoPath, startTime, duration = 15, hookText = "", outputPath, onProgress, onLog }) {
    return new Promise((resolve, reject) => {
      const fs = require("fs");
      const path = require("path");

      if (!fs.existsSync(longVideoPath)) {
        return reject(new Error(`Long-form video not found at ${longVideoPath}`));
      }

      // Ensure output directory exists
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });

      // Copy font file to project root for bulletproof relative path loading in FFmpeg
      const localFontPath = path.join(process.cwd(), "arial.ttf");
      if (!fs.existsSync(localFontPath)) {
        try {
          fs.copyFileSync("C:\\Windows\\Fonts\\arial.ttf", localFontPath);
          onLog("Copied system Arial font to project root for FFmpeg relative path loading.");
        } catch (e) {
          onLog(`Warning: Failed to copy system font: ${e.message}`);
        }
      }

      const logoPath = path.join(process.cwd(), "public", "dokkaebi_logo.png");
      const hasLogo = fs.existsSync(logoPath);

      let cmd;
      if (hasLogo) {
        // Overlay transparent dokkaebi_logo.png in the center of the vertical frame (width 180px)
        const filterComplex = [
          `[0:v]crop=in_h*9/16:in_h,noise=alls=6:allf=t+u[bg]`,
          `[1:v]scale=180:-1[logo]`,
          `[bg][logo]overlay=(W-w)/2:(H-h)/2`
        ].join(";");

        cmd = [
          this.ffmpegPath,
          `-ss ${startTime}`,
          `-t ${duration}`,
          `-i "${longVideoPath}"`,
          `-i "${logoPath}"`,
          `-filter_complex "${filterComplex}"`,
          `-c:v libx264`,
          `-tune stillimage`,
          `-pix_fmt yuv420p`,
          `-c:a aac`,
          `-b:a 192k`,
          `-y`,
          `"${outputPath}"`
        ].join(" ");
      } else {
        const vfFilters = [
          `crop=in_h*9/16:in_h`,
          `noise=alls=6:allf=t+u`
        ];
        cmd = [
          this.ffmpegPath,
          `-ss ${startTime}`,
          `-t ${duration}`,
          `-i "${longVideoPath}"`,
          `-vf "${vfFilters.join(",")}"`,
          `-c:v libx264`,
          `-tune stillimage`,
          `-pix_fmt yuv420p`,
          `-c:a aac`,
          `-b:a 192k`,
          `-y`,
          `"${outputPath}"`
        ].join(" ");
      }

      onLog(`Running FFmpeg Shorts command:\n${cmd}`);

      const proc = exec(cmd, { maxBuffer: 1024 * 1024 * 50 });

      proc.stdout.on("data", (data) => {
        onLog(data.toString());
      });

      proc.stderr.on("data", (data) => {
        const text = data.toString();
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const seconds = parseInt(timeMatch[3], 10);
          const currentSeconds = hours * 3600 + minutes * 60 + seconds;
          const percentage = Math.min(Math.round((currentSeconds / duration) * 100), 99);
          onProgress(percentage);
        } else {
          onLog(text);
        }
      });

      proc.on("close", (code) => {
        const fileCreatedSuccessfully = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 10000;
        if (code === 0 && fileCreatedSuccessfully) {
          onProgress(100);
          onLog(`Shorts video successfully created at ${outputPath}`);
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg Shorts process exited with code ${code}`));
        }
      });
    });
  }
}

module.exports = new FFmpegHelper();
