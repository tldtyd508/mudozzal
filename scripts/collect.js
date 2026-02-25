#!/usr/bin/env node

/**
 * 무도짤 이미지 수집 스크립트
 *
 * 사용법:
 *   node scripts/collect.js --serpapi              # SerpAPI로 자동 수집
 *   node scripts/collect.js --urls urls.txt        # URL 파일에서 수집
 *   node scripts/collect.js --urls urls.txt --append  # 기존에 추가
 *
 * 환경변수:
 *   SERPAPI_KEY — SerpAPI API Key (--serpapi 모드)
 *   GEMINI_API_KEY — .env.local에서 자동 로드
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ─── Config ───
const RAW_DIR = path.join(__dirname, '..', 'raw');
const IMAGES_DIR = path.join(RAW_DIR, 'images');
const MANIFEST_PATH = path.join(RAW_DIR, 'manifest.json');
const KEYWORDS_PATH = path.join(__dirname, 'keywords.json');

// ─── Helpers ───
function ensureDirs() {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
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

function hashBuffer(buf) {
    return crypto.createHash('md5').update(buf).digest('hex');
}

function getExtFromUrl(url) {
    const pathname = new URL(url).pathname;
    const ext = path.extname(pathname).toLowerCase().split('?')[0];
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    return validExts.includes(ext) ? ext : '.jpg';
}

function downloadImage(url, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, {
            timeout, headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'image/*,*/*',
            }
        }, (res) => {
            // Follow redirects
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadImage(res.headers.location, timeout).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

// ─── SerpAPI Image Search ───
async function searchSerpApi(query, apiKey) {
    const params = new URLSearchParams({
        engine: 'google_images',
        q: query,
        api_key: apiKey,
        ijn: '0',
        num: '20',
    });

    const url = `https://serpapi.com/search.json?${params}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`SerpAPI error: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return (data.images_results || []).map((r) => ({
        url: r.original,
        thumbnail: r.thumbnail,
        title: r.title || '',
        source: r.source || '',
        width: r.original_width,
        height: r.original_height,
    }));
}

// ─── Main: SerpAPI Mode ───
async function collectFromSerpApi(apiKey) {
    const keywords = JSON.parse(fs.readFileSync(KEYWORDS_PATH, 'utf-8'));
    const manifest = loadManifest();
    let totalNew = 0;

    console.log(`\n🔍 SerpAPI 모드: ${keywords.searches.length}개 키워드 검색\n`);

    for (let i = 0; i < keywords.searches.length; i++) {
        const keyword = keywords.searches[i];
        console.log(`[${i + 1}/${keywords.searches.length}] "${keyword}" 검색 중...`);

        try {
            const results = await searchSerpApi(keyword, apiKey);
            console.log(`  → ${results.length}개 결과`);

            for (const result of results) {
                if (!result.url) continue;

                try {
                    const buf = await downloadImage(result.url);

                    // Size filter: skip tiny images (<5KB) or huge ones (>10MB)
                    if (buf.length < 5000 || buf.length > 10 * 1024 * 1024) {
                        continue;
                    }

                    const hash = hashBuffer(buf);

                    // Skip duplicates
                    if (manifest.hashes.includes(hash)) {
                        continue;
                    }

                    const ext = getExtFromUrl(result.url);
                    const filename = `mudo_${Date.now()}_${hash.slice(0, 8)}${ext}`;
                    const filepath = path.join(IMAGES_DIR, filename);

                    fs.writeFileSync(filepath, buf);
                    manifest.hashes.push(hash);
                    manifest.images.push({
                        filename,
                        sourceUrl: result.url,
                        sourceTitle: result.title,
                        sourceSite: result.source,
                        keyword,
                        hash,
                        width: result.width,
                        height: result.height,
                        downloadedAt: new Date().toISOString(),
                        analyzed: false,
                    });

                    totalNew++;
                    process.stdout.write(`  ✅ ${filename} (${(buf.length / 1024).toFixed(0)}KB)\n`);
                } catch (err) {
                    // Silently skip failed downloads
                }
            }

            saveManifest(manifest);

            // Rate limiting: wait between searches
            if (i < keywords.searches.length - 1) {
                await sleep(2000);
            }
        } catch (err) {
            console.error(`  ❌ 검색 실패: ${err.message}`);
        }
    }

    console.log(`\n✨ 수집 완료: ${totalNew}개 새 이미지 (총 ${manifest.images.length}개)`);
}

// ─── Main: URL File Mode ───
async function collectFromUrls(urlFile) {
    const content = fs.readFileSync(urlFile, 'utf-8');
    const urls = content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const manifest = loadManifest();
    let totalNew = 0;

    console.log(`\n📋 URL 모드: ${urls.length}개 URL에서 수집\n`);

    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`[${i + 1}/${urls.length}] 다운로드 중...`);

        try {
            const buf = await downloadImage(url);
            const hash = hashBuffer(buf);

            if (manifest.hashes.includes(hash)) {
                console.log(`  ⏭️  중복 스킵`);
                continue;
            }

            const ext = getExtFromUrl(url);
            const filename = `mudo_${Date.now()}_${hash.slice(0, 8)}${ext}`;
            const filepath = path.join(IMAGES_DIR, filename);

            fs.writeFileSync(filepath, buf);
            manifest.hashes.push(hash);
            manifest.images.push({
                filename,
                sourceUrl: url,
                sourceTitle: '',
                sourceSite: '',
                keyword: 'manual',
                hash,
                downloadedAt: new Date().toISOString(),
                analyzed: false,
            });

            totalNew++;
            console.log(`  ✅ ${filename} (${(buf.length / 1024).toFixed(0)}KB)`);
        } catch (err) {
            console.error(`  ❌ 실패: ${err.message}`);
        }

        await sleep(500);
    }

    saveManifest(manifest);
    console.log(`\n✨ 수집 완료: ${totalNew}개 새 이미지 (총 ${manifest.images.length}개)`);
}

// ─── CLI ───
async function main() {
    const args = process.argv.slice(2);
    ensureDirs();

    if (args.includes('--serpapi')) {
        const apiKey = process.env.SERPAPI_KEY;
        if (!apiKey) {
            console.error('❌ SERPAPI_KEY 환경변수가 필요합니다.');
            console.error('   export SERPAPI_KEY=your_key_here');
            process.exit(1);
        }
        await collectFromSerpApi(apiKey);
    } else if (args.includes('--urls')) {
        const idx = args.indexOf('--urls');
        const urlFile = args[idx + 1];
        if (!urlFile || !fs.existsSync(urlFile)) {
            console.error('❌ URL 파일 경로가 필요합니다.');
            console.error('   node scripts/collect.js --urls urls.txt');
            process.exit(1);
        }
        await collectFromUrls(urlFile);
    } else {
        console.log(`
무도짤 이미지 수집 스크립트

사용법:
  node scripts/collect.js --serpapi              SerpAPI로 자동 수집
  node scripts/collect.js --urls <file>          URL 파일에서 수집

환경변수:
  SERPAPI_KEY    SerpAPI API Key (--serpapi 모드)

URL 파일 형식 (한 줄에 하나):
  https://example.com/image1.jpg
  https://example.com/image2.png
  # 주석은 #으로 시작
`);
    }
}

main().catch(console.error);
