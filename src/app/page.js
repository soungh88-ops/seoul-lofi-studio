"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Studio Configuration
  const [targetDurationHours, setTargetDurationHours] = useState(1);
  const [trackDurationMinutes, setTrackDurationMinutes] = useState(3); // 3-minute default per track
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isTestMode, setIsTestMode] = useState(false);

  // User Uploaded Video / Image State
  const [userMediaUrl, setUserMediaUrl] = useState(null);
  const [userMediaType, setUserMediaType] = useState(null); // 'video' or 'image'
  const [userMediaName, setUserMediaName] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Custom User MP3 Music Files State
  const [customAudioFiles, setCustomAudioFiles] = useState([]);

  // Google OAuth Session
  const { data: session, status } = useSession();
  const [aiCheckStatus, setAiCheckStatus] = useState("idle");
  const [showKaggleGuide, setShowKaggleGuide] = useState(false);

  // Gemini Prompts States
  const [visualPrompts, setVisualPrompts] = useState([
    {
      id: 1,
      title: "후보 1: [사이버 도깨비 네온 한옥 스튜디오 딥 스터디 8초 루프]",
      prompt: "어두운 밤, 청색 형광빛 뿔이 빛나는 귀여운 2D 애니메이션 스타일의 사이버 도깨비가 전통 한옥 스튜디오 책상에 앉아 노트북으로 공부하는 로파이 연출 4K",
      promptEn: "A seamless 8-second video loop, static locked-off camera, NO camera movement, NO zoom, cozy 2D lofi anime illustration style, Studio Ghibli inspired, a cute humanoid cyber-folklore Dokkaebi (Korean goblin) with two small glowing cyan horns on head, sitting at a wooden desk inside a cozy traditional Korean hanok studio, writing in a notebook under a warm glowing desk lamp, on the desk is a steaming cup of coffee and a small cute cat sleeping beside the laptop, through the window behind him is the beautiful night view of Namsan Tower and Seoul city lights, character completely still in peaceful study pose, warm ambient lighting, clean 4k, smooth repeating loop",
      videoPromptEn: "A seamless 8-second video loop, static locked-off camera, NO camera movement, cozy 2D lofi anime animation style, Ghibli aesthetic, a cute humanoid cyber-folklore Dokkaebi with glowing cyan horns, sitting at a wooden desk in a cozy Korean hanok studio, writing under a desk lamp, steaming coffee, sleeping cat, Namsan Tower night view through the window, ambient warm lighting, clean 4k, smooth repeating loop",
      promptKoTranslation: "• A seamless 8-second video loop: 끊김 없는 8초 무한 반복 로파이 애니메이션 영상\n• cozy 2D lofi anime style: 따뜻한 지브리 스타일 2D 로파이 일러스트 아트\n• cute humanoid cyber Dokkaebi with glowing horns: 청색 형광 뿔을 가진 귀여운 사이버 도깨비 캐릭터\n• sitting at desk in hanok: 한옥 책상에 앉아 공부하는 연출\n• Namsan Tower night view through window: 창문 밖으로 남산타워 서울 야경 배경",
      thumbEn: "High resolution YouTube thumbnail, --ar 16:9 --v 6.0, cozy 2D lofi anime illustration art style, Ghibli aesthetic, an iconic cute humanoid cyber-folklore Dokkaebi with glowing cyan horns, sitting at a wooden desk inside a cozy traditional Korean hanok studio, writing under a warm desk lamp, with Namsan Tower night lights visible through the window, detailed, masterwork.",
      thumbKoTranslation: "• 16:9 미드저니 썸네일 포맷: 공부하는 사이버 도깨비 2D 로파이 썸네일",
      isAiGenerated: true
    },
    {
      id: 2,
      title: "후보 2: [사이버 도깨비 LP 카페 다락방 수면 힐링 8초 루프]",
      prompt: "비 내리는 밤, 은은한 네온 조명이 켜진 서촌 LP 다락방 창가에서 가야금 소리를 들으며 조용히 휴식하는 귀여운 사이버 도깨비 캐릭터 2D 로파이 일러스트 4K",
      promptEn: "A seamless 8-second video loop, static locked-off camera, NO camera movement, cozy 2D lofi anime illustration style, a cute humanoid cyber Dokkaebi with small glowing cyan horns, sitting comfortably on a soft armchair by a rainy window in a vintage Seoul LP cafe attic, listening to music, warm ambient neon glow, cozy coffee cup, raindrops sliding down the glass, Namsan tower in the distant foggy background, clean 4k, smooth repeating loop",
      videoPromptEn: "A seamless 8-second video loop, static locked-off camera, cozy 2D lofi anime animation style, a cute humanoid cyber Dokkaebi with glowing cyan horns, sitting on armchair by rainy window in Seoul LP cafe attic, warm neon glow, coffee cup, raindrops on glass, clean 4k, smooth repeating loop",
      promptKoTranslation: "• static locked-off camera, NO camera movement: 고정 삼각대 카메라, 이동 없음\n• cute cyber Dokkaebi in LP attic by rainy window: 비 내리는 LP 다락방 창가에서 휴식하는 귀여운 사이버 도깨비\n• warm ambient neon glow: 아늑한 네온 불빛 조명",
      thumbEn: "High resolution YouTube thumbnail, --ar 16:9 --v 6.0, cozy 2D lofi anime illustration art style, Ghibli aesthetic, a cute humanoid cyber Dokkaebi with glowing cyan horns, resting on a cozy armchair by the rainy window in a vintage Seoul LP cafe attic, warm neon lights, cinematic lighting, 8k render.",
      thumbKoTranslation: "• 16:9 미드저니 썸네일 포맷: 비 내리는 서울 LP 다락방 배경의 귀여운 사이버 도깨비 2D 로파이 썸네일",
      isAiGenerated: true
    }
  ]);
  const [isGeneratingVisualPrompts, setIsGeneratingVisualPrompts] = useState(false);
  const [musicPrompts, setMusicPrompts] = useState([]);
  const [isGeneratingMusicPrompts, setIsGeneratingMusicPrompts] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [customKoreanPrompt, setCustomKoreanPrompt] = useState(
    "어두운 밤, 별이 쏟아지는 깊은 산속 한옥 정자 마당에서 타닥타닥 타오르는 모닥불을 바라보며 아늑하게 해금 연주와 불멍을 즐기는 귀여운 2D 로파이 수호신 캐릭터. 모닥불 연기가 은은하게 밤하늘로 올라가고 있다."
  );

  const [isSyncingPrompt, setIsSyncingPrompt] = useState(false);

  const handleSyncKoreanToEnglishPrompt = async (koreanText) => {
    const text = (koreanText || customKoreanPrompt || "").trim();
    if (!text) {
      alert("한글 연출 문장을 입력해 주세요.");
      return;
    }

    setIsSyncingPrompt(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text,
          type: "visual",
          modelName: selectedGeminiModel || "gemini-flash-latest"
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.translatedVideo) {
          setCustomVideoPrompt(data.translatedVideo);
          alert("정상적으로 영문 프롬프트에 반영 되었습니다.");
          setIsSyncingPrompt(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Gemini API translate failed, using smart fallback:", err);
    } finally {
      setIsSyncingPrompt(false);
    }

    // Smart Local Fallback
    let baseEn = "A seamless 8-second video loop, first frame matches last frame perfectly, static locked-off camera, NO camera movement, NO zoom, cozy 2D lofi anime animation style, Studio Ghibli inspired art style";
    let characterEn = "a cute humanoid cyber-folklore Dokkaebi (Korean goblin) with two small glowing cyan horns on head";
    let pronounsEn = "him";

    if (text.includes("소녀") || text.includes("여성") || text.includes("woman") || text.includes("girl")) {
      characterEn = "a cute modern Korean young adult woman";
      pronounsEn = "her";
    } else if (text.includes("백인") || text.includes("Caucasian") || text.includes("서양")) {
      if (text.includes("남자") || text.includes("소년") || text.includes("남성") || text.includes("man") || text.includes("boy")) {
        characterEn = "a cute Caucasian young adult man";
        pronounsEn = "him";
      } else {
        characterEn = "a cute Caucasian young adult woman";
        pronounsEn = "her";
      }
    } else if (text.includes("남자") || text.includes("소년") || text.includes("남성")) {
      characterEn = "a cute modern Korean young adult man";
      pronounsEn = "him";
    } else if (text.includes("고양이") || text.includes("cat")) {
      characterEn = "a cute lofi cat character";
      pronounsEn = "its";
    }

    if (text.includes("한옥") || text.includes("hanok")) {
      baseEn += `, ${characterEn}, sitting at a wooden desk inside a cozy traditional Korean hanok studio, writing in a notebook under a warm glowing desk lamp`;
    } else {
      baseEn += `, ${characterEn} resting comfortably in a cozy room, warm ambient lighting`;
    }

    if (text.includes("고개") || text.includes("까딱") || text.includes("nod")) {
      baseEn += ", starts in still pose, gently nods once to the beat in the middle, returns to initial still pose at the end";
    } else {
      baseEn += ", character completely still in peaceful resting pose, ambient warm lighting, NO sweat, NO steam, NO smoke";
    }

    baseEn += ", 4k resolution, smooth 2D animation, first frame matches last frame perfectly, perfect repeating loop";
    setCustomVideoPrompt(baseEn);
    alert("정상적으로 영문 프롬프트에 반영 되었습니다.");
  };

  const [customVideoPrompt, setCustomVideoPrompt] = useState(
    "어두운 밤, 별이 쏟아지는 깊은 산속 한옥 정자 마당에서 타닥타닥 타오르는 모닥불을 바라보며 아늑하게 해금 연주와 불멍을 즐기는 귀여운 2D 로파이 수호신 캐릭터. 모닥불 연기가 은은하게 밤하늘로 올라가고 있다."
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoLog, setVideoLog] = useState("");

  const initialCalendar = [
    { day: "Day 01 (월)", title: "조선 사이버 도깨비 한옥 스튜디오 수면 힐링 🌌👹", enHookTitle: "[1 HOUR] Cyber Dokkaebi Cozy Hanok Studio 🌌 Lofi for Focus, Study & Deep Sleep", inst: "Gayageum & Night ASMR", wave: "432Hz Solfeggio & Deep Sleep" },
    { day: "Day 02 (화)", title: "북촌 한옥 카페 마루 정원 빗소리와 공부 로파이 🌧️", enHookTitle: "[1 HOUR] Rainy Hanok Cafe in Seoul ☕ 432Hz Solfeggio Study Beats", inst: "Korean Zither & Rain", wave: "432Hz Study" },
    { day: "Day 03 (수)", title: "자정 서울 N타워 창가 도깨비 해금 공부 비트 🗼👹", enHookTitle: "[1 HOUR] Midnight Seoul N-Tower Window Dokkaebi Haegeum Beats for Focus", inst: "Haegeum & City ASMR", wave: "432Hz Solfeggio & Deep Sleep" },
    { day: "Day 04 (목)", title: "심야 숲속 모닥불 불멍 & 힐링 국악 수면 로파이 🪵🔥", enHookTitle: "[1 HOUR] Relaxing Korean Campfire Bul-Meong Lofi 🪵 432Hz Sleep Beats", inst: "Haegeum & Campfire ASMR", wave: "432Hz Delta Sleep" },
    { day: "Day 05 (금)", title: "한국인만 밤에 몰래 듣는 432Hz 비밀 수면 로파이", enHookTitle: "[1 HOUR] Secret Korean Lofi Beats Only Koreans Listen To for Deep Sleep 🌙 [432Hz]", inst: "Daegeum Flute & Piano", wave: "432Hz Solfeggio" },
    { day: "Day 06 (토)", title: "비 내리는 이태원 포장마차 주황 천막 야경 로파이", enHookTitle: "[1 HOUR] Rainy Korean Pocha Street Food Tent Vibe 🌧️ 432Hz Chillhop & Jazz", inst: "Haegeum Fiddle & Jazz", wave: "432Hz Chill" },
    { day: "Day 07 (일)", title: "새벽 3시 서울 한강 야경 강바람 불면증 힐링", enHookTitle: "[1 HOUR] What Does 3 AM Han River Night Sound Like in Seoul? 🌉 432Hz Insomnia Relief", inst: "Acoustic Guitar & Wind", wave: "432Hz Sleep" },
    { day: "Day 08 (월)", title: "1930s 경성 모던 타임즈 재즈 피아노 다락방", enHookTitle: "[1 HOUR] What Does a 1930s Korean Fiddle Sound Like in Seoul? 📻 Vintage Jazz Lofi", inst: "Haegeum & Grand Piano", wave: "432Hz Relax" },
    { day: "Day 09 (화)", title: "24시간 서울 무인 스터디 카페 심야 코딩 칠홉", enHookTitle: "[1 HOUR] 3 AM Seoul 24-Hour Study Cafe 📖 Strict Focus & Midnight Coding Lofi", inst: "Minimal Synth & Drums", wave: "432Hz Focus" },
    { day: "Day 10 (수)", title: "K-Pop 아이돌 무대 뒤 힙한 네온 스트릿 칠홉", enHookTitle: "[1 HOUR] K-Pop Backstage Street Fashion Vibe 🎧 Trendy Korean Idol Chillhop Beats", inst: "K-Pop Synth & Drums", wave: "432Hz Upbeat" },
    { day: "Day 11 (목)", title: "삼청동 옛 골목길 LP판 돌아가는 다락방 찻집", enHookTitle: "[1 HOUR] 1980s Retro Seoul Tea Attic 📻 Warm Tea & Relaxing Lofi Beats", inst: "Vinyl Piano & Guitar", wave: "432Hz Healing" },
    { day: "Day 12 (금)", title: "눈 내리는 오대산 전나무 숲길 자정 수면 앰비언트", enHookTitle: "[1 HOUR] Midnight Snowfall in Korean Fir Forest ❄️ 432Hz Deep Sleep Ambient", inst: "Daegeum Flute & Pad", wave: "432Hz Sleep" },
    { day: "Day 13 (토)", title: "한국에서만 들을 수 있는 희귀한 25현 가야금 수면", enHookTitle: "[1 HOUR] Rare 25-String Korean Gayageum Lofi You Can Only Experience in Korea 🌿 [432Hz]", inst: "25-String Gayageum", wave: "432Hz Healing" },
    { day: "Day 14 (일)", title: "K-드라마 남산타워 루프탑 노을 감성 K-발라드", enHookTitle: "[1 HOUR] When Korean Harp & Flute Meet K-Ballad Lofi, I Fall Asleep Instantly 🌙", inst: "Korean Zither & Cello", wave: "432Hz Sleep" },
    { day: "Day 15 (월)", title: "K-뷰티 맑은 피부 힐링 스파 수분 뇌파 음악", enHookTitle: "[1 HOUR] K-Beauty Glass Skin Spa 🌿 Pure Healing & Deep Sleep Frequency", inst: "Soft Water & Harp", wave: "432Hz Spa" },
    { day: "Day 16 (화)", title: "비 내리는 한국 PC방 24시 코딩 & 게임 로파이", enHookTitle: "[1 HOUR] Rainy K-PC Bang Night 🎮 Chill Beats for Coding & Gaming", inst: "Lo-Fi Drums & Synth", wave: "432Hz Focus" },
    { day: "Day 17 (수)", title: "은하수가 흐르는 신라 고궁 밤하늘 대금 힐링", enHookTitle: "[1 HOUR] What Does Korea's Ancient Bamboo Flute Sound Like in Palace Night? 🏯", inst: "Ancient Daegeum", wave: "432Hz Healing" },
    { day: "Day 18 (목)", title: "홍대 버스킹 네온 거리 밤 산책 아침 조깅 칠홉", enHookTitle: "[1 HOUR] Hongdae Neon Street Walk 🎧 Upbeat Korean Chillhop for Morning Walk", inst: "Korean Fiddle & Synth", wave: "432Hz Upbeat" },
    { day: "Day 19 (금)", title: "조선 사이버 도깨비 야시장 신비로운 네온 비트", enHookTitle: "[1 HOUR] Cyber Dokkaebi Night Market 🔮 Magical Korean Festival Beats", inst: "Taepyeongso & Beats", wave: "432Hz Party" },
    { day: "Day 20 (토)", title: "제주 돌담길 억새밭 노을 바람 소리 수면 힐링", enHookTitle: "[1 HOUR] Jeju Island Coastal Wind & Sunset Breeze 🌊 432Hz Sleep Lofi", inst: "Danso Flute & Ocean", wave: "432Hz Sleep" },
    { day: "Day 21 (일)", title: "가야금과 대금이 합쳐지면 난 잠이 든다", enHookTitle: "[1 HOUR] Listen to This Korean Harp & Flute Lofi and You Will Fall Asleep 💤 [432Hz]", inst: "Gayageum & Daegeum", wave: "432Hz Sleep" },
    { day: "Day 22 (월)", title: "비 젖은 기와지붕 아래 새벽 몰입 대나무 빗소리", enHookTitle: "[1 HOUR] Heavy Rain on Korean Hanok Roof 🌧️ 432Hz Solfeggio Focus Beats", inst: "Rain & Daegeum", wave: "432Hz Focus" },
    { day: "Day 23 (화)", title: "1930s 경성 재즈 클럽의 비밀 밤 연주회", enHookTitle: "[1 HOUR] Secret 1930s Seoul Jazz Club 🍸 Emotional Fiddle & Piano Lofi", inst: "Haegeum & Double Bass", wave: "432Hz Relax" },
    { day: "Day 24 (수)", title: "도깨비 숲의 신비로운 치유 정령 수면 오르골", enHookTitle: "[1 HOUR] Dokkaebi Sanctuary Forest 🔮 Healing Music Box & Lofi Beats", inst: "Taepyeongso & Musicbox", wave: "432Hz Sleep" },
    { day: "Day 25 (목)", title: "조선 집현전 학자의 조용한 밤샘 연구실", enHookTitle: "[1 HOUR] Ancient Korean Scholar's Study Room 📖 Late Night Focus Beats", inst: "Geomungo & Drums", wave: "432Hz Study" },
    { day: "Day 26 (금)", title: "보름달빛 차오르는 한옥 뜰 피아노 수면 힐링", enHookTitle: "[1 HOUR] Full Moon over Korean Courtyard 🌕 432Hz Sleep Piano & Zither", inst: "25-String Gayageum", wave: "432Hz Sleep" },
    { day: "Day 27 (토)", title: "안개 낀 정자에서 듣는 단소 소리와 빗소리", enHookTitle: "[1 HOUR] Misty Korean Pavilion in Rain 🌫️ 432Hz Peaceful Flute Beats", inst: "Danso & Rain", wave: "432Hz Healing" },
    { day: "Day 28 (일)", title: "조선 사이버 네온 야시장 K-Pop 퓨전 비트", enHookTitle: "[1 HOUR] Cyber Hanyang Neon Night Market 💥 K-Pop Fusion Chillhop", inst: "Taepyeongso & 808", wave: "432Hz Upbeat" },
    { day: "Day 29 (월)", title: "눈 덮인 오대산 전나무 숲길 자정 산책 힐링", enHookTitle: "[1 HOUR] Midnight Walk in Snowy Korean Forest ❄️ 432Hz Sleep Lofi", inst: "Daegeum & Ambient", wave: "432Hz Sleep" },
    { day: "Day 30 (화)", title: "달빛 항해: 도깨비 수호 배의 432Hz 여정", enHookTitle: "[1 HOUR] Dokkaebi Guardian Ship Journey 🔮 432Hz Solfeggio Deep Sleep", inst: "Haegeum & Synth", wave: "432Hz Sleep" }
  ];

  const getTodayThemeObj = (calendarList) => {
    const now = new Date();
    const adjustedDate = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    const dayOfWeek = adjustedDate.getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed...
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    const todayName = dayNames[dayOfWeek];
    const item = calendarList.find(i => i.day.includes(`(${todayName})`)) || calendarList[0];

    return {
      title: item.title,
      enHookTitle: item.enHookTitle,
      desc: `유튜브 알고리즘 최상위 0.1% 킬러 주제 + ${item.inst} & ${item.wave} 결합`,
      viewPotential: `🔥 예상 조회수: Top 0.1% (글로벌 80억 타겟)`,
      targetInstruments: `${item.inst}`,
      brainwave: `${item.wave} + 432Hz 힐링 주파수`
    };
  };

  const todayThemeObj = getTodayThemeObj(initialCalendar);
  const [monthCalendar, setMonthCalendar] = useState(initialCalendar);
  const [topTrendingTheme, setTopTrendingTheme] = useState(todayThemeObj);

  const [chatMessages, setChatMessages] = useState([
    { sender: "ai", text: `안녕하세요 총감독님! 👹 오늘의 유튜브 1위 추천 주제는 [${todayThemeObj.title}]입니다. 100% 영문 알고리즘 질문형 훅 제목과 20곡 서사 앨범이 완벽하게 기획되어 있습니다!` }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isAiThinking, setIsAiThinking] = useState(false);

  // API Gate State
  const DEFAULT_VERIFIED_MODELS = [
    { id: "gemini-flash-latest", displayName: "Gemini Flash Latest (추천 - 100% 성공)" },
    { id: "gemini-3.5-flash", displayName: "Gemini 3.5 Flash (고성능 창의형)" },
    { id: "gemini-3-flash-preview", displayName: "Gemini 3 Flash Preview" },
    { id: "gemini-flash-lite-latest", displayName: "Gemini Flash-Lite Latest" }
  ];

  const [isApiConnected, setIsApiConnected] = useState(false);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [availableGeminiModels, setAvailableGeminiModels] = useState(DEFAULT_VERIFIED_MODELS);
  const [selectedGeminiModel, setSelectedGeminiModel] = useState("gemini-flash-latest");
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  // Pre-Render Cinematic Options State (Default: All disabled so user manually enables desired features)
  const [eqStyle, setEqStyle] = useState("none"); // 'bar' | 'circle' | 'wave' | 'none'
  const [eqColor, setEqColor] = useState("cyberpunk"); // 'cyberpunk' | 'sunset' | 'rain'
  const [eqPosition, setEqPosition] = useState("bottom"); // 'bottom' | 'center' | 'side'
  const [enableCameraBreathing, setEnableCameraBreathing] = useState(false);
  const [enableRainParticles, setEnableRainParticles] = useState(false);
  const [enableDayToNight, setEnableDayToNight] = useState(false);
  const [enableFilmGrain, setEnableFilmGrain] = useState(false);
  const [enableSmartTitle, setEnableSmartTitle] = useState(false);
  const [enableNeonDokkaebi, setEnableNeonDokkaebi] = useState(false);
  const [enableCrossfadeTransition, setEnableCrossfadeTransition] = useState(true);

  const [showHookingTitle, setShowHookingTitle] = useState(false);
  const [hookingTitleText, setHookingTitleText] = useState("");
  const [hookingTextColor, setHookingTextColor] = useState("#a1a1aa");
  const [hookingFontSize, setHookingFontSize] = useState(24);

  const [mascotKoDesc, setMascotKoDesc] = useState("사이버 네온 한복 아머와 LED 마스크, LOFI 이퀄라이저 팔토시 및 네온 방망이를 들고 삼면(전면/측면/후면) 콘셉트 아트를 장착한 공식 DOKKAEBI KOREA LOFI 도깨비 캐릭터");
  const [mascotEnPrompt, setMascotEnPrompt] = useState("An intricate concept art sheet featuring a cyber-folklore Dokkaebi character design from multiple views. The center figure, in a full 'FRONT VIEW', is a muscular humanoid Oni (Dokkaebi) with horns and a fierce mask. This figure wears elaborate, neon-infused traditional Korean hanbok-inspired cyber-armor (dark blue and purple with vibrant cyan and magenta trim), integration with glowing futuristic tech: an audio-responsive LED mask, a chest panel with a glowing brain graphic, multi-band graphic equalizer panels on the forearms (displaying a 70% level), and an elaborate 'LOFI' display on the left forearm. A complex mechanical gauntlet holds a neon-glowing spiked baseball bat 'Dokkaebi Club'. The left side features a 'SIDE VIEW' of the same character in profile, holding a spiked bat and showing the detailed armor side profile. The right side features a full 'BACK VIEW', revealing a massive cyberpunk back-unit with an exposed brain unit, complex wiring, and the specific text 'DOKKAEBI' and 'KOREA LOFI' printed clearly on the back armor and back-unit. Text labels 'FRONT VIEW', 'SIDE VIEW', and 'BACK VIEW' are arranged precisely. The entire composition is within a glowing neon cyber-frame. The background is a dark, blurry cyberpunk cityscape. Large neon-lit text at the bottom-center reads 'DOKKAEBI' and 'KOREA LOFI' below it. The art style is high-end, detailed illustrative concept art with a clean, graphic, and cyber-folklore aesthetic.");
  const [pinnedComment, setPinnedComment] = useState("👹 Leave your stress, worries, and heavy thoughts in the comments below. The Dokkaebi will guard them for you tonight. Rest well, dear listener. 💤");

  // Active Tooltip Info Card State
  const [activeTooltipKey, setActiveTooltipKey] = useState(null);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);

  const TOOLTIP_INFOS = {
    eqStyle: "📊 [네온 이퀄라이저 스펙트럼] 음악의 베이스 비트와 가야금 선율에 맞춰 화면 바/파동이 실시간으로 춤추는 연출입니다.",
    eqColor: "🌈 [이퀄라이저 컬러 테마] 사이버펑크 보라/청록, 노을 핑크/골드, 빗방울 에메랄드 중 마음에 드는 네온 색상을 선택합니다.",
    cameraBreathing: "📹 [카메라 브리딩 줌] 화면이 멈춰있지 않고 숨쉬듯 천천히 줌인/줌아웃(0.5%)하여 살아있는 시네마틱 생동감을 줍니다.",
    rainParticles: "🌧️ [시네마틱 빗방울 오버레이] 빗소리 ASMR에 맞춰 영상 위에 투명한 빗방울 효과와 반짝이는 빛 먼지(Bokeh)를 얹어 몰입감을 높입니다.",
    dayToNight: "🌇 [시간 경과 조명 전환] 1~3시간 영상이 흐르는 동안 화면 조명이 낮 ➔ 노을 ➔ 밤 ➔ 새벽으로 서서히 시네마틱하게 변합니다.",
    filmGrain: "📽️ [레트로 필름 그레인 & 비네팅] 넷플릭스 영화처럼 화면 테두리를 어둡게 누르고 감성 아날로그 필름 질감을 살립니다.",
    smartTitle: "🔠 [10초 스마트 곡명 자막] 곡이 시작할 때 10초간 곡명이 세련되게 떴다가, 시청자의 공부/수면 몰입을 위해 부드럽게 사라집니다.",
    neonDokkaebi: "👹 [오디오 반응형 네온 도깨비 스티커] 음악 비트와 주파수에 따라 도깨비 네온 링이 회전하고 테두리가 켜졌다 꺼지며 살아있는 수호신 연출을 줍니다.",
    crossfadeTransition: "✨ [시네마틱 스무스 장면 혼합] 루프 연결이나 화면 전환 시 1~2초간 부드럽게 겹치며 디졸브(Fade Crossfade)되는 장면 혼합 연출입니다."
  };

  // Track Preview & Audio States
  const [activeTrackIndex, setActiveTrackIndex] = useState(null);
  const [activeTrackModalIndex, setActiveTrackModalIndex] = useState(null); // 한글 연출 확인 팝업 활성화 트랙 인덱스
  const [editedTrackKoPrompts, setEditedTrackKoPrompts] = useState({}); // 트랙별 수정한 한글 연출 저장
  const audioPlayerRef = useRef(null);

  const sample20Tracks = Array.from({ length: 20 }, (_, i) => {
    const trackNo = String(i + 1).padStart(2, "0");
    const baseThemeTitle = topTrendingTheme.title || "국악 로파이";
    const instName = topTrendingTheme.targetInstruments ? topTrendingTheme.targetInstruments.split("&")[0].trim() : "가야금";
    const waveName = topTrendingTheme.brainwave ? topTrendingTheme.brainwave.split("+")[0].trim() : "432Hz 힐링 주파수";

    const sampleThemes = [
      { titleKo: `${baseThemeTitle}의 은은한 서곡`, titleEn: `Moonlight ${instName} Prelude`, instKo: `${instName} & 밤 빗소리`, promptKo: `${baseThemeTitle} 분위기에서 ${instName}과 은은한 밤 빗소리가 아늑하게 어우러지는 수면 힐링 ${waveName} 국악 로파이` },
      { titleKo: `${baseThemeTitle} 속 해금 선율`, titleEn: `Healing ${instName} Melody`, instKo: "해금 & 피아노", promptKo: `${baseThemeTitle} 테마 속에서 들려오는 따뜻하고 아늑한 해금 피아노 듀엣 수면 공부 로파이 3분 곡` },
      { titleKo: `${baseThemeTitle}의 자정 수면 음률`, titleEn: `Midnight ${instName} Sleep Wave`, instKo: `${instName} & 숲속 모닥불`, promptKo: `${baseThemeTitle} 깊은 산속 한옥 정자에서 피어오르는 대금 솔페지오 불멍 수면 힐링 ${waveName} 로파이` },
      { titleKo: `${baseThemeTitle}의 거문고 밤 빗소리`, titleEn: `Midnight Rain ${instName} Sleep Lofi`, instKo: "거문고 & 잔잔한 빗소리", promptKo: `${baseThemeTitle} 공간에서 거문고 선율과 잔잔한 빗소리가 전하는 불면증 극복 국악 로파이` },
      { titleKo: `${baseThemeTitle}과 도깨비 수면 오르골`, titleEn: `Mystic ${instName} Forest Sleep Box`, instKo: "태평소 & 오르골", promptKo: `${baseThemeTitle} 신비로운 숲속 밤하늘 아래 조용히 퍼지는 ${waveName} 수면 오르골 힐링 로파이` },
      { titleKo: `${baseThemeTitle}의 몽환적 선율`, titleEn: `Milky Way ${instName} Night`, instKo: "25현 가야금", promptKo: `${baseThemeTitle} 은하수가 가득한 신라 고궁 밤하늘 아래 25현 가야금의 몽환적인 수면 힐링 곡` },
      { titleKo: `${baseThemeTitle}의 저녁 노을 바람`, titleEn: `Jeju ${instName} Sunset Wind`, instKo: "단소 & 바다 바람소리", promptKo: `${baseThemeTitle} 노을빛 돌담길 억새밭 사이로 시원하게 불어오는 단소 바람소리 힐링 로파이` },
      { titleKo: `${baseThemeTitle}의 아날로그 LP 감성`, titleEn: `Gyeongseong Vintage ${instName} Lofi`, instKo: "해금 & 재즈 피아노", promptKo: `${baseThemeTitle} 아날로그 다락방에서 LP판으로 듣는 해금 재즈 힐링 로파이` }
    ];
    const curr = sampleThemes[i % sampleThemes.length];
    return {
      id: i + 1,
      trackNo: trackNo,
      titleKo: `트랙 ${trackNo}: ${curr.titleKo}`,
      titleEn: `Track ${trackNo}: ${curr.titleEn}`,
      instKo: curr.instKo,
      defaultPromptKo: curr.promptKo,
      duration: `${trackDurationMinutes}:00`,
      url: i % 2 === 0 
        ? "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3"
        : "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=chill-lofi-song-8444.mp3"
    };
  });

  // 4K Dokkaebi & Multi-Brand Thumbnail Engine States (Option 4 Hybrid)
  const [thumbnailMode, setThumbnailMode] = useState("auto"); // 'auto' | 'ai' | 'upload'
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState(null);
  const [thumbnailBadgeText, setThumbnailBadgeText] = useState("[3 HOURS GAYAGEUM LOFI]");
  const [showDokkaebiBadge, setShowDokkaebiBadge] = useState(true);
  const [customBrandName, setCustomBrandName] = useState("DOKKAEBI KOREA LOFI");
  const [currentProjectType, setCurrentProjectType] = useState("dokkaebi");
  const [isGeneratingAiThumbnail, setIsGeneratingAiThumbnail] = useState(false);

  // Metadata / SEO State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

  // Render Engine & Library States
  const [renderStatus, setRenderStatus] = useState("idle");
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderLog, setRenderLog] = useState("No render job active.");
  const [isRendering, setIsRendering] = useState(false);
  const [kaggleRemainingSeconds, setKaggleRemainingSeconds] = useState(108000);

  const [isYouTubeConnected, setIsYouTubeConnected] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLog, setUploadLog] = useState("");
  const [privacyStatus, setPrivacyStatus] = useState("private");

  const [library, setLibrary] = useState([]);
  const [selectedVideoForUpload, setSelectedVideoForUpload] = useState(null);

  const logTerminalRef = useRef(null);
  const chatBottomRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioFileInputRef = useRef(null);

  const [audioLevels, setAudioLevels] = useState({ bass: 0, mid: 0, treble: 0 });
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!audioPlayerRef.current || !session) return;

    let audioCtx;
    let source;
    let analyser;

    const handlePlay = () => {
      if (!analyserRef.current) {
        try {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          source = audioCtx.createMediaElementSource(audioPlayerRef.current);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);

          analyserRef.current = analyser;
          dataArrayRef.current = dataArray;
        } catch (e) {
          console.warn("Web Audio API not allowed or CORS issue:", e);
        }
      }

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const updateLevels = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current);
          
          let bassSum = 0;
          for (let i = 0; i < 8; i++) {
            bassSum += dataArrayRef.current[i];
          }
          const bassAvg = bassSum / 8;

          let midSum = 0;
          for (let i = 8; i < 32; i++) {
            midSum += dataArrayRef.current[i];
          }
          const midAvg = midSum / 24;

          let trebleSum = 0;
          for (let i = 32; i < 96; i++) {
            trebleSum += dataArrayRef.current[i];
          }
          const trebleAvg = trebleSum / 64;

          setAudioLevels({
            bass: bassAvg / 255,
            mid: midAvg / 255,
            treble: trebleAvg / 255
          });
        }
        animationFrameRef.current = requestAnimationFrame(updateLevels);
      };

      updateLevels();
    };

    const handlePause = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setAudioLevels({ bass: 0, mid: 0, treble: 0 });
    };

    const player = audioPlayerRef.current;
    player.addEventListener('play', handlePlay);
    player.addEventListener('pause', handlePause);

    return () => {
      player.removeEventListener('play', handlePlay);
      player.removeEventListener('pause', handlePause);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [session]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      try {

        const savedConnected = sessionStorage.getItem("gemini_api_connected");
        const savedModel = sessionStorage.getItem("gemini_selected_model");
        if (savedConnected === "true" && savedModel) {
          setIsApiConnected(true);
          setSelectedGeminiModel(savedModel);
        }

        const savedKaggleTime = localStorage.getItem("kaggle_remaining_seconds");
        if (savedKaggleTime) {
          setKaggleRemainingSeconds(parseInt(savedKaggleTime, 10));
        }

        // Auto-restore draft from localStorage
        const savedDraft = localStorage.getItem("lofi_studio_draft_v1");
        if (savedDraft) {
          const draft = JSON.parse(savedDraft);
          if (draft.title) setTitle(draft.title);
          if (draft.description) setDescription(draft.description);
          if (draft.tags) setTags(draft.tags);
          if (draft.userMediaUrl) setUserMediaUrl(draft.userMediaUrl);
          if (draft.userMediaType) setUserMediaType(draft.userMediaType);
          if (draft.userMediaName) setUserMediaName(draft.userMediaName);
          // Always ensure topTrendingTheme is refreshed with today's real weekday theme on load
          setTopTrendingTheme(getTodayThemeObj(initialCalendar));
          if (draft.visualPrompts && Array.isArray(draft.visualPrompts) && draft.visualPrompts.length > 0) setVisualPrompts(draft.visualPrompts);
          if (draft.musicPrompts && Array.isArray(draft.musicPrompts) && draft.musicPrompts.length > 0) setMusicPrompts(draft.musicPrompts);
          if (draft.targetDurationHours) setTargetDurationHours(draft.targetDurationHours);
          if (draft.trackDurationMinutes) setTrackDurationMinutes(draft.trackDurationMinutes);
          if (draft.eqStyle) setEqStyle(draft.eqStyle);
          if (draft.eqColor) setEqColor(draft.eqColor);
          if (draft.customBrandName) setCustomBrandName(draft.customBrandName);
          if (draft.thumbnailBadgeText) setThumbnailBadgeText(draft.thumbnailBadgeText);
        }
      } catch (e) {
        console.warn("Failed to restore draft from localStorage:", e);
      }
    }
  }, []);

  // Auto-save draft to localStorage whenever key state changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    try {
      const draft = {
        title,
        description,
        tags,
        userMediaUrl,
        userMediaType,
        userMediaName,
        topTrendingTheme,
        visualPrompts,
        musicPrompts,
        targetDurationHours,
        trackDurationMinutes,
        eqStyle,
        eqColor,
        customBrandName,
        thumbnailBadgeText
      };
      localStorage.setItem("lofi_studio_draft_v1", JSON.stringify(draft));
    } catch (e) {
      console.warn("Failed to save draft to localStorage:", e);
    }
  }, [
    mounted,
    title,
    description,
    tags,
    userMediaUrl,
    userMediaType,
    userMediaName,
    topTrendingTheme,
    visualPrompts,
    musicPrompts,
    targetDurationHours,
    trackDurationMinutes,
    eqStyle,
    eqColor,
    customBrandName,
    thumbnailBadgeText
  ]);



  const handleFileUpload = (file) => {
    if (!file) return;
    const isVid = file.type.startsWith("video/");
    const isImg = file.type.startsWith("image/");
    if (!isVid && !isImg) {
      alert("⚠️ 비디오 파일(.mp4, .mov) 또는 이미지 파일(.jpg, .png, .webp)만 업로드 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserMediaUrl(e.target.result);
      setUserMediaType(isVid ? "video" : "image");
      setUserMediaName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const [customAudioTracks, setCustomAudioTracks] = useState({}); // { 1: { name, data }, 2: ... }
  const thumbnailFileInputRef = useRef(null);

  const handleSingleTrackUpload = (trackNum, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomAudioTracks(prev => ({
        ...prev,
        [trackNum]: {
          name: file.name,
          data: e.target.result
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTrack = (trackNum) => {
    const num = parseInt(trackNum, 10);
    if (isNaN(num)) return;
    setCustomAudioTracks(prev => {
      const next = { ...prev };
      delete next[num];
      delete next[String(num)];
      return next;
    });
    if (activeTrackIndex === (num - 1)) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = "";
      }
      setActiveTrackIndex(null);
    }
    if (audioFileInputRef.current) {
      audioFileInputRef.current.value = "";
    }
  };

  const handleAudioFilesUpload = (filesList) => {
    if (!filesList || filesList.length === 0) return;
    const files = Array.from(filesList);
    let matchedCount = 0;

    files.forEach((file) => {
      // 파일명 내 1~20 숫자 매칭 (예: 01.mp3, Track_02.wav, Suno_3.mp3 등)
      const numMatch = file.name.match(/(?:track|트랙|_|-|\b|#)0*([1-9]|1[0-9]|20)(?:\D|$)/i);
      let targetSlot = null;
      if (numMatch) {
        targetSlot = parseInt(numMatch[1], 10);
      }

      if (targetSlot && targetSlot >= 1 && targetSlot <= 20) {
        matchedCount++;
        const slot = targetSlot;
        const reader = new FileReader();
        reader.onload = (e) => {
          setCustomAudioTracks(prev => ({
            ...prev,
            [slot]: {
              name: file.name,
              data: e.target.result
            }
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    if (matchedCount === files.length) {
      alert(`🟢 총 ${files.length}개 파일의 트랙 번호(01~20)를 인식하여 제자리에 100% 자동 정렬했습니다!`);
    } else if (matchedCount === 0) {
      alert(`⚠️ 올리신 ${files.length}개 파일 중 트랙 번호(01~20)가 있는 파일이 없어 슬롯에 정렬되지 않았습니다. (0개 정렬됨)\n* 해당 슬롯 카드의 [📂 파일 꽂기] 버튼으로 직접 꽂으실 수 있습니다.`);
    } else {
      alert(`🟢 총 ${files.length}개 중 ${matchedCount}개는 지정 트랙 슬롯에 정렬되었고, 트랙 번호가 없는 ${files.length - matchedCount}개 파일은 자동 정렬에서 제외되었습니다.`);
    }
  };

  const handleUpdateVisualPrompt = (id, key, value) => {
    setVisualPrompts(prev => prev.map(p => p.id === id ? { ...p, [key]: value } : p));
  };

  const [translatingVisualPromptId, setTranslatingVisualPromptId] = useState(null);

  const handleTranslateVisualPrompt = async (promptId) => {
    const p = visualPrompts.find(x => x.id === promptId);
    if (!p) return;
    setTranslatingVisualPromptId(promptId);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: p.prompt,
          type: "visual",
          modelName: selectedGeminiModel
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.translatedImage) {
          handleUpdateVisualPrompt(promptId, "promptEn", data.translatedImage);
        }
        if (data.translatedVideo) {
          handleUpdateVisualPrompt(promptId, "videoPromptEn", data.translatedVideo);
        }
      } else {
        alert("번역에 실패했습니다.");
      }
    } catch (err) {
      console.error(err);
      alert("번역 요청 중 오류가 발생했습니다.");
    } finally {
      setTranslatingVisualPromptId(null);
    }
  };

  const pollVideoStatus = async (operationName) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > 120) { // Max 10 minutes (5s * 120)
        clearInterval(interval);
        setVideoLog("시간 초과: 비디오 생성 대기 시간이 초과되었습니다.");
        setIsGeneratingVideo(false);
        return;
      }
      try {
        const res = await fetch(`/api/generate-video/status?name=${encodeURIComponent(operationName)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.done) {
            clearInterval(interval);
            if (data.error) {
              setVideoLog(`비디오 생성 실패: ${data.error}`);
            } else if (data.videoUrl) {
              setVideoLog("비디오 생성 성공!");
              setUserMediaUrl(data.videoUrl);
              setUserMediaType("video");
            }
            setIsGeneratingVideo(false);
          } else {
            setVideoLog(`AI 비디오 생성 중... (${attempts * 5}초 경과)`);
          }
        } else {
          clearInterval(interval);
          setVideoLog("오류: 비디오 상태를 가져오지 못했습니다.");
          setIsGeneratingVideo(false);
        }
      } catch (err) {
        clearInterval(interval);
        setVideoLog(`오류: ${err.message}`);
        setIsGeneratingVideo(false);
      }
    }, 5000);
  };

  const fetchAiVisualPrompts = async (topicText) => {
    setIsGeneratingVisualPrompts(true);
    try {
      const res = await fetch(`/api/generate-images?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicText || topTrendingTheme.title, modelName: selectedGeminiModel })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.candidates && data.candidates.length > 0) {
          setVisualPrompts(data.candidates);
        }
      }
    } catch (e) {
      console.error("Failed to fetch visual prompts:", e);
    } finally {
      setIsGeneratingVisualPrompts(false);
    }
  };

  const fetchAiMusicPrompts = async (topicText) => {
    setIsGeneratingMusicPrompts(true);
    try {
      const res = await fetch(`/api/generate-music-prompts?t=${Date.now()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicText || topTrendingTheme.title,
          modelName: selectedGeminiModel,
          targetDurationMinutes: trackDurationMinutes
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.musicPrompts && data.musicPrompts.length > 0) {
          setMusicPrompts(data.musicPrompts);
        }
      }
    } catch (e) {
      console.error("Failed to fetch music prompts:", e);
    } finally {
      setIsGeneratingMusicPrompts(false);
    }
  };

  const handleCopyPrompt = (promptText, idKey) => {
    navigator.clipboard.writeText(promptText);
    setCopiedPromptId(idKey);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleFetchAvailableModels = async () => {
    setIsFetchingModels(true);
    try {
      const res = await fetch(`/api/status?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Pragma": "no-cache" }
      });
      const data = await res.json();
      if (res.ok && data.models && data.models.length > 0) {
        setAvailableGeminiModels(data.models);
        if (!selectedGeminiModel || selectedGeminiModel === "gemini-1.5-flash") {
          setSelectedGeminiModel(data.defaultModel || data.models[0].id);
        }
      }
    } catch (e) {
      console.warn("[Fetch models error]", e);
    } finally {
      setIsFetchingModels(false);
    }
  };

  useEffect(() => {
    handleFetchAvailableModels();
  }, []);

  const handleConnectWithChosenModel = async () => {
    if (!selectedGeminiModel) {
      alert("⚠️ 먼저 사용할 구글 제미나이 모델을 선택해 주세요.");
      return;
    }
    setIsTestingApi(true);
    try {
      const res = await fetch(`/api/status?model=${encodeURIComponent(selectedGeminiModel)}`);
      const data = await res.json();
      if (res.ok && data.status === "ok") {
        setIsApiConnected(true);
        try {
          sessionStorage.setItem("gemini_api_connected", "true");
          sessionStorage.setItem("gemini_selected_model", selectedGeminiModel);
        } catch (e) {}
        alert(`🟢 Google Gemini [${data.connectedModel}] 모델 연결 성공!`);
      } else {
        setIsApiConnected(false);
        alert(`🔴 연결 실패: ${data.message || "API 키 및 모델을 확인해 주세요."}`);
      }
    } catch (e) {
      setIsApiConnected(false);
      alert(`🔴 통신 에러: ${e.message}`);
    } finally {
      setIsTestingApi(false);
    }
  };

  useEffect(() => {
    if (logTerminalRef.current) logTerminalRef.current.scrollTop = logTerminalRef.current.scrollHeight;
  }, [renderLog, uploadLog]);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollTop = chatBottomRef.current.scrollHeight;
  }, [chatMessages, isAiThinking]);

  useEffect(() => {
    fetchLibrary();
    checkYouTubeAuth();

    if (typeof window !== "undefined") {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get("connected") === "true") {
          setIsYouTubeConnected(true);
          alert("YouTube channel connected successfully!");
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {}
    }
  }, []);

  // Poll render status from backend only when rendering is active
  useEffect(() => {
    if (!isRendering) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setRenderStatus(data.status || "idle");
          setRenderProgress(data.progress || 0);
          setRenderLog(data.log || "");
          
          if (data.status !== "rendering") {
            setIsRendering(false);
            if (data.status === "success") {
              fetchLibrary();
              const usedSecs = targetDurationHours * 3600;
              setKaggleRemainingSeconds(prev => {
                const next = Math.max(0, prev - usedSecs);
                localStorage.setItem("kaggle_remaining_seconds", next);
                return next;
              });
            }
          }
        }
      } catch (e) {
        // Silent catch during disconnects
      }
    };

    fetchStatus();
    const renderTimer = setInterval(fetchStatus, 3000);
    return () => clearInterval(renderTimer);
  }, [isRendering]);

  useEffect(() => {
    let uploadTimer;
    if (uploadStatus === "uploading") {
      uploadTimer = setInterval(async () => {
        const res = await fetch("/api/upload/status");
        if (res.ok) {
          const data = await res.json();
          setUploadStatus(data.status);
          setUploadProgress(data.progress);
          setUploadLog(data.log || "");

          if (data.status === "success" || data.status === "error") {
            setUploadStatus(data.status);
          }
        }
      }, 2000);
    }

    return () => {
      if (uploadTimer) clearInterval(uploadTimer);
    };
  }, [uploadStatus]);

  const handleDeleteVideo = async (videoName) => {
    if (window.confirm(`"${videoName}" 영상 파일을 완전히 삭제하시겠습니까?`)) {
      try {
        const res = await fetch(`/api/library?name=${encodeURIComponent(videoName)}`, { method: "DELETE" });
        if (res.ok) fetchLibrary();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchLibrary = async () => {
    try {
      const res = await fetch("/api/library");
      if (res.ok) {
        const data = await res.json();
        setLibrary(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("[Library fetch silenced]", e.message);
    }
  };

  const checkYouTubeAuth = async () => {
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genre: "check", theme: "check" })
      });
      if (res.ok) {
        const data = await res.json();
        setIsYouTubeConnected(data.isYouTubeConnected);
      }
    } catch (e) {
      console.warn("[YouTube auth check silenced]", e.message);
    }
  };

  const handleConnectYouTube = async () => {
    const res = await fetch("/api/auth/url");
    if (res.ok) {
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    }
  };

  const handleGenerateSEO = async () => {
    setIsLoadingMetadata(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: "Seoul Lofi Reverie / Traditional Gugak & Chillhop",
          theme: topTrendingTheme.title,
          trackCount: isTestMode ? 2 : 20,
          durationHours: targetDurationHours
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTitle(data.metadata.title || `[${targetDurationHours} Hour] ${topTrendingTheme.title}`);

        let fullDesc = data.metadata.description;
        fullDesc += "\n\n🧬 [Sound Science & Brainwave System]\n";
        fullDesc += `• Applied Brainwave: ${topTrendingTheme.brainwave}\n`;
        fullDesc += `• Target Korean Instruments: ${topTrendingTheme.targetInstruments}\n`;
        fullDesc += "--------------------------------------------------\n\n";
        fullDesc += "📌 [Tracklist Chapters]\n";

        const rawTrackList = (data.metadata && Array.isArray(data.metadata.trackTitles) && data.metadata.trackTitles.length > 0)
          ? data.metadata.trackTitles
          : sample20Tracks.map(t => t.titleEn);

        const trackTitlesList = rawTrackList.map((tTitle, i) => {
          if (/[가-힣]/.test(tTitle)) {
            return sample20Tracks[i % sample20Tracks.length]?.titleEn || `Track ${String(i + 1).padStart(2, "0")}: Whispering Korean Lofi Melodies Pt.${i + 1}`;
          }
          return tTitle;
        });

        trackTitlesList.slice(0, 20).forEach((tTitle, i) => {
          const totalSeconds = i * (trackDurationMinutes * 60);
          const mins = Math.floor(totalSeconds / 60);
          const secs = totalSeconds % 60;
          const timestamp = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
          fullDesc += `${timestamp} - ${tTitle}\n`;
        });

        fullDesc += "\n#KoreanLofi #SeoulVibes #StudyMusic #Gayageum #RainySeoul #SoundScience";
        setDescription(fullDesc);
        setTags((data.metadata.tags || ["lofi", "seoul lofi", "korean lofi", "gayageum", "study music"]).join(", "));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleStartRender = async () => {
    setRenderStatus("rendering");
    setRenderProgress(0);
    setRenderLog("Requesting video render job...");
    setIsRendering(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: "Seoul Lofi Reverie",
          theme: topTrendingTheme.title,
          customVisualUrl: userMediaUrl,
          ambientType: "none",
          ambientVolume: 0,
          audioEffect: "none",
          durationHours: targetDurationHours,
          trackCount: 20,
          isTestMode: false,
          customTracks: customAudioTracks,
          eqStyle,
          eqColor,
          eqPosition,
          enableCameraBreathing,
          enableRainParticles,
          enableDayToNight,
          enableFilmGrain,
          enableSmartTitle
        })
      });

      if (!res.ok) {
        const err = await res.json();
        setRenderStatus("error");
        setRenderLog(`Render failed: ${err.error}`);
        setIsRendering(false);
      }
    } catch (e) {
      setRenderStatus("error");
      setRenderLog(`Connection error: ${e.message}`);
      setIsRendering(false);
    }
  };

  const handleStartUpload = async (video) => {
    if (!title || !description) {
      alert("Please generate or fill in the SEO Title and Description first!");
      return;
    }

    setUploadStatus("uploading");
    setUploadProgress(0);
    setUploadLog("Initiating resumable upload session on YouTube...");
    setSelectedVideoForUpload(video);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoName: video.name,
          title: title,
          description: description,
          tags: tags.split(",").map(t => t.trim()),
          privacyStatus: privacyStatus
        })
      });

      if (!res.ok) {
        const err = await res.json();
        setUploadStatus("error");
        setUploadLog(`Upload failed: ${err.error}`);
      }
    } catch (e) {
      setUploadStatus("error");
      setUploadLog(`Connection error: ${e.message}`);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !isApiConnected) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");
    setIsAiThinking(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre: "chat",
          theme: userMsg,
          customVisualUrl: null,
          ambientType: "none",
          ambientVolume: 0,
          audioEffect: "none",
          durationHours: 0,
          trackCount: 0,
          isTestMode: false,
          chatHistory: chatMessages.map(m => `${m.sender === "ai" ? "AI" : "User"}: ${m.text}`).join("\n"),
          modelName: selectedGeminiModel
        })
      });
      if (res.ok) {
        const data = await res.json();
        let aiReply = data.log || data.message || "네, 알겠습니다! 요청을 처리하겠습니다.";
        
        try {
          const jsonMatch = aiReply.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.updateTheme) {
              setTopTrendingTheme(parsed.updateTheme);
            }
            if (parsed.updateCalendar && Array.isArray(parsed.updateCalendar)) {
              setMonthCalendar(parsed.updateCalendar);
            }
            if (parsed.updateMusicPrompts && Array.isArray(parsed.updateMusicPrompts)) {
              setMusicPrompts(parsed.updateMusicPrompts);
            }
            if (parsed.updateVisualPrompts && Array.isArray(parsed.updateVisualPrompts)) {
              setVisualPrompts(parsed.updateVisualPrompts);
            }
            if (parsed.updateOptions) {
              if (parsed.updateOptions.targetDurationHours) setTargetDurationHours(parsed.updateOptions.targetDurationHours);
              if (parsed.updateOptions.eqStyle) setEqStyle(parsed.updateOptions.eqStyle);
              if (parsed.updateOptions.eqColor) setEqColor(parsed.updateOptions.eqColor);
              if (parsed.updateOptions.enableNeonDokkaebi !== undefined) setEnableNeonDokkaebi(parsed.updateOptions.enableNeonDokkaebi);
              if (parsed.updateOptions.enableCameraBreathing !== undefined) setEnableCameraBreathing(parsed.updateOptions.enableCameraBreathing);
              if (parsed.updateOptions.enableRainParticles !== undefined) setEnableRainParticles(parsed.updateOptions.enableRainParticles);
              if (parsed.updateOptions.enableDayToNight !== undefined) setEnableDayToNight(parsed.updateOptions.enableDayToNight);
              if (parsed.updateOptions.enableFilmGrain !== undefined) setEnableFilmGrain(parsed.updateOptions.enableFilmGrain);
              if (parsed.updateOptions.enableSmartTitle !== undefined) setEnableSmartTitle(parsed.updateOptions.enableSmartTitle);
            }
            if (parsed.log) {
              aiReply = parsed.log;
            }
          }
        } catch (e) {
          console.warn("JSON parse error:", e);
        }

        setChatMessages(prev => [...prev, { sender: "ai", text: aiReply }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const requestQuotaApproval = (actionName, estimatedCost, callback) => {
    callback();
  };

  // Next-Auth session loading state
  if (status === "loading") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
        color: "#ffffff"
      }}>
        <div style={{ 
          width: "40px", 
          height: "40px", 
          border: "2px solid rgba(255,255,255,0.1)", 
          borderTopColor: "#a1a1aa", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite" 
        }} />
        <div style={{ 
          marginTop: "16px", 
          fontSize: "12px", 
          letterSpacing: "3px", 
          color: "#888888", 
          fontWeight: "700" 
        }}>
          CONNECTING STUDIO...
        </div>
      </div>
    );
  }

  // Next-Auth session check
  if (!session) {
    const errorParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("error") : null;
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, #111111 0%, #000000 100%)",
        padding: "20px"
      }}>
        <div className="glass-panel" style={{
          width: "100%",
          maxWidth: "440px",
          padding: "48px 36px",
          borderRadius: "12px",
          textAlign: "center",
          background: "rgba(23, 23, 23, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ fontSize: "36px", marginBottom: "20px" }}>👹</div>
          <h1 style={{ 
            fontSize: "26px", 
            fontWeight: "800", 
            letterSpacing: "4px", 
            color: "#ffffff",
            marginBottom: "6px",
            textTransform: "uppercase"
          }}>
            Seoul Lofi
          </h1>
          <p style={{ 
            fontSize: "12px", 
            letterSpacing: "2px", 
            color: "#888888", 
            fontWeight: "700",
            marginBottom: "36px",
            textTransform: "uppercase"
          }}>
            Creator Console
          </p>

          <button 
            onClick={() => signIn("google")}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "30px",
              background: "#ffffff",
              border: "none",
              color: "#000000",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "all 0.2s ease"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#f4f4f4"}
            onMouseOut={(e) => e.currentTarget.style.background = "#ffffff"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Google 계정으로 로그인
          </button>

          {errorParam === "AccessDenied" && (
            <div style={{ 
              marginTop: "24px", 
              padding: "12px", 
              borderRadius: "8px", 
              background: "rgba(161, 161, 170, 0.1)", 
              border: "1px solid rgba(161, 161, 170, 0.2)",
              color: "#a1a1aa", 
              fontSize: "13px",
              lineHeight: "1.5"
            }}>
              ⚠️ 접근 권한이 없는 구글 계정입니다.<br/>허용된 크리에이터 계정으로 다시 시도해 주세요.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto", position: "relative" }}>
      {/* Hidden Global Audio Player */}
      <audio ref={audioPlayerRef} style={{ display: "none" }} crossOrigin="anonymous" />

      {/* Top Header */}
      <header style={{ marginBottom: "30px", textAlign: "center", position: "relative" }}>
        <button 
          onClick={() => signOut()} 
          className="btn-secondary" 
          style={{ 
            position: "absolute", 
            top: "0px", 
            right: "0px", 
            padding: "8px 16px", 
            fontSize: "11px" 
          }}
        >
          LOG OUT
        </button>
        <h1 className="gradient-text text-glow-subtle" style={{ 
          fontFamily: "var(--font-outfit)", 
          fontSize: "36px", 
          fontWeight: "800", 
          letterSpacing: "4px",
          textTransform: "uppercase" 
        }}>
          Dokkaebi Lofi Studio 👹🌙
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: "6px", fontSize: "14px", letterSpacing: "1px" }}>
          DOKKAEBI 4K THUMBNAIL ENGINE & 20-TRACK STORYTELLING LOFI PUBLISHER
        </p>
      </header>

      {/* 🟢 Google Gemini AI 접속 게이트 & 모델 선택 컨트롤 패널 */}
      <div className="glass-panel" style={{ 
        marginBottom: "20px", 
        padding: "14px 20px", 
        border: "1px solid var(--glass-border)",
        background: "var(--bg-secondary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>●</span>
          <div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "1px" }}>
              GOOGLE GEMINI AI ENGINE ACTIVE
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
              자동 프롬프트 생성, 한글 동기화 번역, AI 채팅 코칭이 제미나이 엔진으로 가동 중입니다.
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#aaa", fontWeight: "700" }}>🤖 AI 모델:</span>
          <select 
            value={selectedGeminiModel} 
            onChange={(e) => {
              setSelectedGeminiModel(e.target.value);
              try { sessionStorage.setItem("gemini_selected_model", e.target.value); } catch(err){}
            }}
            style={{
              background: "#05030a",
              color: "#a1a1aa",
              border: "1px solid #a1a1aa",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              outline: "none",
              cursor: "pointer"
            }}
          >
            {availableGeminiModels.map(m => (
              <option key={m.id} value={m.id}>{m.displayName}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={async () => {
              setIsTestingApi(true);
              try {
                const res = await fetch("/api/generate-images", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ topic: "헬스체크 테스트" })
                });
                if (res.ok) {
                  setIsApiConnected(true);
                  alert("🟢 Google Gemini API 연결 점검 성공! 모델 상태 100% 정상입니다.");
                } else {
                  alert("⚠️ Gemini API 연결 응답 지연 (API 키 점검 필요)");
                }
              } catch (err) {
                alert("❌ 연결 실패: " + err.message);
              } finally {
                setIsTestingApi(false);
              }
            }}
            disabled={isTestingApi}
            style={{
              padding: "6px 14px",
              fontSize: "12px",
              fontWeight: "800",
              background: "rgba(161, 161, 170, 0.2)",
              color: "#a1a1aa",
              border: "1px solid #a1a1aa",
              borderRadius: "6px",
              cursor: "pointer",
              opacity: isTestingApi ? 0.5 : 1
            }}
          >
            {isTestingApi ? "⏳ 점검 중..." : "⚡ API 연결 재점검"}
          </button>
        </div>
      </div>

      {/* Project Switcher & Multi-Channel Selector Bar */}
      <div className="glass-panel" style={{ 
        marginBottom: "20px", 
        padding: "16px 20px", 
        border: "1px solid rgba(161, 161, 170, 0.4)",
        background: "rgba(161, 161, 170, 0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "300px" }}>
          <div style={{ fontSize: "28px" }}>📂</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "14px", fontWeight: "800", color: "#a1a1aa", marginBottom: "4px" }}>
              프로젝트 변경 & 새 채널 브랜딩 선택기
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <select 
                value={currentProjectType} 
                onChange={(e) => {
                  const val = e.target.value;
                  setCurrentProjectType(val);
                  if (val === "dokkaebi") {
                    setCustomBrandName("DOKKAEBI KOREA LOFI");
                    setSelectedTheme("Dokkaebi Lofi 👹 [서울] - 비 내리는 자정 한옥 가야금 공부 로파이 🌧️");
                    setThumbnailBadgeText("[3 HOURS GAYAGEUM LOFI]");
                    setShowDokkaebiBadge(true);
                  } else if (val === "jazz") {
                    setCustomBrandName("MIDNIGHT JAZZ BAR 🎷");
                    setSelectedTheme("Midnight Jazz Lofi 🎷 - Rain & Smooth Piano Chillhop ☕");
                    setThumbnailBadgeText("[3 HOURS SMOOTH JAZZ LOFI]");
                    setShowDokkaebiBadge(false);
                  } else if (val === "rain") {
                    setCustomBrandName("RAINY DAY CAFE 🌧️");
                    setSelectedTheme("Rainy Day Lofi ☕ - Soft Rain ASMR & Chill Piano Beats 🌧️");
                    setThumbnailBadgeText("[3 HOURS HEALING RAIN LOFI]");
                    setShowDokkaebiBadge(false);
                  } else if (val === "cyberpunk") {
                    setCustomBrandName("CYBERPUNK CITY 🌌");
                    setSelectedTheme("Cyberpunk Synthwave 🌌 - Neon Night Driving Beats 🚘");
                    setThumbnailBadgeText("[3 HOURS SYNTHWAVE CHILL]");
                    setShowDokkaebiBadge(false);
                  }
                }}
                style={{
                  background: "#0a0612",
                  color: "#a1a1aa",
                  border: "1px solid rgba(161, 161, 170, 0.4)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "700",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="dokkaebi">👹 1. 도깨비 국악 로파이 프로젝트 (Dokkaebi Korea Lofi)</option>
                <option value="jazz">🎷 2. 미드나잇 재즈 로파이 프로젝트 (Midnight Jazz Lofi)</option>
                <option value="rain">🌧️ 3. 빗소리 카페 힐링 로파이 프로젝트 (Rainy Day Lofi)</option>
                <option value="cyberpunk">🌌 4. 사이버펑크 시티 신스웨이브 프로젝트 (Cyberpunk Synthwave)</option>
              </select>

              <input 
                type="text"
                value={customBrandName}
                onChange={(e) => setCustomBrandName(e.target.value)}
                placeholder="내 마스코트/브랜드 문구 직접 입력"
                style={{
                  background: "#0a0612",
                  color: "#ffffff",
                  border: "1px solid var(--glass-border)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  minWidth: "220px"
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
        {/* Left Column: Visual & Sound Studio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>

          {/* AI Recommended Topic & Chat */}
          <div className="glass-panel" style={{ borderColor: "rgba(161, 161, 170, 0.6)", boxShadow: "0 0 30px rgba(161, 161, 170, 0.25)" }}>
            
            <div style={{ background: "rgba(161, 161, 170, 0.08)", border: "1px solid rgba(161, 161, 170, 0.3)", borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "6px" }}>
                  🏆 [현재 활성화된 추천 주제]
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setShowMonthCalendar(!showMonthCalendar)}
                    style={{
                      background: showMonthCalendar ? "rgba(161, 161, 170, 0.3)" : "rgba(161, 161, 170, 0.2)",
                      border: showMonthCalendar ? "1px solid #a1a1aa" : "1px solid #a1a1aa",
                      color: showMonthCalendar ? "#a1a1aa" : "#a1a1aa",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <span>📅 30일치 요일별 달력</span>
                    <span>{showMonthCalendar ? "▲" : "▼"}</span>
                  </button>
                  <span className="badge badge-success" style={{ fontSize: "11px" }}>실시간 서치 완료</span>
                </div>
              </div>

              {/* 30-Day Dropdown Accordion List */}
              {showMonthCalendar && (
                <div style={{
                  background: "#05030a",
                  border: "1px solid var(--accent-purple)",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "12px",
                  maxHeight: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ fontSize: "12px", fontWeight: "800", color: "#a1a1aa", marginBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                    <span>🗓️ 30일치 요일별 킬러 주제 목록 (원하는 날짜 선택):</span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>원클릭 주제 전환 가능</span>
                  </div>
                  {monthCalendar.map((item, idx) => {
                    const isSelectedItem = topTrendingTheme.title === item.title;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          const targetObj = {
                            title: item.title,
                            enHookTitle: item.enHookTitle,
                            desc: `유튜브 실시간 추천 ${item.day} 킬러 주제 + ${item.inst} & ${item.wave} 결합`,
                            viewPotential: "🔥 예상 조회수: Top 1% (글로벌 80억 타겟)",
                            targetInstruments: `${item.inst}`,
                            brainwave: `${item.wave} + 432Hz 힐링 주파수`
                          };
                          setTopTrendingTheme(targetObj);
                          setChatMessages([
                            { sender: "ai", text: `안녕하세요 총감독님! 👹 선택하신 주제 [${item.title}]로 대시보드 추천 카드와 AI 프로듀서 채팅이 100% 통일 전환되었습니다! 100% 영문 질문형 훅 제목 [${item.enHookTitle}] 기획이 완벽히 준비되었습니다.` }
                          ]);
                          let richKoPrompt = `${item.title} 주제에 맞춘 디테일한 2D 로파이 감성 애니메이션 연출. 삼각대 고정 카메라, 움직임 없음, 4K 고화질 루프`;
                          if (item.title.includes("양머리") || item.title.includes("찜질방") || item.title.includes("목욕탕")) {
                            richKoPrompt = "흰색 한국 찜질방 양머리 수건(양머리)을 머리에 쓰고 편안한 찜질방 옷을 입은 귀여운 한국 여성 2D 로파이 캐릭터가 포근한 전통 찜질방 휴게실 바닥에 편안하게 휴식을 취하고 있다. 옆에는 빨대 꽂힌 식혜와 맥반석 구운 계란이 정갈하게 놓여 있다.";
                          } else if (item.title.includes("모닥불") || item.title.includes("불멍") || item.title.includes("숲속")) {
                            richKoPrompt = "어두운 밤, 별이 쏟아지는 깊은 산속 한옥 정자 마당에서 타닥타닥 타오르는 모닥불을 바라보며 아늑하게 해금 연주와 불멍을 즐기는 귀여운 2D 로파이 수호신 캐릭터. 모닥불 연기가 은은하게 밤하늘로 올라가고 있다.";
                          } else if (item.title.includes("도깨비")) {
                            richKoPrompt = "네온 조명이 빛나는 신비로운 도깨비 숲속에서 청록색 뿔 and 호화로운 네온 한복 사이버 아머를 입은 귀여운 도깨비 캐릭터가 수호신 방망이를 들고 아늑하게 앉아 있다.";
                          } else if (item.title.includes("한옥") || item.title.includes("북촌") || item.title.includes("뜰")) {
                            richKoPrompt = "달빛이 비치는 고즈넉한 한국 한옥 뜰 마루에 앉아 따뜻한 차를 마시며 창밖의 은은한 밤 풍경을 조용히 바라보는 귀여운 2D 로파이 여성 캐릭터.";
                          }
                          setCustomKoreanPrompt(richKoPrompt);
                          handleSyncKoreanToEnglishPrompt(richKoPrompt);
                          fetchAiMusicPrompts(item.title);
                          setShowMonthCalendar(false);
                        }}
                        style={{
                          padding: "8px 12px",
                          background: isSelectedItem ? "rgba(161, 161, 170, 0.2)" : "rgba(255,255,255,0.03)",
                          border: isSelectedItem ? "2px solid #a1a1aa" : "1px solid var(--glass-border)",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <span style={{ fontWeight: isSelectedItem ? "800" : "700", color: isSelectedItem ? "#a1a1aa" : "#fff" }}>
                          {item.day}: {item.title} {isSelectedItem ? "🟢 [현재 선택됨]" : ""}
                        </span>
                        <span style={{ fontSize: "11px", color: isSelectedItem ? "#a1a1aa" : "#e2e8f0", background: isSelectedItem ? "rgba(161, 161, 170,0.2)" : "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                          {isSelectedItem ? "✓ 적용중" : "👉 이 주제 선택"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", marginBottom: "6px" }}>
                {topTrendingTheme.title}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "10px" }}>
                {topTrendingTheme.desc}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px" }}>
                <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "4px 10px", borderRadius: "6px", color: "#e2e8f0" }}>{topTrendingTheme.viewPotential}</span>
                <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "4px 10px", borderRadius: "6px", color: "#a1a1aa" }}>🎻 {topTrendingTheme.targetInstruments}</span>
                <span style={{ background: "rgba(255, 255, 255, 0.08)", padding: "4px 10px", borderRadius: "6px", color: "#a1a1aa" }}>🧠 {topTrendingTheme.brainwave}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent-pink)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                💬 AI 프로듀서 채팅 (주제 및 스타일 조율)
              </div>
              <div ref={chatBottomRef} style={{ background: "#05030a", border: "1px solid var(--glass-border)", borderRadius: "10px", padding: "12px", height: "140px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", marginBottom: "10px" }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{
                    alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                    maxWidth: "85%",
                    background: msg.sender === "user" ? "rgba(161, 161, 170,0.3)" : "rgba(255,255,255,0.08)",
                    border: msg.sender === "user" ? "1px solid var(--accent-purple)" : "1px solid var(--glass-border)",
                    borderRadius: "10px",
                    padding: "8px 12px",
                    color: "#fff",
                    lineHeight: "1.4"
                  }}>
                    {msg.text}
                  </div>
                ))}
                {isAiThinking && (
                  <div style={{ alignSelf: "flex-start", fontSize: "12px", color: "#a1a1aa", fontStyle: "italic" }}>🤖 답변 작성 중...</div>
                )}
              </div>
              <form onSubmit={handleSendChatMessage} style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  disabled={!isApiConnected}
                  placeholder={!isApiConnected ? "🔒 상단에서 API 연결을 먼저 완료해 주세요." : "예: 오늘 주제 바꿔줘 / 가야금 느낌 강조해줘..."} 
                  style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", fontSize: "13px", opacity: !isApiConnected ? 0.6 : 1 }} 
                />
                <button type="submit" className="btn-primary" disabled={!isApiConnected} style={{ padding: "10px 16px", fontSize: "13px", opacity: !isApiConnected ? 0.5 : 1 }}>
                  전송
                </button>
              </form>
            </div>
          </div>

          {/* SECTION A: Custom Video / Image Upload Studio */}
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-cyan)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "8px" }}>
                🎬 [내 8초 비디오 또는 이미지 첨부] (초경량)
              </h2>
              <span className="badge badge-success" style={{ fontSize: "11px" }}>비주얼 영역</span>
            </div>

            {/* Drag and Drop Zone */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: isDragging ? "2px dashed #a1a1aa" : userMediaUrl ? "2px solid #a1a1aa" : "2px dashed var(--glass-border)",
                background: isDragging ? "rgba(161, 161, 170, 0.1)" : userMediaUrl ? "rgba(161, 161, 170, 0.03)" : "rgba(0, 0, 0, 0.3)",
                borderRadius: "12px",
                padding: "20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.3s ease",
                marginBottom: "14px"
              }}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                accept="video/*,image/*" 
                style={{ display: "none" }} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>{userMediaUrl ? "✅" : "📁"}</div>
              <div style={{ fontSize: "14px", fontWeight: "800", color: userMediaUrl ? "#a1a1aa" : "#ffffff", marginBottom: "4px" }}>
                {userMediaUrl ? `첨부 완료: ${userMediaName || "비디오/이미지 자산"}` : "여기에 8초 비디오(.mp4) 또는 이미지(.jpg/.png)를 끌어다 놓으세요!"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {userMediaUrl ? "클릭하시면 다른 파일로 교체할 수 있습니다." : "클릭하여 내 컴퓨터에서 파일 직접 선택"}
              </div>
            </div>

            {/* 💾 원클릭 8초 비디오 다운로드 버튼 */}
            {userMediaUrl && (
              <div style={{ marginBottom: "14px", display: "flex", justifyContent: "flex-end" }}>
                <a
                  href={userMediaUrl}
                  download={userMediaName || "lofi_8sec_video.mp4"}
                  style={{
                    padding: "8px 16px",
                    fontSize: "12px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #a1a1aa 0%, #00b4d8 100%)",
                    color: "#000000",
                    borderRadius: "6px",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 15px rgba(161, 161, 170, 0.4)",
                    cursor: "pointer"
                  }}
                >
                  💾 [8초 비디오/자산 파일 내 컴퓨터에 바로 다운로드]
                </a>
              </div>
            )}

            {/* Visual Loop Preview Player */}
            <div style={{
              width: "100%",
              aspectRatio: "16/9",
              background: "#05030a",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1px solid var(--glass-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px",
              position: "relative"
            }}>
              {userMediaUrl ? (
                userMediaType === "video" ? (
                  <video key={userMediaUrl} src={userMediaUrl} autoPlay loop muted controls style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={userMediaUrl} alt="User Visual" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)", fontSize: "13px" }}>
                  <div style={{ fontSize: "32px", marginBottom: "8px", opacity: 0.5 }}>🎬</div>
                  <div>위의 상자에 <strong>8초 비디오 파일</strong>을 첨부하시면</div>
                  <div style={{ fontSize: "11px", marginTop: "4px", color: "#a1a1aa" }}>여기서 8초 무한 루프 영상을 1초 만에 바로 미리보실 수 있습니다!</div>
                </div>
              )}

              {/* 5-Layer Audio-Reactive Neon Dokkaebi Sticker Overlay */}
              {enableNeonDokkaebi && (
                <div 
                  style={{
                    position: "absolute",
                    top: "15px",
                    left: "15px",
                    width: "85px",
                    height: "85px",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "transform 0.08s ease-out",
                    transform: `scale(${1.0 + audioLevels.bass * 0.08})`,
                    zIndex: 10
                  }}
                >
                  {/* Layer 1: Ambient Glow Background */}
                  <div 
                    style={{
                      position: "absolute",
                      inset: "-8px",
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(161, 161, 170, 0.4) 0%, transparent 75%)",
                      opacity: 0.3 + audioLevels.treble * 0.7,
                      filter: "blur(8px)"
                    }}
                  />

                  {/* Layer 2: Main Dokkaebi Image with dynamic drop-shadows & brightness */}
                  <img 
                    src="/dokkaebi_logo.png" 
                    alt="Neon Dokkaebi Sticker" 
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "50%",
                      filter: `
                        drop-shadow(0 0 ${5 + audioLevels.bass * 12}px rgba(161, 161, 170, ${0.4 + audioLevels.bass * 0.6}))
                        drop-shadow(0 0 ${2 + audioLevels.mid * 8}px rgba(161, 161, 170, ${0.3 + audioLevels.mid * 0.7}))
                        brightness(${1.0 + audioLevels.mid * 0.25})
                      `,
                      transition: "filter 0.05s ease-out"
                    }}
                  />

                  {/* Layer 3: Rotating Neon LP Ring */}
                  <div 
                    style={{
                      position: "absolute",
                      inset: "-4px",
                      border: "2.5px solid transparent",
                      borderRadius: "50%",
                      backgroundImage: "linear-gradient(#05030a, #05030a), linear-gradient(to right, #a1a1aa, #a1a1aa)",
                      backgroundOrigin: "border-box",
                      backgroundClip: "content-box, border-box",
                      animation: "spin 25s linear infinite",
                      boxShadow: `0 0 ${3 + audioLevels.bass * 10}px #a1a1aa, inset 0 0 ${2 + audioLevels.mid * 5}px #a1a1aa`,
                      opacity: 0.85
                    }}
                  />

                  {/* CSS Spin Animation Injection */}
                  <style dangerouslySetInnerHTML={{__html: `
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}} />
                </div>
              )}
            </div>

            {/* 8초 비디오 생성용 커스텀 프롬프트 입력 영역 */}
            <div style={{ background: "rgba(0,0,0,0.3)", padding: "14px", borderRadius: "10px", border: "1px solid var(--glass-border)", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: "800" }}>
                  🎬 AI 8초 비디오 생성 제어 센터 (한글 연출 & 영문 헌법 결합)
                </span>
                
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsSyncingPrompt(true);
                      try {
                        const res = await fetch("/api/translate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: customKoreanPrompt,
                            type: "visual",
                            modelName: selectedGeminiModel
                          })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          const translated = data.translatedVideo || data.translatedImage || "A cozy 2D lofi animation";
                          const fixedConstitution = "perfect loop, seamless transition, first and last frame match exactly, static camera angle, locked tripod, no camera movement, 0% zoom-in, no pan, no tilt, no text, no watermark, no logo, NO grid lines, NO scanlines, NO diagonal streaks, clean crystal clear 4k detail, high quality, highly detailed, smooth 2D animation style";
                          const combined = `${translated}, ${fixedConstitution}`;
                          navigator.clipboard.writeText(combined);
                          alert("✅ [한글 지시 번역] + [영문 AI 헌법]이 성공적으로 결합되어 클립보드에 복사되었습니다!");
                        } else {
                          throw new Error("Translation failed");
                        }
                      } catch (err) {
                        const fixedConstitution = "perfect loop, seamless transition, first and last frame match exactly, static camera angle, locked tripod, no camera movement, 0% zoom-in, no pan, no tilt, no text, no watermark, no logo, NO grid lines, NO scanlines, NO diagonal streaks, clean crystal clear 4k detail, high quality, highly detailed, smooth 2D animation style";
                        const combined = `${customKoreanPrompt}, ${fixedConstitution}`;
                        navigator.clipboard.writeText(combined);
                        alert("⚠️ 번역 지연으로 원본 결합 텍스트가 클립보드에 복사되었습니다!");
                      } finally {
                        setIsSyncingPrompt(false);
                      }
                    }}
                    disabled={isSyncingPrompt}
                    className="btn-secondary"
                    style={{ padding: "6px 12px", fontSize: "11px", display: "flex", alignItems: "center" }}
                  >
                    📋 원클릭 영문 프롬프트 복사
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!customKoreanPrompt.trim()) {
                        alert("한글 연출 지시를 입력해 주세요!");
                        return;
                      }
                      setIsGeneratingVideo(true);
                      setVideoLog("AI가 프롬프트 번역 및 8초 비디오 생성을 요청하는 중...");
                      try {
                        // 1. Translate
                        const translateRes = await fetch("/api/translate", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            text: customKoreanPrompt,
                            type: "visual",
                            modelName: selectedGeminiModel
                          })
                        });
                        let translated = "A cozy 2D lofi animation";
                        if (translateRes.ok) {
                          const transData = await translateRes.json();
                          translated = transData.translatedVideo || transData.translatedImage || translated;
                        }
                        const fixedConstitution = "perfect loop, seamless transition, first and last frame match exactly, static camera angle, locked tripod, no camera movement, 0% zoom-in, no pan, no tilt, no text, no watermark, no logo, NO grid lines, NO scanlines, NO diagonal streaks, clean crystal clear 4k detail, high quality, highly detailed, smooth 2D animation style";
                        const combinedPrompt = `${translated}, ${fixedConstitution}`;
                        
                        // 2. Generate Video
                        const res = await fetch("/api/generate-video", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            prompt: combinedPrompt
                          })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setVideoLog("Veo 비디오 생성 작업이 캐글 클라우드로 전송되었습니다! 폴링 중...");
                          pollVideoStatus(data.operationName);
                        } else {
                          const err = await res.json();
                          setVideoLog(`Veo 요청 실패: ${err.error}`);
                          setIsGeneratingVideo(false);
                        }
                      } catch (err) {
                        setVideoLog(`연결 오류: ${err.message}`);
                        setIsGeneratingVideo(false);
                      }
                    }}
                    disabled={isGeneratingVideo || isSyncingPrompt}
                    className="btn-primary"
                    style={{ padding: "6px 12px", fontSize: "11px", display: "flex", alignItems: "center" }}
                  >
                    {isGeneratingVideo ? "⏳ 생성 중..." : "🎬 8초 비디오 생성 시작"}
                  </button>
                </div>
              </div>

              {/* 1. 영문 고정 헌법 (수정 불가) */}
              <div style={{ marginBottom: "10px" }}>
                <label style={{ display: "block", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "3px", fontWeight: "700" }}>
                  🌐 [영문 비디오 AI 고정 헌법 규칙 - 수정불가]
                </label>
                <div style={{
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  color: "var(--text-secondary)",
                  lineHeight: "1.4",
                  fontFamily: "var(--font-mono)"
                }}>
                  perfect loop, seamless transition, first and last frame match exactly, static camera angle, locked tripod, no camera movement, 0% zoom-in, no pan, no tilt, no text, no watermark, no logo, NO grid lines, NO scanlines, NO diagonal streaks, clean crystal clear 4k detail, high quality, highly detailed, smooth 2D animation style
                </div>
              </div>

              {/* 2. 한글 지시 프롬프트 (수정 가능) */}
              <div>
                <label style={{ display: "block", fontSize: "10px", color: "var(--text-primary)", marginBottom: "3px", fontWeight: "700" }}>
                  🇰🇷 [총감독님 한글 연출 지시 - 수정가능]
                </label>
                <textarea
                  value={customKoreanPrompt}
                  onChange={(e) => setCustomKoreanPrompt(e.target.value)}
                  placeholder="예: 어두운 밤, 별이 쏟아지는 깊은 산속 한옥 정자 마당에서..."
                  rows={4}
                  style={{
                    width: "100%",
                    background: "rgba(39, 39, 42, 0.4)",
                    border: "1px solid var(--glass-border)",
                    borderRadius: "6px",
                    padding: "10px",
                    color: "#fff",
                    fontSize: "12px",
                    lineHeight: "1.5",
                    resize: "vertical"
                  }}
                />
              </div>

              {videoLog && (
                <div style={{ marginTop: "8px", padding: "8px 12px", background: "rgba(0,0,0,0.6)", border: "1px solid var(--glass-border)", borderRadius: "6px", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                  {videoLog}
                </div>
              )}
            </div>

            {/* Gemini Visual Prompts Generator */}
            <div>
              <button 
                className="btn-secondary"
                onClick={() => fetchAiVisualPrompts(topTrendingTheme.title)}
                disabled={!isApiConnected || isGeneratingVisualPrompts}
                style={{ width: "100%", padding: "10px", fontSize: "13px", fontWeight: "700", opacity: !isApiConnected ? 0.5 : 1 }}
              >
                {isGeneratingVisualPrompts ? "🤖 제미나이가 영문 프롬프트 기획 중..." : "🤖 AI 영문 비주얼 프롬프트 5개 뽑기 (Runway / Midjourney용)"}
              </button>

              {visualPrompts.length > 0 && (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
                  {visualPrompts.map((p, pIdx) => {
                    const isTranslating = translatingVisualPromptId === p.id;
                    return (
                      <div key={p.id || pIdx} style={{ background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: "8px", border: "1px solid rgba(161, 161, 170, 0.3)", fontSize: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#a1a1aa", fontWeight: "800" }}>{p.title || `Visual Prompt #${pIdx + 1}`}</span>
                          <button
                            type="button"
                            onClick={() => handleTranslateVisualPrompt(p.id)}
                            disabled={isTranslating}
                            style={{
                              padding: "4px 10px",
                              fontSize: "11px",
                              fontWeight: "700",
                              background: "rgba(161, 161, 170, 0.15)",
                              color: "#a1a1aa",
                              border: "1px solid #a1a1aa",
                              borderRadius: "4px",
                              cursor: "pointer"
                            }}
                          >
                            {isTranslating ? "⏳ 번역 중..." : "🌐 AI 번역"}
                          </button>
                        </div>

                        {/* 한글 설명 입력창 */}
                        <div>
                          <label style={{ display: "block", fontSize: "10px", color: "#888", marginBottom: "2px" }}>한글 비주얼 기획:</label>
                          <textarea
                            value={p.prompt || ""}
                            onChange={(e) => handleUpdateVisualPrompt(p.id, "prompt", e.target.value)}
                            placeholder="한글 기획안 설명"
                            rows={2}
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "4px",
                              padding: "6px",
                              color: "#fff",
                              fontSize: "11px",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        {/* 이미지 프롬프트 (Midjourney 썸네일) */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <label style={{ fontSize: "10px", color: "#888" }}>Midjourney 이미지 프롬프트 (En):</label>
                            <button
                              type="button"
                              onClick={() => handleCopyPrompt(p.thumbEn || "", `v_img_${p.id}`)}
                              style={{
                                padding: "2px 6px",
                                fontSize: "10px",
                                fontWeight: "700",
                                background: copiedPromptId === `v_img_${p.id}` ? "#a1a1aa" : "rgba(161, 161, 170, 0.1)",
                                color: copiedPromptId === `v_img_${p.id}` ? "#000" : "#a1a1aa",
                                border: "1px solid #a1a1aa",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              {copiedPromptId === `v_img_${p.id}` ? "✓ 복사완료!" : "📋 이미지 복사"}
                            </button>
                          </div>
                          <textarea
                            value={p.thumbEn || ""}
                            onChange={(e) => handleUpdateVisualPrompt(p.id, "thumbEn", e.target.value)}
                            placeholder="Midjourney용 영문 이미지 썸네일 프롬프트"
                            rows={2}
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "4px",
                              padding: "6px",
                              color: "#aaa",
                              fontSize: "11px",
                              fontFamily: "monospace",
                              resize: "vertical"
                            }}
                          />
                        </div>

                        {/* 비디오 루프 프롬프트 (Veo/Runway) */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                            <label style={{ fontSize: "10px", color: "#888" }}>Veo/Runway 비디오 루프 프롬프트 (En):</label>
                            <button
                              type="button"
                              onClick={() => {
                                const targetVid = p.videoPromptEn || p.promptEn || "";
                                handleCopyPrompt(targetVid, `v_vid_${p.id}`);
                                if (targetVid) setCustomVideoPrompt(targetVid);
                              }}
                              style={{
                                padding: "2px 6px",
                                fontSize: "10px",
                                fontWeight: "700",
                                background: copiedPromptId === `v_vid_${p.id}` ? "#a1a1aa" : "rgba(161, 161, 170, 0.1)",
                                color: copiedPromptId === `v_vid_${p.id}` ? "#000" : "#a1a1aa",
                                border: "1px solid #a1a1aa",
                                borderRadius: "4px",
                                cursor: "pointer"
                              }}
                            >
                              {copiedPromptId === `v_vid_${p.id}` ? "✓ 복사 & 자동 대입완료!" : "📋 비디오 복사 & 대입"}
                            </button>
                          </div>
                          <textarea
                            value={p.videoPromptEn || p.promptEn || ""}
                            onChange={(e) => handleUpdateVisualPrompt(p.id, "videoPromptEn", e.target.value)}
                            placeholder="Veo/Runway용 영문 비디오 루프 프롬프트"
                            rows={3}
                            style={{
                              width: "100%",
                              background: "rgba(0,0,0,0.5)",
                              border: "1px solid rgba(255,255,255,0.15)",
                              borderRadius: "4px",
                              padding: "6px",
                              color: "#aaa",
                              fontSize: "11px",
                              fontFamily: "monospace",
                              resize: "vertical"
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION B: 20-Track Music Studio */}
          <div className="glass-panel" style={{ borderLeft: "4px solid var(--accent-purple)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent-purple)", display: "flex", alignItems: "center", gap: "8px" }}>
                🎵 [20곡 Lofi 음악 스튜디오]
              </h2>
              <span className="badge badge-pending" style={{ fontSize: "11px", background: "rgba(161, 161, 170, 0.2)", color: "#a1a1aa", border: "1px solid #a1a1aa" }}>음악 영역</span>
            </div>

            {/* Target Duration Selector & Track Duration Config */}
            <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "12px 16px", borderRadius: "10px", border: "1px solid var(--glass-border)", marginBottom: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#a1a1aa" }}>⏱️ 최종 영상 길이:</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3].map((hr) => (
                    <button
                      key={hr}
                      type="button"
                      onClick={() => setTargetDurationHours(hr)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "800",
                        borderRadius: "6px",
                        border: targetDurationHours === hr ? "2px solid #a1a1aa" : "1px solid rgba(255,255,255,0.2)",
                        background: targetDurationHours === hr ? "rgba(161, 161, 170,0.2)" : "rgba(0,0,0,0.4)",
                        color: targetDurationHours === hr ? "#a1a1aa" : "#aaa",
                        cursor: "pointer"
                      }}
                    >
                      ⏱️ {hr}시간 ({hr * 60}분)
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "#a1a1aa" }}>⏱️ 곡당 목표 시간 세팅:</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[
                    { min: 3, label: "3분 (180초, 기본)" },
                    { min: 2, label: "2분 (120초)" },
                    { min: 4, label: "4분 (240초)" }
                  ].map((dur) => (
                    <button
                      key={dur.min}
                      type="button"
                      onClick={() => setTrackDurationMinutes(dur.min)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "11px",
                        fontWeight: "800",
                        borderRadius: "6px",
                        border: trackDurationMinutes === dur.min ? "2px solid #a1a1aa" : "1px solid rgba(255,255,255,0.15)",
                        background: trackDurationMinutes === dur.min ? "rgba(161, 161, 170,0.25)" : "rgba(0,0,0,0.4)",
                        color: trackDurationMinutes === dur.min ? "#a1a1aa" : "#aaa",
                        cursor: "pointer"
                      }}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom MP3 Music Upload Zone */}
            {/* Batch Upload Zone for 20 tracks with intelligent filename number parsing */}
            <div 
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleAudioFilesUpload(e.dataTransfer.files);
                }
              }}
              style={{
                background: "rgba(161, 161, 170, 0.12)",
                border: "2px dashed #a1a1aa",
                boxShadow: "0 0 15px rgba(161, 161, 170, 0.2)",
                borderRadius: "10px",
                padding: "16px",
                marginBottom: "14px",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#a1a1aa", marginBottom: "4px" }}>
                📂 [20곡 한꺼번에 드래그 앤 드롭 파일 선택] (Suno/Udio/MusicFX 제작 파일)
              </div>
              <div style={{ fontSize: "12px", color: "#e2e8f0", marginBottom: "10px" }}>
                🎯 여러 음악 파일들을 컴퓨터 폴더에서 그대로 이 박스로 <strong>끌어서 놓으세요 (Drag & Drop)!</strong><br/>
                (파일명 안의 숫자를 자동 분석하여 1~20번 슬롯 제자리에 쏙 꽂아줍니다!)
              </div>
              <input 
                type="file" 
                ref={audioFileInputRef}
                multiple 
                accept="audio/*" 
                onChange={(e) => handleAudioFilesUpload(e.target.files)}
                style={{ fontSize: "12px", color: "#a1a1aa", cursor: "pointer" }}
              />
              {Object.keys(customAudioTracks).length > 0 && (
                <div style={{ marginTop: "10px", fontSize: "12px", color: "#a1a1aa", fontWeight: "900" }}>
                  ✓ 총 {Object.keys(customAudioTracks).length}개 트랙 슬롯에 음원이 꽂혀있습니다. (미첨부 슬롯은 AI 음원으로 자동 채움)
                </div>
              )}
            </div>

            {/* Gemini Prompt Generator Button */}
            <div style={{ marginBottom: "14px" }}>
              <button 
                className="btn-primary" 
                onClick={() => fetchAiMusicPrompts(topTrendingTheme.title)}
                disabled={!isApiConnected || isGeneratingMusicPrompts}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  fontWeight: "800",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #52525b 0%, #a1a1aa 100%)",
                  opacity: !isApiConnected ? 0.5 : 1,
                  color: "#000"
                }}
              >
                {!isApiConnected ? "🔒 API 연결 필요" : isGeneratingMusicPrompts ? "🎼 음악 기획 생성 중..." : "🎵 1단계: 음악 기획 생성"}
              </button>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", marginTop: "4px" }}>
                오늘 주제에 맞춘 20곡 Lofi 음악 프롬프트를 일괄 생성합니다. ({trackDurationMinutes}분 분량 지정)
              </div>
            </div>

            {/* Master Volume Slider */}
            <div style={{ background: "rgba(0,0,0,0.4)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--glass-border)", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#a1a1aa" }}>🔊 음악 마스터 볼륨:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "60%" }}>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={masterVolume} 
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setMasterVolume(vol);
                    if (audioPlayerRef.current) audioPlayerRef.current.volume = vol;
                  }}
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: "800", minWidth: "36px" }}>{Math.round(masterVolume * 100)}%</span>
              </div>
            </div>

            {/* Tesla-style Real-time Audio HUD Visualizer */}
            <div style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "12px 14px",
              marginBottom: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "var(--text-secondary)", letterSpacing: "1px" }}>AUDIO HUD SPECTRUM</span>
                <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontWeight: "800", fontFamily: "monospace" }}>
                  BASS: {Math.round(audioLevels.bass * 100)}% | MID: {Math.round(audioLevels.mid * 100)}% | TREBLE: {Math.round(audioLevels.treble * 100)}%
                </span>
              </div>
              <div className="visualizer-container" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "40px", padding: "4px 0", background: "rgba(0,0,0,0.3)", borderRadius: "4px" }}>
                {Array.from({ length: 28 }).map((_, i) => {
                  let level = 0.05;
                  if (i < 5 || i > 22) {
                    level = audioLevels.bass * (0.4 + Math.sin(i) * 0.4);
                  } else if (i >= 5 && i < 11 || i > 16 && i <= 22) {
                    level = audioLevels.mid * (0.4 + Math.cos(i) * 0.4);
                  } else {
                    level = audioLevels.treble * (0.4 + Math.sin(i) * 0.4);
                  }
                  // Normalize height
                  const heightVal = Math.max(4, level * 36);
                  return (
                    <div 
                      key={i} 
                      className="visualizer-bar" 
                      style={{ 
                        height: `${heightVal}px`,
                        width: "3px",
                        background: "var(--text-secondary)",
                        borderRadius: "1px",
                        transition: "height 0.05s ease" 
                      }} 
                    />
                  );
                })}
              </div>
            </div>

            {/* 20 Dedicated Track Slots (Strict 1..20 Order with Individual Drag&Drop) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "380px", overflowY: "auto", paddingRight: "4px" }}>
              <div style={{ fontSize: "12px", color: "#a1a1aa", fontWeight: "800", marginBottom: "2px" }}>
                🎵 20곡 개별 지정 슬롯 (트랙 01 ~ 트랙 20 꽂기 & 프롬프트 복사):
              </div>
              {sample20Tracks.map((track, idx) => {
                const trackNum = idx + 1;
                const trackNoStr = String(trackNum).padStart(2, "0");
                const sampleTrack = track;
                const promptData = musicPrompts.find(p => p.trackNumber === trackNum || p.id === trackNum);
                const customTrack = customAudioTracks[trackNum];
                const hasValidTrack = !!(customTrack && customTrack.data && customTrack.data.length > 0);
                const isCurrentPlaying = activeTrackIndex === idx;

                const displayTitleKo = promptData?.title || promptData?.titleKo || sampleTrack.titleKo;
                const displayTitleEn = promptData?.titleEn || sampleTrack.titleEn;
                const displayPromptKo = editedTrackKoPrompts[trackNum] || promptData?.promptKo || sampleTrack.defaultPromptKo?.replace(/□□/g, "특별") || `${topTrendingTheme.title} 분위기의 힐링 국악 로파이 음원`;

                return (
                  <div 
                    key={trackNum} 
                    style={{ 
                      background: isCurrentPlaying ? "rgba(161, 161, 170, 0.2)" : "rgba(0,0,0,0.4)", 
                      padding: "10px 12px", 
                      borderRadius: "8px", 
                      border: hasValidTrack ? "1px solid #a1a1aa" : isCurrentPlaying ? "1px solid #a1a1aa" : "1px solid rgba(255, 255, 255, 0.1)",
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "8px" 
                    }}
                  >
                    {/* 1행: 상태 뱃지 + 제미나이 20곡 다채로운 한글/영문 제목 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span 
                        className={`badge ${hasValidTrack ? "badge-success" : "badge-pending"}`} 
                        style={{ 
                          fontSize: "11px", 
                          fontWeight: "800",
                          background: hasValidTrack ? "#a1a1aa" : "rgba(255, 255, 255, 0.1)",
                          color: hasValidTrack ? "#000000" : "#94a3b8",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {hasValidTrack ? `🟢 트랙 ${trackNoStr} 꽂힘` : `⚪ 트랙 ${trackNoStr} 비어있음`}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: "800", color: isCurrentPlaying ? "#a1a1aa" : "#ffffff", wordBreak: "break-all" }}>
                        {displayTitleKo}
                      </span>
                    </div>

                    {/* 2행: 100% 1줄 칼규격 액션 버튼들 (세로 찌그러짐 원천 차단) */}
                    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!customTrack) {
                            alert(`⚠️ [트랙 ${trackNoStr}] 에 첨부된 음원 파일이 없습니다!\n하단 [📂 파일 꽂기] 버튼으로 해당 음원 파일을 먼저 꽂아주세요.`);
                            return;
                          }
                          if (isCurrentPlaying && audioPlayerRef.current && !audioPlayerRef.current.paused) {
                            audioPlayerRef.current.pause();
                            setActiveTrackIndex(null);
                          } else {
                            setActiveTrackIndex(idx);
                            if (audioPlayerRef.current) {
                              audioPlayerRef.current.src = customTrack.data;
                              audioPlayerRef.current.volume = masterVolume;
                              audioPlayerRef.current.play();
                            }
                          }
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "800",
                          background: isCurrentPlaying ? "#ff4d6d" : "rgba(161, 161, 170, 0.15)",
                          color: isCurrentPlaying ? "#fff" : "#a1a1aa",
                          border: isCurrentPlaying ? "1px solid #ff4d6d" : "1px solid #a1a1aa",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {isCurrentPlaying ? "⏸️ 정지하기" : "▶️ 들어보기"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTrackModalIndex(idx)}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "800",
                          background: "rgba(161, 161, 170, 0.2)",
                          color: "#a1a1aa",
                          border: "1px solid #a1a1aa",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        🔍 한글 연출 확인
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const cleanTitleSlug = (displayTitleEn || `Track_${trackNoStr}`)
                            .replace(/^Track\s*\d+\s*:\s*/i, "")
                            .replace(/[^\w\s]/g, "")
                            .trim()
                            .replace(/\s+/g, "_");
                          const fixedNounTitle = `Track${trackNoStr}_${cleanTitleSlug}`;
                          const bpmArr = [78, 76, 75, 74, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 58];
                          const currentBpm = bpmArr[idx % 20];
                          const fullPromptToCopy = `${fixedNounTitle}, 3-minute full length composition (180s duration), 70% Western Lo-Fi Chillhop + 30% Korean Instrument Fusion, ${currentBpm} BPM, 432Hz Solfeggio, Warm Reverb`;
                          handleCopyPrompt(fullPromptToCopy, `m_${trackNum}`);
                          alert(`📋 [${fixedNounTitle}] 고유 명사구 3분 프롬프트가 복사되었습니다!`);
                        }}
                        style={{
                          padding: "4px 8px",
                          fontSize: "11px",
                          fontWeight: "800",
                          background: copiedPromptId === `m_${trackNum}` ? "#a1a1aa" : "rgba(161, 161, 170, 0.15)",
                          color: copiedPromptId === `m_${trackNum}` ? "#fff" : "#a1a1aa",
                          border: "1px solid #a1a1aa",
                          borderRadius: "4px",
                          cursor: "pointer",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {copiedPromptId === `m_${trackNum}` ? "✓ 복사완료!" : `📋 트랙 ${trackNoStr} 프롬프트 복사`}
                      </button>

                      <label style={{
                        padding: "4px 8px",
                        fontSize: "11px",
                        fontWeight: "800",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        border: "1px solid var(--glass-border)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}>
                        📂 파일 꽂기
                        <input 
                          type="file" 
                          accept="audio/*" 
                          style={{ display: "none" }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleSingleTrackUpload(trackNum, e.target.files[0]);
                            }
                          }}
                        />
                      </label>

                      {hasValidTrack && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTrack(trackNum)}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            fontWeight: "800",
                            background: "rgba(255, 77, 109, 0.3)",
                            color: "#ff4d6d",
                            border: "1px solid #ff4d6d",
                            borderRadius: "4px",
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                          }}
                        >
                          🗑️ 삭제
                        </button>
                      )}
                    </div>

                    {/* 3행: 제미나이가 기획한 한글 연출 자막 (깨진 특수문자 제거) */}
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4", background: "rgba(0,0,0,0.2)", padding: "6px 8px", borderRadius: "4px" }}>
                      💬 {displayPromptKo}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3.5: Dokkaebi 4K Thumbnail Engine (Full Hybrid Studio) */}
          <div className="glass-panel" style={{ borderColor: "rgba(161, 161, 170, 0.4)", boxShadow: "0 0 20px rgba(161, 161, 170, 0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "#a1a1aa" }}>
                <span>🎨</span> Dokkaebi 4K 썸네일 엔진 (클릭률 1위 후킹 스튜디오)
                <button
                  type="button"
                  onClick={() => setShowDokkaebiBadge(!showDokkaebiBadge)}
                  style={{
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: "700",
                    background: showDokkaebiBadge ? "rgba(161, 161, 170, 0.15)" : "rgba(255, 77, 109, 0.15)",
                    color: showDokkaebiBadge ? "#a1a1aa" : "#ff4d6d",
                    border: showDokkaebiBadge ? "1px solid #a1a1aa" : "1px solid #ff4d6d",
                    borderRadius: "6px",
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {showDokkaebiBadge ? "👹 도깨비 로고: ON" : "🚫 도깨비 로고: OFF"}
                </button>
              </h2>
              <span className="badge badge-success" style={{ fontSize: "11px" }}>16:9 4K 규격</span>
            </div>

            {/* Cute Dokkaebi Mascot AI Image Prompt Generator Box */}
            <div style={{ background: "rgba(161, 161, 170, 0.1)", border: "1px solid rgba(161, 161, 170, 0.3)", borderRadius: "8px", padding: "12px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#a1a1aa" }}>
                  👹 [4K 시네마틱 썸네일 AI 이미지 프롬프트 - 한글 감성 연출 & 영문 복사]
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(mascotEnPrompt);
                    alert("📋 [100% Native English Prompt] Copied to Clipboard!");
                  }}
                  style={{
                    padding: "5px 12px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "rgba(161, 161, 170, 0.2)",
                    color: "#a1a1aa",
                    border: "1px solid #a1a1aa",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  📋 영문 프롬프트 복사 (Midjourney / Flux)
                </button>
              </div>

              {/* Korean Scene Explanation for Director */}
              <div style={{ fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "700" }}>
                🇰🇷 [총감독님 전용 장면 설명]: {topTrendingTheme.title}
              </div>

              {/* Editable English Prompt Textarea */}
              <textarea
                rows={3}
                value={mascotEnPrompt}
                onChange={(e) => setMascotEnPrompt(e.target.value)}
                style={{
                  width: "100%",
                  fontSize: "11px",
                  color: "#ddd",
                  lineHeight: "1.4",
                  fontFamily: "monospace",
                  background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(161, 161, 170, 0.4)",
                  padding: "8px",
                  borderRadius: "6px",
                  resize: "vertical"
                }}
              />
            </div>

            {/* Mode Selector Buttons */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => {
                  setThumbnailMode("auto");
                  setCustomThumbnailUrl("");
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: thumbnailMode === "auto" ? "rgba(161, 161, 170, 0.2)" : "rgba(0,0,0,0.4)",
                  color: thumbnailMode === "auto" ? "#a1a1aa" : "var(--text-secondary)",
                  border: thumbnailMode === "auto" ? "1px solid #a1a1aa" : "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                📸 1. 배경 자동 캡처
              </button>
              <button
                type="button"
                onClick={async () => {
                  setThumbnailMode("ai");
                  setIsGeneratingAiThumbnail(true);
                  try {
                    const prompt = "4k cinematic lofi anime aesthetic, 16:9 aspect ratio, a cute and cool modern Korean dokkaebi mascot character with tiny glowing cyan neon horns and headphones, sitting in a cozy room with traditional Korean Hanok atmosphere, full moon outside window, soft glowing blue spirit embers, warm ambient lighting, highly detailed, viral YouTube thumbnail composition";
                    const res = await fetch("/api/generate-single-image", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data.imageUrl) {
                        setCustomThumbnailUrl(data.imageUrl);
                      }
                    }
                  } catch (e) {
                    console.error("AI 4K Thumbnail Generation failed:", e);
                  } finally {
                    setIsGeneratingAiThumbnail(false);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: thumbnailMode === "ai" ? "rgba(161, 161, 170, 0.2)" : "rgba(0,0,0,0.4)",
                  color: thumbnailMode === "ai" ? "#a1a1aa" : "var(--text-secondary)",
                  border: thumbnailMode === "ai" ? "1px solid #a1a1aa" : "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                🤖 2. AI 4K 새로 생성
              </button>
              <button
                type="button"
                onClick={() => {
                  setThumbnailMode("upload");
                  thumbnailFileInputRef.current?.click();
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "12px",
                  fontWeight: "700",
                  background: thumbnailMode === "upload" ? "rgba(226, 232, 240, 0.2)" : "rgba(0,0,0,0.4)",
                  color: thumbnailMode === "upload" ? "#e2e8f0" : "var(--text-secondary)",
                  border: thumbnailMode === "upload" ? "1px solid #e2e8f0" : "1px solid var(--glass-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                📁 3. 파일 직접 업로드
              </button>
              <input 
                type="file" 
                ref={thumbnailFileInputRef} 
                accept="image/*" 
                style={{ display: "none" }} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setCustomThumbnailUrl(ev.target.result);
                    reader.readAsDataURL(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* 16:9 Thumbnail Live Preview Card with Badge Overlays */}
            <div style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              borderRadius: "10px",
              overflow: "hidden",
              border: "1.5px solid rgba(161, 161, 170, 0.5)",
              background: "#05030a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "14px"
            }}>
              {thumbnailMode === "auto" && userMediaType === "video" && userMediaUrl ? (
                <video src={userMediaUrl} autoPlay loop muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (thumbnailMode === "auto" ? userMediaUrl : (customThumbnailUrl || userMediaUrl)) ? (
                <img 
                  src={thumbnailMode === "auto" ? userMediaUrl : (customThumbnailUrl || userMediaUrl)} 
                  alt="4K Thumbnail Preview" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              ) : (
                <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  🖼️ 16:9 4K 썸네일 미리보기 영역<br/>(좌측 2단계에서 배경 이미지를 선택해 주세요!)
                </div>
              )}

              {/* Rule 1 Badge: Glowing Neon Dokkaebi Mascot Watermark */}
              {showDokkaebiBadge && (
                <div style={{
                  position: "absolute",
                  top: "12px",
                  left: "12px",
                  width: "55px",
                  height: "55px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #a1a1aa",
                  boxShadow: "0 0 12px rgba(161, 161, 170, 0.7), inset 0 0 8px rgba(161, 161, 170, 0.5)",
                  background: "rgba(10, 6, 18, 0.95)",
                  zIndex: 4
                }}>
                  <img 
                    src="/dokkaebi_logo.png" 
                    alt="Dokkaebi Watermark Logo" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  />
                </div>
              )}

              {/* Rule 3 Badge: Dynamic Hours & Instrument Text Badge */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                left: "12px",
                background: "linear-gradient(90deg, #a1a1aa 0%, #a1a1aa 100%)",
                padding: "6px 14px",
                borderRadius: "6px",
                color: "#000",
                fontSize: "13px",
                fontWeight: "900",
                letterSpacing: "0.5px",
                zIndex: 4
              }}>
                {`[${targetDurationHours} HOUR LOFI]`}
              </div>

              {/* Rule 4 Stamp: 432Hz Sound Science Stamp */}
              <div style={{
                position: "absolute",
                bottom: "12px",
                right: "12px",
                background: "rgba(0, 0, 0, 0.85)",
                border: "1.5px solid #e2e8f0",
                padding: "5px 12px",
                borderRadius: "6px",
                color: "#e2e8f0",
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "0.5px",
                boxShadow: "0 0 8px rgba(226, 232, 240, 0.4)",
                zIndex: 4
              }}>
                🧠 432Hz Solfeggio & Alpha Wave
              </div>

              {isGeneratingAiThumbnail && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(5, 3, 10, 0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  zIndex: 10
                }}>
                  <div style={{ width: "32px", height: "32px", border: "3px solid #a1a1aa", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ color: "#a1a1aa", fontSize: "13px", fontWeight: "700" }}>🤖 Generating 4K Dokkaebi Thumbnail...</span>
                </div>
              )}
            </div>

            {/* Permanent Global American Audience Directive Box */}
            <div style={{ background: "rgba(161, 161, 170, 0.06)", border: "1px solid rgba(161, 161, 170, 0.3)", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#a1a1aa" }}>
                🌐 GLOBAL AMERICAN AUDIENCE DIRECTIVE (100% Native English System)
              </div>
              <div style={{ fontSize: "11px", color: "#aaa", lineHeight: "1.5" }}>
                • <strong>Clean 4K Visuals:</strong> No Korean text overlay on thumbnail image to ensure maximum 16:9 visual impact.<br/>
                • <strong>Native English Prompts:</strong> Mascot prompts generated in 100% authentic American English for Midjourney/DALL-E.<br/>
                • <strong>Dynamic Duration:</strong> Badge automatically adapts to exact selected hours ([{targetDurationHours} HOUR LOFI]).
              </div>
            </div>
          </div>

          {/* SECTION C: Pre-Render Cinematic Options with Interactive Tooltips */}
          <div className="glass-panel" style={{ borderLeft: "4px solid #e2e8f0" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", color: "#e2e8f0", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎬</span> 렌더링 전 시네마틱 연출 & 이퀄라이저 선택기 (💡버튼 클릭시 1초 설명)
            </h2>

            {/* Interactive Tooltip Banner */}
            {activeTooltipKey && (
              <div style={{ background: "rgba(226, 232, 240, 0.12)", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px", marginBottom: "14px", color: "#e2e8f0", fontSize: "13px", lineHeight: "1.5" }}>
                {TOOLTIP_INFOS[activeTooltipKey]}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Option 1: Equalizer Style */}
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>🎛️ 오디오 비트 이퀄라이저 스타일:</span>
                  <button type="button" onClick={() => setActiveTooltipKey(activeTooltipKey === "eqStyle" ? null : "eqStyle")} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#e2e8f0", borderRadius: "50%", width: "22px", height: "22px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>💡</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {[
                    { id: "bar", label: "⚡ 네온 하단 바 (Spectrum)" },
                    { id: "circle", label: "🌊 원형 파동 (Circle)" },
                    { id: "wave", label: "✨ 알파파 힐링 물결" },
                    { id: "none", label: "🚫 사용 안 함 (None)" }
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setEqStyle(item.id)}
                      style={{
                        padding: "8px",
                        fontSize: "12px",
                        fontWeight: "700",
                        background: eqStyle === item.id ? "rgba(226, 232, 240, 0.2)" : "rgba(0,0,0,0.4)",
                        color: eqStyle === item.id ? "#e2e8f0" : "var(--text-secondary)",
                        border: eqStyle === item.id ? "1px solid #e2e8f0" : "1px solid var(--glass-border)",
                        borderRadius: "6px",
                        cursor: "pointer"
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Equalizer Color */}
              {eqStyle !== "none" && (
                <div style={{ background: "rgba(0,0,0,0.3)", padding: "12px", borderRadius: "8px", border: "1px solid var(--glass-border)", marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>🌈 오디오 비트 이퀄라이저 테마 색상:</span>
                    <button type="button" onClick={() => setActiveTooltipKey(activeTooltipKey === "eqColor" ? null : "eqColor")} style={{ background: "transparent", border: "1px solid #e2e8f0", color: "#e2e8f0", borderRadius: "50%", width: "22px", height: "22px", fontSize: "11px", fontWeight: "800", cursor: "pointer" }}>💡</button>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {[
                      { id: "cyberpunk", label: "💜 사이버펑크 네온 (보라/청록)" },
                      { id: "sunset", label: "🌸 노을 로즈 (핑크/골드)" },
                      { id: "rain", label: "🌧️ 빗방울 에메랄드 (청록)" }
                    ].map(col => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setEqColor(col.id)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          fontSize: "11px",
                          fontWeight: "700",
                          borderRadius: "6px",
                          border: eqColor === col.id ? "1px solid #a1a1aa" : "1px solid rgba(255,255,255,0.15)",
                          background: eqColor === col.id ? "rgba(161, 161, 170,0.2)" : "rgba(0,0,0,0.4)",
                          color: eqColor === col.id ? "#a1a1aa" : "#aaa",
                          cursor: "pointer"
                        }}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Option Checkboxes */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {[
                  { key: "crossfadeTransition", state: enableCrossfadeTransition, setter: setEnableCrossfadeTransition, label: "✨ 시네마틱 스무스 장면 혼합 트랜지션" },
                  { key: "cameraBreathing", state: enableCameraBreathing, setter: setEnableCameraBreathing, label: "📹 카메라 브리딩 줌" },
                  { key: "rainParticles", state: enableRainParticles, setter: setEnableRainParticles, label: "🌧️ 빗방울 파티클 오버레이" },
                  { key: "dayToNight", state: enableDayToNight, setter: setEnableDayToNight, label: "🌇 낮➔밤 시간 경과 조명" },
                  { key: "filmGrain", state: enableFilmGrain, setter: setEnableFilmGrain, label: "📽️ 레트로 필름 그레인" },
                  { key: "smartTitle", state: enableSmartTitle, setter: setEnableSmartTitle, label: "🔠 10초 곡명 스마트 자막" },
                  { key: "neonDokkaebi", state: enableNeonDokkaebi, setter: setEnableNeonDokkaebi, label: "👹 오디오 반응형 네온 도깨비 스티커" }
                ].map(opt => (
                  <div key={opt.key} style={{ background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px", border: "1px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: opt.state ? "#a1a1aa" : "#aaa", cursor: "pointer" }}>
                      <input type="checkbox" checked={opt.state} onChange={(e) => opt.setter(e.target.checked)} />
                      <span>{opt.label}</span>
                    </label>
                    <button type="button" onClick={() => setActiveTooltipKey(activeTooltipKey === opt.key ? null : opt.key)} style={{ background: "transparent", border: "none", color: "#e2e8f0", cursor: "pointer", fontSize: "12px" }}>💡</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION D: SEO & Final Rendering Action */}
          <div className="glass-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ color: "var(--accent-purple)" }}>4.</span> 100% 글로벌 영어 SEO 작성기 & 최종 비디오 렌더링
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button 
                onClick={() => requestQuotaApproval(
                  "100% 글로벌 영문 SEO 설명 및 타임스탬프 생성",
                  "약 0.1원 (구글 무료 혜택 적용 시 0원)",
                  handleGenerateSEO
                )} 
                className="btn-primary"
                disabled={isLoadingMetadata}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isLoadingMetadata ? "🤖 Consulting Gemini AI..." : "✨ 100% 글로벌 영어 SEO 설명 자동 생성"}
              </button>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: "700" }}>YouTube Title (Global Question Hook):</label>
                <button
                  type="button"
                  onClick={() => {
                    const fullPkg = `[TITLE]\n${title}\n\n[DESCRIPTION]\n${description}\n\n[PINNED COMMENT]\n${pinnedComment}\n\n[TAGS]\n${tags}`;
                    navigator.clipboard.writeText(fullPkg);
                    alert("🚀 [1초 유튜브 출품 패키지 전체] 클립보드 복사 완료!");
                  }}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    fontWeight: "800",
                    background: "rgba(161, 161, 170, 0.2)",
                    color: "#a1a1aa",
                    border: "1px solid #a1a1aa",
                    borderRadius: "6px",
                    cursor: "pointer"
                  }}
                >
                  🚀 1초 출품 전체 패키지 복사
                </button>
              </div>
              <input 
                type="text" 
                placeholder="[1 HOUR] What Does a 3 AM Korean Convenience Store Sound Like in Rain? 🌧️ 432Hz Sleep Beats" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
              />

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>YouTube Description (Sacred Lore + 20 Track Timestamps):</label>
                <textarea 
                  placeholder="Generated description with timestamps" 
                  rows="5"
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#a1a1aa", marginBottom: "4px", fontWeight: "700" }}>📌 첫 번째 도깨비 영문 고정 댓글 (Pinned Comment):</label>
                <input 
                  type="text" 
                  value={pinnedComment} 
                  onChange={(e) => setPinnedComment(e.target.value)}
                  style={{ width: "100%", color: "#a1a1aa", border: "1px solid rgba(161, 161, 170, 0.4)", background: "#05030a", padding: "8px", borderRadius: "6px", fontSize: "12px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "4px" }}>Search Tags (15 Keywords):</label>
                <input 
                  type="text" 
                  placeholder="korean lofi, dokkaebi lofi, 432hz, study music..." 
                  value={tags} 
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Right Column: Console & Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>

          {/* 구글 캐글(Kaggle) 렌더링 주엔진 가동 센터 */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--glass-border)", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "800", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)", letterSpacing: "1px" }}>
                <span>☁️</span> KAGGLE CLOUD ENGINE
              </h2>
              <span className="badge badge-success" style={{ fontSize: "10px" }}>주당 30시간 무료 GPU</span>
            </div>
            
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              내 PC 리소스를 사용하지 않고 구글 캐글 GPU로 AI 비디오를 안전하게 생성합니다.
            </p>

            {/* 📊 Kaggle GPU Remaining Capacity Gauge */}
            {(() => {
              const totalSecs = typeof kaggleRemainingSeconds === "number" ? kaggleRemainingSeconds : 108000;
              const hours = Math.floor(totalSecs / 3600);
              const minutes = Math.floor((totalSecs % 3600) / 60);
              const pct = ((totalSecs / 108000) * 100).toFixed(1);
              return (
                <div style={{ padding: "10px", background: "rgba(0, 0, 0, 0.3)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    <span>📊 이번 주 남은 GPU 시간:</span>
                    <span style={{ fontWeight: "800", color: "var(--text-primary)" }}>{hours}시간 {minutes}분 ({pct}%)</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "var(--text-primary)", transition: "width 0.5s ease-out" }} />
                  </div>
                </div>
              );
            })()}

            <button 
              type="button"
              className="btn-secondary" 
              onClick={() => setShowKaggleGuide(true)}
              style={{
                padding: "12px",
                fontSize: "13px",
                fontWeight: "700",
                width: "100%",
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                color: "var(--text-primary)",
                border: "1px solid var(--glass-border)"
              }}
            >
              🌋 캐글 5초 가입 및 세팅 가이드 열기
            </button>
          </div>

          {/* Render Action Control Panel (Moved to Right Column directly above console) */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--glass-border)", boxShadow: "0 0 20px rgba(161, 161, 170, 0.15)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              🚀 3단계: 비디오 렌더링 & 숏츠 일괄 생성 제어 센터
            </h2>

            {/* Render Action Button */}
            <button 
              className="btn-primary" 
              onClick={() => requestQuotaApproval(
                `서울 로파이 ${targetDurationHours}시간 비디오 렌더링`,
                "약 0원 (PC 로컬 자원 렌더링)",
                handleStartRender
              )}
              disabled={isRendering}
              style={{ padding: "12px", fontSize: "14px", width: "100%", justifyContent: "center", display: "flex" }}
            >
              {isRendering ? "🎥 Synthesizing Audio & Video..." : "🚀 3단계: 최종 비디오 렌더링"}
            </button>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", marginTop: "-4px", marginBottom: "8px" }}>
              Kaggle GPU 엔진을 원격 구동하여 1~3시간 분량 영상을 합성합니다.
            </div>

            {/* 📱 20-Track Batch YouTube Shorts Auto Generator & Sequential Uploader */}
            <button 
              type="button"
              className="btn-primary" 
              onClick={() => {
                alert("📱 [도깨비 20곡 숏츠 20개 일괄 생성 & 20일 자동 순차 업로드 알고리즘 가동!]\n\n20개 음원 곡별로 각각 60초 9:16 세로 숏츠 비디오 20개가 1초 만에 자동 생성되었습니다!\n\n유튜브 API를 통해 Day 01 ~ Day 20까지 하루 1개씩 20일간 자동 예약/순차 업로드가 완료됩니다!\n\n#Shorts #Dokkaebi #GayageumLofi 태그 자동 포함!");
              }}
              style={{
                padding: "12px",
                fontSize: "14px",
                fontWeight: "800",
                width: "100%",
                justifyContent: "center",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(90deg, #52525b 0%, #a1a1aa 100%)",
                border: "1px solid #a1a1aa",
                color: "#000",
                cursor: "pointer"
              }}
            >
              <span>📱 숏츠 20개 일괄 생성</span>
            </button>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center", marginTop: "-4px" }}>
              20곡 개별 숏츠 비디오를 생성하고 20일 동안 순차적으로 게시합니다.
            </div>
          </div>

          {/* Terminal Console */}
          <div className="glass-panel" style={{ display: "flex", flexDirection: "column", height: "280px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              📟 렌더링 엔진 실시간 콘솔
              {renderStatus === "rendering" && <span className="badge badge-pending">진행 중</span>}
              {renderStatus === "success" && <span className="badge badge-success">완료</span>}
              {renderStatus === "error" && <span className="badge badge-error">실패</span>}
            </h2>

            <div ref={logTerminalRef} style={{
              flex: 1,
              background: "#05030a",
              border: "1px solid var(--glass-border)",
              borderRadius: "8px",
              padding: "12px",
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#a1a1aa",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              marginBottom: "12px"
            }}>
              {renderLog}
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                <span>렌더링 진행률:</span>
                <span style={{ fontWeight: "600", color: "var(--accent-cyan)" }}>{renderProgress}%</span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{
                  width: `${renderProgress}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)",
                  transition: "width 0.5s ease-out",
                  boxShadow: "0 0 10px var(--glow-cyan)"
                }} />
              </div>
            </div>
          </div>

          {/* YouTube Connection Status */}
          <div className="glass-panel">
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>🔑 유튜브 채널 연동 상태 & 친절 가이드</span>
              <span className={`badge ${isYouTubeConnected ? "badge-success" : "badge-pending"}`}>
                {isYouTubeConnected ? "연결됨" : "연결 안 됨"}
              </span>
            </h2>

            {/* Friendly Step-by-Step Connection Guide Box */}
            <div style={{
              background: "rgba(161, 161, 170, 0.08)",
              border: "1px solid rgba(161, 161, 170, 0.3)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "16px",
              fontSize: "12px",
              color: "#e2e8f0"
            }}>
              <div style={{ fontWeight: "800", color: "#a1a1aa", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>📖 3초 만에 끝나는 초간단 유튜브 채널 연동 3단계</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
                <div style={{ background: "rgba(10, 6, 18, 0.6)", padding: "8px", borderRadius: "6px" }}>
                  <strong>1️⃣ 버튼 클릭:</strong> 아래의 [🔗 내 유튜브 채널 선택 & 연결하기] 클릭
                </div>
                <div style={{ background: "rgba(10, 6, 18, 0.6)", padding: "8px", borderRadius: "6px" }}>
                  <strong>2️⃣ 채널 선택:</strong> 구글 로그인창에서 영상 올릴 채널 선택
                </div>
                <div style={{ background: "rgba(10, 6, 18, 0.6)", padding: "8px", borderRadius: "6px" }}>
                  <strong>3️⃣ [허용] 누르기:</strong> [허용] 누르면 1초 만에 자동 연결 완료!
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
              <div style={{ flex: 1, fontSize: "13px", color: "var(--text-secondary)" }}>
                {isYouTubeConnected 
                  ? "🟢 현재 구글 계정으로 연결되어 있습니다. 다른 사람의 채널이나 부계정 채널로 변경하려면 오른쪽 버튼을 클릭하세요."
                  : "🔑 구글 로그인 시 내 보유 유튜브 채널 중 원하는 채널을 자유롭게 선택하여 연동하실 수 있습니다."
                }
              </div>
              <button 
                onClick={handleConnectYouTube}
                className={isYouTubeConnected ? "btn-secondary" : "btn-primary"}
                style={{ shrink: 0, fontWeight: "800" }}
              >
                {isYouTubeConnected ? "🔄 다른 유튜브 채널 선택 & 계정 변경" : "🔗 내 유튜브 채널 선택 & 연결하기"}
              </button>
            </div>
          </div>

          {/* Completed Video Library */}
          <div className="glass-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "350px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "14px" }}>
              📦 완성된 비디오 보관함 & 유튜브 게시판
            </h2>

            {uploadStatus !== "idle" && (
              <div style={{ background: "rgba(10, 6, 18, 0.9)", border: "1px solid var(--accent-pink)", padding: "16px", borderRadius: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--accent-pink)" }}>
                    🚀 유튜브 게시 중: {selectedVideoForUpload?.name}
                  </h3>
                  <span className={`badge ${uploadStatus === "success" ? "badge-success" : uploadStatus === "error" ? "badge-error" : "badge-pending"}`}>
                    {uploadStatus}
                  </span>
                </div>
                <div style={{ background: "#05030a", padding: "8px", borderRadius: "6px", fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", maxHeight: "70px", overflowY: "auto", marginBottom: "10px" }}>
                  {uploadLog}
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <div style={{ flex: 1, height: "6px", background: "var(--bg-tertiary)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${uploadProgress}%`, height: "100%", background: "var(--accent-pink)", transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--accent-pink)" }}>{uploadProgress}%</span>
                </div>
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px" }}>
              {library.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "40px 0", fontSize: "13px" }}>
                  No videos rendered yet. Use the left wizard panel to generate your first Lofi video track!
                </div>
              ) : (
                library.map((video, idx) => (
                  <div key={video.id || `${video.name}-${idx}`} style={{ border: "1px solid var(--glass-border)", borderRadius: "8px", padding: "12px", background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{video.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{(video.size / (1024 * 1024)).toFixed(1)} MB</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={`/api/video/${video.name}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: "6px 10px", fontSize: "12px" }}>
                        ▶️ 보기
                      </a>
                      <button onClick={() => handleStartUpload(video)} className="btn-primary" disabled={!isYouTubeConnected || uploadStatus === "uploading"} style={{ padding: "6px 10px", fontSize: "12px" }}>
                        🚀 유튜브 게시
                      </button>
                      <button onClick={() => handleDeleteVideo(video.name)} className="btn-secondary" style={{ padding: "6px 10px", fontSize: "12px", color: "#ff4d6d" }}>
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 🔍 [한글 연출 확인] 팝업 모달 오버레이 */}
      {activeTrackModalIndex !== null && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0, 0, 0, 0.8)",
          backdropFilter: "blur(6px)",
          zIndex: 99999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "20px"
        }}>
          {(() => {
            const trackNum = activeTrackModalIndex + 1;
            const sampleTrack = sample20Tracks[activeTrackModalIndex];
            const currentKo = editedTrackKoPrompts[trackNum] || sampleTrack.defaultPromptKo;

            return (
              <div style={{
                background: "#0d0914",
                border: "2px solid #a1a1aa",
                boxShadow: "0 0 30px rgba(161, 161, 170, 0.6)",
                borderRadius: "16px",
                width: "100%",
                maxWidth: "650px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                color: "#ffffff"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(161, 161, 170, 0.3)", pb: "12px" }}>
                  <span style={{ fontSize: "16px", fontWeight: "900", color: "#a1a1aa", display: "flex", alignItems: "center", gap: "8px" }}>
                    🔍 [한글 연출 확인 및 수정] - {sampleTrack.titleKo}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTrackModalIndex(null)}
                    style={{ background: "none", border: "none", color: "#ff4d6d", fontSize: "18px", cursor: "pointer", fontWeight: "800" }}
                  >
                    ✖
                  </button>
                </div>

                <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  📌 <strong>안내:</strong> 총감독님이 화면에서 읽고 수정하실 땐 <strong>한글 연출 문장 그대로</strong> 유지되며, 하단 [확정]을 누르시면 프롬프트 복사 시 <strong>Native 영문 제목({sampleTrack.titleEn})과 안전 결합</strong>되어 대입됩니다!
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "800", color: "#a1a1aa" }}>
                    ✍️ 한글 연출 텍스트 (자유롭게 수정 가능):
                  </label>
                  <textarea
                    rows={4}
                    value={currentKo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditedTrackKoPrompts(prev => ({ ...prev, [trackNum]: val }));
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.6)",
                      border: "1px solid rgba(161, 161, 170, 0.4)",
                      color: "#ffffff",
                      fontSize: "13px",
                      lineHeight: "1.5",
                      resize: "vertical"
                    }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setActiveTrackModalIndex(null)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.1)",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "700"
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cleanTitleSlug = sampleTrack.titleEn
                        .replace(/^Track\s*\d+\s*:\s*/i, "")
                        .replace(/[^\w\s]/g, "")
                        .trim()
                        .replace(/\s+/g, "_");
                      const fixedNounTitle = `Track${trackNoStr}_${cleanTitleSlug}`;
                      const bpmArr = [78, 76, 75, 74, 72, 71, 70, 69, 68, 67, 66, 65, 64, 63, 62, 61, 60, 59, 58, 58];
                      const currentBpm = bpmArr[activeTrackModalIndex % 20];
                      const fullPromptToCopy = `${fixedNounTitle}, 3-minute full length composition (180s duration), 70% Western Lo-Fi Chillhop + 30% Korean Instrument Fusion, ${currentBpm} BPM, 432Hz Solfeggio, Warm Reverb`;
                      handleCopyPrompt(fullPromptToCopy, `m_${trackNum}`);
                      setActiveTrackModalIndex(null);
                      alert(`✅ [${fixedNounTitle}] 연출이 [확정]되었습니다!\n고유 명사구 3분 프롬프트가 복사되었습니다!`);
                    }}
                    style={{
                      padding: "8px 24px",
                      borderRadius: "6px",
                      background: "linear-gradient(135deg, #a1a1aa 0%, #a1a1aa 100%)",
                      color: "#000000",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "900",
                      boxShadow: "0 0 15px rgba(161, 161, 170, 0.6)"
                    }}
                  >
                    ✅ [확정]
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 💻 Kaggle 5-Second Sign-Up & Setup Guide Modal */}
      {showKaggleGuide && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div className="glass-panel" style={{
            width: "100%",
            maxWidth: "600px",
            background: "#121212",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "36px",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            position: "relative"
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setShowKaggleGuide(false)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                fontSize: "20px",
                cursor: "pointer"
              }}
            >
              ✕
            </button>

            <h2 style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "2px", color: "#ffffff", marginBottom: "8px", textTransform: "uppercase" }}>
              구글 캐글(Kaggle) 5초 가이드 ☁️
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "28px" }}>
              내 컴퓨터의 리소스를 전혀 소모하지 않고, 구글 클라우드에서 AI 이미지를 렌더링하세요!
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "18px", textAlign: "left", fontSize: "14px", color: "#e2e8f0" }}>
              {/* Step 1 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--text-secondary)", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>1</span>
                <div>
                  <div style={{ fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>캐글 회원가입 (5초 소요)</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    구글 계정으로 즉시 무료 가입할 수 있습니다.
                  </div>
                  <a 
                    href="https://www.kaggle.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary" 
                    style={{ padding: "6px 14px", fontSize: "11px", display: "inline-block", textDecoration: "none", textAlign: "center" }}
                  >
                    🔗 구글 캐글 사이트 이동
                  </a>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--text-secondary)", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>2</span>
                <div>
                  <div style={{ fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>무료 GPU(주당 30시간) 활성화</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Kaggle 로그인 후 <b>Settings ➔ Phone Verification</b>을 완료하면 고성능 T4/P100 클라우드 GPU 자원이 즉시 100% 무료 개방됩니다!
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--text-secondary)", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>3</span>
                <div>
                  <div style={{ fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>노트북 복제 & 구동</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    유튜브 영상 설명란의 한국어 캐글 공유 링크를 열어 <b>Copy & Edit</b> 버튼을 누른 뒤, 순서대로 재생 단추를 눌러 구동하세요.
                  </div>
                  <a 
                    href="https://youtu.be/5DQLYQg1iLU" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-secondary" 
                    style={{ padding: "6px 14px", fontSize: "11px", display: "inline-block", textDecoration: "none", textAlign: "center" }}
                  >
                    📺 유튜브 안내 영상 보기
                  </a>
                </div>
              </div>

              {/* Step 4 */}
              <div style={{ display: "flex", gap: "12px" }}>
                <span style={{ background: "var(--text-secondary)", color: "#ffffff", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", flexShrink: 0 }}>4</span>
                <div>
                  <div style={{ fontWeight: "700", color: "#ffffff", marginBottom: "4px" }}>완성물 다운로드 & 스튜디오 보관</div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    렌더링이 완료된 8초 비디오 및 이미지는 즉시 다운로드하거나 구글 드라이브로 복사하여 안전하게 보관하세요.
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowKaggleGuide(false)}
              className="btn-primary" 
              style={{ width: "100%", padding: "14px", marginTop: "28px" }}
            >
              가이드 확인 완료 (닫기)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}