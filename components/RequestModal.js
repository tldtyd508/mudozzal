import { useState } from 'react';

export default function RequestModal({ isOpen, onClose }) {
    const [situation, setSituation] = useState('');
    const [member, setMember] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!situation.trim()) return;

        setIsSubmitting(true);

        // Mock Submission (e.g., to Supabase or Email in the future)
        setTimeout(() => {
            setIsSubmitting(false);
            setSituation('');
            setMember('');
            onClose(true); // true indicates a successful submission for a toast message
        }, 800);
    };

    return (
        <div className="modal-overlay" onClick={() => onClose(false)}>
            <div
                className="modal-content request-modal-content"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="request-modal-title"
            >
                <button className="modal-close" onClick={() => onClose(false)} aria-label="닫기">
                    &times;
                </button>

                <div className="request-modal-header">
                    <h2 id="request-modal-title">짤 추가 요청하기 📮</h2>
                    <p>찾으시는 무도 짤이 없나요? 무도짤 요원에게 제보해주세요!</p>
                </div>

                <form onSubmit={handleSubmit} className="request-form">
                    <div className="form-group">
                        <label htmlFor="situation">어떤 상황/대사의 짤인가요? *</label>
                        <textarea
                            id="situation"
                            value={situation}
                            onChange={(e) => setSituation(e.target.value)}
                            placeholder="예: 박명수가 가기 싫다고 떼쓰면서 바닥에 눕는 짤"
                            required
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="member">기억나는 멤버 (선택)</label>
                        <input
                            type="text"
                            id="member"
                            value={member}
                            onChange={(e) => setMember(e.target.value)}
                            placeholder="예: 박명수, 정준하"
                        />
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => onClose(false)}>
                            취소
                        </button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting || !situation.trim()}>
                            {isSubmitting ? '제출 중...' : '제보하기'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
