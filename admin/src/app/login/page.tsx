'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('@ravi1921#');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error?.message || 'Invalid admin credentials');
      }
    } catch (err: any) {
      setError('Connection failed. Please ensure backend server is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 0%, #1e1b4b 0%, #0f172a 70%)',
      padding: '1.5rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(30, 41, 59, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '2.5rem',
        backdropFilter: 'blur(20px)',
        boxShadow: 'var(--shadow-lg)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 8px 20px rgba(59, 130, 246, 0.35)',
          }}>
            <Store size={28} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc' }}>Ravi Vision Admin</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginTop: '0.35rem' }}>Standalone Operations Portal Sign In</p>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
              Username
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="admin"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="@ravi1921#"
                style={{
                  width: '100%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.75rem 1rem 0.75rem 2.75rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Dashboard <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Credentials Info Helper */}
        <div style={{
          marginTop: '1.75rem',
          padding: '0.85rem 1rem',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid var(--border-color)',
          fontSize: '0.8rem',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <ShieldCheck size={18} color="#34d399" />
          <div>
            Authorized Access Only<br />
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Username: admin</span> | <span style={{ color: '#34d399', fontWeight: 600 }}>Password: @ravi1921#</span>
          </div>
        </div>
      </div>
    </div>
  );
}
