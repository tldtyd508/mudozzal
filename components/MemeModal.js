'use client';

import { useEffect, useCallback } from 'react';

export default function MemeModal({ meme, onClose, onToast }) {
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [handleKeyDown]);

    if (!meme) return null;

    const handleDownload = async () => {
        try {
            const res = await fetch(meme.imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mudozzal-${meme.id}.webp`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            onToast('다운로드 완료! 📥');
        } catch {
            onToast('다운로드에 실패했습니다 😢');
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}?meme=${meme.id}`;
        navigator.clipboard.writeText(url).then(() => {
            onToast('링크가 복사되었습니다! 🔗');
        }).catch(() => {
            onToast('복사에 실패했습니다 😢');
        });
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-image">
                    <button className="modal-close" onClick={onClose}>✕</button>
                    <img
                        src={meme.imageUrl}
                        alt={meme.title}
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML += `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:5rem;background:#111;">😂</div>`;
                        }}
                    />
                </div>
                <div className="modal-body">
                    <h2 className="modal-title">{meme.title}</h2>
                    <p className="modal-description">{meme.description}</p>
                    <div className="modal-info-row">
                        <span className="modal-member-badge">{meme.member}</span>
                        <span className="modal-episode">📺 {meme.episode}</span>
                    </div>
                    <div className="modal-tags">
                        {meme.tags.map((tag) => (
                            <span key={tag} className="modal-tag">#{tag}</span>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button className="modal-btn modal-btn-primary" onClick={handleDownload}>
                            📥 다운로드
                        </button>
                        <button className="modal-btn modal-btn-secondary" onClick={handleCopyLink}>
                            🔗 링크 복사
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
