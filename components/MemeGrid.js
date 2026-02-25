'use client';

export default function MemeGrid({ memes, onMemeClick }) {
    if (memes.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-emoji">🤔</div>
                <p className="empty-state-text">검색 결과가 없습니다... 다른 키워드로 시도해보세요!</p>
            </div>
        );
    }

    return (
        <div className="meme-grid">
            {memes.map((meme) => (
                <div
                    key={meme.id}
                    className="meme-card"
                    onClick={() => onMemeClick(meme)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onMemeClick(meme)}
                >
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
                        <div className="meme-card-meta">
                            <span className="meme-card-member">{meme.member}</span>
                            <span>{meme.episode}</span>
                        </div>
                        <div className="meme-card-tags">
                            {meme.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="meme-card-tag">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
