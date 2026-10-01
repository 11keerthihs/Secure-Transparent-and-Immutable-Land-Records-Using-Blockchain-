export interface LandRecord {
  id: number;
  parcelId: string;
  surveyNumber: string;
  plotNumber: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  addressLine: string;
  landUse: string;
  area: number;
  areaUnit: string;
  coordinates: string;
  ownerName: string;
  ownerGovId: string; // SHA-256 hash or masked ID
  documentHash: string; // SHA-256 cryptographic digest of title deed
  marketValue: number;
  registrationDate: number; // Unix timestamp
  status: 'VERIFIED' | 'PENDING_TRANSFER' | 'TRANSFERRED' | string;
  exists: boolean;
  txHash?: string;
  blockNumber?: number;
}

export interface BlockchainConnectionState {
  isConnected: boolean;
  isSimulatedFallback: boolean;
  rpcUrl: string;
  chainId: number;
  contractAddress: string;
  contractCodeFound: boolean;
  latestBlock: number;
  deployerAddress: string;
  errorMessage?: string;
  lastChecked: Date;
}
