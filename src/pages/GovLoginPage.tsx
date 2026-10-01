import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AUTHORIZED_ADMIN_EMAILS, isFirebaseConfigured } from '../firebase/config';
import { Shield, Lock, AlertOctagon, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const GovLoginPage: React.FC = () => {
  const { loginGovernmentGoogle } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      await loginGovernmentGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Gov login error:', err);
      setErrorMessage(err.message || 'Access denied. You are not authorized to access this system.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-700 to-yellow-500 p-0.5 shadow-xl shadow-amber-950/50 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
          </div>
        </div>

        <h2 className="text-center text-2xl font-extrabold text-white tracking-tight">
          Government Official Portal
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400">
          Land Records & Survey Settlement Directorate
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl relative">
          {/* Official badge */}
          <div className="mb-6 p-3 rounded-lg bg-amber-950/30 border border-amber-800/50 text-xs text-amber-300 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Restricted Access Authorization</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Authentication requires an authorized Google Workspace / Government administrator email.
              </p>
            </div>
          </div>

          {/* Error Message Box */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-lg bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-start gap-3">
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
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow-md transition disabled:opacity-50"
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
              <span>{loading ? 'Authenticating Official...' : 'Sign In with Official Google Account'}</span>
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Authorized Government Emails Whitelist</span>
              </button>
            </div>
          </div>

          {/* Admin Email Whitelist Info Dropdown */}
          {showConfigHelp && (
            <div className="mt-5 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Authorized Administrator Emails:</span>
              </h4>
              <ul className="space-y-1 font-mono text-[11px] text-amber-300 mb-3">
                {AUTHORIZED_ADMIN_EMAILS.map((email) => (
                  <li key={email} className="bg-slate-900 px-2 py-1 rounded border border-slate-800">
                    • {email}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                To authorize additional government official accounts, set the <code className="text-amber-400">REACT_APP_ADMIN_EMAILS</code> or <code className="text-amber-400">VITE_ADMIN_EMAILS</code> environment variable in your <code className="text-blue-400">.env</code> file (comma-separated).
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between text-xs">
            <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
            <Link to="/citizen/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Citizen Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
