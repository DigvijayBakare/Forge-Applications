import React, { useEffect, useState, useCallback } from 'react';
import { invoke } from '@forge/bridge';

export default function UserIssuesPage() {
    const [issues, setIssues] = useState([]);
    const [days, setDays] = useState(0);
    const [loading, setLoading] = useState(false);
    const [pageIdx, setPageIdx] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [debugInfo, setDebugInfo] = useState('');
    const pageSize = 50;

    const fetchPage = useCallback(async (page) => {
        console.log('fetchPage called, page:', page, 'days:', days);
        setLoading(true);
        try {
            const startAt = page * pageSize;
            console.log('Invoking fetchAssignedIssues with:', { startAt, maxResults: pageSize });

            const res = await invoke('fetchAssignedIssues', { startAt, maxResults: pageSize });
            console.log('Response from resolver:', res);

            // setDebugInfo(`API returned: ${res?.total || 0} total issues, received ${res?.issues?.length || 0} issues`);

            const list = Array.isArray(res?.issues) ? res.issues : [];
            console.log('Issues list:', list);

            // Client-side filter: not updated within last N days
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - Number(days || 0));
            console.log('Filter cutoff date:', cutoff, 'days:', days);

            const filtered = list.filter(i => {
                const updated = i.updated ? new Date(i.updated) : null;
                // If days is 0, show all issues
                if (Number(days) === 0) {
                    console.log('Days is 0, showing issue:', i.key);
                    return true;
                }
                const shouldShow = updated ? updated < cutoff : true;
                console.log('Issue', i.key, 'updated:', updated, 'shouldShow:', shouldShow);
                return shouldShow;
            });

            console.log('Filtered issues:', filtered.length, filtered);

            // Update state
            setIssues(prev => {
                const newList = page === 0 ? filtered : [...prev, ...filtered];
                console.log('Setting issues state to:', newList);
                return newList;
            });

            const total = res?.total ?? 0;
            const fetchedSoFar = (page + 1) * pageSize;
            setHasMore(fetchedSoFar < total);
            console.log('Has more:', fetchedSoFar < total, 'fetched:', fetchedSoFar, 'total:', total);
        } catch (error) {
            console.error('Error in fetchPage:', error);
            setDebugInfo(`Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [days]);

    useEffect(() => {
        console.log('useEffect triggered, days changed to:', days);
        // Reset when days changes
        setIssues([]);
        setPageIdx(0);
        fetchPage(0);
    }, [days, fetchPage]);

    const loadMore = async () => {
        const next = pageIdx + 1;
        setPageIdx(next);
        await fetchPage(next);
    };

    console.log('Render - issues.length:', issues.length, 'loading:', loading);

    return (
        <div style={{
            padding: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 24, fontWeight: 600 }}>My Assigned Issues</h2>

            <div style={{
                marginBottom: 20,
                padding: '12px 16px',
                background: '#F4F5F7',
                borderRadius: 4,
                display: 'inline-block'
            }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                    Show issues not updated in the last N days.
                    <input
                        type="number"
                        min="0"
                        value={days}
                        onChange={(e) => setDays(e.target.value)}
                        style={{
                            width: 80,
                            padding: '6px 8px',
                            border: '2px solid #DFE1E6',
                            borderRadius: 3,
                            fontSize: 14,
                            textAlign: 'center'
                        }}
                    />
                </label>
            </div>

            {loading && issues.length === 0 && (
                <div style={{ marginTop: 16, color: '#6B778C' }}>Loading...</div>
            )}

            {!loading && issues.length === 0 && (
                <div style={{
                    marginTop: 16,
                    padding: '16px',
                    background: '#F4F5F7',
                    borderRadius: 4,
                    color: '#6B778C'
                }}>
                    No issues match the filter.
                </div>
            )}

            {issues.length > 0 && (
                <div style={{
                    background: '#fff',
                    border: '1px solid #DFE1E6',
                    borderRadius: 4,
                    overflow: 'hidden'
                }}>
                    {issues.map((issue, idx) => (
                        <div
                            key={issue.key}
                            style={{
                                padding: '12px 16px',
                                borderBottom: idx < issues.length - 1 ? '1px solid #EBECF0' : 'none',
                                fontSize: 14
                            }}
                        >
                            <strong style={{ color: '#0052CC' }}>{issue.key}</strong>: {issue.summary || '(no summary)'}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 16 }}>
                {hasMore && issues.length > 0 && (
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        style={{
                            padding: '8px 16px',
                            background: loading ? '#A5ADBA' : '#0052CC',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: 14,
                            fontWeight: 500
                        }}
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </button>
                )}
                {!hasMore && issues.length > 0 && (
                    <div style={{ color: '#6B778C', fontSize: 14 }}>No more issues</div>
                )}
            </div>
        </div>
    );
}

