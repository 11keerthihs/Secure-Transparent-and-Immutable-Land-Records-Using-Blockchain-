import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { landBlockchainService } from '../blockchain/landService';
import { firestoreService } from '../firebase/firestoreService';
import { LandRecord } from '../blockchain/types';
import { BuyerInterest, LandListing, TransferHistoryRecord } from '../firebase/types';
import {
  User,
  Shield,
  Layers,
  Search,
  Building,
  HeartHandshake,
  History,
  LogOut,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Tag,
  Copy,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const CitizenDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'profile' | 'my-lands' | 'search' | 'marketplace' | 'my-interests' | 'transfers'
  >('my-lands');

  const [lands, setLands] = useState<LandRecord[]>([]);
  const [listings, setListings] = useState<LandListing[]>([]);
  const [interests, setInterests] = useState<BuyerInterest[]>([]);
  const [transfers, setTransfers] = useState<TransferHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  // Interest Proposal Modal State
  const [selectedListing, setSelectedListing] = useState<LandListing | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [interestMessage, setInterestMessage] = useState('');
  const [interestSubmitting, setInterestSubmitting] = useState(false);

  // List Land on Marketplace Modal State
  const [listingLand, setListingLand] = useState<LandRecord | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [listingDescription, setListingDescription] = useState('');
  const [listingSubmitting, setListingSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [allLands, allListings, allInterests, allTransfers] = await Promise.all([
        landBlockchainService.getAllLands(),
        firestoreService.getLandListings(),
        firestoreService.getInterestsByBuyer(user.uid),
        firestoreService.getTransferHistory(),
      ]);
      setLands(allLands);
      setListings(allListings);
      setInterests(allInterests);
      setTransfers(allTransfers);
    } catch (err) {
      console.error('Citizen data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Lands owned by current citizen
  const myLands = lands.filter(
    (l) =>
      (user?.govIdHash && l.ownerGovId === user.govIdHash) ||
      (user?.displayName && l.ownerName.toLowerCase().includes(user.displayName.toLowerCase())) ||
      (l.ownerGovId && user?.govIdHash && l.ownerGovId.toLowerCase() === user.govIdHash.toLowerCase())
  );

  // Submit Interest Offer
  const handleSubmitInterest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !user) return;
    setInterestSubmitting(true);
    try {
      await firestoreService.submitBuyerInterest({
        listingId: selectedListing.listingId,
        landId: selectedListing.landId,
        parcelId: selectedListing.parcelId,
        buyerUid: user.uid,
        buyerName: user.displayName,
        buyerEmail: user.email,
        buyerGovId: user.govIdHash,
        buyerGovIdLast4: user.govIdLast4,
        sellerUid: selectedListing.sellerUid,
        sellerGovId: selectedListing.sellerGovId,
        message: interestMessage || 'Interested in purchasing this parcel at the proposed valuation.',
        offerPrice: Number(offerPrice) || selectedListing.price,
      });

      alert('Your purchase interest proposal has been submitted to the seller!');
      setSelectedListing(null);
      setOfferPrice('');
      setInterestMessage('');
      await loadData();
    } catch (err: any) {
      alert('Error submitting interest: ' + err.message);
    } finally {
      setInterestSubmitting(false);
    }
  };

  // List Land on Marketplace
  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingLand || !user) return;
    setListingSubmitting(true);
    try {
      await firestoreService.createLandListing({
        landId: listingLand.id,
        parcelId: listingLand.parcelId,
        sellerUid: user.uid,
        sellerName: user.displayName,
        sellerGovId: user.govIdHash,
        price: Number(listingPrice) || listingLand.marketValue,
        description:
          listingDescription ||
          `Verified ${listingLand.area} ${listingLand.areaUnit} ${listingLand.landUse} land parcel in ${listingLand.village}, ${listingLand.district}.`,
        status: 'active',
      });

      alert('Land listing published to marketplace successfully!');
      setListingLand(null);
      setListingPrice('');
      setListingDescription('');
      await loadData();
      setActiveTab('marketplace');
    } catch (err: any) {
      alert('Failed to list land: ' + err.message);
    } finally {
      setListingSubmitting(false);
    }
  };

  const copyGovHash = () => {
    if (!user?.govIdHash) return;
    navigator.clipboard.writeText(user.govIdHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 p-4 flex flex-col justify-between shrink-0">
        <div>
          {/* User Badge */}
          <div className="pb-4 mb-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-bold text-white truncate">{user?.displayName}</h2>
              <p className="text-[10px] text-blue-400 font-mono">Citizen Account</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              onClick={() => setActiveTab('my-lands')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'my-lands'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>My Land Holdings ({myLands.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('marketplace')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'marketplace'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Marketplace ({listings.filter((l) => l.status === 'active').length})</span>
            </button>

            <button
              onClick={() => setActiveTab('my-interests')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'my-interests'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <HeartHandshake className="w-4 h-4" />
              <span>My Purchase Offers ({interests.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('search')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'search'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Search Public Registry</span>
            </button>

            <button
              onClick={() => setActiveTab('transfers')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'transfers'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Transfer History</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition ${
                activeTab === 'profile'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Citizen Profile</span>
            </button>
          </nav>
        </div>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={async () => {
              await logout();
              navigate('/');
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Citizen Cadastral Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Connected Citizen: <span className="text-white font-medium">{user?.displayName}</span> • Government ID Ending in <strong className="text-amber-400 font-mono">{user?.govIdLast4}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('marketplace')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition"
            >
              <Building className="w-3.5 h-3.5" />
              <span>Browse Marketplace</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MY LAND HOLDINGS */}
        {activeTab === 'my-lands' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Your Registered Land Parcels</h3>
                <p className="text-xs text-slate-400">
                  Land records registered under your cryptographic Government ID hash on the Ethereum blockchain.
                </p>
              </div>
            </div>

            {myLands.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                <Shield className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">No lands registered under your ID yet.</p>
                <p className="text-slate-500 mt-1">
                  Once the Government Registrar registers a deed in your name or an acquired property is approved, it will automatically appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myLands.map((land) => (
                  <div
                    key={land.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs flex flex-col justify-between shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {land.parcelId}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>{land.status}</span>
                        </span>
                      </div>

                      <div className="space-y-1.5 text-slate-300">
                        <div>
                          <strong>Survey & Plot:</strong> S.No {land.surveyNumber} ({land.plotNumber})
                        </div>
                        <div>
                          <strong>Location:</strong> {land.village}, {land.taluka}, {land.district}, {land.state}
                        </div>
                        <div>
                          <strong>Area:</strong> {land.area} {land.areaUnit} ({land.landUse})
                        </div>
                        <div>
                          <strong>Assessed Value:</strong> ₹{land.marketValue.toLocaleString()}
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 block">Document SHA-256 Digest:</span>
                          <span className="font-mono text-[10px] text-emerald-400 break-all select-all">
                            {land.documentHash}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <Link
                        to={`/land/${land.id}`}
                        className="text-blue-400 hover:text-blue-300 text-xs font-semibold flex items-center gap-1"
                      >
                        <span>Full Dossier</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => {
                          setListingLand(land);
                          setListingPrice(land.marketValue.toString());
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-medium transition flex items-center gap-1.5"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>List on Marketplace</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MARKETPLACE */}
        {activeTab === 'marketplace' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Public Land Marketplace</h3>
              <p className="text-xs text-slate-400">
                Verified land holdings listed by title deed owners. Citizens can submit purchase proposals for review.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {listings.map((item) => (
                <div
                  key={item.listingId}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono font-bold text-amber-400">{item.parcelId}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          item.status === 'active'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="text-slate-300 font-semibold mb-1">
                      Seller: {item.sellerName}
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Asking Price:</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm">
                        ₹{item.price.toLocaleString()}
                      </span>
                    </div>

                    {item.status === 'active' && item.sellerUid !== user?.uid ? (
                      <button
                        onClick={() => {
                          setSelectedListing(item);
                          setOfferPrice(item.price.toString());
                        }}
                        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
                      >
                        <HeartHandshake className="w-3.5 h-3.5" />
                        <span>Submit Purchase Offer</span>
                      </button>
                    ) : item.sellerUid === user?.uid ? (
                      <div className="text-center text-[11px] text-amber-400 font-medium py-1">
                        ★ You are the seller of this listing
                      </div>
                    ) : (
                      <div className="text-center text-[11px] text-slate-500 py-1">
                        Conveyance in progress
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MY PURCHASE OFFERS */}
        {activeTab === 'my-interests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Your Submitted Purchase Proposals</h3>
              <p className="text-xs text-slate-400">
                Track status through seller agreement and official government conveyance approval.
              </p>
            </div>

            {interests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                You haven't submitted any purchase offers yet.
              </div>
            ) : (
              <div className="space-y-3">
                {interests.map((int) => (
                  <div
                    key={int.id}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {int.parcelId}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            int.status === 'gov-approved'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : int.status === 'seller-agreed'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {int.status === 'gov-approved'
                            ? 'Approved on Blockchain'
                            : int.status === 'seller-agreed'
                            ? 'Awaiting Registrar Signature'
                            : 'Pending Seller Review'}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-1">
                        <strong>Offer:</strong> ₹{int.offerPrice.toLocaleString()} • "{int.message}"
                      </div>
                      <div className="text-slate-500 text-[10px] mt-0.5">
                        Submitted: {new Date(int.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <Link
                      to={`/land/${int.landId}`}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium self-start sm:self-center transition"
                    >
                      View Land →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SEARCH PUBLIC REGISTRY */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search Parcel ID, Village, District, Survey Number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4">Parcel ID</th>
                    <th className="py-2.5 px-4">Survey & Plot</th>
                    <th className="py-2.5 px-4">District</th>
                    <th className="py-2.5 px-4">Area & Use</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {lands
                    .filter(
                      (l) =>
                        l.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        l.surveyNumber.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((land) => (
                      <tr key={land.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-medium text-amber-400">
                          {land.parcelId}
                        </td>
                        <td className="py-2.5 px-4">
                          S.No {land.surveyNumber} ({land.plotNumber})
                        </td>
                        <td className="py-2.5 px-4">
                          {land.village}, {land.district}
                        </td>
                        <td className="py-2.5 px-4">
                          {land.area} {land.areaUnit} ({land.landUse})
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-emerald-400 font-semibold">{land.status}</span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <Link
                            to={`/land/${land.id}`}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: TRANSFER HISTORY */}
        {activeTab === 'transfers' && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Cadastral Conveyance Audit Trail</h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-300 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-700">
                  <tr>
                    <th className="py-2.5 px-4">Parcel</th>
                    <th className="py-2.5 px-4">Seller</th>
                    <th className="py-2.5 px-4">Buyer</th>
                    <th className="py-2.5 px-4">Price</th>
                    <th className="py-2.5 px-4">Blockchain Receipt</th>
                    <th className="py-2.5 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {transfers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-mono font-medium text-amber-400">
                        {t.parcelId}
                      </td>
                      <td className="py-2.5 px-4">{t.beforeOwnerName}</td>
                      <td className="py-2.5 px-4 font-semibold text-white">{t.afterOwnerName}</td>
                      <td className="py-2.5 px-4 font-mono text-emerald-400">
                        ₹{t.salePrice.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-400">
                        <span title={t.txHash}>{t.txHash.slice(0, 10)}...</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-xl mx-auto space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-400" />
                <span>Verified Citizen Identification</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-1">Full Legal Name:</span>
                  <div className="font-semibold text-white text-sm">{user?.displayName}</div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Registered Email:</span>
                  <div className="font-mono text-slate-200">{user?.email}</div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-400">Government ID Privacy Mask:</span>
                    <span className="text-amber-400 font-mono font-semibold">
                      Ending in •••• {user?.govIdLast4}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-400 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800 select-all flex items-center justify-between">
                    <span>{user?.govIdHash}</span>
                    <button
                      onClick={copyGovHash}
                      className="ml-2 text-slate-400 hover:text-white shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Your plaintext identity document was irreversibly encrypted via SHA-256. This cryptographic hash proves deed ownership without revealing your private citizen ID.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Interest Modal */}
        {selectedListing && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">
                  Propose Offer for Parcel {selectedListing.parcelId}
                </h3>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitInterest} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Asking Price</label>
                  <div className="font-mono text-emerald-400 text-sm font-bold">
                    ₹{selectedListing.price.toLocaleString()}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Your Offer Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Proposal Message / Terms *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={interestMessage}
                    onChange={(e) => setInterestMessage(e.target.value)}
                    placeholder="We agree to the title deed specifications and request seller concurrence..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedListing(null)}
                    className="px-4 py-2 bg-slate-800 rounded text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={interestSubmitting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold"
                  >
                    {interestSubmitting ? 'Submitting...' : 'Send Offer to Seller'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List Land Modal */}
        {listingLand && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-sm">
                  List Parcel {listingLand.parcelId} for Sale
                </h3>
                <button
                  onClick={() => setListingLand(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateListing} className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Marketplace Asking Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-emerald-400 font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Listing Description & Features *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={listingDescription}
                    onChange={(e) => setListingDescription(e.target.value)}
                    placeholder="Describe boundary fencing, water access, road connectivity..."
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white placeholder-slate-500"
                  />
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setListingLand(null)}
                    className="px-4 py-2 bg-slate-800 rounded text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={listingSubmitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-semibold"
                  >
                    {listingSubmitting ? 'Publishing...' : 'Publish to Marketplace'}
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
