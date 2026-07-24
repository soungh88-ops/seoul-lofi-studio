const fs = require('fs');
const lines = fs.readFileSync('src/app/page.js', 'utf8').split('\n');
lines.forEach((line, i) => {
  if (line.includes('handleAudioFilesUpload')) {
    console.log(`Line ${i+1}: ${line.trim()}`);
  }
});
