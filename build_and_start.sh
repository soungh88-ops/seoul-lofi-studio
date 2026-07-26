#!/bin/bash
echo "=== 빌드 잠금 해제 및 재빌드 시작 ==="

# 기존 next 프로세스 강제 종료
sudo pkill -9 -f "next build" 2>/dev/null || true
sleep 2

# .next 캐시 폴더 완전 삭제
sudo rm -rf /home/soungh88/seoul-lofi-studio/.next
echo "캐시 삭제 완료"

# 메모리 확인
free -h

# 스왑이 없으면 다시 활성화
if ! swapon --show | grep -q /swapfile; then
    sudo swapon /swapfile 2>/dev/null || (sudo mkswap /swapfile && sudo swapon /swapfile)
    echo "스왑 재활성화 완료"
fi

echo "=== npm run build 시작 ==="
cd /home/soungh88/seoul-lofi-studio
export NODE_OPTIONS="--max-old-space-size=512"
npm run build > /tmp/build.log 2>&1
BUILD_EXIT=$?

if [ $BUILD_EXIT -eq 0 ]; then
    echo "BUILD_SUCCESS"
    # PM2 서버 가동
    pm2 delete seoul-lofi 2>/dev/null || true
    pm2 start npm --name "seoul-lofi" -- start
    pm2 startup 2>/dev/null || true
    pm2 save
    echo "PM2_STARTED"
else
    echo "BUILD_FAILED with exit code $BUILD_EXIT"
    tail -30 /tmp/build.log
fi
