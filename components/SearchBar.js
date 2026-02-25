'use client';

export default function SearchBar({ query, onQueryChange }) {
  return (
    <div className="search-wrapper">
      <input
        id="search-input"
        type="text"
        className="search-input"
        placeholder="짤 키워드를 입력하세요 (예: 무야호, 박명수, 화남)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        autoComplete="off"
      />
      <span className="search-icon">🔍</span>
    </div>
  );
}
