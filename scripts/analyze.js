#!/usr/bin/env node

/**
 * 무도짤 Gemini Vision 분석 스크립트
 *
 * raw/ 폴더의 이미지를 Gemini Vision으로 분석하여
 * 제목, 태그, 상황, 멤버 등 메타데이터를 자동 생성합니다.
 *
 * 사용법:
 *   node scripts/analyze.js                    # 미분석 이미지 전부
 *   node scripts/analyze.js --limit 10         # 최대 10개만
 *   node scripts/analyze.js --reanalyze        # 전부 재분석
 *
 * 환경변수:
 *   GEMINI_API_KEY — Gemini API Key
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

// ─── Config ───
const RAW_DIR = path.join(__dirname, '..', 'raw');
const IMAGES_DIR = path.join(RAW_DIR, 'images');
const MANIFEST_PATH = path.join(RAW_DIR, 'manifest.json');
const ANALYZED_PATH = path.join(RAW_DIR, 'analyzed.json');

// Load API key from .env.local
function loadEnv() {
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach((line) => {
            const match = line.match(/^([^#=]+)=(.*)$/);
            if (match && !process.env[match[1].trim()]) {
                process.env[match[1].trim()] = match[2].trim();
            }
        });
    }
}

function loadManifest() {
    if (fs.existsSync(MANIFEST_PATH)) {
        return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
    return { images: [], hashes: [] };
}

function saveManifest(manifest) {
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function loadAnalyzed() {
    if (fs.existsSync(ANALYZED_PATH)) {
        return JSON.parse(fs.readFileSync(ANALYZED_PATH, 'utf-8'));
    }
    return [];
}

function saveAnalyzed(data) {
    fs.writeFileSync(ANALYZED_PATH, JSON.stringify(data, null, 2));
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    return types[ext] || 'image/jpeg';
}

// ─── Gemini Vision Analysis ───
async function analyzeImage(ai, imagePath, filename, context, width, height) {
    const imageData = fs.readFileSync(imagePath);
    const base64 = imageData.toString('base64');
    const mimeType = getMimeType(filename);

    // Pre-filter based on aspect ratio if available
    if (width && height) {
        const ratio = width / height;
        if (ratio < 0.6 || ratio > 2.5) {
            return { relevant: false, reason: '비율이 단일 프레임 짤이 아님 (다중 패널 또는 파노라마)' };
        }
    }

    const prompt = `이 이미지는 한국 예능 프로그램 "무한도전(MBC)"의 캡처/짤이야.
이 이미지를 분석해서 아래 JSON 형식으로 메타데이터를 생성해줘.

${context ? `참고: 이 이미지는 "${context}" 검색으로 찾은 거야.` : ''}

[매우 중요한 필터링 규칙 - 아래 중 하나라도 해당하면 "relevant": false 로 설정해!]
1. **가장 중요**: 실제 "무한도전" TV 방송 화면 캡처가 **아닌** 경우 무조건 제외 (기자회견 사진, 직찍, 팬아트, 포스터, 유튜브 썸네일 구조 등은 모두 제외)
2. '단일 프레임'이 아닌 경우 (여러 장이 세로/가로로 붙어있는 웹툰 형식, 패널 분할)
3. 짤(Meme)로서의 가치가 없는 일반적인 방송 캡처 (자막이 없거나 아무 감정/상황이 느껴지지 않음)
4. 너무 화질이 안 좋거나 텍스트가 심하게 깨져 알아볼 수 없는 경우
5. 무한도전 멤버가 아니거나 무도 방송이 아닌 다른 프로그램인 경우

[메타데이터 규칙 - relevant가 true일 때만 작성]
1. title: 이 짤이 대화에서 쓰일 때의 대사나 상황을 제일 잘 나타내는 짧은 문장 (예: "무야호~", "그건 니 생각이고")
2. tags: 5~8개, 감정/상황/인물 관련 키워드
3. situation: 이 짤을 메신저 등에서 실제로 쓸 수 있는 구체적인 상황 3~4가지
4. description: 이미지에서 일어나는 장면과 자막 내용 설명
5. member: 메인으로 등장하는 무한도전 멤버 이름 (유재석, 박명수, 정준하, 정형돈, 노홍철, 하하, 길, 데프콘, 광희, 양세형, 조세호 등). 불확실하면 "알수없음"
6. episode: 추정 회차 또는 코너명 (모르면 "알수없음")
7. emotion: 주요 감정 (기쁨/슬픔/분노/놀람/웃음/당황/감동/피곤/기타)

JSON만 응답해. 다른 텍스트는 절대 포함하지 마.

{
  "relevant": true,
  "title": "짤 제목/대사",
  "tags": ["태그1", "태그2", ...],
  "situation": "이 짤을 쓸 수 있는 상황 설명",
  "description": "이미지에서 일어나는 장면 설명",
  "member": "멤버이름",
  "episode": "추정 회차 또는 코너명 (모르면 '알수없음')",
  "emotion": "주요 감정"
}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{
            role: 'user',
            parts: [
                { inlineData: { mimeType, data: base64 } },
                { text: prompt },
            ],
        }],
        config: {
            temperature: 0.2,
            maxOutputTokens: 1024,
        },
    });

    const text = response.text.trim();

    // Extract JSON
    let jsonStr = text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonStr = jsonMatch[0];
    }

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        return { relevant: false, reason: 'AI 응답이 올바르지 않음' };
    }
}

// ─── Main ───
async function main() {
    loadEnv();
    const args = process.argv.slice(2);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
        console.error('❌ GEMINI_API_KEY가 필요합니다.');
        console.error('   .env.local 파일에 GEMINI_API_KEY=xxx 설정해주세요.');
        process.exit(1);
    }

    const ai = new GoogleGenAI({ apiKey });
    const manifest = loadManifest();
    const analyzed = loadAnalyzed();
    const analyzedFiles = new Set(analyzed.map((a) => a.filename));

    const reanalyze = args.includes('--reanalyze');
    const limitIdx = args.indexOf('--limit');
    const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

    // Find images to analyze
    let toAnalyze = manifest.images.filter((img) => {
        if (reanalyze) return true;
        return !img.analyzed && !analyzedFiles.has(img.filename);
    });

    if (toAnalyze.length === 0) {
        // Also check for images in raw/images not in manifest
        if (fs.existsSync(IMAGES_DIR)) {
            const filesOnDisk = fs.readdirSync(IMAGES_DIR).filter((f) => !f.startsWith('.'));
            const manifestFiles = new Set(manifest.images.map((m) => m.filename));
            const unmanifested = filesOnDisk.filter((f) => !manifestFiles.has(f) && !analyzedFiles.has(f));
            toAnalyze = unmanifested.map((f) => ({ filename: f, keyword: '' }));
        }
    }

    toAnalyze = toAnalyze.slice(0, limit);

    if (toAnalyze.length === 0) {
        console.log('✅ 분석할 이미지가 없습니다.');
        return;
    }

    console.log(`\n🤖 Gemini Vision 분석: ${toAnalyze.length}개 이미지\n`);

    let success = 0;
    let skipped = 0;

    for (let i = 0; i < toAnalyze.length; i++) {
        const img = toAnalyze[i];
        const imagePath = path.join(IMAGES_DIR, img.filename);

        if (!fs.existsSync(imagePath)) {
            console.log(`  ⏭️  [${i + 1}] ${img.filename} — 파일 없음`);
            continue;
        }

        console.log(`  [${i + 1}/${toAnalyze.length}] ${img.filename} 분석 중...`);

        // Find corresponding manifest entry to get width and height
        const manifestImg = manifest.images.find((m) => m.filename === img.filename);
        const width = manifestImg ? manifestImg.width : null;
        const height = manifestImg ? manifestImg.height : null;

        try {
            const result = await analyzeImage(ai, imagePath, img.filename, img.keyword, width, height);

            if (!result.relevant) {
                console.log(`    ❌ 무한도전 관련 아님 — 스킵`);
                skipped++;
                // Mark as analyzed so we don't retry
                const manifestImg = manifest.images.find((m) => m.filename === img.filename);
                if (manifestImg) manifestImg.analyzed = true;
                continue;
            }

            // Remove existing analysis for this file if reanalyzing
            const existingIdx = analyzed.findIndex((a) => a.filename === img.filename);
            if (existingIdx !== -1) {
                analyzed.splice(existingIdx, 1);
            }

            analyzed.push({
                filename: img.filename,
                ...result,
                sourceUrl: img.sourceUrl || '',
                keyword: img.keyword || '',
                analyzedAt: new Date().toISOString(),
            });

            // Mark in manifest
            const manifestImg = manifest.images.find((m) => m.filename === img.filename);
            if (manifestImg) manifestImg.analyzed = true;

            success++;
            console.log(`    ✅ "${result.title}" — ${result.member} (${result.emotion})`);
        } catch (err) {
            console.error(`    ❌ 분석 실패: ${err.message}`);

            // Handle 429 Quota Exceeded API Error
            if (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')) {
                console.error(`\n🚨 [경고] API 할당량을 초과했습니다 (429). 무료 제공량이 다 소진되었을 수 있습니다.`);
                console.error(`🚨 진행 상태를 멈추고 저장 후 종료합니다... 내일 다시 시도하거나 결제 계정을 연결하세요.\n`);
                break; // Exit the for-loop completely
            }
        }

        // Rate limiting (Gemini free tier allows ~15 RPM, so sleep for 12s)
        if (i < toAnalyze.length - 1) {
            await sleep(12000);
        }
    }

    saveManifest(manifest);
    saveAnalyzed(analyzed);

    console.log(`\n✨ 분석 완료: ${success}개 성공, ${skipped}개 비관련 스킵`);
    console.log(`   총 분석 데이터: ${analyzed.length}개`);
}

main().catch(console.error);
