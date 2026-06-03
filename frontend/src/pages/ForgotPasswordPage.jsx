import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: enter email, 2: answer security question
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [passwordCopied, setPasswordCopied] = useState(false);

  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/api/auth/security-question', {
        params: { email }
      });

      if (response.data.found) {
        setSecurityQuestion(response.data.question);
        setStep(2);
        setMessage('');
      } else {
        setError('Email not found or security question not set.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error retrieving security question.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!securityAnswer) {
      setError('Please provide your security answer.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', {
        email,
        security_answer: securityAnswer
      });

      if (response.data.success) {
        setTempPassword(response.data.temporary_password);
        setUserName(response.data.user_name);
        setMessage(response.data.message);
        setSecurityAnswer('');
      } else {
        setError(response.data.message || 'Incorrect answer. Please try again.');
        setSecurityAnswer('');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Error during password reset.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(tempPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  };

  const handleReset = () => {
    setStep(1);
    setEmail('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setTempPassword('');
    setMessage('');
    setError('');
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
        maxWidth: '500px',
        width: '100%',
        padding: '2.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#667eea', marginBottom: '0.5rem' }}>🔐 Password Reset</h2>
          <p style={{ color: '#999', fontSize: '0.95rem' }}>
            {step === 1 ? 'Enter your email to retrieve your security question.' : 'Answer your security question to reset your password.'}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: step >= 1 ? '#667eea' : '#ddd',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            1
          </div>
          <div style={{
            width: '40px',
            height: '2px',
            background: step >= 2 ? '#667eea' : '#ddd',
            margin: 'auto 0'
          }} />
          <div style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            background: step >= 2 ? '#667eea' : '#ddd',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            2
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            border: '1px solid #fcc',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {message && !tempPassword && (
          <div style={{
            background: '#effaf1',
            border: '1px solid #c8e6c9',
            color: '#2d6a4f',
            padding: '0.75rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.9rem'
          }}>
            ✅ {message}
          </div>
        )}

        {/* Step 1: Enter Email */}
        {step === 1 && !tempPassword && (
          <form onSubmit={handleFetchQuestion}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Finding your account...' : 'Continue'}
            </button>
          </form>
        )}

        {/* Step 2: Answer Security Question */}
        {step === 2 && !tempPassword && (
          <form onSubmit={handleVerifyAnswer}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                Your Security Question:
              </label>
              <div style={{
                padding: '0.75rem',
                background: '#f0f4ff',
                border: '1px solid #667eea',
                borderRadius: '6px',
                fontSize: '0.95rem',
                color: '#333',
                fontStyle: 'italic'
              }}>
                {securityQuestion}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                Your Answer
              </label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Enter your security answer"
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

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Get Temporary Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                width: '100%',
                padding: '0.625rem',
                marginTop: '0.75rem',
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Back to Email
            </button>
          </form>
        )}

        {/* Step 3: Show Temporary Password */}
        {tempPassword && (
          <div>
            <div style={{
              background: '#f0f4ff',
              border: '2px solid #667eea',
              padding: '1.5rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#333', marginTop: 0, marginBottom: '0.75rem', fontWeight: '500' }}>
                Hi {userName || 'there'}! 👋
              </p>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                Your temporary password is ready:
              </p>
              <div style={{
                background: 'white',
                border: '1px dashed #667eea',
                padding: '1rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#667eea',
                wordBreak: 'break-all'
              }}>
                {tempPassword}
              </div>
              <button
                onClick={copyToClipboard}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: passwordCopied ? '#4caf50' : '#f0f4ff',
                  color: passwordCopied ? 'white' : '#667eea',
                  border: '1px solid ' + (passwordCopied ? '#4caf50' : '#667eea'),
                  borderRadius: '6px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {passwordCopied ? '✓ Copied to clipboard!' : '📋 Copy to Clipboard'}
              </button>
            </div>

            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{ color: '#856404', margin: '0 0 0.75rem 0', fontWeight: '500' }}>
                ℹ️ Next Steps:
              </p>
              <ul style={{ color: '#856404', margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                <li style={{ marginBottom: '0.5rem' }}>Use this temporary password to log in</li>
                <li>After logging in, change your password to something you'll remember</li>
                <li>Never share your password with anyone</li>
              </ul>
            </div>

            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '0.75rem'
              }}
            >
              Go to Login
            </button>

            <button
              onClick={handleReset}
              style={{
                width: '100%',
                padding: '0.625rem',
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '6px',
                fontSize: '0.95rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reset Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
