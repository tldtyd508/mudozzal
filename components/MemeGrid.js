'use client';

export default function MemeGrid({ memes, onMemeClick, getStats, aiMode }) {
    if (memes.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-emoji">🤔</div>
                <p className="empty-state-text">
                    {aiMode
                        ? 'AI가 추천할 짤을 찾지 못했어요... 다시 시도해보세요!'
                        : '검색 결과가 없습니다... 다른 키워드로 시도해보세요!'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="meme-grid">
            {memes.map((meme) => {
                const stats = getStats ? getStats(meme.id) : { views: 0, hearts: 0, usage: 0 };
                return (
                    <div
                        key={meme.id}
                        className={`meme-card ${meme.reason ? 'ai-recommended' : ''}`}
                        onClick={() => onMemeClick(meme)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && onMemeClick(meme)}
                    >
                        {meme.reason && (
                            <div className="ai-reason-badge">
                                <span>✨ AI 추천</span>
                            </div>
                        )}
                        <div className="meme-card-image">
                            <img
                                src={meme.imageUrl}
                                alt={meme.title}
                                loading="lazy"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;background:#1a1a25;">😂</div>`;
                                }}
                            />
                        </div>
                        <div className="meme-card-body">
                            <h3 className="meme-card-title">{meme.title}</h3>
                            {meme.reason && (
                                <p className="meme-card-reason">{meme.reason}</p>
                            )}
                            <div className="meme-card-meta">
                                <span className="meme-card-member">{meme.member}</span>
                                <span>{meme.episode}</span>
                            </div>
                            <div className="meme-card-footer">
                                <div className="meme-card-tags">
                                    {meme.tags.slice(0, 3).map((tag) => (
                                        <span key={tag} className="meme-card-tag">#{tag}</span>
                                    ))}
                                </div>
                                <div className="meme-card-stats">
                                    {stats.hearts > 0 && <span className="stat-badge">❤️ {stats.hearts}</span>}
                                    {stats.views > 0 && <span className="stat-badge">👀 {stats.views}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
