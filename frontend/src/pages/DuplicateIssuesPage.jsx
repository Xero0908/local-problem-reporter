import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function DuplicateIssuesPage() {
    const [duplicateGroups, setDuplicateGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedIssues, setSelectedIssues] = useState(new Set());
    const token = localStorage.getItem('authToken');
    const userId = localStorage.getItem('userId');

    useEffect(() => {
        fetchDuplicateIssues();
    }, []);

    const stringifyError = (err) => {
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (Array.isArray(detail)) return detail.map(item => item?.msg || item?.message || JSON.stringify(item)).join('; ');
        if (detail && typeof detail === 'object') return JSON.stringify(detail);
        return err.response?.data?.message || err.message || 'Error loading duplicate issues';
    };

    const fetchDuplicateIssues = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/issues/duplicates', {
                params: { token }
            });
            setDuplicateGroups(response.data.duplicate_groups || []);
            setError('');
        } catch (err) {
            setError(stringifyError(err));
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (issueId) => {
        const newSelected = new Set(selectedIssues);
        if (newSelected.has(issueId)) {
            newSelected.delete(issueId);
        } else {
            newSelected.add(issueId);
        }
        setSelectedIssues(newSelected);
    };

    const handleConfirmDuplicates = async (groupId, selectedIssueIds, allGroupIssueIds) => {
        const idsToDelete = selectedIssueIds.length > 0
            ? selectedIssueIds
            : allGroupIssueIds.slice(1);

        const confirmMsg = `This will delete ${idsToDelete.length} duplicate report(s) and keep the main report. Continue?`;
        if (!window.confirm(confirmMsg)) {
            return;
        }

        try {
            const response = await api.post('/api/issues/confirm-duplicates', {
                duplicate_group_id: groupId,
                issue_ids_to_delete: idsToDelete
            }, {
                params: { token, user_id: userId }
            });

            alert(response.data.message || 'Duplicates deleted successfully!');
            fetchDuplicateIssues(); // Refresh the list
            setSelectedIssues(new Set());
        } catch (err) {
            setError(stringifyError(err));
        }
    };

    const handleDeleteGroup = async (groupId, issueIds) => {
        if (!window.confirm(`Delete all ${issueIds.length} issues in this group?`)) {
            return;
        }

        try {
            const response = await api.post('/api/issues/confirm-duplicates', {
                duplicate_group_id: groupId,
                issue_ids_to_delete: Array.from(issueIds)
            }, {
                params: { token, user_id: userId }
            });

            alert(response.data.message || 'Group deleted successfully!');
            fetchDuplicateIssues();
            setSelectedIssues(new Set());
        } catch (err) {
            setError(stringifyError(err));
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div className="spinner"></div>
                <p>Loading duplicate issues...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ marginBottom: '1rem' }}>🔄 Duplicate Issues Management</h1>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
                Review and manage duplicate reports that have been detected by the AI system
            </p>

            {error && (
                <div style={{
                    background: '#fee',
                    border: '1px solid #fcc',
                    color: '#c33',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '2rem'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {duplicateGroups.length === 0 ? (
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    color: '#999'
                }}>
                    <p style={{ fontSize: '1.1rem' }}>✅ No duplicate issues detected!</p>
                    <p>All reports appear to be unique.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '2rem' }}>
                    {duplicateGroups.map((group, index) => (
                        <div key={index} style={{
                            background: 'white',
                            border: '2px solid #ffc107',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                                color: 'white',
                                padding: '1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h2 style={{ margin: '0 0 0.5rem 0' }}>Group {index + 1} - {group.issues.length} Reports</h2>
                                    <p style={{ margin: 0, opacity: 0.9 }}>ID: {group.duplicate_group_id}</p>
                                </div>
                                <button
                                    onClick={() => handleDeleteGroup(group.duplicate_group_id, new Set(group.issues.map(i => i.id)))}
                                    style={{
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Delete All
                                </button>
                            </div>

                            <div style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
                                {group.issues.map((issue) => (
                                    <div key={issue.id} style={{
                                        background: '#f9f9f9',
                                        border: selectedIssues.has(issue.id) ? '2px solid #667eea' : '1px solid #ddd',
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        gap: '1rem',
                                        alignItems: 'flex-start',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                        onClick={() => toggleSelection(issue.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedIssues.has(issue.id)}
                                            onChange={() => toggleSelection(issue.id)}
                                            style={{ marginTop: '0.25rem', cursor: 'pointer', width: '20px', height: '20px' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>{issue.title}</h4>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                📍 Location: {issue.location_description}
                                            </p>
                                            <p style={{ margin: '0 0 0.5rem 0', color: '#666', fontSize: '0.9rem' }}>
                                                Type: <strong>{issue.issue_type}</strong> | Priority: <strong>{issue.priority_level}</strong>
                                            </p>
                                            <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>
                                                Reported: {new Date(issue.created_at).toLocaleString()}
                                            </p>
                                            <p style={{ margin: '0.5rem 0 0 0', color: '#999', fontSize: '0.85rem' }}>
                                                ID: {issue.id} | Score: {issue.priority_score.toFixed(1)}/100 | Upvotes: {issue.upvotes}
                                            </p>
                                        </div>
                                        {issue.image_path && (
                                            <img
                                                src={issue.image_path}
                                                alt="issue"
                                                style={{
                                                    width: '120px',
                                                    height: '100px',
                                                    objectFit: 'cover',
                                                    borderRadius: '6px'
                                                }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div style={{
                                background: '#f9f9f9',
                                padding: '1rem',
                                borderTop: '1px solid #ddd',
                                display: 'flex',
                                gap: '1rem',
                                justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => handleConfirmDuplicates(
                                        group.duplicate_group_id,
                                        Array.from(selectedIssues),
                                        group.issues.map(i => i.id)
                                    )}
                                    style={{
                                        background: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✓ Confirm & Delete {selectedIssues.size > 0 ? selectedIssues.size - 1 : group.issues.length - 1} Duplicate(s)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default DuplicateIssuesPage;
