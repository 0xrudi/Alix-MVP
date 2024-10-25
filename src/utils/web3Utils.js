import Moralis from 'moralis';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { ethers } from 'ethers';
import Resolution from '@unstoppabledomains/resolution';
import { logger } from '../utils/logger';

const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;
const MAINNET_RPC_URL = 'https://ethereum.publicnode.com';
const BASE_RPC_URL = 'https://mainnet.base.org'
const resolution = new Resolution();

let moralisStartPromise = null;

const startMoralis = async () => {
  if (!moralisStartPromise) {
    moralisStartPromise = (async () => {
      if (!MORALIS_API_KEY) {
        throw new Error('Moralis API Key is not set');
      }
      try {
        await Moralis.start({
          apiKey: MORALIS_API_KEY,
        });
        return true;
      } catch (error) {
        if (error.message.includes('Modules are started already')) {
          return true; // Already started is fine
        }
        throw error; // Re-throw other errors
      }
    })();
  }
  return moralisStartPromise;
};

const withMoralis = async (fn) => {
  await startMoralis();
  return fn();
};

export const networks = [
  { value: "eth", label: "Ethereum", chain: "0x1", type: "evm" },
  { value: "polygon", label: "Polygon", chain: "0x89", type: "evm" },
  { value: "bsc", label: "Binance Smart Chain", chain: "0x38", type: "evm" },
  { value: "arbitrum", label: "Arbitrum", chain: "0xa4b1", type: "evm" },
  { value: "optimism", label: "Optimism", chain: "0xa", type: "evm" },
  { value: "avalanche", label: "Avalanche", chain: "0xa86a", type: "evm" },
  { value: "fantom", label: "Fantom", chain: "0xfa", type: "evm" },
  { value: "base", label: "Base", chain: "0x2105", type: "evm" }, 
  { value: "solana", label: "Solana", chain: "1", type: "solana" },
];

export const isValidBaseAddress = (address) => {
  try {
    const normalized = normalizeBaseAddress(address);
    return normalized.length === 42 && normalized.startsWith('0x');
  } catch {
    return false;
  }
};

export const getChainForNetwork = (networkValue) => {
  const network = networks.find(n => n.value === networkValue);
  if (network) {
    // Special handling for Base network
    if (networkValue === 'base') {
      return '0x2105'; // Base mainnet chain ID
    }
    return network.chain;
  }
  return null;
};

export const getNetworkType = (networkValue) => {
  const network = networks.find(n => n.value === networkValue);
  return network ? network.type : null;
};

export const fetchNFTs = async (address, network, cursor = null, limit = 100) => {
  const networkType = getNetworkType(network);

  if (networkType === 'evm') {
    if (network === 'base') {
      try {
        // Normalize the address for Base network
        const normalizedAddress = normalizeBaseAddress(address);
        
        const response = await Moralis.EvmApi.nft.getWalletNFTs({
          address: normalizedAddress,
          chain: getChainForNetwork(network),
          limit,
          cursor,
          normalizeMetadata: true,
        });

        const nfts = response.result.map(nft => ({
          id: { tokenId: nft.tokenId },
          contract: { 
            address: normalizeBaseAddress(nft.tokenAddress),
            name: nft.name,
            symbol: nft.symbol,
            type: nft.contractType
          },
          title: nft.metadata?.name || nft.name || `Token ID: ${nft.tokenId}`,
          description: nft.metadata?.description || '',
          media: [{
            gateway: nft.metadata?.image || nft.tokenUri || 'https://via.placeholder.com/150?text=No+Image'
          }],
          metadata: nft.metadata || {},
          isSpam: nft.possibleSpam,
          network: 'base'
        }));

        return { 
          nfts, 
          cursor: response.pagination.cursor
        };
      } catch (error) {
        logger.error('Error fetching Base NFTs:', error);
        throw error;
      }
    }
    return fetchEVMNFTs(address, network, cursor, limit);
  } else if (networkType === 'solana') {
    return fetchSolanaNFTs(address);
  } else {
    throw new Error(`Unsupported network type: ${networkType}`);
  }
};

const fetchEVMNFTs = (address, network, cursor = null, limit = 100) => 
  withMoralis(async () => {
    const chain = getChainForNetwork(network);
    if (!chain) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const response = await Moralis.EvmApi.nft.getWalletNFTs({
      address,
      chain,
      limit,
      cursor,
      normalizeMetadata: true,
    });

    const nfts = response.result.map(nft => ({
      id: { tokenId: nft.tokenId },
      contract: { 
        address: nft.tokenAddress,
        name: nft.name,
        symbol: nft.symbol
      },
      title: nft.metadata?.name || nft.name || `Token ID: ${nft.tokenId}`,
      description: nft.metadata?.description || '',
      media: [{
        gateway: nft.metadata?.image || nft.tokenUri || 'https://via.placeholder.com/150?text=No+Image'
      }],
      metadata: nft.metadata || {},
      isSpam: nft.possibleSpam
    }));

    return { 
      nfts, 
      cursor: response.pagination.cursor
    };
  });

const fetchSolanaNFTs = async (address) => {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const publicKey = new PublicKey(address);

  try {
    const nftArray = await getParsedNftAccountsByOwner({
      publicAddress: publicKey,
      connection: connection,
    });

    const nfts = nftArray.map(nft => ({
      id: { tokenId: nft.mint },
      contract: {
        address: nft.data.creators[0].address,
        name: nft.data.name,
        symbol: nft.data.symbol
      },
      title: nft.data.name,
      description: nft.data.description || '',
      media: [{
        gateway: nft.data.uri || 'https://via.placeholder.com/150?text=No+Image'
      }],
      metadata: nft.data,
      isSpam: false // Solana doesn't provide spam detection, so we set it to false by default
    }));

    return { nfts, cursor: null };
  } catch (error) {
    console.error("Error fetching Solana NFTs:", error);
    throw error;
  }
};

// Add this new utility function for Base address handling
const normalizeBaseAddress = (address) => {
  try {
    // Remove '0x' prefix if it exists
    const cleanAddress = address.toLowerCase().replace('0x', '');
    // Add '0x' prefix back and return
    return `0x${cleanAddress}`;
  } catch (error) {
    logger.error('Error normalizing Base address:', error);
    return address;
  }
};

export const getImageUrl = (nft) => {
  const possibleSources = [
    nft.metadata?.image_url,
    nft.metadata?.image,
    nft.media?.[0]?.gateway,
    nft.imageUrl,
    nft.metadata?.external_url
  ];

  for (let source of possibleSources) {
    if (source) {
      // Check if the source is an SVG string
      if (source.startsWith('data:image/svg+xml,')) {
        return source;
      }
      // Check if it's already a valid URL (including IPFS gateways)
      if (source.startsWith('http://') || source.startsWith('https://')) {
        return source;
      }
      // Handle IPFS protocol
      if (source.startsWith('ipfs://')) {
        const hash = source.replace('ipfs://', '');
        return `https://ipfs.io/ipfs/${hash}`;
      }
      // Handle Arweave protocol
      if (source.startsWith('ar://')) {
        const hash = source.replace('ar://', '');
        return `https://arweave.net/${hash}`;
      }
    }
  }

  return 'https://via.placeholder.com/400?text=No+Image';
};

export const resolveENS = async (ensName) => {
  const mainnetProvider = new ethers.providers.JsonRpcProvider(MAINNET_RPC_URL);
  
  try {
    if (ensName.toLowerCase().endsWith('.base.eth')) {
      try {
        const baseRegistryAddress = "0x4E2883Eb808584502326B3EA7b163f9E47a68E5D";
        const baseRegistryABI = [
          "function resolve(string name) view returns (address)",
        ];
        
        const baseRegistry = new ethers.Contract(
          baseRegistryAddress,
          baseRegistryABI,
          mainnetProvider
        );

        const rawAddress = await baseRegistry.resolve(ensName);
        
        if (rawAddress && rawAddress !== ethers.constants.AddressZero) {
          // Use our custom normalization for Base addresses
          const normalizedAddress = normalizeBaseAddress(rawAddress);
          return { success: true, address: normalizedAddress, type: 'evm' };
        }
      } catch (baseError) {
        logger.error('Error resolving Base domain:', baseError);
      }
    }

    // Try regular ENS resolution
    const address = await mainnetProvider.resolveName(ensName);
    if (address) {
      return { success: true, address, type: 'evm' };
    }

    return { success: false, message: 'ENS name not found or no address associated' };
  } catch (error) {
    logger.error('Error resolving ENS:', error);
    return { success: false, message: error.message || 'Error resolving ENS name' };
  }
};

// Update the BASE_PROVIDER initialization
const getBaseProvider = () => {
  return new ethers.providers.JsonRpcProvider(BASE_RPC_URL, {
    name: 'base',
    chainId: 8453,
    ensAddress: null // Base doesn't have native ENS support
  });
};

export const resolveUnstoppableDomain = async (domain) => {
  try {
    const address = await resolution.addr(domain, 'ETH');
    if (address) {
      return { success: true, address, type: 'evm' };
    }
  } catch (error) {
    console.error('Error resolving Unstoppable Domain:', error);
  }

  try {
    const address = await resolution.addr(domain, 'SOL');
    if (address) {
      return { success: true, address, type: 'solana' };
    }
  } catch (error) {
    console.error('Error resolving Unstoppable Domain for Solana:', error);
  }

  return { success: false, message: 'Unstoppable Domain not found or no address associated' };
};

export const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

export const isValidAddress = (address) => {
  // Check if it's a valid Ethereum address
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: true, type: 'evm' };
  }
  
  // Check if it's a valid Solana address
  if (isValidSolanaAddress(address)) {
    return { isValid: true, type: 'solana' };
  }

  return { isValid: false };
};

export const fetchENSAvatar = (ensName) => 
  withMoralis(async () => {
    try {
      const response = await axios.get(`https://deep-index.moralis.io/api/v2/resolve/ens/${ensName}`, {
        headers: {
          'X-API-Key': MORALIS_API_KEY,
        },
      });

      if (response.data && response.data.avatar) {
        return response.data.avatar;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching ENS avatar:', error);
      return null;
    }
  });

export const isNftSpam = (tokenId, contractAddress, spamNfts) => {
  return Object.values(spamNfts).flat().some(spam => spam.tokenId === tokenId && spam.contractAddress === contractAddress);
};

export const getAvailableENS = (wallets) => {
  if (!wallets || !Array.isArray(wallets)) {
    return [];
  }
  return wallets
    .filter(wallet => wallet.nickname && wallet.nickname.endsWith('.eth'))
    .map(wallet => wallet.nickname);
};