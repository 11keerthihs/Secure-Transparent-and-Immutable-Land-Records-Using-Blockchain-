import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useBlockchain } from '../contexts/BlockchainContext';
import { landBlockchainService } from '../blockchain/landService';
import { firestoreService } from '../firebase/firestoreService';
import { LandRecord } from '../blockchain/types';
import { BuyerInterest, LandListing, TransferHistoryRecord } from '../firebase/types';
import { DocumentHashVerifier } from '../components/DocumentHashVerifier';
import { calculateTextHash, hashGovId } from '../utils/crypto';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  LayoutDashboard,
  Layers,
  PlusCircle,
  FileEdit,
  ArrowRightLeft,
  BarChart3,
  User,
  LogOut,
  Shield,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Cpu,
  RefreshCw,
  FileCheck2,
  AlertTriangle,
  Database,
  Building,
} from 'lucide-react';

export const GovDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { state: chainState, refreshConnection } = useBlockchain();
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'records' | 'add' | 'transfers' | 'marketplace' | 'stats' | 'profile'
  >('overview');

  // State data
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [listings, setListings] = useState<LandListing[]>([]);
  const [interests, setInterests] = useState<BuyerInterest[]>([]);
  const [transfers, setTransfers] = useState<TransferHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Land Form State
  const [formData, setFormData] = useState({
    parcelId: '',
    surveyNumber: '',
    plotNumber: '',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Wagholi',
    addressLine: '',
    landUse: 'Residential',
    area: '',
    areaUnit: 'Sq.Ft',
    coordinates: '18.5793° N, 73.9787° E',
    ownerName: '',
    ownerGovId: '',
    documentHash: '',
    marketValue: '',
    status: 'VERIFIED',
  });

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [txReceipt, setTxReceipt] = useState<{
    txHash: string;
    landId: number;
    blockNumber: number;
    isSimulated: boolean;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit / Update Land Modal State
  const [editingLand, setEditingLand] = useState<LandRecord | null>(null);
  const [editLandUse, setEditLandUse] = useState('');
  const [editMarketValue, setEditMarketValue] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editDocHash, setEditDocHash] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Load all records
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [landList, listList, intList, transList] = await Promise.all([
        landBlockchainService.getAllLands(),
        firestoreService.getLandListings(),
        firestoreService.getInterests(),
        firestoreService.getTransferHistory(),
      ]);
      setLands(landList);
      setListings(listList);
      setInterests(intList);
      setTransfers(transList);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handle Form input change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Add Land Submit
  const handleAddLand = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setTxReceipt(null);
    setFormSubmitting(true);

    try {
      // Validations
      if (!formData.parcelId.trim()) throw new Error('Parcel ID is mandatory.');
      if (!formData.surveyNumber.trim()) throw new Error('Survey Number is mandatory.');
      if (!formData.ownerName.trim()) throw new Error('Owner Legal Name is required.');
      if (!formData.ownerGovId.trim()) throw new Error('Owner Government ID is required.');
      if (!formData.area || Number(formData.area) <= 0) throw new Error('Valid Area is required.');
      if (!formData.marketValue || Number(formData.marketValue) <= 0)
        throw new Error('Valid Market Value is required.');

      // Auto generate document hash if empty
      let finalDocHash = formData.documentHash;
      if (!finalDocHash) {
        const signaturePayload = `${formData.parcelId}|${formData.surveyNumber}|${formData.ownerName}|${Date.now()}`;
        finalDocHash = await calculateTextHash(signaturePayload);
      }

      // Hash owner Government ID for on-chain privacy
      const { hash: hashedGovId } = await hashGovId(formData.ownerGovId);

      // Write to Smart Contract
      const receipt = await landBlockchainService.addLand({
        parcelId: formData.parcelId.trim(),
        surveyNumber: formData.surveyNumber.trim(),
        plotNumber: formData.plotNumber.trim(),
        state: formData.state.trim(),
        district: formData.district.trim(),
        taluka: formData.taluka.trim(),
        village: formData.village.trim(),
        addressLine: formData.addressLine.trim(),
        landUse: formData.landUse,
        area: Number(formData.area),
        areaUnit: formData.areaUnit,
        coordinates: formData.coordinates.trim(),
        ownerName: formData.ownerName.trim(),
        ownerGovId: hashedGovId,
        documentHash: finalDocHash,
        marketValue: Number(formData.marketValue),
        registrationDate: Math.floor(Date.now() / 1000),
        status: formData.status || 'VERIFIED',
      });

      setTxReceipt(receipt);

      // Reset form
      setFormData({
        parcelId: '',
        surveyNumber: '',
        plotNumber: '',
        state: 'Maharashtra',
        district: 'Pune',
        taluka: 'Haveli',
        village: 'Wagholi',
        addressLine: '',
        landUse: 'Residential',
        area: '',
        areaUnit: 'Sq.Ft',
        coordinates: '18.5793° N, 73.9787° E',
        ownerName: '',
        ownerGovId: '',
        documentHash: '',
        marketValue: '',
        status: 'VERIFIED',
      });

      // Reload records
      await loadAllData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record land on blockchain.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (land: LandRecord) => {
    setEditingLand(land);
    setEditLandUse(land.landUse);
    setEditMarketValue(land.marketValue.toString());
    setEditStatus(land.status);
    setEditDocHash(land.documentHash);
  };

  // Submit Edit
  const handleUpdateLand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLand) return;
    setEditLoading(true);
    try {
      await landBlockchainService.updateLand(
        editingLand.id,
        editLandUse,
        Number(editMarketValue),
        editStatus,
        editDocHash
      );
      setEditingLand(null);
      await loadAllData();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Land
  const handleDeleteLand = async (id: number) => {
    if (!window.confirm(`Are you sure you want to revoke and delete land record #${id}?`)) {
      return;
    }
    try {
      await landBlockchainService.deleteLand(id);
      await loadAllData();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Approve Transfer Request (Government Approval step)
  const handleApproveTransfer = async (interest: BuyerInterest) => {
    if (
      !window.confirm(
        `Approve legal land conveyance for Parcel ${interest.parcelId} to buyer ${interest.buyerName}? This will write an immutable ownership change on the smart contract.`
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      // Find land record
      const land = lands.find((l) => l.id === interest.landId);
      if (!land) throw new Error('Target land record not found');

      // Generate new title deed endorsement hash
      const endorsementHash = await calculateTextHash(
        `CONVEYANCE|${interest.parcelId}|SELLER:${land.ownerGovId}|BUYER:${interest.buyerGovId}|DATE:${Date.now()}`
      );

      // 1. Update blockchain ownership
      const { txHash, blockNumber } = await landBlockchainService.transferOwnershipRecord(
        interest.landId,
        interest.buyerName,
        interest.buyerGovId,
        interest.offerPrice || land.marketValue,
        endorsementHash
      );

      // 2. Update interest status to gov-approved
      await firestoreService.updateInterestStatus(interest.id, 'gov-approved');

      // 3. Update listing status to sold
      await firestoreService.updateListingStatus(interest.listingId, 'sold');

      // 4. Record transfer audit history
      await firestoreService.recordTransfer({
        listingId: interest.listingId,
        landId: interest.landId,
        parcelId: interest.parcelId,
        sellerGovId: land.ownerGovId,
        buyerGovId: interest.buyerGovId,
        sellerUid: interest.sellerUid,
        buyerUid: interest.buyerUid,
        beforeOwnerName: land.ownerName,
        beforeOwnerGovId: land.ownerGovId,
        afterOwnerName: interest.buyerName,
        afterOwnerGovId: interest.buyerGovId,
        salePrice: interest.offerPrice || land.marketValue,
        txHash,
        blockNumber,
      });

      alert(
        `Ownership conveyance successfully approved on blockchain! Transaction Hash: ${txHash}`
      );
      await loadAllData();
    } catch (err: any) {
      alert('Transfer approval failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Seed Demo Data
  const handleSeedDemoData = () => {
    if (
      window.confirm(
        'Reset and seed high-fidelity demo lands, marketplace listings, and transfer history?'
      )
    ) {
      landBlockchainService.resetSimulatedData();
      firestoreService.resetAllDemoData();
      loadAllData();
    }
  };

  // Data aggregations for charts
  const landUseData = [
    { name: 'Residential', value: lands.filter((l) => l.landUse === 'Residential').length },
    { name: 'Commercial', value: lands.filter((l) => l.landUse === 'Commercial').length },
    { name: 'Agricultural', value: lands.filter((l) => l.landUse === 'Agricultural').length },
    { name: 'Industrial', value: lands.filter((l) => l.landUse === 'Industrial').length },
  ].filter((d) => d.value > 0);

  const districtData = Array.from(new Set(lands.map((l) => l.district))).map((dist) => ({
    name: dist,
    count: lands.filter((l) => l.district === dist).length,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  const filteredLands = lands.filter(
    (l) =>
      l.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* Government Badge */}
          <div className="pb-4 mb-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white tracking-tight">Government Console</h2>
              <p className="text-[10px] text-amber-400 font-mono">Land Registrar Authority</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('records')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'records'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Land Records ({lands.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'add'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Register New Land</span>
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'transfers'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer Approvals ({interests.filter((i) => i.status === 'seller-agreed').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'marketplace'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Marketplace / Listings</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'stats'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Cadastral Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-amber-600/20 text-amber-400 border border-amber-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Official Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <button
            onClick={handleSeedDemoData}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            <span>Seed Sample Lands</span>
          </button>

          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs transition border border-rose-900/50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>Cadastral Registry Authority</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800/80 font-mono">
                Solidity 0.8.20
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Officer: <span className="text-white font-medium">{user?.displayName}</span> ({user?.email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAllData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh Registry</span>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Register Land</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Total Lands Registered
                </span>
                <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                  {lands.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Stored on Smart Contract</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Verified Lands
                </span>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {lands.filter((l) => l.status === 'VERIFIED').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Cryptographically Authenticated</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Pending Transfer Requests
                </span>
                <div className="text-2xl font-black text-blue-400 font-mono mt-1">
                  {interests.filter((i) => i.status === 'seller-agreed').length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Awaiting Registrar Signature</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                  Sold / Conveyed
                </span>
                <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                  {transfers.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Immutable Conveyances</div>
              </div>
            </div>

            {/* Quick Analytics & Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Land Use Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Land Use Classification</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={landUseData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent || 0) * 100).toFixed(0)}%`
                        }
                      >
                        {landUseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          fontSize: '12px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* District Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-400" />
                  <span>Cadastral Registrations by District</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={districtData}>
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                      <YAxis stroke="#64748B" fontSize={11} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Cadastral Activity */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Recently Registered Parcels</span>
              </h3>
              <div className="divide-y divide-slate-800 text-xs">
                {lands.slice(0, 5).map((l) => (
                  <div key={l.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">
                        {l.parcelId} • S.No {l.surveyNumber}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Owner: {l.ownerName} • {l.village}, {l.district}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-emerald-400 font-medium">
                        ₹{(l.marketValue / 100000).toFixed(1)} Lakhs
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {l.documentHash.slice(0, 8)}...
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LAND RECORDS TABLE */}
        {activeTab === 'records' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Parcel ID, Owner Name, District, S.No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Showing {filteredLands.length} records</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700/80">
                    <tr>
                      <th className="py-3 px-4">Parcel ID</th>
                      <th className="py-3 px-4">Survey & Plot</th>
                      <th className="py-3 px-4">Owner Name</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Area & Use</th>
                      <th className="py-3 px-4">Valuation</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {filteredLands.map((land) => (
                      <tr key={land.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-medium text-amber-400">
                          {land.parcelId}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">S.No {land.surveyNumber}</span>
                          <div className="text-[11px] text-slate-400">{land.plotNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-white">{land.ownerName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {land.ownerGovId.slice(0, 10)}...
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>{land.village}, {land.district}</div>
                          <div className="text-[11px] text-slate-400">{land.state}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{land.area} {land.areaUnit}</div>
                          <span className="text-[10px] text-blue-400">{land.landUse}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                          ₹{land.marketValue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>{land.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Link
                            to={`/land/${land.id}`}
                            className="inline-flex items-center p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Inspect Blockchain Dossier"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                          </Link>
                          <button
                            onClick={() => openEditModal(land)}
                            className="inline-flex items-center p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit Land Metadata"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteLand(land.id)}
                            className="inline-flex items-center p-1.5 rounded bg-rose-950/40 hover:bg-rose-900 text-rose-300 transition"
                            title="Revoke Land Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER NEW LAND (17 Complete Fields + SHA-256 Hasher + Smart Contract addLand()) */}
        {activeTab === 'add' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">
                  Register Cadastral Land Parcel on Smart Contract
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Enter complete cadastral survey metrics and attach the title deed. All critical parameters will be permanently committed to the Ethereum blockchain with an authorized registrar signature.
              </p>

              {/* Receipt Success Banner */}
              {txReceipt && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-100 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Land Registered Successfully on Blockchain!</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px] pt-1">
                    <div>
                      <span className="text-emerald-400 font-semibold">Assigned Land ID:</span> #{txReceipt.landId}
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold">Block Number:</span> #{txReceipt.blockNumber}
                    </div>
                    <div>
                      <span className="text-emerald-400 font-semibold">Ledger Node:</span>{' '}
                      {txReceipt.isSimulated ? 'Simulated EVM' : 'Ganache RPC'}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-emerald-900/60 break-all font-mono text-[11px]">
                    <span className="text-emerald-400 font-semibold">Transaction Hash: </span>
                    {txReceipt.txHash}
                  </div>
                </div>
              )}

              {formError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleAddLand} className="space-y-6 text-xs">
                {/* Section A: Identification */}
                <div>
                  <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] mb-3">
                    A. Cadastral Survey Identifiers
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Parcel ID (Unique GIS) *
                      </label>
                      <input
                        type="text"
                        name="parcelId"
                        required
                        placeholder="e.g. MH-PUN-HAV-2024-089"
                        value={formData.parcelId}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Survey Number *
                      </label>
                      <input
                        type="text"
                        name="surveyNumber"
                        required
                        placeholder="e.g. 142/2A"
                        value={formData.surveyNumber}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Plot / Sub-division Number
                      </label>
                      <input
                        type="text"
                        name="plotNumber"
                        placeholder="e.g. Plot 18-B"
                        value={formData.plotNumber}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Geographic Location */}
                <div>
                  <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] mb-3">
                    B. Geographic Jurisdiction
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">District *</label>
                      <input
                        type="text"
                        name="district"
                        required
                        value={formData.district}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Taluka / Tehsil *</label>
                      <input
                        type="text"
                        name="taluka"
                        required
                        value={formData.taluka}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Village / Revenue Ward *</label>
                      <input
                        type="text"
                        name="village"
                        required
                        value={formData.village}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-slate-300 font-medium mb-1">
                      Complete Cadastral Address Line
                    </label>
                    <input
                      type="text"
                      name="addressLine"
                      placeholder="e.g. Survey No 142/2A, Near Golden Heights, Ring Road"
                      value={formData.addressLine}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Section C: Classification, Area & Valuation */}
                <div>
                  <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] mb-3">
                    C. Technical Specifications & Valuation
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Land Use *</label>
                      <select
                        name="landUse"
                        value={formData.landUse}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Agricultural">Agricultural</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Institutional">Institutional</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Area Magnitude *</label>
                      <input
                        type="number"
                        name="area"
                        required
                        placeholder="e.g. 2400"
                        value={formData.area}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Area Unit *</label>
                      <select
                        name="areaUnit"
                        value={formData.areaUnit}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="Sq.Ft">Sq.Ft</option>
                        <option value="Sq.Meters">Sq.Meters</option>
                        <option value="Acres">Acres</option>
                        <option value="Guntas">Guntas</option>
                        <option value="Hectares">Hectares</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Assessed Market Value (₹) *
                      </label>
                      <input
                        type="number"
                        name="marketValue"
                        required
                        placeholder="e.g. 4500000"
                        value={formData.marketValue}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono font-semibold focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-slate-300 font-medium mb-1">
                      GIS Coordinates (Latitude, Longitude)
                    </label>
                    <input
                      type="text"
                      name="coordinates"
                      value={formData.coordinates}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Section D: Owner Details */}
                <div>
                  <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] mb-3">
                    D. Primary Owner Information & Privacy Protection
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">
                        Owner Legal Name *
                      </label>
                      <input
                        type="text"
                        name="ownerName"
                        required
                        placeholder="e.g. Rajesh Kumar Sharma"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-slate-300 font-medium">
                          Owner Government ID (SSN / Aadhaar / National ID) *
                        </label>
                        <span className="text-[10px] text-amber-400 font-mono">SHA-256 Hashed</span>
                      </div>
                      <input
                        type="text"
                        name="ownerGovId"
                        required
                        placeholder="e.g. 9876-5432-1098"
                        value={formData.ownerGovId}
                        onChange={handleInputChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Section E: Document Hash */}
                <div>
                  <h4 className="font-semibold text-amber-400 uppercase tracking-wider text-[11px] mb-3">
                    E. Title Deed Cryptographic Digest (SHA-256)
                  </h4>
                  <DocumentHashVerifier
                    title="Generate Title Deed SHA-256 Hash"
                    onHashGenerated={(computed) => {
                      setFormData((prev) => ({ ...prev, documentHash: computed }));
                    }}
                  />
                  <div className="mt-3">
                    <label className="block text-slate-300 font-medium mb-1">
                      Assigned Document Hash (Auto-filled or manual) *
                    </label>
                    <input
                      type="text"
                      name="documentHash"
                      required
                      placeholder="0x..."
                      value={formData.documentHash}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-400 font-mono text-[11px] focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold text-xs shadow-lg transition flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    <span>
                      {formSubmitting
                        ? 'Broadcasting to Blockchain...'
                        : 'Sign & Register Land on Smart Contract'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: TRANSFER APPROVALS */}
        {activeTab === 'transfers' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">
                  Pending Land Transfer & Conveyance Approvals
                </h3>
              </div>
              <p className="text-xs text-slate-400 mb-6">
                When a seller accepts a buyer's offer in the marketplace, the conveyance dossier is submitted for Government Registrar review. Approving it writes the ownership update directly to the blockchain smart contract.
              </p>

              <div className="space-y-4">
                {interests.filter((i) => i.status === 'seller-agreed').length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
                    No pending transfer requests awaiting Government Registrar signature.
                  </div>
                ) : (
                  interests
                    .filter((i) => i.status === 'seller-agreed')
                    .map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-amber-400 text-sm">
                              {item.parcelId}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
                              Seller Concurrence Received
                            </span>
                          </div>
                          <div className="text-slate-300">
                            <strong>Buyer:</strong> {item.buyerName} ({item.buyerEmail})
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            <strong>Offer Price:</strong> ₹{item.offerPrice.toLocaleString()} •{' '}
                            <strong>Message:</strong> "{item.message}"
                          </div>
                          <div className="text-slate-500 font-mono text-[10px]">
                            Buyer Gov ID Hash: {item.buyerGovId.slice(0, 16)}...
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveTransfer(item)}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approve & Write to Blockchain</span>
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Historical Audit Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-400" />
                <span>Historical Conveyance Audit Trail</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700">
                    <tr>
                      <th className="py-2.5 px-3">Parcel</th>
                      <th className="py-2.5 px-3">Former Owner</th>
                      <th className="py-2.5 px-3">New Owner</th>
                      <th className="py-2.5 px-3">Sale Value</th>
                      <th className="py-2.5 px-3">Transaction Receipt</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {transfers.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono text-amber-400 font-medium">
                          {t.parcelId}
                        </td>
                        <td className="py-2.5 px-3">{t.beforeOwnerName}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{t.afterOwnerName}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400">
                          ₹{t.salePrice.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                          <span title={t.txHash}>{t.txHash.slice(0, 10)}...</span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: MARKETPLACE / LISTINGS */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white text-base mb-2">Marketplace Listings Overview</h3>
              <p className="text-xs text-slate-400 mb-6">
                Active land parcels listed by verified owners for sale in the public marketplace.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {listings.map((item) => (
                  <div
                    key={item.listingId}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono font-bold text-amber-400">{item.parcelId}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 uppercase font-semibold">
                          {item.status}
                        </span>
                      </div>
                      <div className="text-slate-200 font-medium mb-1">
                        Listed by: {item.sellerName}
                      </div>
                      <p className="text-slate-400 text-[11px] line-clamp-3 mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        ₹{item.price.toLocaleString()}
                      </span>
                      <Link
                        to={`/land/${item.landId}`}
                        className="text-blue-400 hover:text-blue-300 text-[11px] font-medium"
                      >
                        Inspect Land →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white text-base mb-4">Cadastral Statistical Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">
                    Land Allocation by Category
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={landUseData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {landUseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">
                    District Parcel Density
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={districtData}>
                        <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                        <YAxis stroke="#64748B" fontSize={11} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-white text-base mb-4">Official Registrar Credentials</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400">Authenticated Email:</span>
                  <div className="font-mono text-white font-semibold mt-0.5">{user?.email}</div>
                </div>
                <div>
                  <span className="text-slate-400">Officer Designation:</span>
                  <div className="text-amber-400 font-semibold mt-0.5">
                    {user?.displayName || 'State Land Registrar'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Role Authority:</span>
                  <div className="text-emerald-400 font-mono mt-0.5 uppercase">
                    ★ Government Administrator
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Officer Gov ID Hash:</span>
                  <div className="font-mono text-slate-300 text-[10px] break-all bg-slate-950 p-2 rounded border border-slate-800 mt-1 select-all">
                    {user?.govIdHash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Land Modal */}
        {editingLand && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full p-6 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">
                  Update Land Parcel {editingLand.parcelId}
                </h3>
                <button
                  onClick={() => setEditingLand(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateLand} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Land Use</label>
                  <select
                    value={editLandUse}
                    onChange={(e) => setEditLandUse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Industrial">Industrial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Market Value (₹)</label>
                  <input
                    type="number"
                    value={editMarketValue}
                    onChange={(e) => setEditMarketValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="PENDING_TRANSFER">PENDING_TRANSFER</option>
                    <option value="RESTRICTED">RESTRICTED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Document Hash</label>
                  <input
                    type="text"
                    value={editDocHash}
                    onChange={(e) => setEditDocHash(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-slate-300 font-mono text-[11px]"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingLand(null)}
                    className="px-4 py-2 bg-slate-800 rounded text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded font-semibold"
                  >
                    {editLoading ? 'Updating...' : 'Save to Blockchain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
