import { GoogleGenAI } from '@google/genai';
import memesData from '@/data/memes.json';

export async function POST(request) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
            { status: 500 }
        );
    }

    try {
        const { query } = await request.json();

        if (!query || !query.trim()) {
            return Response.json(
                { error: '검색어를 입력해주세요.' },
                { status: 400 }
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        const memeContext = memesData.map((m) =>
            `[ID:${m.id}] "${m.title}" - ${m.member} | 태그: ${m.tags.join(', ')} | 상황: ${m.situation} | ${m.description}`
        ).join('\n');

        const systemPrompt = `너는 무한도전 짤 추천 전문가야. 사용자가 자신의 상황이나 감정을 설명하면, 아래 짤 목록에서 가장 적합한 짤 3개를 추천해줘.

## 짤 목록:
${memeContext}

## 규칙:
1. 반드시 위 목록에 있는 짤만 추천해야 해.
2. 정확히 3개를 추천해야 해. (적합한 게 3개 미만이면 가능한 만큼만)
3. 각 추천에 대해 왜 이 짤이 적합한지 한 줄로 설명해줘.
4. 반드시 아래 JSON 형식으로만 응답해줘. 다른 텍스트는 절대 포함하지 마.

## 응답 형식:
[{"id": "짤ID", "reason": "추천 이유"}, ...]`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: query }] }],
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                maxOutputTokens: 512,
            },
        });

        const text = response.text.trim();

        // Extract JSON from response (handle possible markdown code blocks)
        let jsonStr = text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        const results = JSON.parse(jsonStr);

        // Validate and enrich results with full meme data
        const enrichedResults = results
            .filter((r) => memesData.find((m) => m.id === r.id))
            .map((r) => ({
                ...memesData.find((m) => m.id === r.id),
                reason: r.reason,
            }));

        return Response.json({ results: enrichedResults });
    } catch (error) {
        console.error('Gemini API error:', error);
        return Response.json(
            { error: 'AI 검색 중 오류가 발생했습니다. 다시 시도해주세요.' },
            { status: 500 }
        );
    }
}
