const fs = require("fs");
const path = require("path");

class KaggleHelper {
  constructor() {
    // .env.local에 KAGGLER_USERNAME 또는 KAGGLE_USERNAME 둘 다 지원
    this.username = process.env.KAGGLE_USERNAME || process.env.KAGGLER_USERNAME;
    this.key = process.env.KAGGLE_KEY || process.env.KAGGLER_KEY;
  }

  _getAuthHeader() {
    const authBuffer = Buffer.from(`${this.username}:${this.key}`).toString("base64");
    return `Basic ${authBuffer}`;
  }

  _checkCredentials() {
    if (!this.username || !this.key) {
      throw new Error("KAGGLE_USERNAME 또는 KAGGLE_KEY 환경 변수가 설정되지 않았습니다.");
    }
  }

  /**
   * 기존 메서드: 풀 로파이 영상(1~3시간) 렌더링용 커널 전송
   */
  async pushRenderKernel({ title, durationHours, veoPrompt, audioUrls }) {
    this._checkCredentials();
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const templatePath = path.join(process.cwd(), "src", "utils", "kaggle_render_kernel.py");
    let scriptContent = fs.readFileSync(templatePath, "utf-8");

    const audioUrlsPy = JSON.stringify(audioUrls);
    scriptContent = scriptContent
      .replace("{{VIDEO_TITLE}}", title)
      .replace("{{DURATION_HOURS}}", durationHours)
      .replace("{{VEO_PROMPT}}", veoPrompt.replace(/"/g, '\\"'))
      .replace("{{AUDIO_URLS}}", audioUrlsPy)
      .replace("{{GEMINI_API_KEY}}", geminiApiKey);

    const payload = {
      newTitle: title,
      code: scriptContent,
      language: "python",
      kernelType: "script",
      isPrivate: true,
      enableGpu: true,
      enableInternet: true,
      datasetSources: [],
      competitionSources: [],
      kernelSources: []
    };

    const response = await fetch("https://www.kaggle.com/api/v1/kernels/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this._getAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Kaggle API Error (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
    }

    console.log(`[Kaggle] Full Render Kernel pushed: ${data.url}`);
    return data;
  }

  /**
   * 신규: 8초 영상 전용 커널 전송
   * @param {string} prompt - 영문 영상 프롬프트
   * @param {string} outputFileName - 출력 파일명 (예: 8sec_1234567890.mp4)
   * @returns {{ slug, ref, url }} Kaggle 커널 정보
   */
  async push8SecKernel({ prompt, outputFileName }) {
    this._checkCredentials();
    const geminiApiKey = process.env.GEMINI_API_KEY;

    const templatePath = path.join(process.cwd(), "src", "utils", "kaggle_8sec_kernel.py");
    let scriptContent = fs.readFileSync(templatePath, "utf-8");

    scriptContent = scriptContent
      .replace("{{VIDEO_PROMPT}}", prompt.replace(/"/g, '\\"'))
      .replace("{{GEMINI_API_KEY}}", geminiApiKey)
      .replace("{{OUTPUT_FILENAME}}", outputFileName);

    // 슬러그: 타임스탬프 기반 (항상 고유)
    const ts = Date.now();
    const slug = `seoul-lofi-8sec-${ts}`.slice(0, 50);
    const title = `Seoul Lofi 8sec ${ts}`;

    const payload = {
      newTitle: title,
      code: scriptContent,
      language: "python",
      kernelType: "script",
      isPrivate: true,
      enableGpu: true,
      enableInternet: true,
      datasetSources: [],
      competitionSources: [],
      kernelSources: []
    };

    console.log(`[Kaggle 8sec] Pushing new kernel: ${title}`);

    const response = await fetch("https://www.kaggle.com/api/v1/kernels/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": this._getAuthHeader()
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Kaggle push 실패 (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
    }

    // ref 형식: "username/slug" → slug 추출
    const ref = data.ref || "";
    const actualSlug = ref.split("/")[1] || slug;

    console.log(`[Kaggle 8sec] Push 성공! ref=${ref}, URL: ${data.url}`);
    return { slug: actualSlug, ref, url: data.url };
  }

  /**
   * 신규: Kaggle 커널 실행 상태 조회
   * @param {string} slug - 커널 슬러그
   * @returns {{ status: 'complete'|'running'|'queued'|'error', rawData }}
   */
  async getKernelStatus(slug) {
    this._checkCredentials();

    const url = `https://www.kaggle.com/api/v1/kernels/${this.username}/${slug}`;
    const response = await fetch(url, {
      headers: { "Authorization": this._getAuthHeader() }
    });

    if (!response.ok) {
      throw new Error(`Kaggle 상태 조회 실패 (${response.status})`);
    }

    const data = await response.json();
    // runningStatus: "complete" | "running" | "queued" | "error" | "cancelAcknowledged"
    const status = (
      data.currentRunningVersion?.runningStatus ||
      data.status ||
      "queued"
    ).toLowerCase();

    return { status, rawData: data };
  }

  /**
   * 신규: Kaggle 커널 출력 파일 다운로드 → 로컬에 저장
   * @param {string} slug - 커널 슬러그
   * @param {string} outputFileName - 찾을 파일명
   * @param {string} destPath - 로컬 저장 경로
   */
  async downloadKernelOutput(slug, outputFileName, destPath) {
    this._checkCredentials();

    // 1. 출력 파일 목록 조회
    const listUrl = `https://www.kaggle.com/api/v1/kernels/${this.username}/${slug}/output`;
    const listRes = await fetch(listUrl, {
      headers: { "Authorization": this._getAuthHeader() }
    });

    if (!listRes.ok) {
      throw new Error(`Kaggle 출력 목록 조회 실패 (${listRes.status})`);
    }

    const listData = await listRes.json();
    console.log(`[Kaggle Output] 파일 목록:`, JSON.stringify(listData).slice(0, 300));

    // 파일 목록에서 대상 파일 찾기 (다양한 응답 구조 대응)
    const files = listData.files || listData.outputs || listData.results || [];
    const targetFile = files.find(f =>
      (f.name && f.name === outputFileName) ||
      (f.ref && f.ref.endsWith(outputFileName)) ||
      (f.fileName && f.fileName === outputFileName)
    );

    if (!targetFile) {
      throw new Error(`출력 파일 "${outputFileName}"를 Kaggle 결과에서 찾을 수 없습니다. 파일 목록: ${JSON.stringify(files).slice(0, 200)}`);
    }

    // 2. 파일 다운로드
    const dlUrl = targetFile.url || targetFile.downloadUrl || targetFile.ref;
    console.log(`[Kaggle Output] 다운로드 시작: ${dlUrl}`);

    const dlRes = await fetch(dlUrl, {
      headers: { "Authorization": this._getAuthHeader() }
    });

    if (!dlRes.ok) {
      throw new Error(`파일 다운로드 실패 (${dlRes.status})`);
    }

    const buffer = Buffer.from(await dlRes.arrayBuffer());
    fs.writeFileSync(destPath, buffer);

    console.log(`[Kaggle Output] 저장 완료: ${destPath} (${buffer.length} bytes)`);
    return destPath;
  }
}

module.exports = new KaggleHelper();
