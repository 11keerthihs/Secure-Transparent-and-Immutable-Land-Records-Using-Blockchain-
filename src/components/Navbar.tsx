import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Layers, User, LogOut, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Emblem */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-blue-700 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-blue-900/40">
              <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  LandRegistry<span className="text-amber-400 font-mono">.eth</span>
                </span>
                <span className="text-[10px] bg-blue-950 text-blue-300 font-mono px-1.5 py-0.5 rounded border border-blue-800">
                  EVM-1337
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                National Immutable Land Registry Authority
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-300">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg transition ${
                isActive('/') ? 'text-white bg-slate-800' : 'hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Home
            </Link>
            <a
              href="/#features"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
            >
              Features
            </a>
            <a
              href="/#architecture"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
            >
              Architecture
            </a>
            <a
              href="/#verify"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition"
            >
              Verify Deed
            </a>

            {/* Role specific quick jump */}
            {role === 'government' && (
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-lg transition font-semibold text-amber-400 ${
                  isActive('/dashboard') ? 'bg-amber-950/40 border border-amber-800/60' : 'hover:bg-slate-800/60'
                }`}
              >
                Government Dashboard
              </Link>
            )}

            {role === 'citizen' && (
              <Link
                to="/citizen/dashboard"
                className={`px-3 py-2 rounded-lg transition font-semibold text-blue-400 ${
                  isActive('/citizen/dashboard') ? 'bg-blue-950/40 border border-blue-800/60' : 'hover:bg-slate-800/60'
                }`}
              >
                Citizen Dashboard
              </Link>
            )}
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-white">
                    {user.displayName || user.email}
                  </span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400">
                    {user.role === 'government' ? '★ Government Admin' : '● Verified Citizen'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={user.role === 'government' ? '/dashboard' : '/citizen/dashboard'}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Go to Dashboard"
                  >
                    <Layers className="w-4 h-4 text-blue-400" />
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 text-xs font-medium border border-slate-700 hover:border-rose-800/60 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 hover:text-white hover:bg-slate-800 transition border border-slate-700 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/login?role=citizen"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition items-center gap-1"
                >
                  <span>Citizen</span>
                </Link>
                <Link
                  to="/login?role=government"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-sm transition flex items-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Gov Login</span>
                  <ArrowRight className="w-3 h-3 opacity-80" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
