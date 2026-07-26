# 👹 서울 로파이 스튜디오 - 구글 클라우드 평생 무료 VM (e2-micro) 배포 & 이전 가이드

이 문서는 프로젝트 최신 소스코드를 구글 클라우드 평생 무료 VM 서버(e2-micro)로 이전하고, **구글 로그인(Next-Auth) 및 유튜브 API 연동**을 실시간 라이브 서버에서 완벽히 유지하기 위한 단계별 가이드입니다.

구글 계정 `soungh88@gmail.com` 기준으로 설계되었습니다.

---

## 1단계: 구글 클라우드(GCP) VM 인스턴스 생성 가이드

구글 클라우드 평생 무료 조건(Always Free)에 맞추어 인스턴스를 생성해야 요금이 청구되지 않습니다.

1. **GCP 콘솔 접속**: `soungh88@gmail.com` 계정으로 [Google Cloud Console](https://console.cloud.google.com)에 로그인합니다.
2. **Compute Engine VM 인스턴스 만들기**:
   * **리전(Region)**: 반드시 `us-central1` (아이오와), `us-east1` (사우스캐롤라이나), `us-west1` (오레곤) 중 하나를 선택합니다.
   * **머신 유형(Machine type)**: `e2-micro` (2 vCPU, 1GB 메모리)를 선택합니다.
   * **부트 디스크**:
     * 운영체제: `Ubuntu`
     * 버전: `Ubuntu 22.04 LTS` (혹은 20.04 LTS)
     * 디스크 유형: `표준 영구 디스크 (Standard Persistent Disk)`
     * 크기: `30GB` 이하 (무료 한도 최대 30GB)
   * **방화벽(Firewall)**: `HTTP 트래픽 허용` 및 `HTTPS 트래픽 허용`을 모두 체크합니다.
3. **고정 외부 IP 할당**:
   * 네트워크 세부 설정에서 생성한 VM의 외부 IP를 **'임시(Ephemerial)'에서 '고정(Static)'** IP로 예약을 수행하여 서버 IP가 변경되지 않도록 고정합니다.

---

## 2단계: 구글 콘솔(GCP) OAuth 클라이언트 ID 설정 변경

구글 로그인과 유튜브 API가 로컬(`localhost`)이 아닌 새로운 구글 VM 서버 주소로 응답할 수 있도록 URI를 추가 등록해야 합니다.

1. **OAuth 사용자 인증 정보 페이지로 이동**:
   * `API 및 서비스` -> `사용자 인증 정보` -> 사용 중인 OAuth 2.0 클라이언트 ID (`YOUR_GOOGLE_CLIENT_ID`) 클릭.
2. **승인된 JavaScript 원본 추가**:
   * `http://<구글_VM_외부_IP>` 추가
3. **승인된 리디렉션 URI 추가**:
   * 구글 로그인용: `http://<구글_VM_외부_IP>/api/auth/callback/google` 추가
   * 유튜브 API OAuth 인증용: `http://<구글_VM_외부_IP>:8080/api/auth/callback` 추가
4. 저장 버튼을 누릅니다. (반영에 5~10분 정도 소요될 수 있습니다.)

---

## 3단계: 로컬 중요 자격증명 파일 서버로 이전 (SCP 전송)

깃에 포함되지 않는 `.env.local`, `google_service_account.json`, `tokens.json` 파일을 로컬 컴퓨터에서 VM 서버로 전송해야 합니다. 로컬 윈도우 PowerShell에서 실행하는 예시입니다.

```powershell
# 1. SSH 키 설정 또는 GCP CLI(gcloud)를 통한 파일 전송
# (VM의 사용자명이 soungh88 인 경우의 예시)

# 로컬 seoul-lofi-studio 폴더 경로로 이동 후 실행
cd C:\Users\천상좌v\.gemini\antigravity\scratch\seoul-lofi-studio

# 환경 변수 파일 전송
scp -i <사용자_SSH_키_경로> .env.local soungh88@<구글_VM_외부_IP>:/home/soungh88/seoul-lofi-studio/

# 서비스 어카운트 JSON 키 전송
scp -i <사용자_SSH_키_경로> google_service_account.json soungh88@<구글_VM_외부_IP>:/home/soungh88/seoul-lofi-studio/

# 기존 인증 토큰 전송 (유튜브 토큰 유지 목적)
scp -i <사용자_SSH_키_경로> tokens.json soungh88@<구글_VM_외부_IP>:/home/soungh88/seoul-lofi-studio/
```

> [!TIP]
> 만약 SCP 사용이 번거롭다면, VM에 접속한 후 아래 4단계에서 파일 생성 명령으로 내용을 직접 복사-붙여넣기 해도 무방합니다.

---

## 4단계: 구글 VM 서버 접속 및 환경 설정 진행 (SSH 접속 후)

### 1. 프로젝트 복사 및 자동 설치 스크립트 실행
```bash
# 1. 깃 클론 수행 (또는 파일 업로드)
git clone https://github.com/soungh88-ops/seoul-lofi-studio.git
cd seoul-lofi-studio

# 2. 설치 스크립트 실행 권한 부여 및 실행
chmod +x setup-google-server.sh
./setup-google-server.sh
```
*이 스크립트는 e2-micro OOM 방지를 위한 **스왑 메모리(2GB)** 활성화, Node.js 20 LTS 설치, 필수 도구(git, build-essential, ffmpeg, pm2) 설치, 80포트 포워딩을 자동으로 수행합니다.*

### 2. 비밀 환경 변수 설정 (`.env.local` 수정)
VM 서버의 `/home/soungh88/seoul-lofi-studio/.env.local` 파일을 생성하거나 수정하여 **리눅스 경로와 VM 외부 IP**에 맞게 경로를 업데이트합니다.

```bash
nano .env.local
```

아래 내용을 서버 환경에 맞게 기입하되, 특히 **경로와 호스트 IP**를 수정합니다.

```ini
# RunwayML API Key
RUNWAY_API_KEY=key_28bb7af7f681...

# Google Cloud Service Account JSON Key (리눅스 절대경로로 수정)
GOOGLE_APPLICATION_CREDENTIALS=/home/soungh88/seoul-lofi-studio/google_service_account.json
GOOGLE_CLOUD_PROJECT=texttospeech-501704

# Google Gemini API Keys
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_API_KEY_BACKUP=YOUR_BACKUP_GEMINI_API_KEY

# YouTube OAuth Redirect URI (VM 외부 IP로 변경)
YOUTUBE_CLIENT_ID=YOUR_YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET=YOUR_YOUTUBE_CLIENT_SECRET
YOUTUBE_REDIRECT_URI=http://34.55.146.85.nip.io:8080/api/auth/callback

# Next.js Port (동일하게 유지)
PORT=8080

# Next-Auth Security Settings (VM 외부 IP로 변경)
NEXTAUTH_URL=http://34.55.146.85.nip.io
NEXTAUTH_SECRET=seoul_lofi_studio_super_secret_key_2026
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
ALLOWED_EMAILS=soungh88@gmail.com,rubato12@gmail.com

# Kaggle API Credentials for Cloud Rendering
KAGGLER_USERNAME=soungh88
KAGGLER_KEY=0e6b38ba5b0b4643467cc500472a4e09
```

---

## 5단계: 빌드 및 PM2 서버 구동

스왑 메모리가 적용된 상태이므로, 메모리 고갈 걱정 없이 빌드를 진행할 수 있습니다.

```bash
# 1. 패키지 설치
npm install

# 2. Next.js 프로덕션 빌드
npm run build

# 3. PM2를 통한 웹 애플리케이션 데몬 가동 (무중단 실행)
pm2 start npm --name "seoul-lofi" -- start

# 4. 서버 재부팅 시 자동 가동 설정 등록
pm2 startup
# (출력되는 sudo env PATH=... 명령어를 복사해서 터미널에 한 번 실행해주세요)
pm2 save
```

가동이 성공하면 `http://<구글_VM_외부_IP>`로 접속하여 로그인 버튼을 누르고 `soungh88@gmail.com`으로 로그인하여 정상 구동되는지 확인합니다.
또한, 비디오 렌더링/유튜브 업로드 등 Kaggle GPU 위임 연동이 에러 없이 호출되는지 최종 점검합니다.
