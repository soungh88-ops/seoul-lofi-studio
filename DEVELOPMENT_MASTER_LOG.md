# 🛡️ 서울 로파이 스튜디오 (Seoul Lofi Studio) - 마스터 개발 노트 & 시계열 작업 이력 일지

> **[최고 철칙]**
> 1. 하네스(가드레일): 사전 계획 보고 ➡️ 총감독님 명시적 승인 ➡️ 실행 3단계 준수.
> 2. 사이드 이펙트(부작용) 무단 발생 절대 금지: 기존 확정 디자인 및 룰이 엉뚱하게 바뀌지 않도록 본 마스터 노트를 작업 전후로 반드시 대조·검증한다.
> 3. 유튜브 구독자 폭발 품질 헌법: 단순 사이트 구동을 위해 저급 덤미 텍스트나 싸구려 템플릿을 억지로 끼워 맞추는 행위 절대 금지! 오직 구글 제미나이 최상위 AI가 선별한 Top 1% 고품질 음악/비디오 프로덕션 프롬프트만 출하한다.

---

## 🌐 [클라우드 라이브 배포 명세서]

### 1. 깃허브 원격 저장소 (Production Main Branch)
- **리포지토리 URL:** `https://github.com/soungh88-ops/seoul-lofi-studio.git`
- **배포 메인 브랜치:** `main`

### 2. 구글 클라우드 평생 무료 VM (운영 라이브 서버)
- **GCP 프로젝트:** `roasting-412506`
- **VM 인스턴스명:** `seoul-lofi-vm` (IP: `34.55.146.85`)
- **nip.io 도메인:** `http://34.55.146.85.nip.io`

---

## 📌 절대 변경 불가 시스템 고정 헌법 (Lock-down Rules)

1. **[유튜브 구독자 성장 품질 헌법 - 저급 덤미 절대 금지]:** 단순 오류 방지를 위해 저급 문장이나 싸구려 템플릿을 억지로 끼워 맞추는 행위 엄금.
2. **[한국 정통 도깨비 헌법 (2026-08-03 마스터 19개 지침 개정)]:**
   - **브랜드 정체성**: Google Lyria 3 도구 활용 + 인간이 음악/캐릭터/세계관 통제하는 한국 도깨비 음악 IP 스튜디오.
   - **브랜드 슬로건**: *"Objects remember human warmth. Music remembers human nights. From that memory, a Dokkaebi is born."*
   - **외모 헌법**: `소뿔 2개 + 호피무늬 팬티 + 철퇴 + 붉은/푸른 피부 + 식인` 5대 오니 정형화 100% 배제. 갓, 도포, 삿갓, 통일신라 귀면와 수호가면 양뿔 문양 재해석 사용.
   - **기원 & 연도 헌법**: BC 2000년 연속성 단정 금지 ❌ ➡️ 한국의 애니미즘 전통 및 생활도구 영혼 깃듦 + 조선초 문헌(`석보상절` 1447년) 명시 ⭕
   - **형태 헌법**: 오래된 물건(붓, 주판, 가야금, 장독대, 비 젖은 갓, 깨진 찻잔)과 사람의 온기, 기억에서 태어난 정령 오리지널 세계관.
   - **성격 헌법**: 무조건적 재물신/액막이 효능 표현 금지. 욕심을 시험하고 행운을 던지는 익살스럽고 변덕스러운 책상 옆 동반자 (`playful spirit`).
   - **콘텐츠 4대 비율**: 기능성 음악 50%, 대표 세계관 25%, 한국 문화 연결 15%, Shorts 10%.
3. **[트랙 슬롯 3층 구조 & 1줄 칼규격 버튼 헌법]:** 1행(뱃지+제목), 2행(4개 버튼 `white-space: nowrap`), 3행(한글 연출).
4. **[AI 공개 & Content ID 헌법]:** SynthID 제거 금지, Google Lyria 3 투명 공개 문구 포함, Content ID 기본 `보류(Hold)`.
5. **[AI 영상 빗금 방지 헌법]:** Veo AI 프롬프트에 `NO grid lines, NO scanlines, clean crystal clear 4k detail` 탑재 필수.

---

## 🕒 [2026-08-03 작업 이력 - 마스터 운영 전략 19개 조항 탑재]

| 순번 | 작업 내용 | 상태 |
|------|-----------|------|
| 1 | 도깨비 음악 DNA 데이터베이스 파일 구축 (`src/data/dokkaebi-dna.js`) | ✅ |
| 2 | 운영 전략 핵심 라이브러리 엔진 개발 (`src/utils/lofi-strategy-engine.js`) | ✅ |
| 3 | 마스터 가이드북 19개 지침 전면 개정 (`YOUTUBE_LOFI_STRATEGY.md`) | ✅ |
| 4 | 마스터 개발 노트 및 헌법 19개 조항 동기화 (`DEVELOPMENT_MASTER_LOG.md`) | ✅ |
| 5 | 메인 콘솔 UI 보조 확장 제어판 탭 결합 (`src/app/page.js`) | ✅ |

---

## 💻 [VM 서버 SSH 접속 및 관리 명령어]

```powershell
# SSH 접속
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --quiet"

# 최신 코드 반영 및 재시작
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'cd /home/soungh88/seoul-lofi-studio && git pull origin main && pm2 restart seoul-lofi' --quiet"
```
