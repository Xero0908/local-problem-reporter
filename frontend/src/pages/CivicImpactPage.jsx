import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';

function CivicImpactPage() {
    const [userStats, setUserStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            if (token) {
                const decoded = jwtDecode(token);
                const userId = decoded.sub;
                const response = await api.get(`/api/issues/user/${userId}/stats`);
                setUserStats(response.data);
                setError('');
            } else {
                setError('Please log in to view your civic impact');
            }
        } catch (err) {
            const errorMessage = err.response?.data?.detail || 'Error loading your civic impact data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="civic-impact-page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Loading your civic impact...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="civic-impact-page">
                <div className="alert alert-error">
                    <p>{error}</p>
                    <button onClick={fetchUserStats} className="btn btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!userStats) {
        return (
            <div className="civic-impact-page">
                <div className="alert alert-info">
                    <p>No civic impact data available yet. Start reporting issues to earn points!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="civic-impact-page">
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>🏆 My Civic Impact</h1>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                    Your contribution to making our community better
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                marginBottom: '3rem'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        {userStats.civic_points}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Civic Points</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Earned through community service
                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        {(userStats.reputation_score * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Reputation Score</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Based on report accuracy and community trust
                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        {userStats.valid_reports}
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Valid Reports</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Issues successfully verified and addressed
                    </div>
                </div>

                <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '50%'
                    }}></div>
                    <div style={{ fontSize: '4rem', fontWeight: 'bold', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
                        {userStats.accuracy_rate.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem' }}>Accuracy Rate</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                        Percentage of accurate reports submitted
                    </div>
                </div>
            </div>

            {userStats.badges && userStats.badges.length > 0 && (
                <div style={{
                    background: 'white',
                    padding: '2rem',
                    borderRadius: '16px',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#333', textAlign: 'center' }}>🏅 Achievement Badges</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {userStats.badges.map((badge, index) => (
                            <div key={index} style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                textAlign: 'center',
                                color: 'white',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '-15px',
                                    right: '-15px',
                                    width: '50px',
                                    height: '50px',
                                    background: 'rgba(255,255,255,0.2)',
                                    borderRadius: '50%'
                                }}></div>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    {badge}
                                </div>
                                <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                    Achievement unlocked!
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ marginBottom: '1.5rem', color: '#333', textAlign: 'center' }}>📊 Your Reporting Activity</h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '1.5rem'
                }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #28a745'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                            {userStats.total_reports}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666' }}>Total Reports</div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #17a2b8'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#17a2b8', marginBottom: '0.5rem' }}>
                            {userStats.valid_reports}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666' }}>Verified Reports</div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #ffc107'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ffc107', marginBottom: '0.5rem' }}>
                            {userStats.upvotes_received}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666' }}>Community Upvotes</div>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '1.5rem',
                        background: '#f8f9fa',
                        borderRadius: '12px',
                        border: '2px solid #dc3545'
                    }}>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc3545', marginBottom: '0.5rem' }}>
                            {userStats.fake_reports}
                        </div>
                        <div style={{ fontSize: '1rem', color: '#666' }}>Inaccurate Reports</div>
                    </div>
                </div>

                <div style={{
                    marginTop: '2rem',
                    padding: '1.5rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '1rem' }}>Keep Making a Difference! 🌟</h3>
                    <p style={{ marginBottom: '0', opacity: 0.9 }}>
                        Every report you submit helps improve our community. Continue contributing to earn more points and unlock new badges!
                    </p>
                </div>
            </div>
        </div>
    );
}

export default CivicImpactPage;