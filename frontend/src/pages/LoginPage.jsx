import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';


function LoginPage() {
  const navigate = useNavigate();
  const [loginMode, setLoginMode] = useState(true); // true: login, false: register
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    fullName: '',
    security_question: '',
    security_answer: ''
  });
  const [securityNote, setSecurityNote] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value || ''  // Ensure value is always a string
    }));
  };

  const fetchSecurityQuestion = async () => {
    try {
      const response = await api.get('/api/auth/random-security-question');
      setFormData(prev => ({
        ...prev,
        security_question: response.data.question,
        security_answer: ''
      }));
      setSecurityNote('');
    } catch (err) {
      console.error('Error fetching security question:', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      // Store token and user info
      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('userId', response.data.user_id);
      localStorage.setItem('userEmail', response.data.email);
      localStorage.setItem('isAuthority', response.data.is_authority);
      localStorage.setItem('userRole', response.data.is_authority ? 'authority' : 'user');

      // Redirect and reload to update App component
      navigate('/');
      // Give React time to process the navigation before reload
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.username || !formData.fullName || !formData.security_answer) {
      setError('Please fill in all fields including security answer');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.security_answer.trim().length === 0) {
      setError('Please provide an answer to the security question');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/api/auth/register', {
        email: formData.email,
        username: formData.username,
        full_name: formData.fullName,
        password: formData.password,
        security_question: formData.security_question,
        security_answer: formData.security_answer
      });

      // Store token and user info
      localStorage.setItem('authToken', response.data.access_token);
      localStorage.setItem('userId', response.data.user_id);
      localStorage.setItem('userEmail', response.data.email);
      localStorage.setItem('isAuthority', response.data.is_authority);
      localStorage.setItem('userRole', response.data.is_authority ? 'authority' : 'user');

      // Redirect and reload to update App component
      navigate('/');
      setTimeout(() => window.location.reload(), 100);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>🚨</h1>
          <h2 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Local Problem Reporter</h2>
          <p style={{ color: '#999', fontSize: '0.9rem' }}>
            {loginMode ? 'Login to your account' : 'Create a new account'}
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={loginMode ? handleLogin : handleRegister}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {!loginMode && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Your full name"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ color: '#333', fontWeight: '500' }}>
                    Security Question
                  </label>
                  <button
                    type="button"
                    onClick={fetchSecurityQuestion}
                    style={{
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Get Question
                  </button>
                </div>
                <div style={{
                  padding: '0.75rem',
                  background: '#f0f4ff',
                  border: '1px solid #667eea',
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  color: '#333',
                  minHeight: '2.5rem',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {formData.security_question || 'Click "Get Question" to load a security question'}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Security Answer (1 word)
                </label>
                <input
                  type="text"
                  name="security_answer"
                  value={formData.security_answer || ''}
                  onChange={(e) => {
                    const value = e.target.value || '';
                    handleInputChange(e);
                    setSecurityNote(value ? `📝 Remember: "${value}"` : '');
                  }}
                  placeholder="Your answer (keep it simple, 1 word)"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                {securityNote && (
                  <div style={{
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#fff3cd',
                    border: '1px solid #ffc107',
                    color: '#856404',
                    borderRadius: '4px',
                    fontSize: '0.9rem'
                  }}>
                    {securityNote}
                  </div>
                )}
              </div>
            </>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={loginMode ? 'Your password' : 'At least 6 characters'}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
            {loginMode && (
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    padding: '0'
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.875rem',
              background: loginMode ? '#667eea' : '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.2s'
            }}
          >
            {loading ? '⏳ Processing...' : (loginMode ? '🔓 Login' : '✓ Create Account')}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          paddingTop: '1.5rem'
        }}>
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            {loginMode ? "Don't have an account?" : 'Already have an account?'}
          </p>
          <button
            onClick={() => {
              setLoginMode(!loginMode);
              setError('');
              setFormData({ email: '', password: '', username: '', fullName: '' });
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            {loginMode ? 'Create account' : 'Login instead'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
