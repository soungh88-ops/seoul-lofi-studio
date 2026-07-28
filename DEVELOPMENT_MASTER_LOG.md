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
- **최신 커밋:** `aa2c4cb` - Fix: Add anti-scanline and anti-gridline keywords to Veo prompts

### 2. 구글 클라우드 평생 무료 VM (운영 라이브 서버) - 2026-07-26 배포 완료
- **GCP 프로젝트:** `roasting-412506` (프로젝트 번호: 984499161988)
- **GCP 계정:** `soungh88@gmail.com`
- **VM 인스턴스명:** `seoul-lofi-vm`
- **VM 리전/존:** `us-central1-a` (아이오와 - 평생 무료 대상)
- **머신 유형:** `e2-micro` (2 vCPU, 1GB RAM + 2GB Swap)
- **OS:** `Ubuntu 22.04 LTS`
- **외부 공인 IP:** `34.55.146.85`
- **nip.io 도메인:** `http://34.55.146.85.nip.io` ← 구글 로그인 시 이 주소로 접속!
- **PM2 데몬 상태:** `seoul-lofi` (online / 44h+ / systemd 자동부팅 완료)
- **결제 계정 ID:** `01CADC-45DFEC-B43F2F`

---

## 📌 절대 변경 불가 시스템 고정 헌법 (Lock-down Rules)

1. **[유튜브 구독자 성장 품질 헌법 - 저급 덤미 절대 금지]:** 단순 오류 방지를 위해 저급 문장이나 싸구려 템플릿을 억지로 끼워 맞추는 행위 엄금.
2. **[방식 1 자동 반응 헌법]:** 상단 달력 주제 클릭 시 제미나이가 20곡 제목과 한글 연출 프롬프트를 1초 만에 자동 생성.
3. **[트랙 슬롯 3층 구조 & 1줄 칼규격 버튼 헌법]:** 1행(뱃지+제목), 2행(4개 버튼 `white-space: nowrap`), 3행(한글 연출).
4. **디자인 헌법:** 딥 매트 블랙, 타이타늄 실버, 웜 화이트 모노크롬 테마. 붉은색/원색 글로우 무단 변경 엄금.
5. **SEO 헌법:** 타임스탬프 Chapters에 한글 단어 포함 엄금. 100% pure English 제목 사용.
6. **캐글 헌법:** 30시간 잔량 게이지 상시 노출 및 렌더링 완료 시 자동 차감 보존.
7. **AI 영상 빗금 방지 헌법 (2026-07-26 추가):** Veo AI 프롬프트에 `NO grid lines, NO scanlines, NO diagonal streaks, clean crystal clear 4k detail` 고정 구문 탑재 필수.

---

## 🕒 [2026-07-24 작업 이력]

1. 구글 OAuth 보안 로그인 & 이메일 화이트리스트 차단벽 구축 (Next-Auth)
2. 테슬라 매트 블랙 & 시그니처 레드 스타일 1차 디자인 수술
3. 모노크롬 차콜 실버 & 타이타늄 그레이 2차 디자인 수술 (최종 디자인 확정)
4. 캐글 API 자격 증명 안착 & 30시간 잔량 게이지 탑재
5. 2단계 비디오 프롬프트 UI & 한글 SEO 필터 수술
6. 유튜브 구독자 성장 품질 헌법 확립 & 트랙 슬롯 3층 구조 칼규격 수술

---

## 🕒 [2026-07-25 작업 이력]

1. 사용자 비디오 경로 매칭 및 30초 완성본 비디오 빌드 완료
2. Gemini API 이중 키 자동 롤오버(429 에러 시 0.1초 내 전환) 구축
3. Vercel 운영 배포 및 API 연동 라이브 테스트 완료

---

## 🕒 [2026-07-26 작업 이력 - 구글 무료 VM 서버 이전 완료]

| 순번 | 작업 내용 | 상태 |
|------|-----------|------|
| 1 | `setup-google-server.sh` 스왑 메모리(2GB) 로직 추가 | ✅ |
| 2 | GCP 결제 계정(`01CADC-45DFEC-B43F2F`) 생성 및 연동 | ✅ |
| 3 | Compute Engine API 활성화 (`roasting-412506`) | ✅ |
| 4 | `seoul-lofi-vm` e2-micro 인스턴스 생성 (IP: `34.55.146.85`) | ✅ |
| 5 | 방화벽 규칙 개방 (80, 443, 8080, SSH 22 포트) | ✅ |
| 6 | 깃허브 소스코드 VM 클론 및 `.env.local` 전송 | ✅ |
| 7 | Node.js 20 LTS, FFmpeg, PM2 설치 완료 | ✅ |
| 8 | Next.js 프로덕션 빌드 완료 (`.next/BUILD_ID` 생성) | ✅ |
| 9 | PM2 무중단 데몬 가동 + systemd 자동부팅 완료 | ✅ |
| 10 | iptables 80→3000 포트포워딩 & netfilter-persistent 영구화 | ✅ |
| 11 | 외부 HTTP `200 OK` 정상 서빙 확인 | ✅ |
| 12 | Veo AI 영상 프롬프트 빗금 방지 헌법 이식 (page.js, kaggle_render_kernel.py) | ✅ |
| 13 | `nip.io` 무료 도메인 적용 (OAuth IP 입력 불가 우회) | ✅ |

---

## 🚨 [현재 미완성 / 다음 세션 즉각 착수 작업]

### 🔴 문제 1: OAuth 로그인 `State cookie was missing` 에러
- **원인:** `NEXTAUTH_URL=http://34.55.146.85.nip.io` 설정되어 있는데 `http://34.55.146.85` IP로 접속하면 쿠키 도메인 불일치로 로그인 실패.
- **해결:** 브라우저에서 반드시 **`http://34.55.146.85.nip.io`** 로 접속할 것.
- **추가 조치 필요:** [GCP OAuth 콘솔](https://console.cloud.google.com/apis/credentials?project=roasting-412506)에서 아래 URI 등록 필요:
  - 승인된 JavaScript 원본: `http://34.55.146.85.nip.io`
  - 승인된 리디렉션 URI: `http://34.55.146.85.nip.io/api/auth/callback/google`
  - 승인된 리디렉션 URI: `http://34.55.146.85.nip.io:8080/api/auth/callback`

### 🔴 문제 2: Veo API 할당량 초과 → 폴백 영상 빗금 현상
- **원인:** Gemini Veo 3.1 API 할당량 소진 → `/videos/rain_loop.mp4` (빗금 있는 샘플 영상) 폴백 실행됨.
- **해결:** 새 Gemini API 키 발급 또는 기존 키 재충전 후 `.env.local`의 `GEMINI_API_KEY` 갱신 필요.
- **VM 서버에서 .env.local 수정 명령:**
  ```bash
  gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'nano /home/soungh88/seoul-lofi-studio/.env.local' --quiet
  ```

### 🟡 문제 3: 폴백 영상 자체의 빗금 문제
- **해결 계획:** FFmpeg으로 VM 서버에서 빗금 없는 깨끗한 폴백 영상을 직접 생성하여 `/public/videos/` 교체 예정.

---

## 💻 [VM 서버 SSH 접속 및 관리 명령어]

```powershell
# SSH 접속
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --quiet"

# 서비스 상태 확인
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'pm2 list' --quiet"

# 최신 코드 반영 및 재시작
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'cd /home/soungh88/seoul-lofi-studio && git pull origin main && pm2 restart seoul-lofi' --quiet"

# 서버 로그 확인
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'pm2 logs seoul-lofi --lines 30 --nostream' --quiet"

# 스왑 활성화 (VM 재부팅 후 필요)
powershell.exe -ExecutionPolicy Bypass -Command "gcloud compute ssh seoul-lofi-vm --zone=us-central1-a --command 'sudo swapon /swapfile' --quiet"
```
