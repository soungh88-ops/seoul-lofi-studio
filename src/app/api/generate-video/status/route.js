import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
const kaggleHelper = require("@/utils/kaggle-helper");

/**
 * GET /api/generate-video/status?name=kaggle-8sec-{slug}|{outputFileName}
 * Kaggle 8초 영상 생성 커널 상태 폴링.
 * 완료 시 Kaggle 출력 파일을 서버 output/ 폴더로 다운로드 → /api/video/파일명 반환.
 * 다운로드 실패 시 FFmpeg으로 빗금 없는 클린 플레이스홀더 생성.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationName = searchParams.get("name");

    if (!operationName) {
      return NextResponse.json({ error: "name 파라미터가 필요합니다." }, { status: 400 });
    }

    // ── Kaggle 8초 영상 작업 처리 ──────────────────────────────────────────
    if (operationName.startsWith("kaggle-8sec-")) {
      const rest = operationName.slice("kaggle-8sec-".length); // "slug|filename"
      const pipeIdx = rest.indexOf("|");

      if (pipeIdx === -1) {
        return NextResponse.json({ error: "operationName 형식 오류 (slug|filename 필요)" }, { status: 400 });
      }

      const slug = rest.slice(0, pipeIdx);
      const outputFileName = rest.slice(pipeIdx + 1);

      console.log(`[video/status] Kaggle 폴링: slug=${slug}, file=${outputFileName}`);

      // Kaggle 커널 상태 조회
      let statusInfo;
      try {
        statusInfo = await kaggleHelper.getKernelStatus(slug);
      } catch (statusErr) {
        console.error("[video/status] Kaggle 상태 조회 실패:", statusErr.message);
        return NextResponse.json({ done: false, log: `상태 조회 중... (${statusErr.message})` });
      }

      const { status } = statusInfo;
      console.log(`[video/status] Kaggle 상태: ${status}`);

      // 실행 중 또는 대기 중
      if (status === "running" || status === "queued") {
        return NextResponse.json({ done: false, log: `Kaggle GPU 처리 중... (${status})` });
      }

      // 오류 발생 → 클린 FFmpeg 플레이스홀더 생성
      if (status === "error" || status === "cancelacknowledged" || status === "cancel") {
        console.warn(`[video/status] Kaggle 커널 오류: ${status} → FFmpeg 클린 폴백 생성`);
        const fallbackUrl = await generateCleanFallback(outputFileName);
        return NextResponse.json({
          done: true,
          videoUrl: fallbackUrl,
          log: `⚠️ Kaggle 오류(${status}) → 클린 폴백 영상으로 대체됨`
        });
      }

      // 완료! → 출력 파일 다운로드
      if (status === "complete") {
        const outputDir = path.join(process.cwd(), "output");
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const destPath = path.join(outputDir, outputFileName);

        try {
          console.log(`[video/status] Kaggle 출력 파일 다운로드 시작: ${outputFileName}`);
          await kaggleHelper.downloadKernelOutput(slug, outputFileName, destPath);

          const sizeMB = (fs.statSync(destPath).size / (1024 * 1024)).toFixed(2);
          console.log(`[video/status] 다운로드 완료: ${destPath} (${sizeMB} MB)`);

          return NextResponse.json({
            done: true,
            videoUrl: `/api/video/${encodeURIComponent(outputFileName)}`,
            log: `✅ Kaggle 영상 생성 완료! (${sizeMB} MB)`
          });

        } catch (dlErr) {
          // 다운로드 실패 → FFmpeg 클린 플레이스홀더로 대체
          console.warn(`[video/status] Kaggle 출력 다운로드 실패: ${dlErr.message} → FFmpeg 클린 폴백`);
          const fallbackUrl = await generateCleanFallback(outputFileName);
          return NextResponse.json({
            done: true,
            videoUrl: fallbackUrl,
            log: `⚠️ Kaggle 다운로드 실패 → 클린 폴백 영상 사용 (다운로드 오류: ${dlErr.message})`
          });
        }
      }

      // 알 수 없는 상태 → 대기
      return NextResponse.json({ done: false, log: `Kaggle 상태: ${status}` });
    }

    // ── 기존 Veo Long Running Operation 폴링 (호환성 유지) ──────────────────
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "your_gemini_api_key_here") {
      return NextResponse.json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." }, { status: 500 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "Veo 상태 조회 실패" },
        { status: response.status }
      );
    }

    if (data.done) {
      if (data.error) {
        return NextResponse.json({ done: true, error: data.error.message || "비디오 렌더링 실패" });
      }

      const samples = data.response?.generateVideoResponse?.generatedSamples || [];
      let rawUri = null;
      if (samples.length > 0) {
        rawUri = samples[0]?.video?.uri || samples[0]?.uri;
      }

      if (rawUri) {
        const streamableUrl = rawUri.includes("key=") ? rawUri : `${rawUri}&key=${apiKey}`;
        return NextResponse.json({ done: true, videoUrl: streamableUrl });
      }

      return NextResponse.json({ done: true, error: "구글 비디오 파일 링크를 생성할 수 없습니다." });
    }

    return NextResponse.json({ done: false });

  } catch (error) {
    console.error("[generate-video/status error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * FFmpeg으로 빗금 없는 깨끗한 다크 배경 플레이스홀더 영상 생성.
 * Kaggle 실패 시 최후 보루. 딥 매트 블랙 (#0d0d14), 빗금 제로.
 */
async function generateCleanFallback(outputFileName) {
  return new Promise((resolve) => {
    const outputDir = path.join(process.cwd(), "output");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const destPath = path.join(outputDir, outputFileName);

    const cmd = [
      "ffmpeg", "-y",
      "-f", "lavfi",
      "-i", "color=c=0x0d0d14:s=1920x1080:r=30:d=8",
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      `"${destPath}"`
    ].join(" ");

    exec(cmd, (error) => {
      if (error) {
        console.error("[generateCleanFallback] FFmpeg 실패:", error.message);
        // FFmpeg도 없으면 drive_loop.mp4 폴백 (rain_loop은 빗금 있으므로 제외)
        resolve(`/videos/drive_loop.mp4`);
      } else {
        console.log(`[generateCleanFallback] 클린 플레이스홀더 생성: ${destPath}`);
        resolve(`/api/video/${encodeURIComponent(outputFileName)}`);
      }
    });
  });
}
