const fs = require('fs');
const lines = fs.readFileSync('src/app/page.js', 'utf8').split('\n');
lines.forEach((l, i) => { 
  if (l.includes('썸네일') || l.includes('thumbnail')) {
    console.log(i+1, l.trim()); 
  }
});
