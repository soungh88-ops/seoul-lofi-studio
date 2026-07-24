const fs = require('fs');
const lines = fs.readFileSync('src/app/page.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('글로벌 영어 SEO') || l.includes('SEO') || l.includes('generateMetadata') || l.includes('4.')) {
    if (l.includes('button') || l.includes('4.')) {
      console.log(i+1, l.trim());
    }
  }
});
