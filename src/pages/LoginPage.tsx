import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AUTHORIZED_ADMIN_EMAILS } from '../firebase/config';
import {
  Shield,
  UserCheck,
  Lock,
  Mail,
  KeyRound,
  User,
  AlertOctagon,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
  Building,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const {
    loginGovernmentGoogle,
    loginCitizenEmail,
    registerCitizenEmail,
    loginCitizenGoogle,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial role from URL query param or state
  const queryParams = new URLSearchParams(location.search);
  const initialRoleParam = queryParams.get('role');

  const [activeRole, setActiveRole] = useState<'citizen' | 'government'>(
    initialRoleParam === 'government' || location.pathname === '/gov/login'
      ? 'government'
      : 'citizen'
  );

  // Citizen mode: signin vs register
  const [citizenMode, setCitizenMode] = useState<'signin' | 'register'>('signin');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [govId, setGovId] = useState('');

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  useEffect(() => {
    if (initialRoleParam === 'government') {
      setActiveRole('government');
    } else if (initialRoleParam === 'citizen') {
      setActiveRole('citizen');
    }
  }, [initialRoleParam]);

  // Clear errors when switching roles or tabs
  const handleRoleChange = (role: 'citizen' | 'government') => {
    setActiveRole(role);
    setErrorMessage(null);
  };

  // Government Google Sign-In
  const handleGovGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginGovernmentGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Gov login error:', err);
      setErrorMessage(
        err.message || 'Access denied. You are not authorized to access this system.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Citizen Submit (Sign In or Register)
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (citizenMode === 'signin') {
        await loginCitizenEmail(email, password);
      } else {
        if (!govId.trim()) {
          throw new Error('Valid Government ID is mandatory for land registration privileges.');
        }
        await registerCitizenEmail(email, password, displayName, govId);
      }
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Citizen Google Sign-In
  const handleCitizenGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      await loginCitizenGoogle(govId || undefined);
      navigate('/citizen/dashboard');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        {/* Emblem */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 p-0.5 shadow-xl shadow-blue-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Land Registry Authentication Portal
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400 max-w-sm mx-auto">
          Secure, verified sign-in for Citizens, Property Owners, and Government Authorities
        </p>

        {/* Portal Role Selector Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 p-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleRoleChange('citizen')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
              activeRole === 'citizen'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Citizen Portal</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleChange('government')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold transition ${
              activeRole === 'government'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-300" />
            <span>Government Official</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl relative">
          {/* ============================================================== */}
          {/* SECTION A: CITIZEN AUTHENTICATION */}
          {/* ============================================================== */}
          {activeRole === 'citizen' && (
            <div>
              {/* Tab Selector: Sign In vs Register */}
              <div className="flex rounded-lg bg-slate-950 p-1 mb-6 border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                    citizenMode === 'signin'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCitizenMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition ${
                    citizenMode === 'register'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Register Citizen Account
                </button>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="mb-5 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCitizenSubmit} className="space-y-4">
                {citizenMode === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Legal Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rajesh Kumar Sharma"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="email"
                      required
                      placeholder="citizen@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {citizenMode === 'register' && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-slate-300">
                        Government Identification ID (SSN / Aadhaar / National ID) *
                      </label>
                      <span className="text-[10px] text-amber-400 font-mono">
                        SHA-256 Protected
                      </span>
                    </div>
                    <div className="relative">
                      <Shield className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 5432-8765-4321"
                        value={govId}
                        onChange={(e) => setGovId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Privacy notice: Plaintext ID is normalized and encrypted via SHA-256 before storage.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50"
                >
                  {loading
                    ? 'Processing...'
                    : citizenMode === 'signin'
                    ? 'Sign In to Citizen Dashboard'
                    : 'Complete Citizen Registration'}
                </button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center">
                <div className="flex-1 border-t border-slate-800" />
                <span className="px-3 text-[11px] text-slate-500 uppercase tracking-wider">or</span>
                <div className="flex-1 border-t border-slate-800" />
              </div>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleCitizenGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow-sm transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* SECTION B: GOVERNMENT OFFICIAL AUTHENTICATION */}
          {/* ============================================================== */}
          {activeRole === 'government' && (
            <div>
              {/* Official badge notice */}
              <div className="mb-6 p-3.5 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white">Government Official Access Only</span>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    Access is restricted to authorized Government Land Registrars. Sign-in requires an official Google account present on the authorized administrator whitelist.
                  </p>
                </div>
              </div>

              {/* Error Message Box (Access Denied) */}
              {errorMessage && (
                <div className="mb-6 p-4 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
                  <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold text-rose-100 mb-1">
                      Access Authorization Failed
                    </strong>
                    <p className="leading-relaxed">{errorMessage}</p>
                    {errorMessage.includes('Access denied') && (
                      <p className="mt-2 text-[11px] text-rose-300/80">
                        Your authenticated Google email does not match any entry in the authorized administrator whitelist.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Google Sign In Button */}
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGovGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow-md transition disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>
                    {loading ? 'Authenticating Official...' : 'Sign In with Official Google Account'}
                  </span>
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowConfigHelp(!showConfigHelp)}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>View Whitelisted Government Emails</span>
                  </button>
                </div>
              </div>

              {/* Admin Email Whitelist Info Dropdown */}
              {showConfigHelp && (
                <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Authorized Administrator Whitelist:</span>
                  </h4>
                  <ul className="space-y-1 font-mono text-[11px] text-amber-300 mb-3">
                    {AUTHORIZED_ADMIN_EMAILS.map((adminEmail) => (
                      <li
                        key={adminEmail}
                        className="bg-slate-900 px-2 py-1 rounded border border-slate-800"
                      >
                        • {adminEmail}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    To authorize additional officials, update the{' '}
                    <code className="text-amber-400">REACT_APP_ADMIN_EMAILS</code> or{' '}
                    <code className="text-amber-400">VITE_ADMIN_EMAILS</code> variable in your{' '}
                    <code className="text-blue-400">.env</code> file.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer Back Link */}
          <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>

            <span className="text-[11px] text-slate-500 font-mono">
              EVM-1337 • Ganache Localhost
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
