'use client';

import { useState } from 'react';

export default function SearchBar({ query, onQueryChange, aiMode, onAiModeChange, onAiSearch, isLoading }) {
  const [inputValue, setInputValue] = useState(query);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (!aiMode) {
      onQueryChange(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && aiMode && inputValue.trim()) {
      onAiSearch(inputValue.trim());
    }
  };

  return (
    <div className="search-wrapper">
      <input
        id="search-input"
        type="text"
        className={`search-input ${aiMode ? 'ai-active' : ''}`}
        placeholder={aiMode
          ? '상황을 설명해보세요 (예: 회의 끝나고 퇴근할 때 기분)'
          : '짤 키워드를 입력하세요 (예: 무야호, 박명수, 화남)'
        }
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        disabled={isLoading}
      />
      <span className="search-icon">{aiMode ? '🤖' : '🔍'}</span>
      <button
        className={`ai-toggle ${aiMode ? 'active' : ''}`}
        onClick={() => {
          onAiModeChange(!aiMode);
          if (!aiMode) {
            onQueryChange('');
          } else {
            setInputValue('');
          }
        }}
        title={aiMode ? '일반 검색으로 전환' : 'AI 추천 모드로 전환'}
      >
        {aiMode ? '🔍 일반' : '✨ AI'}
      </button>
      {isLoading && <div className="search-loading"><div className="spinner"></div></div>}
    </div>
  );
}
