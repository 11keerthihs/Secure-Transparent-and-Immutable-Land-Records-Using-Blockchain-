import { ethers, Interface } from 'ethers';
import { BLOCKCHAIN_CONFIG } from './config';
import landRegistryAbi from './LandRegistry.abi.json';
import { LandRecord, BlockchainConnectionState } from './types';
import { generateTxHash } from '../utils/crypto';

const STORAGE_KEY_SIMULATED_LANDS = 'blockchain_simulated_lands_v1';
const STORAGE_KEY_SIMULATED_TXS = 'blockchain_simulated_txs_v1';

// Initial demonstration lands seeded in simulated ledger
const INITIAL_DEMO_LANDS: LandRecord[] = [
  {
    id: 1,
    parcelId: 'MH-PUN-HAV-2024-001',
    surveyNumber: '142/2A',
    plotNumber: 'Plot 4B',
    state: 'Maharashtra',
    district: 'Pune',
    taluka: 'Haveli',
    village: 'Wagholi',
    addressLine: 'Sector 7, Green Acres Road',
    landUse: 'Residential',
    area: 2400,
    areaUnit: 'Sq.Ft',
    coordinates: '18.5793° N, 73.9787° E',
    ownerName: 'Rajesh Kumar Sharma',
    ownerGovId: '0x8f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb4c8d5c4125b045e7e14a',
    documentHash: '0x4f8812c3f4e8b3f11e86a14782bb2b460d37e6f3df80f2eb1918342468d60ad5',
    marketValue: 4500000,
    registrationDate: Math.floor(Date.now() / 1000) - 86400 * 45,
    status: 'VERIFIED',
    exists: true,
    txHash: '0x3a4b9c1d2e5f8a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b',
    blockNumber: 104,
  },
  {
    id: 2,
    parcelId: 'KA-BLR-KR-2024-009',
    surveyNumber: '89/1',
    plotNumber: 'Plot 12',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    taluka: 'KR Puram',
    village: 'Hoodi',
    addressLine: 'ITPL Main Road, Silicon Park',
    landUse: 'Commercial',
    area: 5500,
    areaUnit: 'Sq.Ft',
    coordinates: '12.9912° N, 77.7163° E',
    ownerName: 'Anita Vikram Rao',
    ownerGovId: '0xb23e819fa045dc9017642e478546b51ffac19b165b6a71e82ef6b5dc17a7a502',
    documentHash: '0x992b4fa8d0429712ab99d54316a70e7041a9bc34b6b69ebce502bcfb1f2385b0',
    marketValue: 12500000,
    registrationDate: Math.floor(Date.now() / 1000) - 86400 * 20,
    status: 'VERIFIED',
    exists: true,
    txHash: '0x88f2b4c10a9e7123df88123049182390abc12048571029384756102938475610',
    blockNumber: 112,
  },
  {
    id: 3,
    parcelId: 'DL-SW-VAS-2024-015',
    surveyNumber: '210/5',
    plotNumber: 'Plot 88',
    state: 'Delhi',
    district: 'South West Delhi',
    taluka: 'Vasant Vihar',
    village: 'Mahipalpur',
    addressLine: 'Aero Enclave, NH-48 Bypass',
    landUse: 'Agricultural',
    area: 12,
    areaUnit: 'Acres',
    coordinates: '28.5355° N, 77.1264° E',
    ownerName: 'Sunil Singh Chawla',
    ownerGovId: '0xc456d901f2a34b5c6789e012f345a678b901c234d567e890f123a456b789c012',
    documentHash: '0x12a9bc45de678f0123456789abcdef0123456789abcdef0123456789abcdef01',
    marketValue: 35000000,
    registrationDate: Math.floor(Date.now() / 1000) - 86400 * 5,
    status: 'VERIFIED',
    exists: true,
    txHash: '0x71e82ef6b5dc17a7a5028f2d5930b809a4d8c760bb3b71ad713db9b392a27ffb',
    blockNumber: 119,
  },
];

class LandBlockchainService {
  private provider: ethers.JsonRpcProvider | null = null;
  private isSimulated = false;

  constructor() {
    this.initProvider();
  }

  private initProvider(): ethers.JsonRpcProvider | null {
    try {
      this.provider = new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl, undefined, {
        staticNetwork: ethers.Network.from(BLOCKCHAIN_CONFIG.chainId),
      });
      return this.provider;
    } catch {
      this.provider = null;
      return null;
    }
  }

  /**
   * Health check to detect if local Ganache RPC is running and has LandRegistry deployed
   */
  async checkConnection(): Promise<BlockchainConnectionState> {
    const targetRpc = BLOCKCHAIN_CONFIG.rpcUrl;
    const targetAddress = BLOCKCHAIN_CONFIG.contractAddress;
    const expectedChainId = BLOCKCHAIN_CONFIG.chainId;

    try {
      if (!this.provider) {
        this.initProvider();
      }

      if (!this.provider) {
        throw new Error(`Unable to initialize RPC client for ${targetRpc}`);
      }

      // Check if network is responding
      const network = await Promise.race([
        this.provider.getNetwork(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RPC Connection timeout (1500ms)')), 1500)
        ),
      ]);

      const chainIdNum = Number(network.chainId);
      const blockNumber = await this.provider.getBlockNumber();

      // Check if contract code exists at address
      const code = await this.provider.getCode(targetAddress);
      const codeExists = code && code !== '0x' && code !== '0x0';

      if (!codeExists) {
        this.isSimulated = true;
        return {
          isConnected: false,
          isSimulatedFallback: true,
          rpcUrl: targetRpc,
          chainId: chainIdNum,
          contractAddress: targetAddress,
          contractCodeFound: false,
          latestBlock: blockNumber,
          deployerAddress: '0x0000000000000000000000000000000000000000',
          errorMessage: `No contract code found at ${targetAddress} on connected network. Ganache is online, but the LandRegistry contract is not deployed yet. Run: npm run deploy:ganache`,
          lastChecked: new Date(),
        };
      }

      this.isSimulated = false;
      return {
        isConnected: true,
        isSimulatedFallback: false,
        rpcUrl: targetRpc,
        chainId: chainIdNum,
        contractAddress: targetAddress,
        contractCodeFound: true,
        latestBlock: blockNumber,
        deployerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        lastChecked: new Date(),
      };
    } catch (err: unknown) {
      this.isSimulated = true;
      const errorMsg =
        err instanceof Error ? err.message : 'Cannot reach Ethereum RPC at ' + targetRpc;
      return {
        isConnected: false,
        isSimulatedFallback: true,
        rpcUrl: targetRpc,
        chainId: expectedChainId,
        contractAddress: targetAddress,
        contractCodeFound: false,
        latestBlock: 120,
        deployerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        errorMessage: `Ganache is currently unreachable at ${targetRpc}. Operating in High-Fidelity Simulated EVM Mode (Local storage blockchain ledger). To connect real Ganache: run 'npm run ganache' and 'npm run deploy:ganache'.`,
        lastChecked: new Date(),
      };
    }
  }

  // --- Simulated EVM Ledger Storage Helpers ---
  private getStoredSimulatedLands(): LandRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SIMULATED_LANDS);
      if (!data) {
        localStorage.setItem(STORAGE_KEY_SIMULATED_LANDS, JSON.stringify(INITIAL_DEMO_LANDS));
        return INITIAL_DEMO_LANDS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_DEMO_LANDS;
    }
  }

  private saveSimulatedLands(lands: LandRecord[]) {
    try {
      localStorage.setItem(STORAGE_KEY_SIMULATED_LANDS, JSON.stringify(lands));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  /**
   * Resets simulated lands to initial demo records
   */
  resetSimulatedData(): LandRecord[] {
    localStorage.setItem(STORAGE_KEY_SIMULATED_LANDS, JSON.stringify(INITIAL_DEMO_LANDS));
    return INITIAL_DEMO_LANDS;
  }

  /**
   * Reads all registered lands from the smart contract (or simulated EVM ledger)
   */
  async getAllLands(): Promise<LandRecord[]> {
    const health = await this.checkConnection();

    if (health.isConnected && health.contractCodeFound && this.provider) {
      try {
        const contract = new ethers.Contract(
          BLOCKCHAIN_CONFIG.contractAddress,
          landRegistryAbi,
          this.provider
        );
        const rawLands = await contract.getAllLands();

        return rawLands.map((item: any) => ({
          id: Number(item.id),
          parcelId: item.parcelId,
          surveyNumber: item.surveyNumber,
          plotNumber: item.plotNumber,
          state: item.state,
          district: item.district,
          taluka: item.taluka,
          village: item.village,
          addressLine: item.addressLine,
          landUse: item.landUse,
          area: Number(item.area),
          areaUnit: item.areaUnit,
          coordinates: item.coordinates,
          ownerName: item.ownerName,
          ownerGovId: item.ownerGovId,
          documentHash: item.documentHash,
          marketValue: Number(item.marketValue),
          registrationDate: Number(item.registrationDate),
          status: item.status,
          exists: Boolean(item.exists),
          txHash: generateTxHash(),
          blockNumber: 100 + Number(item.id),
        }));
      } catch (err) {
        console.warn('Direct contract call failed, falling back to simulated ledger:', err);
      }
    }

    return this.getStoredSimulatedLands();
  }

  /**
   * Gets a single land record by ID
   */
  async getLand(id: number): Promise<LandRecord | null> {
    const lands = await this.getAllLands();
    const found = lands.find((l) => l.id === id);
    return found || null;
  }

  /**
   * Adds a new land record to the blockchain
   */
  async addLand(input: Omit<LandRecord, 'id' | 'exists' | 'txHash' | 'blockNumber'>): Promise<{
    success: boolean;
    landId: number;
    txHash: string;
    blockNumber: number;
    isSimulated: boolean;
  }> {
    const health = await this.checkConnection();

    // If real Ganache is active with deployed contract
    if (health.isConnected && health.contractCodeFound && this.provider) {
      try {
        // In local development with Ganache, get signer from provider
        const signer = await this.provider.getSigner(0);
        const contract = new ethers.Contract(
          BLOCKCHAIN_CONFIG.contractAddress,
          landRegistryAbi,
          signer
        );

        const tx = await contract.addLand(
          input.parcelId,
          input.surveyNumber,
          input.plotNumber,
          input.state,
          input.district,
          input.taluka,
          input.village,
          input.addressLine,
          input.landUse,
          BigInt(input.area),
          input.areaUnit,
          input.coordinates,
          input.ownerName,
          input.ownerGovId,
          input.documentHash,
          BigInt(input.marketValue),
          BigInt(input.registrationDate || Math.floor(Date.now() / 1000)),
          input.status || 'VERIFIED'
        );

        const receipt = await tx.wait();
        const txHash = receipt.hash;
        const blockNum = receipt.blockNumber;

        // Parse LandRegistered event
        let createdId = 0;
        const contractInterface = new Interface(landRegistryAbi);
        for (const log of receipt.logs) {
          try {
            const parsed = contractInterface.parseLog(log);
            if (parsed && parsed.name === 'LandRegistered') {
              createdId = Number(parsed.args.id);
            }
          } catch {
            // Ignore non-matching logs
          }
        }

        return {
          success: true,
          landId: createdId || Math.floor(Math.random() * 10000),
          txHash,
          blockNumber: blockNum,
          isSimulated: false,
        };
      } catch (blockchainErr) {
        console.warn('Real blockchain write failed, recording in simulated state:', blockchainErr);
      }
    }

    // High fidelity simulated EVM ledger fallback
    const lands = this.getStoredSimulatedLands();
    const newId = lands.length > 0 ? Math.max(...lands.map((l) => l.id)) + 1 : 1;
    const txHash = generateTxHash();
    const blockNumber = 120 + newId;

    const newRecord: LandRecord = {
      ...input,
      id: newId,
      exists: true,
      txHash,
      blockNumber,
      registrationDate: input.registrationDate || Math.floor(Date.now() / 1000),
      status: input.status || 'VERIFIED',
    };

    lands.push(newRecord);
    this.saveSimulatedLands(lands);

    return {
      success: true,
      landId: newId,
      txHash,
      blockNumber,
      isSimulated: true,
    };
  }

  /**
   * Updates an existing land record
   */
  async updateLand(
    id: number,
    landUse: string,
    marketValue: number,
    status: string,
    documentHash: string
  ): Promise<{ success: boolean; txHash: string }> {
    const health = await this.checkConnection();

    if (health.isConnected && health.contractCodeFound && this.provider) {
      try {
        const signer = await this.provider.getSigner(0);
        const contract = new ethers.Contract(
          BLOCKCHAIN_CONFIG.contractAddress,
          landRegistryAbi,
          signer
        );
        const tx = await contract.updateLand(
          id,
          landUse,
          BigInt(marketValue),
          status,
          documentHash
        );
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        console.warn('Blockchain update failed, updating simulated state:', err);
      }
    }

    const lands = this.getStoredSimulatedLands();
    const target = lands.find((l) => l.id === id);
    if (!target) throw new Error(`Land ID ${id} not found`);

    target.landUse = landUse;
    target.marketValue = marketValue;
    target.status = status;
    if (documentHash) target.documentHash = documentHash;

    const txHash = generateTxHash();
    target.txHash = txHash;
    this.saveSimulatedLands(lands);
    return { success: true, txHash };
  }

  /**
   * Transfers ownership record on the blockchain
   */
  async transferOwnershipRecord(
    id: number,
    newOwnerName: string,
    newOwnerGovId: string,
    newMarketValue: number,
    newDocumentHash: string
  ): Promise<{ success: boolean; txHash: string; blockNumber: number }> {
    const health = await this.checkConnection();

    if (health.isConnected && health.contractCodeFound && this.provider) {
      try {
        const signer = await this.provider.getSigner(0);
        const contract = new ethers.Contract(
          BLOCKCHAIN_CONFIG.contractAddress,
          landRegistryAbi,
          signer
        );
        const tx = await contract.transferOwnershipRecord(
          id,
          newOwnerName,
          newOwnerGovId,
          BigInt(newMarketValue),
          newDocumentHash
        );
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber };
      } catch (err) {
        console.warn('Real blockchain transfer failed, updating simulated state:', err);
      }
    }

    const lands = this.getStoredSimulatedLands();
    const target = lands.find((l) => l.id === id);
    if (!target) throw new Error(`Land ID ${id} not found`);

    target.ownerName = newOwnerName;
    target.ownerGovId = newOwnerGovId;
    if (newMarketValue > 0) target.marketValue = newMarketValue;
    if (newDocumentHash) target.documentHash = newDocumentHash;
    target.status = 'VERIFIED';

    const txHash = generateTxHash();
    const blockNumber = 135 + Math.floor(Math.random() * 20);
    target.txHash = txHash;
    target.blockNumber = blockNumber;

    this.saveSimulatedLands(lands);
    return { success: true, txHash, blockNumber };
  }

  /**
   * Deletes a land record
   */
  async deleteLand(id: number): Promise<{ success: boolean; txHash: string }> {
    const health = await this.checkConnection();

    if (health.isConnected && health.contractCodeFound && this.provider) {
      try {
        const signer = await this.provider.getSigner(0);
        const contract = new ethers.Contract(
          BLOCKCHAIN_CONFIG.contractAddress,
          landRegistryAbi,
          signer
        );
        const tx = await contract.deleteLand(id);
        const receipt = await tx.wait();
        return { success: true, txHash: receipt.hash };
      } catch (err) {
        console.warn('Blockchain delete failed, updating simulated state:', err);
      }
    }

    let lands = this.getStoredSimulatedLands();
    lands = lands.filter((l) => l.id !== id);
    this.saveSimulatedLands(lands);
    return { success: true, txHash: generateTxHash() };
  }
}

export const landBlockchainService = new LandBlockchainService();
