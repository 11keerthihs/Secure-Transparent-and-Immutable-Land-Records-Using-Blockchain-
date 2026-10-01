import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import {
  UserProfile,
  LandListing,
  BuyerInterest,
  TransferHistoryRecord,
  ListingStatus,
} from './types';

// Local storage backup keys for offline / preview operation
const KEY_USERS = 'landregistry_users_v1';
const KEY_LISTINGS = 'landregistry_listings_v1';
const KEY_INTERESTS = 'landregistry_interests_v1';
const KEY_TRANSFERS = 'landregistry_transfers_v1';
const KEY_GOV_INDEX = 'landregistry_gov_index_v1';

// Seed demo listings
const INITIAL_DEMO_LISTINGS: LandListing[] = [
  {
    listingId: 'list-001',
    landId: 1,
    parcelId: 'MH-PUN-HAV-2024-001',
    sellerUid: 'demo-seller-1',
    sellerName: 'Rajesh Kumar Sharma',
    sellerGovId: '0x8f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb4c8d5c4125b045e7e14a',
    price: 4500000,
    description: 'Prime 2400 sq.ft residential corner plot with verified clear title and RERA approval.',
    status: 'active',
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    listingId: 'list-002',
    landId: 2,
    parcelId: 'KA-BLR-KR-2024-009',
    sellerUid: 'demo-seller-2',
    sellerName: 'Anita Vikram Rao',
    sellerGovId: '0xb23e819fa045dc9017642e478546b51ffac19b165b6a71e82ef6b5dc17a7a502',
    price: 12500000,
    description: 'Commercial plot located near ITPL tech corridor with dual road accessibility.',
    status: 'seller-agreed',
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    listingId: 'list-003',
    landId: 3,
    parcelId: 'DL-SW-VAS-2024-015',
    sellerUid: 'demo-seller-3',
    sellerName: 'Sunil Singh Chawla',
    sellerGovId: '0xc456d901f2a34b5c6789e012f345a678b901c234d567e890f123a456b789c012',
    price: 35000000,
    description: '12-acre agricultural land holding with fertile soil and high-capacity borewell infrastructure.',
    status: 'active',
    createdAt: Date.now() - 86400000 * 2,
  },
];

const INITIAL_DEMO_INTERESTS: BuyerInterest[] = [
  {
    id: 'int-001',
    listingId: 'list-002',
    landId: 2,
    parcelId: 'KA-BLR-KR-2024-009',
    buyerUid: 'demo-buyer-1',
    buyerName: 'Vikramaditya Hegde',
    buyerEmail: 'vikram.hegde@example.com',
    buyerGovId: '0x9999a81234bcdef90123456789abcdef0123456789abcdef0123456789abcdef',
    buyerGovIdLast4: '4892',
    sellerUid: 'demo-seller-2',
    sellerGovId: '0xb23e819fa045dc9017642e478546b51ffac19b165b6a71e82ef6b5dc17a7a502',
    message: 'We are willing to match the asking price of 1.25 Cr. All title documents have been vetted by our legal counsel.',
    offerPrice: 12500000,
    status: 'seller-agreed',
    createdAt: Date.now() - 86400000 * 3,
  },
];

const INITIAL_DEMO_TRANSFERS: TransferHistoryRecord[] = [
  {
    id: 'tx-hist-001',
    listingId: 'list-archived-99',
    landId: 1,
    parcelId: 'MH-PUN-HAV-2024-001',
    sellerGovId: '0x1111a81234bcdef90123456789abcdef0123456789abcdef0123456789abcdef',
    buyerGovId: '0x8f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb4c8d5c4125b045e7e14a',
    sellerUid: 'seller-prev-uid',
    buyerUid: 'demo-seller-1',
    beforeOwnerName: 'Dattatreya Joshi',
    beforeOwnerGovId: '0x1111a81234bcdef90123456789abcdef0123456789abcdef0123456789abcdef',
    afterOwnerName: 'Rajesh Kumar Sharma',
    afterOwnerGovId: '0x8f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb4c8d5c4125b045e7e14a',
    salePrice: 4200000,
    txHash: '0x3a4b9c1d2e5f8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    blockNumber: 104,
    createdAt: Date.now() - 86400000 * 45,
  },
];

export class FirestoreService {
  // Local storage helpers
  private getStorage<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  // --- USERS & GOV ID INDEX ---
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured() && db) {
      try {
        const docRef = doc(db, 'users', uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Firestore getUserProfile fallback:', err);
      }
    }

    const users = this.getStorage<Record<string, UserProfile>>(KEY_USERS, {});
    return users[uid] || null;
  }

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        const userRef = doc(db, 'users', profile.uid);
        await setDoc(userRef, profile, { merge: true });

        // Record in govIdIndex to enforce uniqueness
        if (profile.govIdHash) {
          const indexRef = doc(db, 'govIdIndex', profile.govIdHash);
          await setDoc(indexRef, {
            uid: profile.uid,
            govIdLast4: profile.govIdLast4,
            updatedAt: Date.now(),
          });
        }
        return;
      } catch (err) {
        console.warn('Firestore saveUserProfile fallback:', err);
      }
    }

    const users = this.getStorage<Record<string, UserProfile>>(KEY_USERS, {});
    users[profile.uid] = profile;
    this.setStorage(KEY_USERS, users);

    if (profile.govIdHash) {
      const govIndex = this.getStorage<Record<string, string>>(KEY_GOV_INDEX, {});
      govIndex[profile.govIdHash] = profile.uid;
      this.setStorage(KEY_GOV_INDEX, govIndex);
    }
  }

  async isGovIdRegistered(govIdHash: string, excludeUid?: string): Promise<boolean> {
    if (isFirebaseConfigured() && db) {
      try {
        const indexRef = doc(db, 'govIdIndex', govIdHash);
        const snap = await getDoc(indexRef);
        if (snap.exists()) {
          const data = snap.data();
          if (excludeUid && data.uid === excludeUid) {
            return false;
          }
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Firestore isGovIdRegistered fallback:', err);
      }
    }

    const govIndex = this.getStorage<Record<string, string>>(KEY_GOV_INDEX, {});
    const existingUid = govIndex[govIdHash];
    if (existingUid && existingUid !== excludeUid) {
      return true;
    }
    return false;
  }

  // --- MARKETPLACE LAND LISTINGS ---
  async getLandListings(): Promise<LandListing[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'landListings'));
        const listings: LandListing[] = [];
        snap.forEach((d) => listings.push(d.data() as LandListing));
        if (listings.length > 0) return listings;
      } catch (err) {
        console.warn('Firestore getLandListings fallback:', err);
      }
    }

    return this.getStorage<LandListing[]>(KEY_LISTINGS, INITIAL_DEMO_LISTINGS);
  }

  async createLandListing(
    listingData: Omit<LandListing, 'listingId' | 'createdAt'>
  ): Promise<string> {
    const listingId = 'list-' + Date.now();
    const newListing: LandListing = {
      ...listingData,
      listingId,
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'landListings', listingId), newListing);
        return listingId;
      } catch (err) {
        console.warn('Firestore createLandListing fallback:', err);
      }
    }

    const listings = this.getLandListingsSync();
    listings.unshift(newListing);
    this.setStorage(KEY_LISTINGS, listings);
    return listingId;
  }

  async updateListingStatus(listingId: string, status: ListingStatus): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'landListings', listingId), { status });
        return;
      } catch (err) {
        console.warn('Firestore updateListingStatus fallback:', err);
      }
    }

    const listings = this.getLandListingsSync();
    const target = listings.find((l) => l.listingId === listingId);
    if (target) {
      target.status = status;
      this.setStorage(KEY_LISTINGS, listings);
    }
  }

  private getLandListingsSync(): LandListing[] {
    return this.getStorage<LandListing[]>(KEY_LISTINGS, INITIAL_DEMO_LISTINGS);
  }

  // --- BUYER INTERESTS ---
  async getInterests(): Promise<BuyerInterest[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'interests'));
        const list: BuyerInterest[] = [];
        snap.forEach((d) => list.push(d.data() as BuyerInterest));
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('Firestore getInterests fallback:', err);
      }
    }

    return this.getStorage<BuyerInterest[]>(KEY_INTERESTS, INITIAL_DEMO_INTERESTS);
  }

  async getInterestsByBuyer(buyerUid: string): Promise<BuyerInterest[]> {
    const all = await this.getInterests();
    return all.filter((i) => i.buyerUid === buyerUid);
  }

  async getInterestsForSeller(sellerUid: string): Promise<BuyerInterest[]> {
    const all = await this.getInterests();
    return all.filter((i) => i.sellerUid === sellerUid);
  }

  async submitBuyerInterest(
    interestData: Omit<BuyerInterest, 'id' | 'createdAt' | 'status'>
  ): Promise<string> {
    const id = 'int-' + Date.now();
    const newInterest: BuyerInterest = {
      ...interestData,
      id,
      status: 'pending',
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'interests', id), newInterest);
        return id;
      } catch (err) {
        console.warn('Firestore submitBuyerInterest fallback:', err);
      }
    }

    const interests = this.getStorage<BuyerInterest[]>(KEY_INTERESTS, INITIAL_DEMO_INTERESTS);
    interests.unshift(newInterest);
    this.setStorage(KEY_INTERESTS, interests);
    return id;
  }

  async updateInterestStatus(interestId: string, status: BuyerInterest['status']): Promise<void> {
    if (isFirebaseConfigured() && db) {
      try {
        await updateDoc(doc(db, 'interests', interestId), { status });
        return;
      } catch (err) {
        console.warn('Firestore updateInterestStatus fallback:', err);
      }
    }

    const interests = this.getStorage<BuyerInterest[]>(KEY_INTERESTS, INITIAL_DEMO_INTERESTS);
    const target = interests.find((i) => i.id === interestId);
    if (target) {
      target.status = status;
      this.setStorage(KEY_INTERESTS, interests);
    }
  }

  // --- TRANSFERS AUDIT HISTORY ---
  async getTransferHistory(): Promise<TransferHistoryRecord[]> {
    if (isFirebaseConfigured() && db) {
      try {
        const snap = await getDocs(collection(db, 'transfers'));
        const list: TransferHistoryRecord[] = [];
        snap.forEach((d) => list.push(d.data() as TransferHistoryRecord));
        if (list.length > 0) return list;
      } catch (err) {
        console.warn('Firestore getTransferHistory fallback:', err);
      }
    }

    return this.getStorage<TransferHistoryRecord[]>(KEY_TRANSFERS, INITIAL_DEMO_TRANSFERS);
  }

  async recordTransfer(
    transferData: Omit<TransferHistoryRecord, 'id' | 'createdAt'>
  ): Promise<string> {
    const id = 'trans-' + Date.now();
    const newRecord: TransferHistoryRecord = {
      ...transferData,
      id,
      createdAt: Date.now(),
    };

    if (isFirebaseConfigured() && db) {
      try {
        await setDoc(doc(db, 'transfers', id), newRecord);
        return id;
      } catch (err) {
        console.warn('Firestore recordTransfer fallback:', err);
      }
    }

    const transfers = this.getStorage<TransferHistoryRecord[]>(
      KEY_TRANSFERS,
      INITIAL_DEMO_TRANSFERS
    );
    transfers.unshift(newRecord);
    this.setStorage(KEY_TRANSFERS, transfers);
    return id;
  }

  // --- SEED OR RESET DEMO DATA ---
  resetAllDemoData(): void {
    localStorage.setItem(KEY_LISTINGS, JSON.stringify(INITIAL_DEMO_LISTINGS));
    localStorage.setItem(KEY_INTERESTS, JSON.stringify(INITIAL_DEMO_INTERESTS));
    localStorage.setItem(KEY_TRANSFERS, JSON.stringify(INITIAL_DEMO_TRANSFERS));
  }
}

export const firestoreService = new FirestoreService();
