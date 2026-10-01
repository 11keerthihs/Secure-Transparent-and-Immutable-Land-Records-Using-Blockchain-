export type UserRole = 'government' | 'citizen' | 'guest';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  govIdHash: string;
  govIdLast4: string;
  createdAt: number;
}

export type ListingStatus =
  | 'pending'
  | 'active'
  | 'pending-transfer'
  | 'seller-agreed'
  | 'gov-approved'
  | 'sold';

export interface LandListing {
  listingId: string;
  landId: number;
  parcelId: string;
  sellerUid: string;
  sellerName: string;
  sellerGovId: string;
  price: number;
  description: string;
  status: ListingStatus;
  createdAt: number;
}

export type InterestStatus =
  | 'pending'
  | 'seller-agreed'
  | 'seller-rejected'
  | 'gov-approved'
  | 'rejected';

export interface BuyerInterest {
  id: string;
  listingId: string;
  landId: number;
  parcelId: string;
  buyerUid: string;
  buyerName: string;
  buyerEmail: string;
  buyerGovId: string;
  buyerGovIdLast4: string;
  sellerUid: string;
  sellerGovId: string;
  message: string;
  offerPrice: number;
  status: InterestStatus;
  createdAt: number;
}

export interface TransferHistoryRecord {
  id: string;
  listingId: string;
  landId: number;
  parcelId: string;
  sellerGovId: string;
  buyerGovId: string;
  sellerUid: string;
  buyerUid: string;
  beforeOwnerName: string;
  beforeOwnerGovId: string;
  afterOwnerName: string;
  afterOwnerGovId: string;
  salePrice: number;
  txHash: string;
  blockNumber?: number;
  createdAt: number;
}
