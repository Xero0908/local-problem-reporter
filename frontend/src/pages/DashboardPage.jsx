import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { jwtDecode } from 'jwt-decode';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGamification, setShowGamification] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchUserStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/analytics/dashboard');
      setDashboardData(response.data);
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Error loading dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const decoded = jwtDecode(token);
        const userId = decoded.sub;
        const response = await api.get(`/api/issues/user/${userId}/stats`);
        setUserStats(response.data);
      }
    } catch (err) {
      console.log('Could not load user stats:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="alert alert-error">
        <p>{error || 'Error loading dashboard'}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Retry
        </button>
      </div>
    );
  }

  const priorityLabels = Object.keys(dashboardData.priority_distribution || {});
  const priorityValues = Object.values(dashboardData.priority_distribution || {});
  const typeLabels = Object.keys(dashboardData.issue_types || {});
  const typeValues = Object.values(dashboardData.issue_types || {});
  const statusLabels = Object.keys(dashboardData.issues_by_status || {});
  const statusValues = Object.values(dashboardData.issues_by_status || {});

  const recentIssueCountsByDate = (dashboardData.recent_issues || []).reduce((acc, item) => {
    const date = item.created_at?.slice(0, 10);
    if (date) {
      acc[date] = (acc[date] || 0) + 1;
    }
    return acc;
  }, {});
  const recentIssueLabels = Object.keys(recentIssueCountsByDate);
  const recentIssueValues = Object.values(recentIssueCountsByDate);

  const priorityColors = {
    critical: '#e74c3c',
    high: '#e67e22',
    medium: '#f39c12',
    low: '#27ae60'
  };

  const typeColors = [
    '#667eea',
    '#764ba2',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#fee140'
  ];

  const statusColors = {
    reported: '#3498db',
    investigating: '#f39c12',
    resolved: '#27ae60'
  };

  return (
    <div className="dashboard-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>📊 Authority Dashboard</h1>
        <button
          onClick={() => setShowGamification(!showGamification)}
          style={{
            background: userStats ? (showGamification ? '#e74c3c' : '#27ae60') : '#3498db',
            color: 'white',
            border: 'none',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.3s ease',
            transform: showGamification ? 'scale(1.05)' : 'scale(1)',
            position: 'relative'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>🏆</span>
          {showGamification ? 'Hide' : 'Show'} My Civic Impact
          {userStats && !showGamification && (
            <span style={{
              background: '#fff',
              color: '#27ae60',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              position: 'absolute',
              top: '-5px',
              right: '-5px'
            }}>
              {userStats.civic_points}
            </span>
          )}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card critical">
          <h3>Critical Issues</h3>
          <div className="number">{dashboardData.critical_issues}</div>
        </div>
        <div className="stat-card high">
          <h3>High Priority</h3>
          <div className="number">{dashboardData.high_issues}</div>
        </div>
        <div className="stat-card">
          <h3>Medium Priority</h3>
          <div className="number">{dashboardData.medium_issues}</div>
        </div>
        <div className="stat-card">
          <h3>Low Priority</h3>
          <div className="number">{dashboardData.low_issues}</div>
        </div>
        <div className="stat-card resolved">
          <h3>Resolved Issues</h3>
          <div className="number">{dashboardData.resolved_issues}</div>
        </div>
        <div className="stat-card">
          <h3>Pending Issues</h3>
          <div className="number">{dashboardData.pending_issues}</div>
        </div>
        <div className="stat-card">
          <h3>Total Issues</h3>
          <div className="number">{dashboardData.total_issues}</div>
        </div>
        <div className="stat-card">
          <h3>Resolution Rate</h3>
          <div className="number">
            {dashboardData.total_issues > 0
              ? ((dashboardData.resolved_issues / dashboardData.total_issues) * 100).toFixed(1)
              : 0}%
          </div>
        </div>
      </div>

      {userStats && showGamification && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>🏆 Your Civic Impact</h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userStats.civic_points}
              </div>
              <div style={{ fontSize: '1.1rem' }}>Civic Points</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {(userStats.reputation_score * 100).toFixed(0)}%
              </div>
              <div style={{ fontSize: '1.1rem' }}>Reputation Score</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userStats.valid_reports}
              </div>
              <div style={{ fontSize: '1.1rem' }}>Valid Reports</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '1.5rem',
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {userStats.accuracy_rate.toFixed(0)}%
              </div>
              <div style={{ fontSize: '1.1rem' }}>Accuracy Rate</div>
            </div>
          </div>

          {userStats.badges && userStats.badges.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: '#555' }}>🏅 Earned Badges</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {userStats.badges.map((badge, index) => (
                  <div key={index} style={{
                    background: '#f8f9fa',
                    padding: '0.75rem 1rem',
                    borderRadius: '20px',
                    border: '2px solid #667eea',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    color: '#667eea'
                  }}>
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#27ae60' }}>
                {userStats.total_reports}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Reports</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e74c3c' }}>
                {userStats.fake_reports}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Fake Reports</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f39c12' }}>
                {userStats.upvotes_received}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Upvotes Received</div>
            </div>
          </div>
        </div>
      )}

      {showGamification && !userStats && (
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#333' }}>🏆 Your Civic Impact</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            Loading your gamification stats... Please make sure you're logged in.
          </p>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <p style={{ color: '#999', fontSize: '0.9rem' }}>
              If stats don't load, try refreshing the page or logging in again.
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        <div className="chart-container">
          <h3>Issues by Priority Level</h3>
          <Pie
            data={{
              labels: priorityLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
              datasets: [{
                data: priorityValues,
                backgroundColor: priorityLabels.map(label => priorityColors[label] || '#95a5a6'),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.parsed}%`
                  }
                }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Issues by Type</h3>
          <Bar
            data={{
              labels: typeLabels.map(l => l.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())),
              datasets: [{
                label: 'Count',
                data: typeValues,
                backgroundColor: typeColors.slice(0, typeLabels.length),
                borderRadius: 4
              }]
            }}
            options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              },
              plugins: {
                legend: { display: false }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Issues by Status</h3>
          <Pie
            data={{
              labels: statusLabels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
              datasets: [{
                data: statusValues,
                backgroundColor: statusLabels.map(label => statusColors[label] || '#95a5a6'),
                borderWidth: 2,
                borderColor: '#fff'
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'bottom' },
                tooltip: {
                  callbacks: {
                    label: (context) => `${context.label}: ${context.parsed}%`
                  }
                }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h3>Issue Trends (Recent Reports)</h3>
          <Line
            data={{
              labels: recentIssueLabels,
              datasets: [{
                label: 'Recent Reports',
                data: recentIssueValues,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
              }]
            }}
            options={{
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              }
            }}
          />
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button
          onClick={fetchDashboardData}
          className="btn btn-primary"
        >
          🔄 Refresh Dashboard
        </button>
        <a
          href="/api/analytics/export/csv"
          className="btn btn-secondary"
          download
        >
          📥 Export as CSV
        </a>
      </div>
    </div>
  );
}

export default DashboardPage;
