const fs = require('fs');
const path = require('path');
const baseDir = 'C:\\Users\\천상좌v\\.gemini\\antigravity\\brain';
const convDirs = fs.readdirSync(baseDir).filter(d => fs.statSync(path.join(baseDir, d)).isDirectory());

console.log("Searching past transcripts for mentions of local PC rendering...");

let found = false;
convDirs.forEach(dir => {
  const tPath = path.join(baseDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (fs.existsSync(tPath)) {
    const lines = fs.readFileSync(tPath, 'utf8').split('\n');
    lines.forEach(l => {
      try {
        const obj = JSON.parse(l);
        if (obj.content && (obj.content.includes('컴퓨터') || obj.content.includes('PC') || obj.content.includes('로컬')) && (obj.content.includes('렌더링') || obj.content.includes('랜더링') || obj.content.includes('FFmpeg'))) {
          if (obj.type === "PLANNER_RESPONSE") {
             console.log(`[AI]:`, obj.content.substring(0, 300).replace(/\n/g, ' '));
             found = true;
          } else if (obj.type === "USER_INPUT") {
             console.log(`[USER]:`, obj.content.substring(0, 300).replace(/\n/g, ' '));
             found = true;
          }
        }
      } catch(e){}
    });
  }
});
if(!found) console.log("No matching messages found.");
