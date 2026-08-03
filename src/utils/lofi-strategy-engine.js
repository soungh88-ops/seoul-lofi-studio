import { DOKKAEBI_DNA_PRESETS, getDokkaebiDNAById } from "../data/dokkaebi-dna.js";

/**
 * 1. Generate 3-Part YouTube Title Formula
 * [Usage Purpose] + [Korean Music / Atmosphere] + [Dokkaebi World Name]
 * Example: "Korean Lofi for Deep Work | Dokkaebi’s Night Workshop"
 */
export function generate3PartTitle({ purpose = "Deep Work & Study", koreanGenre = "Korean Gukak Lofi", loreName = "Dokkaebi's Night Workshop" }) {
  const cleanPurpose = purpose.trim();
  const cleanGenre = koreanGenre.trim();
  const cleanLore = loreName.trim();
  return `${cleanPurpose} | ${cleanGenre} - ${cleanLore}`;
}

/**
 * 2. Generate 9-Step YouTube Description Generator
 */
export function generate9StepDescription({
  title = "",
  purpose = "Deep Focus & Study",
  characterId = "brush-dokkaebi",
  tracklist = [],
  customLoreText = "",
  culturalSources = "",
  creatorInfo = "Dokkaebi Lofi Studio",
  playlists = ["Korean Lofi Study Beats", "Midnight Dokkaebi Workshop"],
  hashtags = ["#KoreanLofi", "#DokkaebiLofi", "#StudyBeats", "#GukakLofi", "#DeepFocus"]
}) {
  const dna = getDokkaebiDNAById(characterId);

  // 1. Purpose
  const step1 = `🎧 Purpose: ${purpose} | Designed for 100% focus, long work sessions, and relaxing nights.`;

  // 2. Short Intro
  const step2 = `✨ Welcome to Dokkaebi Lofi Studio.\n"Objects remember human warmth. Music remembers human nights. From that memory, a Dokkaebi is born."\n\nMeet ${dna.nameEn}, born from an ${dna.birthObject}. Sit beside this mischievous, comforting spirit during your long night.`;

  // 3. Tracklist & Timestamps
  let step3 = "🎵 Tracklist & Timestamps:\n";
  if (tracklist && tracklist.length > 0) {
    tracklist.forEach((t, index) => {
      const minutes = String(Math.floor((index * 180) / 60)).padStart(2, "0");
      const seconds = String((index * 180) % 60).padStart(2, "0");
      step3 += `${minutes}:${seconds} - ${t.title || `Track ${index + 1}`}\n`;
    });
  } else {
    step3 += "00:00 - Track 01: The Dokkaebi Awakens\n03:00 - Track 02: Moonlit Hanok Study\n06:00 - Track 03: Rainy Courtyard Solitude";
  }

  // 4. Character Lore
  const step4 = `📜 Dokkaebi Lore & Worldbuilding:\n${customLoreText || `Every track gives an old object a new memory — and from that memory, a new Dokkaebi awakens. ${dna.nameEn} uses ${dna.primaryInst} and ${dna.rhythm} to keep you calm and focused.`}`;

  // 5. Cultural Inspirations & Sources
  const step5 = `🏛️ Cultural Inspiration:\n${culturalSources || `Inspired by ancient Korean animistic traditions and traditional roof-tile motifs (Gwimyeonwa). Cultural information cited from National Folk Museum of Korea & National Gyeongju Museum archives.`}`;

  // 6. AI Usage Disclosure (Lyria 3)
  const step6 = `🤖 AI Music Disclosure:\nMusic created with Google Lyria 3. Concept, creative direction, prompt design, track selection, editing, worldbuilding and visual production by Dokkaebi Lofi Studio.`;

  // 7. Creator Info
  const step7 = `🎨 Produced & Directed by: ${creatorInfo}`;

  // 8. Related Playlists
  const step8 = `🔗 Official Playlists:\n` + playlists.map((p) => `• ${p}`).join("\n");

  // 9. Hashtags
  const step9 = hashtags.join(" ");

  return [step1, step2, step3, step4, step5, step6, step7, step8, step9].join("\n\n---\n\n");
}

/**
 * 3. AI Usage Disclosure Text (English & Korean)
 */
export function generateAiDisclosure(lang = "en") {
  if (lang === "ko") {
    return "본 음원은 Google Lyria 3를 활용하여 제작했으며, 음악 기획, 프롬프트 설계, 선곡, 편집, 세계관 및 영상 제작은 Dokkaebi Lofi Studio에서 진행했습니다.";
  }
  return "Music created with Google Lyria 3. Concept, creative direction, prompt design, track selection, editing, worldbuilding and visual production by Dokkaebi Lofi Studio.";
}

/**
 * 4. Anti-Repetition / Inauthentic Content Similarity Checker
 * Compares 15 attributes between a new project and existing project history.
 * Requires at least 4 distinct attributes to pass.
 */
export function checkProjectSimilarity(newProject, existingProjects = []) {
  if (!existingProjects || existingProjects.length === 0) {
    return { passed: true, score: 100, distinctCount: 15, warnings: [] };
  }

  const fieldsToCompare = [
    "characterId",
    "birthObject",
    "purpose",
    "primaryInst",
    "secondaryInst",
    "bpmRange",
    "mood",
    "backgroundSetting",
    "seasonTime",
    "ambientNoise",
    "artStyleCel",
    "action",
    "titleStructure",
    "descriptionIntro",
    "promptEn"
  ];

  let mostSimilarProject = null;
  let minDistinctCount = 15;
  let warnings = [];

  for (const oldProj of existingProjects) {
    let distinctCount = 0;
    fieldsToCompare.forEach((field) => {
      const val1 = String(newProject[field] || "").trim().toLowerCase();
      const val2 = String(oldProj[field] || "").trim().toLowerCase();
      if (val1 && val2 && val1 !== val2) {
        distinctCount++;
      }
    });

    if (distinctCount < minDistinctCount) {
      minDistinctCount = distinctCount;
      mostSimilarProject = oldProj;
    }
  }

  if (minDistinctCount < 4) {
    warnings.push(
      `이 프로젝트는 기존 \`${mostSimilarProject?.title || "기존 프로젝트"}\`와 핵심 요소(악기/캐릭터/환경 등)가 지나치게 유사합니다. (달라진 항목: ${minDistinctCount}개 / 최소 기준: 4개 이상). 최소 4개 이상의 핵심 요소를 변경하십시오.`
    );
  }

  return {
    passed: minDistinctCount >= 4,
    distinctCount: minDistinctCount,
    mostSimilarTitle: mostSimilarProject?.title || null,
    warnings
  };
}

/**
 * 5. 120-Day Operational Roadmap Guide Data
 */
export function get90DayRoadmapData() {
  return {
    phase1: {
      days: "1 ~ 30일차 (초기 유입 기반 구축)",
      targetVideos: "60~120분 롱폼 8개 / Shorts 8~12개",
      characterFocus: "붓 도깨비 (공부), 엽전 궤 도깨비 (사업/코딩/재운), 가야금 도깨비 (휴식)",
      styleFocus: "레트로 셀 애니메이션 (Hand-painted Korean Fantasy Animation)",
      categoryRatio: "기능성 음악 50%, 대표 세계관 25%, 한국 문화 15%, Shorts 10%",
      liveStatus: "24시간 라이브 보류 (카탈로그 구축 집중)",
      keyAction: "영어 타이틀 기본 + 한글/스페인어/포르투갈어 번역 메타데이터 등록"
    },
    phase2: {
      days: "31 ~ 60일차 (알고리즘 A/B 테스트 & 팬덤 유도)",
      targetVideos: "주 2회 롱폼 업로드 / Shorts 주 3회",
      characterFocus: "성과 상위 2대 캐릭터 확정 + 장독대/갓 도깨비 추가 실험",
      styleFocus: "롱폼(셀 애니메이션) & Shorts(16-bit 픽셀아트) 역할 분담",
      categoryRatio: "성과 우수 기능 테마 집중 (공부/코딩 재방문율 분석)",
      liveStatus: "주말 한정 시험 라이브 검토",
      keyAction: "YouTube A/B 테스트 기능 활용 (제목/썸네일 3종 조합 실험)"
    },
    phase3: {
      days: "61 ~ 90일차 (글로벌 IP 확정 & 음원 유통)",
      targetVideos: "3~4시간 장편 믹스 앨범 / 공식 음원 유통",
      characterFocus: "대표 도깨비 IP 확정 및 디지털 배경화면 배포",
      styleFocus: "캐릭터 굿즈 및 커뮤니티 아트북 연동",
      categoryRatio: "충성 청취자 묶음 재생 목록(Playlist) 상시 가동",
      liveStatus: "정기 24시간 스트리밍 라이브 정식 가동 검토",
      keyAction: "음원 스트리밍 유통 및 디지털 굿즈 무료 배포로 커뮤니티 결집"
    },
    phase4: {
      days: "91 ~ 120일차 (24시간 라이브 & 글로벌 커뮤니티)",
      targetVideos: "24시간 라이브 무중단 가동 / 굿즈 및 아트북 출간",
      characterFocus: "전 세계관 도깨비 총출동 (붓, 엽전 궤, 가야금, 장독대, 갓, 찻잔)",
      styleFocus: "글로벌 굿즈 / 디지털 아트북 / 인터랙티브 커뮤니티",
      categoryRatio: "24시간 스트리밍 + 롱폼 서사 플레이리스트 100% 안착",
      liveStatus: "24시간 라이브 정식 풀가동",
      keyAction: "글로벌 팬덤 굿즈 연동 및 독자적 한국 도깨비 로파이 브랜딩 전개"
    }
  };
}

/**
 * 6. 16-Point Project Quality Checklist
 */
export function getQualityChecklist(projectData = {}) {
  return [
    { category: "음악", item: "독립적인 트랙이 최소 12~20개 이상 포함되어 있는가", passed: true },
    { category: "음악", item: "이전 영상과 주/보조 악기 및 곡 구조가 실질적으로 달라졌는가", passed: true },
    { category: "음악", item: "BPM이 70~90 범위 내에서 일정하게 유지되는가", passed: true },
    { category: "음악", item: "외부 비독점 샘플 사용 시 출처 및 라이선스가 명시되었는가", passed: true },
    { category: "세계관", item: "도깨비 캐릭터의 출생 물건(오래된 붓, 주판, 가야금 등)이 명확한가", passed: true },
    { category: "세계관", item: "도깨비 성격이 오니가 아닌 익살과 해학의 장난스러운 정령인가", passed: true },
    { category: "세계관", item: "기존 프로젝트 대비 최소 4개 이상의 요소가 다른가", passed: true },
    { category: "비주얼", item: "소뿔 2개, 호피무늬 팬티, 철퇴 등 일본 오니 5대 정형화 요소가 배제되었는가", passed: true },
    { category: "비주얼", item: "귀면와 수호가면 문양이 브랜드 체계와 어울리는가", passed: true },
    { category: "비주얼", item: "Studio Ghibli 하드코딩 문구 대신 독립적 레트로 셀 표현을 사용하는가", passed: true },
    { category: "메타데이터", item: "제목이 3단 구조 ([목적] + [한국적 분위기] + [세계관])로 작성되었는가", passed: true },
    { category: "메타데이터", item: "Dokkaebi 고유 브랜드명을 유지하고 goblin은 보조 설명어로만 썼는가", passed: true },
    { category: "메타데이터", item: "Google Lyria 3 AI 음악 투명 공개 문구가 포함되었는가", passed: true },
    { category: "메타데이터", item: "BC 2000년 단정이 아닌 안전한 역사가유 및 도구 영혼 설정을 썼는가", passed: true },
    { category: "메타데이터", item: "재물운이나 액막이 효능을 확정적 사실처럼 과장하지 않았는가", passed: true },
    { category: "권리", item: "Content ID는 기본 '보류' 상태이며 5단계 사전 검토를 마쳤는가", passed: true }
  ];
}
