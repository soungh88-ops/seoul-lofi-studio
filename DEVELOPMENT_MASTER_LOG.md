# 🛡️ 서울 로파이 스튜디오 (Seoul Lofi Studio) - 마스터 개발 노트 & 시개열 작업 이력 일지

> **[최고 철칙]**
> 1. 하네스(가드레일): 사전 계획 보고 ➡️ 총감독님 명시적 승인 ➡️ 실행 3단계 준수.
> 2. 사이드 이펙트(부작용) 무단 발생 절대 금지: 기존 확정 디자인 및 룰이 엉뚱하게 바뀌지 않도록 본 마스터 노트를 작업 전후로 반드시 대조·검증한다.

---

## 🌐 [클라우드 라이브 배포 명세서 (Vercel Cloud Deployment)]

### 1. 깃허브 원격 저장소 (Production Main Branch)
- **리포지토리 URL:** `https://github.com/soungh88-ops/seoul-lofi-studio.git`
- **배포 메인 브랜치:** `main`

### 2. Vercel 클라우드 배포 시 필수 환경 변수 8종 명세 (Environment Variables)
```text
1. NEXTAUTH_URL = https://seoul-lofi-studio.vercel.app (또는 실제 할당된 Vercel 도메인)
2. NEXTAUTH_SECRET = seoul_lofi_studio_super_secret_key_2026
3. GOOGLE_CLIENT_ID = (구글 콘솔 OAuth 클라이언트 ID)
4. GOOGLE_CLIENT_SECRET = (구글 콘솔 OAuth 클라이언트 시크릿)
5. ALLOWED_EMAILS = soungh88@gmail.com
6. GEMINI_API_KEY = (구글 제미나이 API 키)
7. KAGGLER_USERNAME = soungh88
8. KAGGLER_KEY = 0e6b38ba5b0b4643467cc500472a4e09
```

---

## 📌 절대 변경 불가 시스템 고정 헌법 (Lock-down Rules)

1. **[방식 1 자동 반응 헌법]:** 상단 달력 주제 클릭 시 제미나이가 20곡 제목과 한글 연출 프롬프트를 1초 만에 자동 생성하여 하단 20개 슬롯에 즉시 착착 갱신 동기화한다. 내려와서 마음에 안 들 경우 `🎵 1단계: 음악 기획 생성` 버튼을 눌러 언제든 다른 버전으로 재기획할 수 있도록 바인딩을 보장한다.
2. **[트랙 슬롯 3층 구조 & 1줄 칼규격 버튼 헌법]:** 
   - **1행:** 상태 뱃지 + 제미나이 20곡 다채로운 한글/영문 제목.
   - **2행:** `▶️ 들어보기`, `🔍 한글 연출 확인`, `📋 프롬프트 복사`, `📂 파일 꽂기` 4개 버튼을 `white-space: nowrap` 적용하여 **세로 찌그러짐 전혀 없이 100% 1줄 칼규격 유니폼 정렬**.
   - **3행:** `□□` 깨진 특수문자 제거 및 100% 제미나이 한글 연출 설명 배치.
3. **디자인 헌법:** [모노크롬 차콜 실버] 딥 매트 블랙, 타이타늄 실버, 웜 화이트 유지. (붉은색/원색 글로우 무단 변경 엄금)
4. **버튼 헌법:** 버튼 텍스트 줄바꿈/개행 절대 금지 (`white-space: nowrap`). 긴 설명은 하단 회색 자막으로 분리.
5. **프롬프트 헌법:** 상단 영문 고정 헌법(readOnly) + 하단 한글 지시(수정 가능) 2층 구조 유지.
6. **SEO 헌법:** 타임스탬프 Chapters 영역에 한글 단어(`[가-힣]`) 포함 엄금. 100% pure English 제목 사용.
7. **캐글 헌법:** 30시간 잔량 게이지 상시 노출 및 렌더링 완료 시 자동 차감 보존.

---

## 🕒 [2026-07-24 작업 이력 시간대별 상세 타임라인]

### 1️⃣ [오전] 구글 OAuth 보안 로그인 & 이메일 화이트리스트 차단벽 구축
- `Next-Auth` 백엔드 연동 (`route.js`), `SessionProvider` 연동 (`layout.js`), 프리미엄 매트 차콜 로그인 카드 UI 구축 (`page.js`), `ALLOWED_EMAILS=soungh88@gmail.com` 화이트리스트 이식 (`.env.local`).

### 2️⃣ [오후 - 디자인 1차 수술] 테슬라 매트 블랙 & 시그니처 레드 스타일 적용
- 테슬라 매트 블랙 & 카본 그레이 & 레드 오디오 HUD 비주얼라이저 디스플레이 1차 탑재 (`tesla_style_replace.js`).

### 3️⃣ [오후/저녁 - 디자인 2차 수술] 모노크롬 차콜 실버 & 타이타늄 그레이 리폼
- 1차 수술의 붉은색 네온 전면 폐기, 딥 차콜 블랙 & 타이타늄 실버 **모노크롬 테마**로 2차 전격 수술 (`monochrome_style_replace.js`, `globals.css`). 버튼 텍스트 줄바꿈 방지(`white-space: nowrap`) 및 슬림화, 긴 설명글 회색 자막(Subtext) 분리.

### 4️⃣ [저녁] 캐글(Kaggle) API 자격 증명 안착 & 30시간 잔량 게이지 탑재
- `Downloads` 폴더의 `kaggle.json` (`soungh88`)을 `~/.kaggle/kaggle.json`으로 복사 안착, `.env.local`에 `KAGGLER_USERNAME` / `KAGGLER_KEY` 이식. `KAGGLE CLOUD ENGINE` 패널 상단에 **이번 주 남은 30시간 GPU 잔량 및 백분율 게이지 바** 상시 노출.

### 5️⃣ [저녁] 2단계 비디오 프롬프트 UI 센터 & 100% pure English SEO 필터 수술
- 8초 비디오 박스를 상단 **[영문 고정 헌법(readOnly)]** + 하단 **[한글 지시(수정가능)]** 2단계 UI로 분리. `handleGenerateSEO` 타임스탬프 생성 시 `/[가-힣]/` 정규식 필터를 적용하여 **한글 단어 섞임 100% 차단 및 pure English 제목(`titleEn`) 치환 방어막** 탑재.

### 6️⃣ [밤] 방식 1 자동 반응 20곡 동기화 & 트랙 슬롯 1줄 칼규격 유니폼 수술
- 상단 달력 주제 클릭 시 제미나이 20곡 제목/프롬프트 자동 갱신 동기화 연동. `🎵 1단계: 음악 기획 생성` 버튼 누를 시 언제든 20곡 재기획 지원. 트랙 슬롯 3층 구조 개편으로 세로 찌그러짐 및 `□□` 깨진 특수문자 완벽 퇴출.
