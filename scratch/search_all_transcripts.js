const fs = require('fs');
const path = require('path');
const baseDir = 'C:\\Users\\천상좌v\\.gemini\\antigravity\\brain';
const convDirs = fs.readdirSync(baseDir).filter(d => fs.statSync(path.join(baseDir, d)).isDirectory());

convDirs.forEach(dir => {
  const tPath = path.join(baseDir, dir, '.system_generated', 'logs', 'transcript_full.jsonl');
  if (fs.existsSync(tPath)) {
    const lines = fs.readFileSync(tPath, 'utf8').split('\n');
    lines.forEach(l => {
      if (l.includes('"type":"USER_INPUT"') && l.includes('썸네일')) {
        try {
          const obj = JSON.parse(l);
          console.log(`[${dir}] USER:`, obj.content);
        } catch(e){}
      }
    });
  }
});
