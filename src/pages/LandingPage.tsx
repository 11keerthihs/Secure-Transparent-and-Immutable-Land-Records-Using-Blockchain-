import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { landBlockchainService } from '../blockchain/landService';
import { LandRecord } from '../blockchain/types';
import { DocumentHashVerifier } from '../components/DocumentHashVerifier';
import {
  Shield,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Database,
  Building,
  UserCheck,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedLand, setSelectedLand] = useState<LandRecord | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const items = await landBlockchainService.getAllLands();
        setLands(items);
      } catch (err) {
        console.error('Failed to load lands:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredLands = lands.filter(
    (l) =>
      l.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-800">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 blur-[130px] pointer-events-none rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[250px] bg-amber-500/10 blur-[110px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/80 text-xs text-amber-400 font-mono mb-6">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Decentralized Cadastral Integrity • Solidity ^0.8.20</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Secure, Transparent and{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-400">
                Immutable Land Records
              </span>{' '}
              Using Blockchain
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-300 leading-relaxed">
              Traditional land registries suffer from single-point database vulnerabilities, unauthorized alterations, and bureaucratic opacity. Our solution leverages Ethereum smart contracts and SHA-256 cryptographic document verification to guarantee complete immutability and transparent public provenance.
            </p>

            {/* CTA action buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold shadow-lg shadow-amber-900/30 transition flex items-center gap-2 text-sm"
              >
                <Shield className="w-4 h-4" />
                <span>Government Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/citizen/login"
                className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold border border-slate-700 hover:border-slate-600 transition flex items-center gap-2 text-sm"
              >
                <UserCheck className="w-4 h-4 text-blue-400" />
                <span>Citizen Services & Marketplace</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-amber-400 font-mono">
                {lands.length}
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                Verified Lands
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-blue-400 font-mono">
                100%
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                Cryptographic Integrity
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                1337
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                Ganache Chain ID
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-black text-purple-400 font-mono">
                SHA-256
              </div>
              <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">
                Deed Hash Standard
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Public Registry Search Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              <span>Public Blockchain Cadastral Search</span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">
              Search Registered Land Parcels
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Any citizen or institution can verify title existence and view on-chain hashes.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Parcel, Survey No, District..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Land Records Table / Cards */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700/80">
                <tr>
                  <th className="py-3 px-4">Parcel ID</th>
                  <th className="py-3 px-4">Survey / Plot</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Land Use</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">On-Chain Hash</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      Querying Ethereum smart contract records...
                    </td>
                  </tr>
                ) : filteredLands.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No land records match your search filter.
                    </td>
                  </tr>
                ) : (
                  filteredLands.map((land) => (
                    <tr key={land.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-medium text-amber-400">
                        {land.parcelId}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-white">S.No {land.surveyNumber}</span>
                        <div className="text-[11px] text-slate-400">{land.plotNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">{land.village}, {land.taluka}</div>
                        <div className="text-[11px] text-slate-400">{land.district}, {land.state}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-800 text-blue-300 border border-slate-700">
                          {land.landUse}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {land.area.toLocaleString()} {land.areaUnit}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{land.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {land.documentHash ? (
                          <span title={land.documentHash} className="cursor-help">
                            {land.documentHash.slice(0, 10)}...{land.documentHash.slice(-6)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/land/${land.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 font-medium transition"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SHA-256 Title Deed Integrity Verifier Section */}
      <section id="verify" className="py-14 bg-slate-900/40 border-y border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Instant Title Deed Cryptographic Verifier
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Compute the browser-side SHA-256 digest of your land deed file to ensure zero alterations.
            </p>
          </div>
          <DocumentHashVerifier />
        </div>
      </section>

      {/* Architecture & How It Works */}
      <section id="architecture" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
            System Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Separation of On-Chain and Off-Chain Data
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Designed according to decentralized engineering principles to optimize block size while maintaining cryptographic verifiability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* On Chain Box */}
          <div className="bg-slate-900/70 border border-amber-900/50 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">On-Chain Smart Contract Ledger</h3>
                <span className="text-xs font-mono text-amber-400">LandRegistry.sol • EVM Chain 1337</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Immutable Cadastral Properties:</strong> Parcel ID, Survey No, Plot No, Coordinates, Area, and State.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Cryptographic Document Digest:</strong> SHA-256 title deed hash stored permanently. Full files are never dumped into EVM storage.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Owner Proof & Timestamp:</strong> Timestamped block headers and authorized government deployer signatures.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Modifier Protection:</strong> <code>onlyOwner</code> ensures only authenticated government officers can sign registry modifications.</span>
              </li>
            </ul>
          </div>

          {/* Off Chain Box */}
          <div className="bg-slate-900/70 border border-blue-900/50 rounded-xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Off-Chain Application Storage</h3>
                <span className="text-xs font-mono text-blue-400">Firebase Auth & Firestore NoSQL</span>
              </div>
            </div>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Citizen Profile Management:</strong> User registration, display names, email verification, and session tokens.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Government ID Privacy:</strong> Normalization + SHA-256 hashing; plain ID is never exposed, only last 4 digits stored.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Marketplace & Transfer Workflow:</strong> Interactive listing creation, buyer interest proposals, and seller concurrence.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>Transfer Audit History:</strong> Real-time conveyance log linking seller, buyer, and blockchain transaction receipt hash.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-white">Enterprise Land Management Features</h2>
            <p className="text-xs text-slate-400 mt-1">Built specifically to solve cadastral fraud and double-allocation dilemmas.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300 text-xs">
            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <Lock className="w-5 h-5 text-amber-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">Tamper-Proof Ledger</h4>
              <p className="text-slate-400 leading-relaxed">
                Records cannot be deleted or modified in secrecy. Every state alteration produces an immutable cryptographic event receipt.
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <FileCheck2 className="w-5 h-5 text-blue-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">SHA-256 Deed Verification</h4>
              <p className="text-slate-400 leading-relaxed">
                Title deeds, survey sketches, and sale agreements can be verified against the on-chain hash at any time in under 2 seconds.
              </p>
            </div>

            <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
              <Building className="w-5 h-5 text-emerald-400 mb-3" />
              <h4 className="text-sm font-semibold text-white mb-1">Multi-Role Governance</h4>
              <p className="text-slate-400 leading-relaxed">
                Government authorities retain administrative oversight to approve land registration, while citizens can transparently buy, sell, and track.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
