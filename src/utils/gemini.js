const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Helper to call Gemini for text and SEO generation with authentic Korean Dokkaebi Heritage Philosophy
 */
class GeminiHelper {
  constructor() {
    this.activeKeyIndex = 0;
  }

  getApiKeys() {
    const keys = [];
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
      keys.push(process.env.GEMINI_API_KEY);
    }
    if (process.env.GEMINI_API_KEY_BACKUP && process.env.GEMINI_API_KEY_BACKUP !== "your_gemini_api_key_backup_here") {
      keys.push(process.env.GEMINI_API_KEY_BACKUP);
    }
    return keys.length > 0 ? keys : ["your_gemini_api_key_here"];
  }

  getActiveApiKey() {
    const keys = this.getApiKeys();
    const index = this.activeKeyIndex % keys.length;
    return keys[index];
  }

  rotateKey() {
    const keys = this.getApiKeys();
    this.activeKeyIndex = (this.activeKeyIndex + 1) % keys.length;
    console.log(`[Gemini API Key Rotated] Active key index is now: ${this.activeKeyIndex}`);
  }

  getGenAI() {
    const apiKey = this.getActiveApiKey();
    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      return new GoogleGenerativeAI(apiKey);
    }
    return null;
  }

  isConfigured() {
    return this.getGenAI() !== null;
  }

  async runWithRetry(fn, fallback = null) {
    const keys = this.getApiKeys();
    let lastError = null;
    for (let attempt = 0; attempt < keys.length; attempt++) {
      try {
        const genAI = this.getGenAI();
        if (!genAI) {
          throw new Error("Gemini AI client not configured.");
        }
        return await fn(genAI);
      } catch (err) {
        lastError = err;
        console.warn(`[Gemini execution failed with key index ${this.activeKeyIndex}]:`, err.message || err);
        this.rotateKey();
      }
    }
    if (fallback) return fallback;
    throw lastError;
  }

  async getWorkingGenerativeModel(genAI) {
    const apiKey = this.getActiveApiKey();
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const validModels = (data?.models || []).filter(m => 
          m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
        );
        if (validModels.length > 0) {
          const bestModel = validModels.find(m => m.name.includes("flash")) || validModels[0];
          const cleanName = bestModel.name.replace(/^models\//, "");
          return genAI.getGenerativeModel({ model: cleanName });
        }
      }
    } catch (e) {
      console.warn("[ListModels lookup warn]:", e.message);
    }
    return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  }

  /**
   * Generates authentic Dokkaebi Heritage YouTube Metadata (Title, Description with Lore Storytelling, Chapters, Tags)
   */
  async generateMetadata({ genre, theme, enHookTitle, trackCount = 20, durationHours = 1 }) {
    const defaultData = {
      title: `Deep Focus Korean Lofi | ${enHookTitle || theme || 'Midnight East Palace & Shamanic Beats'} (Official ${durationHours}-Hour Loop)`,
      description: `Objects remember human warmth. Music remembers human nights. From that memory, a Dokkaebi is born.

Unlike Japanese Oni, the Korean Dokkaebi belongs to a different cultural tradition. It is an ancient guardian spirit inspired by Bronze Age animism and shamanic lore.

📜 Historical & Cultural Inspiration:
• Prehistoric & Bronze Age: Inspired by ancient Animism & Shamanism—energy inhabiting nature and daily objects.
• 1st Century AD: Shamanic records of Dokkaebi worship in Korean history.
• 600s AD: The legend of Bihyeongrang who commanded Dokkaebis to build stone bridges in one night.
• 1447 AD: Recorded in Hangeul as 'Dot-gabi' (돗가비)—Master of Prosperity, Fire, and Health.

🔥 Endless Forms of Existence:
• As Sacred Fire (도깨비불): Floating mystic light driving away bad energy.
• As Everyday Humans: Walking among people, sharing laughs, and wrestling (씨름) for fun.
• As Infused Objects: Born from ancient Gayageums, worn-out broomsticks, and tools touched by human warmth.
• As SOUND & MUSIC: Existing as ethereal lofi beats that clear nightmares and anxiety.

🧹 Pure, Playful, yet Fiercely Just:
• Generous and warm to good-hearted people.
• Instantly perceiving evil intentions and delivering swift retribution.
• Wrestling (씨름) all night for fun, leaving humans dazed holding a worn-out old broomstick at dawn.

🎧 Experience the true living spirit of Korea tonight. A Dokkaebi guardian mask inspired by ancient Korean roof-tile motifs known as gwimyeonwa protects this space. 🛡️✨

🎶 Music composition & audio generation powered by Google Lyria 3.
📜 Concept, creative direction, track selection, arrangement, worldbuilding & visual production by Dokkaebi Lofi Studio.

#lofi #studybeats #koreanlofi #dokkaebi #deepsleep #focus #shamanism #kculture`,
      tags: ["lofi", "korean lofi", "dokkaebi lofi", "study beats", "deep sleep", "focus music", "shamanism lofi", "kculture", "donggung lofi"],
      chapters: Array.from({ length: trackCount }, (_, i) => ({
        time: `${Math.floor((i * 3) / 60).toString().padStart(2, '0')}:${((i * 3) % 60).toString().padStart(2, '0')}`,
        title: `Track ${String(i + 1).padStart(2, '0')} - Dokkaebi Heritage Chapter ${i + 1}`
      })),
      thumbnails: [
        { type: "A_Mood", text: "", prompt: "Cozy Korean Hanok room at night, rain falling outside, warm candle light, peaceful lofi aesthetic, NO text" },
        { type: "B_Contrast", text: "Deep Focus", prompt: "Dark mysterious background with glowing Gayageum or traditional Gat hat in bright orange/yellow tones, striking contrast, bold text" },
        { type: "C_Character", text: "", prompt: "Close up of a friendly Dokkaebi spirit wearing a Gat hat, smiling softly while working on a scroll, emotional connection, NO text" }
      ],
      shortsVisualPrompt: "First 1 second: a close-up of a worn-out old broomstick. Next 2 seconds: smooth cel animation transformation into a majestic Dokkaebi spirit wearing a Gat hat, dancing to a 90 BPM beat."
    };

    return this.runWithRetry(async (genAI) => {
      const model = await this.getWorkingGenerativeModel(genAI);
      const prompt = `You are the Master Creative Director for "Dokkaebi Lofi" (도깨비 로파이 스튜디오).
Generate YouTube metadata for theme: "${enHookTitle || theme}".

STRICT RULES & BRAND TONE:
1. Title MUST be Function-first. Format: "[Function] Lofi | [Worldbuilding/Theme Name]" (e.g., "Deep Focus Korean Lofi | Dokkaebi's Night Workshop").
2. ALL output fields (title, description, tags, thumbnails, and prompts) MUST be written in 100% English. DO NOT use any Korean (Hangul) characters under any circumstances. If the input theme is in Korean, translate it to English.
3. Description MUST include:
   - Slogan: "Objects remember human warmth. Music remembers human nights. From that memory, a Dokkaebi is born."
   - Cultural explanation without hostility (e.g., "Dokkaebi and Oni belong to different cultural traditions").
   - Mention the 4 forms: Fire, Human, Objects, Music.
   - Mention "A Dokkaebi guardian mask inspired by ancient Korean roof-tile motifs known as gwimyeonwa."
   - AI Transparency Clause EXACTLY as:
     "🎶 Music composition & audio generation powered by Google Lyria 3.\n📜 Concept, creative direction, track selection, arrangement, worldbuilding & visual production by Dokkaebi Lofi Studio."
4. NO EXAGGERATED CLAIMS. Do not promise guaranteed wealth or miracle cures. Focus on cultural inspiration and cozy ambiance.
5. Output strictly valid JSON with keys: 
   - "title" (string)
   - "description" (string)
   - "tags" (array of strings)
   - "chapters" (array of {time, title})
   - "thumbnails" (array of 3 objects: {type: 'A_Mood' | 'B_Contrast' | 'C_Character', text: 'up to 3 words or empty', prompt: 'visual description for Midjourney'})
   - "shortsVisualPrompt" (string: 15-30s hook description, e.g. "First 1s: close up of object. Next 2s: transformation into Dokkaebi.")

JSON:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }, defaultData);
  }

  /**
   * Generates 20-Track Storytelling Prompts with Korean Dokkaebi Lore & Visual Specs
   */
  async generateMusicPrompts({ genre, theme, trackCount = 20 }) {
    const defaultPrompts = {
      theme: theme || "Dokkaebi Lofi Shamanic Heritage",
      prompts: Array.from({ length: trackCount }, (_, i) => ({
        trackNumber: i + 1,
        title: `Dokkaebi Heritage Track ${i + 1}`,
        koreanDescription: `도깨비의 신통력과 액막이 수호가 서린 ${i + 1}번 트랙 연출`,
        visualPrompt: `80s retro anime style, a friendly Dokkaebi spirit wearing traditional Korean Gat hat and Durumagi robes inside Joseon East Palace room, candle light, incense smoke, Gayageum on floor, night palace window view, NO horns, NO tiger skin, NO Japanese Oni, clean 4k detail`,
        musicPrompt: `Chill Korean lofi hip hop, 75 bpm, warm vinyl crackle, subtle Gayageum melody, rain sounds, cozy nocturnal mood`
      }))
    };

    return this.runWithRetry(async (genAI) => {
      const model = await this.getWorkingGenerativeModel(genAI);
      const prompt = `You are the Master Music Producer for "Dokkaebi Lofi".
Generate a ${trackCount}-track storytelling album for theme: "${theme}".

STRICT CONSTITUTIONAL RULES:
1. Visual Prompts MUST specify:
   - "80s retro anime style, cel animation"
   - "Friendly Korean Dokkaebi spirit wearing traditional Gat hat and Durumagi robes"
   - "NO horns, NO tiger skin, NO Japanese Oni, NO headphones, NO human actors, NO grid lines, clean crystal clear 4k detail"
   - Add micro-visual variations per track (e.g., blinking eyes, sipping tea, rain to snow, day to night lighting).

2. Music Prompts MUST follow CHARACTER-DRIVEN ARCHITECTURES based on the object spirit:
   - Brush Spirit (Study/Wisdom): Gayageum, Danso, Piano, paper turning sounds, night rain, 70-75 BPM.
   - Abacus Spirit (Work/Coding): Yanggeum, Geomungo, Bass, abacus wood percussion, night market ambience, 78-85 BPM.
   - Gayageum/Feast Spirit (Rest/Comfort): Rich Gayageum, Piri, analog chillhop, candle crackle, 80-88 BPM.
   - Mask/Broomstick Spirit (Bad Luck Remedy/Dance): Taepyeongso, Janggu, fusion lofi beats, wind/wrestling sounds, 85-90 BPM.
   - Select ONE of the above 4 architectures that best fits the theme and apply it, creating 20 DISTINCT variations (different melodies, subtle instrument swaps) to avoid repetitive content flags.

3. Output strictly valid JSON with keys: "theme", "prompts" (array of {trackNumber, title, koreanDescription, visualPrompt, musicPrompt}).

JSON:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    }, defaultPrompts);
  }
}

module.exports = new GeminiHelper();
