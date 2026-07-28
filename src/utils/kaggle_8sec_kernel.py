"""
Seoul Lofi Studio - Kaggle 8-Second Video Loop Generator
Kaggle GPU 안에서 실행: Veo API로 8초 루프 영상 생성.
Veo 실패 시 → FFmpeg으로 빗금 없는 깨끗한 다크 배경 생성.
Output: /kaggle/working/{{OUTPUT_FILENAME}}
"""

import os
import subprocess
import time
import json
import urllib.request
import urllib.error

# === INJECTED PARAMETERS (Next.js 백엔드가 자동 주입) ===
VIDEO_PROMPT = "{{VIDEO_PROMPT}}"
GEMINI_API_KEY = "{{GEMINI_API_KEY}}"
OUTPUT_FILENAME = "{{OUTPUT_FILENAME}}"
# =========================================================

def log(msg):
    print(f"[{time.strftime('%X')}] {msg}", flush=True)

def generate_veo_8sec(prompt, api_key, dest_path):
    """Veo 3.1 API를 Kaggle 내에서 호출하여 8초 루프 영상 생성."""
    log("Google Veo 3.1 API 호출 시작 (Kaggle Cloud)...")

    veo_prompt = (
        f"{prompt}, "
        "MANDATORY PERFECT SEAMLESS LOOP: first frame matches last frame perfectly, "
        "static tripod camera shot, ZERO camera zoom, ZERO camera motion, "
        "NO grid lines, NO scanlines, NO diagonal streaks, NO horizontal lines, "
        "clean crystal clear 4k detail, cozy 2D lofi anime animation style, "
        "Studio Ghibli inspired art style, perfect repeating loop"
    )

    body = {
        "instances": [{"prompt": veo_prompt}],
        "parameters": {
            "aspectRatio": "16:9",
            "sampleCount": 1,
            "durationSeconds": 8
        }
    }

    models = ["veo-3.1-fast-generate-preview", "veo-3.1-generate-preview"]

    for model in models:
        try:
            url = (
                f"https://generativelanguage.googleapis.com/v1beta/"
                f"models/{model}:predictLongRunning?key={api_key}"
            )
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode("utf-8"))

            if "name" in res_data:
                operation_name = res_data["name"]
                log(f"Veo 작업 시작됨: {operation_name}")

                status_url = (
                    f"https://generativelanguage.googleapis.com/v1beta/"
                    f"{operation_name}?key={api_key}"
                )

                for attempt in range(36):  # 최대 6분 대기 (10초 x 36)
                    time.sleep(10)
                    log(f"Veo 폴링 중... ({attempt + 1}/36)")
                    st_req = urllib.request.Request(status_url)
                    with urllib.request.urlopen(st_req) as st_res:
                        st_data = json.loads(st_res.read().decode("utf-8"))

                    if st_data.get("done"):
                        if "error" in st_data:
                            raise Exception(
                                st_data["error"].get("message", "Veo 알 수 없는 오류")
                            )

                        # 응답에서 영상 URI 추출
                        resp = st_data.get("response", {})
                        samples = (
                            resp.get("generateVideoResponse", {})
                                .get("generatedSamples", [])
                        )
                        if samples:
                            video_uri = samples[0].get("video", {}).get("uri")
                            if video_uri:
                                dl_url = (
                                    video_uri
                                    if "key=" in video_uri
                                    else f"{video_uri}&key={api_key}"
                                )
                                log(f"Veo 영상 생성 성공! 다운로드 중...")
                                dl_req = urllib.request.Request(
                                    dl_url,
                                    headers={"User-Agent": "Mozilla/5.0"}
                                )
                                with (
                                    urllib.request.urlopen(dl_req) as r,
                                    open(dest_path, "wb") as f
                                ):
                                    f.write(r.read())
                                log(f"8초 영상 저장 완료: {dest_path}")
                                return True

                raise Exception("Veo 응답에서 영상 URI를 찾을 수 없음")

        except Exception as e:
            log(f"[{model}] 실패: {str(e)}")

    return False


def generate_clean_fallback(dest_path):
    """
    Veo 불가 시 FFmpeg으로 빗금 없는 깨끗한 다크 배경 영상 생성.
    딥 매트 블랙 + 타이타늄 실버 그라데이션, NO scanlines.
    """
    log("Veo 불가 → FFmpeg 클린 폴백 영상 생성 중 (빗금 제로)...")

    # 부드러운 그라데이션 암전 배경 (딥 매트 블랙 테마)
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", (
            "color=c=0x0d0d14:s=1920x1080:r=30,"
            "format=yuv420p"
        ),
        "-t", "8",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        dest_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        log(f"그라데이션 생성 실패, 단색으로 재시도: {result.stderr[:200]}")
        # 최후 단순 폴백
        simple_cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi", "-i", "color=c=0x0a0a0f:s=1920x1080:r=30:d=8",
            "-c:v", "libx264", "-crf", "23", "-pix_fmt", "yuv420p",
            dest_path
        ]
        subprocess.run(simple_cmd)

    log(f"클린 폴백 영상 생성 완료: {dest_path}")


def main():
    log("=== Seoul Lofi Studio - 8초 영상 생성기 (Kaggle Cloud) ===")
    log(f"프롬프트: {VIDEO_PROMPT}")
    log(f"출력 파일명: {OUTPUT_FILENAME}")

    work_dir = "/kaggle/working"
    dest_path = os.path.join(work_dir, OUTPUT_FILENAME)

    veo_ok = generate_veo_8sec(VIDEO_PROMPT, GEMINI_API_KEY, dest_path)

    if not veo_ok:
        generate_clean_fallback(dest_path)

    if os.path.exists(dest_path):
        size_mb = os.path.getsize(dest_path) / (1024 * 1024)
        log(f"최종 결과: {dest_path} ({size_mb:.2f} MB)")
        log("SUCCESS")
    else:
        log("ERROR: 출력 파일 없음!")


if __name__ == "__main__":
    main()
