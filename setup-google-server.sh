#!/bin/bash
# ==============================================================================
# 서울 로파이 스튜디오 - 구글 클라우드 무료 서버 (GCP e2-micro VM) 자동 설치 스크립트
# ==============================================================================

echo "👹 [서울 로파이 스튜디오] 구글 무료 VM 서버 환경 설정을 시작합니다..."

# 1. 패키지 업데이트 및 기본 도구 설치
echo "1. 시스템 패키지 업데이트 및 필수 도구 설치..."
sudo apt update -y
sudo apt install -y curl git build-essential ffmpeg

# 2. Node.js 20 LTS 설치
echo "2. Node.js 20 LTS 설치 중..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Node 및 NPM 버전 확인
echo "설치 완료된 Node 버전: $(node -v)"
echo "설치 완료된 NPM 버전: $(npm -v)"
echo "설치 완료된 FFmpeg 버전: $(ffmpeg -version | head -n 1)"

# 3. PM2 글로벌 설치 (24시간 무중단 구동 및 프로세스 모니터링)
echo "3. PM2 설치 중..."
sudo npm install -g pm2

# 4. 방화벽 포트 개방 및 포트 포워딩 (80포트로 접속하면 3000포트로 연결되도록 설정)
echo "4. 네트워크 포트 개방 설정..."
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

echo "🎉 구글 무료 서버 기본 세팅 완료!"
echo "--------------------------------------------------------"
echo "이제 다음 명령어를 실행하여 서비스를 구동하세요:"
echo "1) npm install"
echo "2) cp .env.local.example .env.local (환경변수 설정)"
echo "3) npm run build"
echo "4) pm2 start npm --name 'seoul-lofi' -- start"
echo "--------------------------------------------------------"
