const fs = require('fs');
const path = require('path');

const memes = [
    { file: 'muyaho.svg', emoji: '⛷️', text: '무야호~', color: '#e63946' },
    { file: 'myungsoo-funny.svg', emoji: '🤨', text: '나 웃긴거야?', color: '#457b9d' },
    { file: 'crazy.svg', emoji: '😱', text: '미쳤어!', color: '#f4a261' },
    { file: 'your-thought.svg', emoji: '😎', text: '니 생각이고', color: '#2a9d8f' },
    { file: 'defconn-tears.svg', emoji: '😢', text: '데프콘 눈물', color: '#6a4c93' },
    { file: 'haha-laugh.svg', emoji: '🤣', text: '하하 깔깔', color: '#ff6b6b' },
    { file: 'hongchul-selfie.svg', emoji: '🤳', text: '노홍철 셀카', color: '#4ecdc4' },
    { file: 'gil-sigh.svg', emoji: '😮‍💨', text: '길 한숨', color: '#95adb6' },
    { file: 'grasshopper.svg', emoji: '🦗', text: '메뚜기 유재석', color: '#06d6a0' },
    { file: 'myungsoo-roar.svg', emoji: '🦁', text: '박명수 사자후', color: '#ef476f' },
    { file: 'junha-eating.svg', emoji: '🍖', text: '정준하 먹방', color: '#ffd166' },
    { file: 'haha-dance.svg', emoji: '💃', text: '하하 댄스', color: '#118ab2' },
];

const dir = path.join(__dirname, '..', 'public', 'memes');
fs.mkdirSync(dir, { recursive: true });

memes.forEach(({ file, emoji, text, color }) => {
    const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="100%" stop-color="${color}88"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)" rx="0"/>
  <text x="400" y="250" text-anchor="middle" font-size="120">${emoji}</text>
  <text x="400" y="380" text-anchor="middle" font-family="sans-serif" font-size="48" font-weight="bold" fill="white" stroke="black" stroke-width="2">${text}</text>
  <text x="400" y="440" text-anchor="middle" font-family="sans-serif" font-size="20" fill="white" opacity="0.7">무도짤 | MudoZzal</text>
</svg>`;
    fs.writeFileSync(path.join(dir, file), svg);
    console.log(`Created ${file}`);
});
