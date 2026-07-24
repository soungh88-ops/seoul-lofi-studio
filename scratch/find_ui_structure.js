const fs = require('fs');
const lines = fs.readFileSync('src/app/page.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('Dokkaebi 4K 썸네일 엔진') || l.includes('<video') || l.includes('미리보기') || l.includes('비디오 생성')) {
    console.log(i+1, l.trim());
  }
});
