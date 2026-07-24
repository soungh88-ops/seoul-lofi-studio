const fs = require('fs');
const lines = fs.readFileSync('C:\\Users\\천상좌v\\.gemini\\antigravity\\brain\\6c7e0d7b-9bcd-4b32-b7b4-8e641f5d7bd8\\.system_generated\\logs\\transcript_full.jsonl', 'utf8').split('\n');
let count = 0;
lines.forEach(l => {
  if (l.includes('"type":"USER_INPUT"') && l.includes('썸네일')) {
    try {
      const obj = JSON.parse(l);
      console.log('USER:', obj.content);
      count++;
    } catch(e){}
  }
});
console.log('Total mentions:', count);
