'use client';

import { useState, useMemo } from 'react';
import SearchBar from '@/components/SearchBar';
import MemeGrid from '@/components/MemeGrid';
import MemeModal from '@/components/MemeModal';
import memesData from '@/data/memes.json';

const MEMBERS = ['전체', ...new Set(memesData.map((m) => m.member))];

export default function Home() {
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState('전체');
  const [selectedMeme, setSelectedMeme] = useState(null);
  const [toast, setToast] = useState('');

  const filteredMemes = useMemo(() => {
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
  }, [query, selectedMember]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <>
      {/* Hero Section */}
      <header className="hero">
        <h1 className="hero-title">무도짤</h1>
        <p className="hero-subtitle">없는 게 없는 무한도전 짤 찾기 🔥</p>
        <SearchBar query={query} onQueryChange={setQuery} />
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
        <p className="result-info">
          <span>{filteredMemes.length}</span>개의 짤을 찾았습니다
        </p>
      </header>

      {/* Meme Grid */}
      <main>
        <MemeGrid memes={filteredMemes} onMemeClick={setSelectedMeme} />
      </main>

      {/* Modal */}
      {selectedMeme && (
        <MemeModal
          meme={selectedMeme}
          onClose={() => setSelectedMeme(null)}
          onToast={showToast}
        />
      )}

      {/* Toast */}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </>
  );
}
