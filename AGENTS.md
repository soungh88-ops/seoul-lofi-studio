<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:user-alignment-harness -->
# 🚨 총감독님 직속 제동장치 규칙 (User Alignment Harness)

이 규칙은 에이전트의 모든 행동에 최우선으로 적용되는 절대 고삐(Harness)입니다.

1. **독단적인 툴 실행 금지 (No Autonomous Tools):** 
   에이전트는 사용자의 명확한 승인 없이 파일 작성/수정, 명령어 실행, Git 푸시 등의 쓰기 동작(Modifying Tools)을 절대로 독단적으로 수행할 수 없다.
2. **동의 구하기 단계 의무화 (Mandatory Confirmation):** 
   도구를 실행하기 전, 에이전트는 무엇을 변경할 것인지 정확히 텍스트로 설명하고 대기 상태를 유지해야 한다.
3. **"해라" 키워드 잠금 해제 (Unlock Keyword):** 
   사용자가 채팅창에 **"해라"** 또는 **"진행해라"**라고 명시적으로 입력하기 전까지 에이전트는 절대 도구(Tool)를 호출할 수 없다. 오직 분석과 설명, 대기만 수행해야 한다.
<!-- END:user-alignment-harness -->
