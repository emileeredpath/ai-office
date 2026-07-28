import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function LoginGate({ children }: { children: React.ReactNode }) {
  const { status, login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-text-secondary text-sm">Loading AI Office…</p>
      </div>
    );
  }

  if (status === 'signed-in') {
    return <>{children}</>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await login(password);
    setSubmitting(false);
    if (!result.success) {
      setError(result.message || 'Incorrect password.');
      return;
    }
    setPassword('');
  };

  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm">
        <h1 className="text-xl font-bold text-text-primary mb-1">AI Office</h1>
        <p className="text-xs text-text-secondary mb-6">Enter the shared team password to continue.</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input mb-3"
          placeholder="Password"
        />
        {error && <p className="text-sm text-danger mb-3">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={submitting || !password}>
          {submitting ? 'Checking…' : 'Continue'}
        </button>
      </form>
    </div>
  );
}
