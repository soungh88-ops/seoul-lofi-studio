const fs = require("fs");
const path = require("path");

class KaggleHelper {
  constructor() {
    this.username = process.env.KAGGLE_USERNAME;
    this.key = process.env.KAGGLE_KEY;
  }

  async pushRenderKernel({ title, durationHours, veoPrompt, audioUrls }) {
    if (!this.username || !this.key) {
      throw new Error("KAGGLE_USERNAME 또는 KAGGLE_KEY 환경 변수가 설정되지 않았습니다.");
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    // 1. Read the kernel script template
    const templatePath = path.join(process.cwd(), "src", "utils", "kaggle_render_kernel.py");
    let scriptContent = fs.readFileSync(templatePath, "utf-8");

    // Convert audio URLs array to Python list string
    const audioUrlsPy = JSON.stringify(audioUrls);

    // 2. Inject parameters into the template
    scriptContent = scriptContent
      .replace("{{VIDEO_TITLE}}", title)
      .replace("{{DURATION_HOURS}}", durationHours)
      .replace("{{VEO_PROMPT}}", veoPrompt.replace(/"/g, '\\"'))
      .replace("{{AUDIO_URLS}}", audioUrlsPy)
      .replace("{{GEMINI_API_KEY}}", geminiApiKey);

    // 3. Prepare Kaggle KernelPushRequest payload
    const slug = title.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
    const payload = {
      id: `${this.username}/${slug}`,
      title: title,
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

    // 4. Authenticate using Basic Auth (username:key)
    const authBuffer = Buffer.from(`${this.username}:${this.key}`).toString("base64");
    const url = "https://www.kaggle.com/api/v1/kernels/push";

    console.log(`[Kaggle Remote Engine] Pushing kernel ${payload.id} to Kaggle API...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${authBuffer}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Kaggle API Error (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
    }

    console.log(`[Kaggle Remote Engine] Push Successful! Kernel URL: ${data.url}`);
    return data;
  }
}

module.exports = new KaggleHelper();
