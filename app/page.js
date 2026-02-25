'use client';

import { useState, useMemo, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import MemeGrid from '@/components/MemeGrid';
import MemeModal from '@/components/MemeModal';
import useStats from '@/hooks/useStats';
import memesData from '@/data/memes.json';

const MEMBERS = ['전체', ...new Set(memesData.map((m) => m.member))];

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('전체');
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [toast, setToast] = useState('');

  // AI search state
  const [aiMode, setAiMode] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  // Stats
  const { getStats, incrementView, toggleHeart, incrementUsage } = useStats();

  const filteredMemes = useMemo(() => {
    if (aiMode && aiResults) return aiResults;

    let result = memesData;

    if (selectedMember !== '전체') {
      result = result.filter((m) => m.member === selectedMember);
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.member.toLowerCase().includes(q) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [query, selectedMember, aiMode, aiResults]);

  const handleAiSearch = useCallback(async (searchQuery) => {
    setAiLoading(true);
    setAiError('');
    setAiResults(null);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || 'AI 검색에 실패했습니다.');
        return;
      }

      setAiResults(data.results);
    } catch {
      setAiError('네트워크 오류가 발생했습니다.');
    } finally {
      setAiLoading(false);
    }
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleAiModeChange = (mode) => {
    setAiMode(mode);
    setAiResults(null);
    setAiError('');
  };

  const displayMemes = filteredMemes;

  return (
    <>
      {/* Hero Section */}
      <header className="hero">
        <h1 className="hero-title">무도짤</h1>
        <p className="hero-subtitle">없는 게 없는 무한도전 짤 찾기 🔥</p>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          aiMode={aiMode}
          onAiModeChange={handleAiModeChange}
          onAiSearch={handleAiSearch}
          isLoading={aiLoading}
        />
        {!aiMode && (
          <div className="filter-tags">
            {MEMBERS.map((member) => (
              <button
                key={member}
                className={`filter-tag ${selectedMember === member ? 'active' : ''}`}
                onClick={() => setSelectedMember(member)}
              >
                {member}
              </button>
            ))}
          </div>
        )}
        {aiMode && aiResults && (
          <p className="result-info ai-result-info">
            ✨ AI가 <span>{aiResults.length}</span>개의 짤을 추천합니다
          </p>
        )}
        {aiError && (
          <p className="result-info error-info">⚠️ {aiError}</p>
        )}
        {!aiMode && (
          <p className="result-info">
            <span>{displayMemes.length}</span>개의 짤을 찾았습니다
          </p>
        )}
      </header>

      {/* Meme Grid */}
      <main>
        <MemeGrid
          memes={displayMemes}
          onMemeClick={setSelectedMeme}
          getStats={getStats}
          aiMode={aiMode}
        />
      </main>

      {/* Modal */}
      {selectedMeme && (
        <MemeModal
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
          onToast={showToast}
          stats={getStats(selectedMeme.id)}
          onIncrementView={incrementView}
          onToggleHeart={toggleHeart}
          onIncrementUsage={incrementUsage}
        />
      )}

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}
