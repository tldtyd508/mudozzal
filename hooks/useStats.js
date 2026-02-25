'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'mudozzal-stats';

function loadStats() {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveStats(stats) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
        // localStorage full or unavailable
    }
}

export default function useStats() {
    const [stats, setStats] = useState({});

    useEffect(() => {
        setStats(loadStats());
    }, []);

    const getStats = useCallback((id) => {
        const s = stats[id] || {};
        return {
            views: s.views || 0,
            hearts: s.hearts || 0,
            hearted: s.hearted || false,
            usage: s.usage || 0,
        };
    }, [stats]);

    const updateStat = useCallback((id, updater) => {
        setStats((prev) => {
            const current = prev[id] || { views: 0, hearts: 0, hearted: false, usage: 0 };
            const updated = { ...prev, [id]: updater(current) };
            saveStats(updated);
            return updated;
        });
    }, []);

    const incrementView = useCallback((id) => {
        updateStat(id, (s) => ({ ...s, views: s.views + 1 }));
    }, [updateStat]);

    const toggleHeart = useCallback((id) => {
        updateStat(id, (s) => ({
            ...s,
            hearted: !s.hearted,
            hearts: s.hearted ? Math.max(0, s.hearts - 1) : s.hearts + 1,
        }));
    }, [updateStat]);

    const incrementUsage = useCallback((id) => {
        updateStat(id, (s) => ({ ...s, usage: s.usage + 1 }));
    }, [updateStat]);

    return { getStats, incrementView, toggleHeart, incrementUsage };
}
