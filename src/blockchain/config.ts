import addressData from './address.json';

// Support both Vite import.meta.env and CRA process.env conventions
const getEnv = (key: string, fallback: string = ''): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const BLOCKCHAIN_CONFIG = {
  rpcUrl:
    getEnv('VITE_GANACHE_RPC') ||
    getEnv('REACT_APP_GANACHE_RPC') ||
    'http://127.0.0.1:7545',
  chainId: 1337,
  contractAddress:
    getEnv('VITE_LAND_REGISTRY_ADDRESS') ||
    getEnv('REACT_APP_LAND_REGISTRY_ADDRESS') ||
    addressData.LandRegistry ||
    '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  blockExplorerTxBase:
    getEnv('VITE_BLOCK_EXPLORER_TX_BASE') ||
    getEnv('REACT_APP_BLOCK_EXPLORER_TX_BASE') ||
    '',
};
