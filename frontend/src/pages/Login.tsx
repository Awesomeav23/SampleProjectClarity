import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import toast from 'react-hot-toast';

const MOCK_USERS = [
  { email: 'sharath@dynpro.com', label: 'Sharath (Finance Head)' },
  { email: 'sharad@dynpro.com', label: 'Sharad (Project Manager)' },
  { email: 'madhup@dynpro.com', label: 'Madhup (Finance/Ops)' },
  { email: 'aishwarya@dynpro.com', label: 'Aishwarya (Finance/Ops)' },
  { email: 'shiv@dynpro.com', label: 'Shiv (Executive)' },
  { email: 'ash@dynpro.com', label: 'Ash (Back Office)' },
  { email: 'romy.sharma@dynpro.com', label: 'Romy Sharma (Employee)' },
  { email: 'admin@dynpro.com', label: 'System Admin' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await login(email);
      navigate('/');
      toast.success('Signed in successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Project Clarity</h1>
            <p className="text-sm text-gray-500 mt-1">DynPro Operations Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@dynpro.com"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Any password (mock mode)"
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">Password is ignored in mock mode</p>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick login shortcuts for dev */}
          <div className="mt-6 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-3 text-center">Quick login (dev mode)</p>
            <div className="grid grid-cols-2 gap-2">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => setEmail(u.email)}
                  className="text-xs text-left px-2 py-1.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 truncate"
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
