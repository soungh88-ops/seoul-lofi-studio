---
name: kaggle-lofi-renderer
description: 서울 로파이 스튜디오의 비디오 생성 및 렌더링 작업을 구글 캐글(Kaggle) 클라우드 GPU 서버에 원격으로 밀어 넣고(Push) 실행 상태를 모니터링하는 전용 스킬입니다.
---

# 👹 Kaggle Lofi Renderer (캐글 원격 렌더링 스킬)

이 스킬은 서울 로파이 스튜디오 웹서버(구글 VM 등)의 리소스를 사용하지 않고, 1~3시간 분량의 고해상도 Lofi 비디오 제작(Veo 3.1 AI 8초 영상 생성 포함) 및 유튜브 자동 업로드를 **구글 캐글(Kaggle) GPU 서버**에 완전 위임하여 비동기 실행하는 절차를 정의합니다.

---

## 🛠️ 1. 스킬 구성 요소
이 스킬은 다음 파일들과 함께 작동합니다:
- `kaggle_render_kernel.py`: 캐글 서버에서 구동될 실질적인 파이썬 렌더링 및 Veo API 호출 엔진.
- `push_kernel.js`: 웹 서버에서 캐글 API(`https://www.kaggle.com/api/v1/kernels/push`)로 파이썬 코드를 쏘아 보내는 Node.js 트리거 라이브러리.

---

## 🚀 2. 실행 흐름 (Workflow)

### [단계 1: 메타데이터 및 프롬프트 준비]
웹사이트 사용자 인터페이스에서 입력한 값(장르, 테마, 비디오 길이, AI 비주얼 프롬프트, 20곡의 음원 주소 등)을 JSON 포맷으로 수집합니다.

### [단계 2: 캐글 커널 푸시 (Push Kernel)]
`push_kernel.js` 모듈을 실행하여 다음을 캐글에 전달합니다:
- **`kernel-metadata.json`**: 커널 식별자(ID), 사용 언어(Python), GPU 가속 활성화 여부(`enable_gpu: true`), 인터넷 사용 여부(`enable_internet: true`) 지정.
- **`kaggle_render_kernel.py`**: 위의 매개변수값들이 동적으로 치환(Injection)된 최종 파이썬 코드.

### [단계 3: 캐글 백그라운드 구동]
캐글 클라우드가 기동되면서 다음 작업을 차례대로 실행합니다:
1. 구글 Veo 3.1 API를 직접 호출하여 8초 4K 애니메이션 루프 비디오를 생성하고 다운로드합니다.
2. 지정된 로파이 MP3 음원 리스트들을 순차 다운로드합니다.
3. **무손실 병합 (`-c:v copy`)** 방식을 사용하여 음원 길이만큼(1~3시간) 비디오를 순식간에 루프 렌더링합니다.
4. 구글 유튜브 API를 통해 지정된 채널에 완성 비디오를 바로 업로드합니다.

---

## ⚙️ 3. 구글 클라우드 VM 서버 설치 및 배포 가이드 (이사 방법)

Vercel의 제한에서 벗어나 이 프로젝트를 **구글 클라우드(GCP) Compute Engine**에 올리는 방법입니다:

1. **GCP VM 인스턴스 생성:**
   - 머신 유형: `e2-micro` (Always Free 무료 티어 해당)
   - 운영체제: `Ubuntu 20.04 LTS` 또는 `Ubuntu 22.04 LTS`
   - 네트워크 설정: `HTTP 트래픽 허용`, `HTTPS 트래픽 허용` 체크

2. **서버 패키지 설치:**
   ```bash
   sudo apt update
   sudo apt install -y nodejs npm git ffmpeg
   ```

3. **소스코드 클론 및 빌드:**
   ```bash
   git clone https://github.com/soungh88-ops/seoul-lofi-studio.git
   cd seoul-lofi-studio
   npm install
   ```

4. **환경 변수 설정 (`.env.local` 생성):**
   ```env
   GEMINI_API_KEY=your_key
   KAGGLE_USERNAME=soungh88
   KAGGLE_KEY=0e6b38ba5b0b4643467cc500472a4e09
   YOUTUBE_OAUTH_TOKEN=...
   ```

5. **애플리케이션 백그라운드 구동 (PM2 사용 권장):**
   ```bash
   sudo npm install -g pm2
   npm run build
   pm2 start npm --name "seoul-lofi" -- start
   ```

---

## 🔍 4. 트러블슈팅 (Troubleshooting)

### Q1. 캐글 API 전송 실패 시 (401 Unauthorized / 403 Forbidden)
- `.env.local` 파일에 `KAGGLE_USERNAME`과 `KAGGLE_KEY`가 올바르게 세팅되었는지 확인하십시오.
- 캐글 계정 설정 페이지에서 새로운 API Token 키를 발급받아 업데이트해야 할 수 있습니다.

### Q2. 비디오가 생성되었는데 화질이 깨지거나 소리가 싱크가 안 맞음
- `kaggle_render_kernel.py` 내의 FFmpeg 명령어 매개변수 중 `-c:v copy` 옵션이 제대로 먹혔는지 확인하십시오. 만약 원본 비디오 포맷과 오디오 포맷의 디코딩 코덱이 다를 경우, 오디오만 `-c:a aac` 옵션을 주어 재인코딩하는 것이 안전합니다.
