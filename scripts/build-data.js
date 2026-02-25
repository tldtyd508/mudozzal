#!/usr/bin/env node

/**
 * 무도짤 데이터 빌드 스크립트
 *
 * analyzed.json → data/memes.json + public/memes/ 이미지 복사
 *
 * 사용법:
 *   node scripts/build-data.js                 # 새 데이터 머지
 *   node scripts/build-data.js --rebuild       # 전체 재빌드
 *   node scripts/build-data.js --dry-run       # 실행 안 하고 미리보기만
 */

const fs = require('fs');
const path = require('path');

// ─── Config ───
const RAW_DIR = path.join(__dirname, '..', 'raw');
const ANALYZED_PATH = path.join(RAW_DIR, 'analyzed.json');
const IMAGES_DIR = path.join(RAW_DIR, 'images');
const MEMES_JSON = path.join(__dirname, '..', 'data', 'memes.json');
const PUBLIC_MEMES = path.join(__dirname, '..', 'public', 'memes');

// ─── Helpers ───
function loadAnalyzed() {
    if (!fs.existsSync(ANALYZED_PATH)) {
        console.error('❌ analyzed.json이 없습니다. 먼저 analyze.js를 실행하세요.');
        process.exit(1);
    }
    return JSON.parse(fs.readFileSync(ANALYZED_PATH, 'utf-8'));
}

function loadExistingMemes() {
    if (fs.existsSync(MEMES_JSON)) {
        return JSON.parse(fs.readFileSync(MEMES_JSON, 'utf-8'));
    }
    return [];
}

function slugify(text) {
    return text
        .replace(/[^\w가-힣\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .slice(0, 50);
}

function getNextId(existing) {
    const ids = existing.map((m) => parseInt(m.id, 10)).filter((n) => !isNaN(n));
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
}

// ─── Main ───
function main() {
    const args = process.argv.slice(2);
    const rebuild = args.includes('--rebuild');
    const dryRun = args.includes('--dry-run');

    const analyzed = loadAnalyzed();

    if (analyzed.length === 0) {
        console.log('✅ 빌드할 데이터가 없습니다.');
        return;
    }

    // Only include relevant images
    const relevantData = analyzed.filter((a) => a.relevant !== false);

    let existingMemes = rebuild ? [] : loadExistingMemes();
    const existingFilenames = new Set(existingMemes.map((m) => m._sourceFile).filter(Boolean));

    // Filter out already-added entries
    const newEntries = relevantData.filter((a) => !existingFilenames.has(a.filename));

    if (newEntries.length === 0 && !rebuild) {
        console.log('✅ 새로 추가할 짤이 없습니다.');
        return;
    }

    console.log(`\n📦 데이터 빌드${dryRun ? ' (DRY RUN)' : ''}`);
    console.log(`   분석 데이터: ${analyzed.length}개`);
    console.log(`   관련 데이터: ${relevantData.length}개`);
    console.log(`   새로 추가: ${rebuild ? relevantData.length : newEntries.length}개`);
    console.log('');

    let nextId = rebuild ? 1 : getNextId(existingMemes);
    const entriesToAdd = rebuild ? relevantData : newEntries;
    const newMemes = [];

    fs.mkdirSync(PUBLIC_MEMES, { recursive: true });

    for (const entry of entriesToAdd) {
        const ext = path.extname(entry.filename).toLowerCase();
        const newFilename = `meme_${nextId}${ext}`;
        const srcPath = path.join(IMAGES_DIR, entry.filename);
        const destPath = path.join(PUBLIC_MEMES, newFilename);

        if (!fs.existsSync(srcPath)) {
            console.log(`  ⏭️  ${entry.filename} — 원본 파일 없음, 스킵`);
            continue;
        }

        const meme = {
            id: String(nextId),
            title: entry.title || '무제',
            tags: entry.tags || [],
            situation: entry.situation || '',
            episode: entry.episode || '알수없음',
            description: entry.description || '',
            imageUrl: `/memes/${newFilename}`,
            member: entry.member || '알수없음',
            _sourceFile: entry.filename,
        };

        if (!dryRun) {
            fs.copyFileSync(srcPath, destPath);
        }

        newMemes.push(meme);
        console.log(`  ✅ [${nextId}] "${meme.title}" — ${meme.member}`);
        nextId++;
    }

    if (!dryRun) {
        const finalMemes = rebuild ? newMemes : [...existingMemes, ...newMemes];

        // Clean internal metadata before saving
        const cleanMemes = finalMemes.map(({ _sourceFile, ...rest }) => rest);

        fs.writeFileSync(MEMES_JSON, JSON.stringify(cleanMemes, null, 2));

        // Also save with metadata for future merges
        const metaPath = path.join(RAW_DIR, 'memes_with_meta.json');
        fs.writeFileSync(metaPath, JSON.stringify(finalMemes, null, 2));

        console.log(`\n✨ 빌드 완료!`);
        console.log(`   📄 ${MEMES_JSON} — ${cleanMemes.length}개 짤`);
        console.log(`   🖼️  ${PUBLIC_MEMES}/ — 이미지 복사됨`);
    } else {
        console.log(`\n🔍 DRY RUN 완료 — 실제 파일 변경 없음`);
    }
}

main();
