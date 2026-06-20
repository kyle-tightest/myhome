'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '../actions/auth';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const formData = new FormData();
    formData.append('password', password);
    
    const result = await login(formData);
    
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Welcome Back</h1>
        <p style={{ marginBottom: '2rem' }}>Please enter the household password.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ marginBottom: '16px' }}
              required
            />
          </div>
          {error && <p style={{ color: 'var(--danger-color)', marginBottom: '16px' }}>{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}
