const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Helper to call Gemini for text and SEO generation
 */
class GeminiHelper {
  getGenAI() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      return new GoogleGenerativeAI(apiKey);
    }
    return null;
  }

  isConfigured() {
    return this.getGenAI() !== null;
  }

  /**
   * Dynamically query Google's ListModels API to get the exact working model for this API key.
   */
  async getWorkingGenerativeModel(genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
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

    // Default fallback name
    return genAI.getGenerativeModel({ model: "gemini-flash-latest" });
  }

  /**
   * Generates SEO-optimized YouTube Title, Description, and Tags based on the selected theme for Global English Audiences.
   */
  async generateMetadata({ genre, theme, trackCount = 20, durationHours = 1 }) {
    const genAI = this.getGenAI();
    if (!genAI) {
      return this.getMockMetadata(genre, theme, trackCount, durationHours);
    }

    try {
      const model = await this.getWorkingGenerativeModel(genAI);
      
      const prompt = `
        You are an expert YouTube SEO Manager & Algorithm Data Scientist specializing in Global K-Lofi, Dokkaebi Aesthetics, and Solfeggio 432Hz playlist channels targeting international/foreign audiences.
        Generate 100% English, high-CTR YouTube metadata tailored SPECIFICALLY to the theme: "${theme}".
        
        RULES:
        1. TITLE: High-converting Question / Curiosity Hook title in 100% Native English for global viewers. DO NOT include internal producer tags like "[오늘 수요일 추천]". Must be framed as an intriguing question or sleeper hook (e.g. "[${durationHours} HOUR] What Does a 3 AM Korean Convenience Store Sound Like in Rain? 🌧️ 432Hz Dokkaebi Lofi Beats").
        2. DESCRIPTION: MUST start with this EXACT sacred channel lore text in fluent American English (do not modify):
"In ancient Korean lore, the Dokkaebi is a mystical, club-wielding spirit—a fierce protector shielding you from heavy energies. Where a Dokkaebi dwells, stress and bad vibes simply cannot enter.

Welcome to K-Dokkaebi Lofi: your digital sanctuary.

Here, this ancient guardian is your late-night guide. We blend 70% modern chillhop and synthwave with 30% breathtaking melodies of traditional Korean instruments to craft a deeply unique sonic landscape.

With a strike of its magical club, the Dokkaebi tunes every track to the healing 432Hz Solfeggio frequency. Rooted in sound psychology, this resonance is designed to stabilize brainwaves, ease an anxious mind, and elevate your mental well-being.

Breathe deep, and let go. As long as you remain here, you are under the Dokkaebi’s protection. Your peace is fully guarded.

🎧 Perfect for: Deep Focus, Coding, Sleep & Clarity.
🔔 Subscribe, and let the Dokkaebi protect your peace."

           Followed by:
           - A 2-sentence English mood description matching "${theme}".
           - Timestamps for all ${trackCount} tracks with 3-minute intervals (00:00 Track 01, 03:00 Track 02...).
           - Top 10 viral English hashtags (#KoreanLofi #Gayageum #StudyMusic #432Hz #Lofi #Chillhop #FocusBeats #Dokkaebi #SeoulVibes #SleepMusic).
        3. TAGS: Array or CSV string of 15 top English search keywords (e.g. "korean lofi, dokkaebi lofi, gayageum, 432hz, study music, chillhop, sleep lofi, focus music, seoul vibes").
        4. TRACKTITLES: An array of exactly ${trackCount} poetic, unique English track titles tailored to "${theme}".
        5. PINNEDCOMMENT: A warm, protective English Pinned Comment from the Dokkaebi (e.g. "👹 Leave your stress, worries, and heavy thoughts in the comments below. The Dokkaebi will guard them for you tonight. Sleep well, dear listener. 💤").
        
        Output JSON with keys: "title", "description", "tags", "trackTitles", "pinnedComment".
        Output ONLY raw JSON without markdown codeblocks.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const cleanJson = text.replace(/^```json/, "").replace(/```$/, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini metadata generation failed:", error);
      return this.getMockMetadata(genre, theme, trackCount, durationHours);
    }
  }

  /**
   * Generates custom prompts for MusicFX
   */
  async generateMusicPrompts({ genre, theme, trackCount = 20 }) {
    const genAI = this.getGenAI();
    if (!genAI) {
      return this.getMockMusicPrompts(genre, theme, trackCount);
    }

    try {
      const model = await this.getWorkingGenerativeModel(genAI);
      
      const prompt = `
        Generate ${trackCount} distinct loopable MusicFX prompts for genre "${genre}" and theme "${theme}".
        Output JSON with key "prompts" array.
        Output ONLY raw JSON.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      const cleanJson = text.replace(/^```json/, "").replace(/```$/, "").trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      console.error("Gemini music prompt generation failed:", error);
      return this.getMockMusicPrompts(genre, theme, trackCount);
    }
  }

  /**
   * Generates 5 distinct visual prompts dynamically based on the input topic.
   */
  async generateImageCandidates({ topic, modelName }) {
    const genAI = this.getGenAI();

    if (genAI) {
      try {
        const model = modelName
          ? genAI.getGenerativeModel({ model: modelName })
          : await this.getWorkingGenerativeModel(genAI);

        const promptText = `
          Generate 5 distinct, highly aesthetic lofi visual concept candidates for topic "${topic}".
          Return JSON object with key "candidates" array. Each item:
          {
            "id": 1,
            "title": "후보 1: [Short Korean scene title related to ${topic}]",
            "prompt": "[Detailed Korean description of scene related to ${topic}]",
            "promptEn": "[Detailed English visual prompt for Imagen 3: lighting, mood, 4k lofi aesthetic, related to ${topic}]"
          }
          Output ONLY valid raw JSON without markdown.
        `;

        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text().trim();

        const cleanJson = text.replace(/^```json/, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(cleanJson);

        if (parsed.candidates && parsed.candidates.length > 0) {
          const candidates = parsed.candidates.map((c, idx) => ({
            id: c.id || idx + 1,
            title: c.title || `후보 ${idx + 1}: ${topic} 감성 씬`,
            prompt: c.prompt || `${topic} 분위기의 차분한 4K 로파이 장면`,
            promptEn: c.promptEn || `${topic} Korean lofi anime aesthetic 4k cinematic`
          }));
          return { candidates };
        }
      } catch (error) {
        console.warn("[gemini dynamic model prompt error]:", error.message);
      }
    }

    // Dynamic Fallback: Uses input topic to generate customized prompts even if API fails
    return this.getMockImageCandidates(topic);
  }

  getMockImageCandidates(topic = "서울 밤거리 로파이") {
    const cleanTopic = topic.replace(/[^\w\s가-힣]/g, "").trim() || "서울 로파이";
    
    return {
      candidates: [
        {
          id: 1,
          title: `후보 1: ${cleanTopic} - 빗소리 창가 ☔`,
          prompt: `어두운 자정, ${cleanTopic} 분위기가 감도는 은은한 조명과 비 내리는 창가 서재 4K 장면`,
          promptEn: `Cozy room window with rain drops outside, ${cleanTopic} mood, warm desk lamp, open book, 4k cinematic lofi anime aesthetic`
        },
        {
          id: 2,
          title: `후보 2: ${cleanTopic} - 감성 한옥 마루 🏯`,
          prompt: `${cleanTopic} 테마의 고즈넉한 한옥 대청마루와 은은하게 빛나는 비단 등불 4K`,
          promptEn: `Traditional Korean Hanok wooden porch at night, ${cleanTopic} vibe, warm glowing paper lantern, 4k lofi aesthetic`
        },
        {
          id: 3,
          title: `후보 3: ${cleanTopic} - 네온 거리 🌃`,
          prompt: `${cleanTopic} 감성의 한글 네온사인과 빗물에 반사되는 차분한 밤거리 4K`,
          promptEn: `Seoul midnight city street with Hangul neon signs reflecting on wet asphalt, ${cleanTopic} mood, 4k lofi anime aesthetic`
        },
        {
          id: 4,
          title: `후보 4: ${cleanTopic} - 자정 남산뷰 & 한강 🌌`,
          prompt: `${cleanTopic} 느낌의 남산타워 시티뷰와 자정 한강의 은은한 조명 4K`,
          promptEn: `Han River and Namsan Tower cityscape view at midnight, ${cleanTopic} atmosphere, 4k lofi aesthetic`
        },
        {
          id: 5,
          title: `후보 5: ${cleanTopic} - 심야 아날로그 LP ☕`,
          prompt: `새벽 2시, ${cleanTopic} 음악이 흐르는 LP 레코드 플레이어와 따뜻한 커피 잔 4K`,
          promptEn: `Vintage vinyl record player spinning, warm coffee cup, ${cleanTopic} room aesthetic, 4k lofi cozy night`
        }
      ]
    };
  }

  getFallbackImageUrl(themePrompt) {
    return "https://images.unsplash.com/photo-1548115184-bc6544d06a58?w=1920&q=80";
  }

  getMockMetadata(genre, theme, trackCount, durationHours) {
    const cleanTheme = theme.replace(/[^\w\s가-힣]/g, "").trim() || "Seoul Lofi";
    const defaultTitles = Array.from({ length: trackCount }, (_, i) => `Track ${String(i + 1).padStart(2, "0")}: Whispering ${cleanTheme} Melodies Pt.${i + 1}`);
    const timestampsText = defaultTitles.map((t, idx) => {
      const totalMinutes = idx * 3;
      const mm = String(totalMinutes % 60).padStart(2, "0");
      const hh = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
      return `${hh}:${mm} - ${t}`;
    }).join("\n");

    return {
      title: `[${durationHours} HOUR] What Does a 3 AM Korean Convenience Store Sound Like in Rain? 🌧️ 432Hz Dokkaebi Lofi Beats`,
      description: `In ancient Korean lore, the Dokkaebi is a mystical, club-wielding spirit—a fierce protector shielding you from heavy energies. Where a Dokkaebi dwells, stress and bad vibes simply cannot enter.\n\nWelcome to K-Dokkaebi Lofi: your digital sanctuary.\n\nHere, this ancient guardian is your late-night guide. We blend 70% modern chillhop and synthwave with 30% breathtaking melodies of traditional Korean instruments to craft a deeply unique sonic landscape.\n\nWith a strike of its magical club, the Dokkaebi tunes every track to the healing 432Hz Solfeggio frequency. Rooted in sound psychology, this resonance is designed to stabilize brainwaves, ease an anxious mind, and elevate your mental well-being.\n\nBreathe deep, and let go. As long as you remain here, you are under the Dokkaebi’s protection. Your peace is fully guarded.\n\n🎧 Perfect for: Deep Focus, Coding, Sleep & Clarity.\n🔔 Subscribe, and let the Dokkaebi protect your peace.\n\n📌 TRACKLIST TIMESTAMPS:\n${timestampsText}\n\n#KoreanLofi #Gayageum #StudyMusic #432Hz #Lofi #Chillhop #FocusBeats #Dokkaebi #SeoulVibes #SleepMusic`,
      tags: "korean lofi, dokkaebi lofi, gayageum, 432hz, study music, chillhop, sleep lofi, focus music, seoul vibes, asian lofi",
      pinnedComment: "👹 Leave your stress, worries, and heavy thoughts in the comments below. The Dokkaebi will guard them for you tonight. Rest well, dear listener. 💤",
      trackTitles: defaultTitles
    };
  }

  getMockMusicPrompts(genre, theme, trackCount) {
    const list = [
      "Chill lofi hip hop beat, warm nylon guitar, boom bap drums, loopable, 80 BPM",
      "Soft emotional piano melody, room reverb, lofi chillhop drums, loopable, 85 BPM"
    ];
    const prompts = Array.from({ length: trackCount }, (_, i) => list[i % list.length]);
    return { prompts };
  }
}

module.exports = new GeminiHelper();
