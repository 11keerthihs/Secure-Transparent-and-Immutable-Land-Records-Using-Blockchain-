import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BlockchainConnectionState } from '../blockchain/types';
import { landBlockchainService } from '../blockchain/landService';
import { BLOCKCHAIN_CONFIG } from '../blockchain/config';

interface BlockchainContextType {
  state: BlockchainConnectionState;
  refreshConnection: () => Promise<void>;
  isChecking: boolean;
}

const defaultState: BlockchainConnectionState = {
  isConnected: false,
  isSimulatedFallback: true,
  rpcUrl: BLOCKCHAIN_CONFIG.rpcUrl,
  chainId: BLOCKCHAIN_CONFIG.chainId,
  contractAddress: BLOCKCHAIN_CONFIG.contractAddress,
  contractCodeFound: false,
  latestBlock: 120,
  deployerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
  lastChecked: new Date(),
};

const BlockchainContext = createContext<BlockchainContextType | undefined>(undefined);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BlockchainConnectionState>(defaultState);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const res = await landBlockchainService.checkConnection();
      setState(res);
    } catch {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isSimulatedFallback: true,
        lastChecked: new Date(),
      }));
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <BlockchainContext.Provider
      value={{
        state,
        refreshConnection: checkStatus,
        isChecking,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = (): BlockchainContextType => {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
};
