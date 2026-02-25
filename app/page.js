'use client';

import { useState, useMemo, useCallback } from 'react';
import SearchBar from '@/components/SearchBar';
import MemeGrid from '@/components/MemeGrid';
import MemeModal from '@/components/MemeModal';
import RequestModal from '@/components/RequestModal'; // NEW
import useStats from '@/hooks/useStats';
import memesData from '@/data/memes.json';

const MEMBERS = ['전체', ...new Set(memesData.map((m) => m.member))];

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('전체');
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [toast, setToast] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false); // NEW

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

  // Modal handlers
  const openModal = useCallback((meme) => {
    setSelectedMeme(meme);
    incrementView(meme.id);
  }, [incrementView]);

  const closeModal = useCallback(() => {
    setSelectedMeme(null);
  }, []);

  const handleCopyLink = useCallback((meme) => {
    const url = `${window.location.origin}/meme/${meme.id}`;
    navigator.clipboard.writeText(url);
    showToast('링크가 복사되었습니다!');
    incrementUsage(meme.id);
  }, [incrementUsage]);

  const handleDownload = useCallback((meme) => {
    const link = document.createElement('a');
    link.href = meme.image;
    link.download = `${meme.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('짤이 다운로드되었습니다!');
    incrementUsage(meme.id);
  }, [incrementUsage]);

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
        {aiError && (
          <p className="result-info error-info">⚠️ {aiError}</p>
        )}
      </header>

      {/* Meme Grid */}
      <main className="container">
        {/* Member Filters */}
        {!aiMode && (
          <div className="filters">
            {MEMBERS.map((member) => (
              <button
                key={member}
                className={`filter-btn ${selectedMember === member ? 'active' : ''}`}
                onClick={() => setSelectedMember(member)}
              >
                {member}
              </button>
            ))}
          </div>
        )}

        {/* Results Info */}
        <div className="results-info">
          <p>
            {aiMode && aiResults ? '✨ AI 추천 결과' : `'${selectedMember}' 검색 결과`}
            <span className="count"> ({displayMemes.length}개)</span>
          </p>
        </div>

        {/* Meme Grid */}
        {displayMemes.length > 0 ? (
          <MemeGrid
            memes={displayMemes}
            onMemeClick={openModal}
            getStats={getStats}
            toggleHeart={toggleHeart}
            aiMode={aiMode}
          />
        ) : (
          <div className="empty-state">
            <p>"{query}" 검색 결과가 없습니다. 😢</p>
            {!aiMode && <p className="hint">다른 키워드나 AI 검색을 시도해 보세요.</p>}
            <div className="empty-state-cta">
              <button className="btn-primary" onClick={() => setIsRequestModalOpen(true)}>
                없는 짤 추가 요청하기 📮
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Meme Detail Modal */}
      <MemeModal
        meme={selectedMeme}
        isOpen={!!selectedMeme}
        onClose={closeModal}
        stats={selectedMeme ? getStats(selectedMeme.id) : {}}
        onCopyLink={handleCopyLink}
        onDownload={handleDownload}
        onToggleHeart={() => toggleHeart(selectedMeme.id)}
      />

      {/* Request Meme Modal */}
      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={(success) => {
          setIsRequestModalOpen(false);
          if (success === true) {
            showToast('✅ 제보가 접수되었습니다! 요원들이 금방 추가할게요.');
          }
        }}
      />

      {/* Floating Action Button */}
      <button className="fab" onClick={() => setIsRequestModalOpen(true)} title="짤 추가 제보하기">
        + 제보하기
      </button>

      {/* Toast Notification */}
      <div className={`toast ${toast ? 'show' : ''}`}>
        {toast}
      </div>
    </>
  );
}
