import React, { useState } from 'react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { Activity, ShieldCheck, AlertTriangle, RefreshCw, Terminal, CheckCircle2, Copy } from 'lucide-react';

export const BlockchainStatusBanner: React.FC = () => {
  const { state, refreshConnection, isChecking } = useBlockchain();
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                {state.isConnected && state.contractCodeFound ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                  </>
                )}
              </span>
              <span className="text-white font-semibold">Blockchain Node:</span>
              {state.isConnected && state.contractCodeFound ? (
                <span className="text-emerald-400 font-mono">Ganache Live (:7545)</span>
              ) : (
                <span className="text-amber-400 font-mono">Simulated EVM Mode (Ganache Offline)</span>
              )}
            </div>

            <div className="hidden sm:flex items-center gap-4 text-slate-400 border-l border-slate-700 pl-3 font-mono">
              <span>RPC: <strong className="text-slate-200">{state.rpcUrl}</strong></span>
              <span>Chain ID: <strong className="text-slate-200">{state.chainId}</strong></span>
              <span>
                Contract:{' '}
                <strong className="text-slate-200">
                  {state.contractAddress.slice(0, 6)}...{state.contractAddress.slice(-4)}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refreshConnection()}
              disabled={isChecking}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 transition"
              title="Test Ganache connection"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-blue-400' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check Node'}</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1 bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:bg-blue-600/50 px-2.5 py-0.5 rounded transition font-medium"
            >
              <Terminal className="w-3 h-3" />
              <span>Inspector</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics & Node Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-lg text-white">Blockchain Node Connection Diagnostics</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div
                className={`p-4 rounded-lg border ${
                  state.isConnected && state.contractCodeFound
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {state.isConnected && state.contractCodeFound ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="font-semibold text-white">
                      {state.isConnected && state.contractCodeFound
                        ? 'Connected to Local Ganache RPC Node'
                        : 'Operating in High-Fidelity In-Browser EVM Ledger'}
                    </h4>
                    <p className="text-xs mt-1 leading-relaxed text-slate-300">
                      {state.errorMessage ||
                        'Smart contract LandRegistry is verified and running on Ganache port 7545 with chainId 1337.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Node Specifications */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Target RPC URL</div>
                  <div className="font-mono text-white font-medium mt-1">{state.rpcUrl}</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700">
                  <div className="text-slate-400">Target Chain ID</div>
                  <div className="font-mono text-white font-medium mt-1">{state.chainId} (Ganache)</div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700 col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Configured LandRegistry Contract Address</span>
                    <button
                      onClick={() => copyToClipboard(state.contractAddress, 'contract')}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {copied === 'contract' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied === 'contract' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-emerald-400 font-semibold mt-1 break-all select-all">
                    {state.contractAddress}
                  </div>
                </div>
              </div>

              {/* Instructions to run Ganache */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                  How to start Ganache & deploy locally:
                </div>
                <div className="space-y-2 font-mono text-xs text-slate-300">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span>1. npm run ganache</span>
                    <button
                      onClick={() => copyToClipboard('npm run ganache', 'cmd1')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied === 'cmd1' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center justify-between">
                    <span>2. npm run deploy:ganache</span>
                    <button
                      onClick={() => copyToClipboard('npm run deploy:ganache', 'cmd2')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copied === 'cmd2' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  * Note: In this browser preview, transactions, hash generation, and smart contract flows are completely functional through our reactive state machine with SHA-256 cryptography!
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => refreshConnection()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                <span>Recheck Ganache</span>
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
