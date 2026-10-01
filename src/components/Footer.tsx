import React from 'react';
import { Shield, Lock, Cpu, Database, CheckCircle2 } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold">
                <Shield className="w-4 h-4 text-amber-300" />
              </div>
              <span className="font-bold text-white text-sm">
                LandRegistry<span className="text-amber-400">.eth</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Immutable Land Record Management System leveraging Ethereum smart contracts, SHA-256 cryptographic document verification, and multi-tier access control.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Smart Contract Verified</span>
            </div>
          </div>

          {/* Col 2: Architecture */}
          <div>
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Stack Architecture
            </h5>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>Solidity ^0.8.20 (Hardhat / Ganache)</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Web Crypto SHA-256 Digest Engine</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-purple-400" />
                <span>Firebase Auth & Firestore Metadata</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ethers.js v6 RPC Provider (:7545)</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Public Portals */}
          <div>
            <h5 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">
              Portals & Services
            </h5>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a href="/login" className="hover:text-amber-400 transition">
                  Government Authority Portal (Google OAuth)
                </a>
              </li>
              <li>
                <a href="/citizen/login" className="hover:text-blue-400 transition">
                  Citizen Registry & Marketplace Portal
                </a>
              </li>
              <li>
                <a href="/#verify" className="hover:text-white transition">
                  Public Title Deed Hash Verifier
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="hover:text-white transition">
                  Immutable Consensus Workflow
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Important Academic & Legal Disclaimer */}
          <div>
            <h5 className="font-semibold text-amber-400 text-xs uppercase tracking-wider mb-3">
              Academic & Legal Notice
            </h5>
            <p className="text-[11px] leading-relaxed text-slate-400 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              This application is designed as an academic and technological reference implementation demonstrating immutable cadastral ledger management. Property conveyances simulated on this network represent demo blockchain consensus.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © {new Date().getFullYear()} National Land Record Management Authority (Blockchain Directorate).
          </div>
          <div className="font-mono text-[10px] text-slate-400">
            Chain ID: 1337 • Ganache Localhost • Dual-Mode Consensus
          </div>
        </div>
      </div>
    </footer>
  );
};
