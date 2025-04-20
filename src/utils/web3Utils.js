import Moralis from 'moralis';
import axios from 'axios';
import { Connection, PublicKey } from '@solana/web3.js';
import { getParsedNftAccountsByOwner } from "@nfteyez/sol-rayz";
import { ethers } from 'ethers';
import Resolution from '@unstoppabledomains/resolution';
import { logger } from './logger';
import { fetchWithCorsProxy, needsCorsProxy, applyCorsProxy } from './corsProxy';

const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;
const MAINNET_RPC_URL = process.env.REACT_APP_ETHEREUM_RPC_URL;
const BASE_RPC_URL = process.env.REACT_APP_BASE_RPC_URL;

// Define all supported networks
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

const resolution = new Resolution();

// Track Moralis initialization to prevent multiple starts
let moralisStartPromise = null;

/**
 * Initialize Moralis safely with error handling
 */
const startMoralis = async () => {
  if (!moralisStartPromise) {
    moralisStartPromise = (async () => {
      if (!MORALIS_API_KEY) {
        throw new Error('Moralis API Key is not set');
      }
      try {
        logger.info('Starting Moralis with API key:', MORALIS_API_KEY.substring(0, 8) + '...');
        await Moralis.start({
          apiKey: MORALIS_API_KEY,
        });
        logger.info('Moralis started successfully');
        return true;
      } catch (error) {
        // Special case: if Moralis is already started, that's fine
        if (error.message && error.message.includes('Modules are started already')) {
          logger.info('Moralis was already started');
          return true;
        }
        
        logger.error('Error starting Moralis:', error);
        throw error;
      }
    })();
  }
  return moralisStartPromise;
};

/**
 * Execute a function with Moralis initialized
 */
const withMoralis = async (fn) => {
  await startMoralis();
  return fn();
};

/**
 * Get the chain ID for a network
 */
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

/**
 * Get the network type (evm or solana)
 */
export const getNetworkType = (networkValue) => {
  const network = networks.find(n => n.value === networkValue);
  return network ? network.type : null;
};

/**
 * Main function to fetch NFTs with improved error handling
 */

export const fetchNFTs = async (address, network, cursor = null, limit = 100, progressCallback = null) => {
  try {
    const networkType = getNetworkType(network);
    if (!networkType) {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    logger.info(`Fetching NFTs for address ${address} on ${network}`);
    
    // Report initial progress
    if (progressCallback) {
      progressCallback({
        network,
        status: 'started',
        progress: 0
      });
    }

    // *** NEW CODE: Resolve ENS domains to addresses BEFORE calling Moralis ***
    let resolvedAddress = address;
    
    // Check if this is an ENS domain
    if (typeof address === 'string' && (address.endsWith('.eth') || address.includes('.'))) {
      // Report progress for ENS resolution
      if (progressCallback) {
        progressCallback({
          network,
          status: 'resolving_ens',
          progress: 5
        });
      }
      
      logger.info(`Resolving ENS domain: ${address}`);
      
      try {
        // Use the ENS resolution function first
        const ensResult = await resolveENS(address);
        
        if (ensResult.success) {
          // Use the resolved address
          resolvedAddress = ensResult.address;
          logger.info(`Resolved ENS ${address} to ${resolvedAddress}`);
        } else if (address.endsWith('.eth')) {
          // Try fallback resolution for .eth domains
          throw new Error(`Could not resolve ENS domain: ${ensResult.message}`);
        } else {
          // For non-.eth domains, try Unstoppable Domains
          const udResult = await resolveUnstoppableDomain(address);
          
          if (udResult.success) {
            resolvedAddress = udResult.address;
            logger.info(`Resolved Unstoppable Domain ${address} to ${resolvedAddress}`);
          } else {
            throw new Error('Could not resolve domain. Please use a valid address.');
          }
        }
      } catch (resolutionError) {
        logger.error(`Failed to resolve domain: ${address}`, resolutionError);
        throw new Error(`Could not resolve domain ${address}. Please use a valid address.`);
      }
    }
    
    // Now we have a resolved address, continue with the regular flow
    // *** END NEW CODE ***

    if (networkType === 'evm') {
      if (network === 'base') {
        // Special handling for Base network
        return await fetchBaseNFTs(resolvedAddress, cursor, limit, progressCallback);
      }
      return await fetchEVMNFTs(resolvedAddress, network, cursor, limit, progressCallback);
    } else if (networkType === 'solana') {
      return await fetchSolanaNFTs(resolvedAddress, progressCallback);
    } else {
      throw new Error(`Unsupported network type: ${networkType}`);
    }
  } catch (error) {
    logger.error(`Failed to fetch NFTs for ${network}:`, error);
    
    // Report error progress
    if (progressCallback) {
      progressCallback({
        network,
        status: 'error',
        progress: 100,
        error: error.message
      });
    }
    
    // Return empty result instead of throwing
    return { nfts: [], cursor: null };
  }
};

/**
 * Fetch NFTs for Base network with specific error handling
 */
const fetchBaseNFTs = async (address, cursor = null, limit = 100, progressCallback = null) => {
  try {
    // Report progress
    if (progressCallback) {
      progressCallback({
        network: 'base',
        status: 'normalizing',
        progress: 10
      });
    }
    
    // Use the utility function to normalize address
    const normalizedAddress = normalizeBaseAddress(address);
    
    logger.info('Base network - Normalized address:', normalizedAddress);
    
    // Report progress
    if (progressCallback) {
      progressCallback({
        network: 'base',
        status: 'fetching',
        progress: 30
      });
    }
    
    return withMoralis(async () => {
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: normalizedAddress,
        chain: getChainForNetwork('base'),
        limit,
        cursor,
        normalizeMetadata: true,
      });
      
      // Convert response to JSON to ensure it's serializable
      const serializedResponse = response.toJSON ? response.toJSON() : JSON.parse(JSON.stringify(response));
      
      // Log the serialized response data
      logger.debug('Raw Moralis response for Base network:', {
        responseData: serializedResponse,
        resultCount: response.result.length
      });
      
      // Report progress
      if (progressCallback) {
        progressCallback({
          network: 'base',
          status: 'processing',
          progress: 60,
          count: response.result.length
        });
      }

      // Log the raw response for Base network
      logger.debug('Base network - found NFTs:', response.result.length);

      const nfts = response.result.map(nft => {
        // Make sure we serialize the NFT data properly
        const serializedNft = nft.toJSON ? nft.toJSON() : JSON.parse(JSON.stringify(nft));
        
        return {
          id: { tokenId: serializedNft.tokenId },
          contract: { 
            address: normalizeBaseAddress(serializedNft.tokenAddress),
            name: serializedNft.name,
            symbol: serializedNft.symbol,
            type: serializedNft.contractType
          },
          title: serializedNft.metadata?.name || serializedNft.name || `Token ID: ${serializedNft.tokenId}`,
          description: serializedNft.metadata?.description || '',
          media: [{
            gateway: serializedNft.metadata?.image || serializedNft.tokenUri || 'https://via.placeholder.com/150?text=No+Image'
          }],
          metadata: serializedNft.metadata || {},
          isSpam: serializedNft.possibleSpam,
          network: 'base',
          // Include the raw response data in a serialized format
          _rawData: serializedNft
        };
      });
      
      // Report complete progress
      if (progressCallback) {
        progressCallback({
          network: 'base',
          status: 'success',
          progress: 100,
          count: nfts.length
        });
      }

      return { 
        nfts, 
        cursor: response.pagination.cursor
      };
    });
  } catch (error) {
    logger.error('Error in Base NFT fetching:', {
      error: error.message,
      stack: error.stack,
      address
    });
    
    // Report error progress
    if (progressCallback) {
      progressCallback({
        network: 'base',
        status: 'error',
        progress: 100,
        error: error.message
      });
    }
    
    return { nfts: [], cursor: null };
  }
};

/**
 * Fetch EVMs NFTs with improved error handling
 */

const fetchEVMNFTs = async (address, network, cursor = null, limit = 100, progressCallback = null) => {
  try {
    // Report progress
    if (progressCallback) {
      progressCallback({
        network,
        status: 'preparing',
        progress: 10
      });
    }
    
    return withMoralis(async () => {
      const chain = getChainForNetwork(network);
      if (!chain) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // Report progress
      if (progressCallback) {
        progressCallback({
          network,
          status: 'fetching',
          progress: 30
        });
      }

      // Add retry logic for better reliability
      let retries = 2;
      let lastError = null;
      
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          // Add small delay between retries
          if (attempt > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            logger.info(`Retry attempt ${attempt} for ${network}`);
          }
          
          const response = await Moralis.EvmApi.nft.getWalletNFTs({
            address,
            chain,
            limit,
            cursor,
            normalizeMetadata: true,
          });
          
          // Convert response to JSON to ensure it's serializable
          // Use toJSON() if available, otherwise serialize manually
          const serializedResponse = response.toJSON ? response.toJSON() : JSON.parse(JSON.stringify(response));
          
          // Log the serialized response data
          logger.debug(`Raw Moralis response for ${network}:`, {
            responseData: serializedResponse,
            resultCount: response.result.length
          });
          
          // Process the results
          logger.debug(`Found ${response.result.length} NFTs on ${network}`);
          
          // Report progress
          if (progressCallback) {
            progressCallback({
              network,
              status: 'processing',
              progress: 60,
              count: response.result.length
            });
          }

          const nfts = response.result.map(nft => {
            // Make sure we serialize the NFT data properly
            const serializedNft = nft.toJSON ? nft.toJSON() : JSON.parse(JSON.stringify(nft));
            
            return {
              id: { tokenId: serializedNft.tokenId },
              contract: { 
                address: serializedNft.tokenAddress,
                name: serializedNft.name,
                symbol: serializedNft.symbol,
                type: serializedNft.contractType
              },
              title: serializedNft.metadata?.name || serializedNft.name || `Token ID: ${serializedNft.tokenId}`,
              description: serializedNft.metadata?.description || '',
              media: [{
                gateway: serializedNft.metadata?.image || serializedNft.tokenUri || 'https://via.placeholder.com/150?text=No+Image'
              }],
              metadata: serializedNft.metadata || {},
              isSpam: serializedNft.possibleSpam,
              network,
              // Include the raw response data in a serialized format
              _rawData: serializedNft
            };
          });
          
          // Report complete progress
          if (progressCallback) {
            progressCallback({
              network,
              status: 'success',
              progress: 100,
              count: nfts.length
            });
          }

          return { 
            nfts, 
            cursor: response.pagination.cursor
          };
        } catch (error) {
          lastError = error;
          logger.warn(`Attempt ${attempt + 1}/${retries + 1} failed for ${network}:`, error);
          
          // Don't retry some errors
          if (
            error.message?.includes('Invalid address') || 
            error.status === 404
          ) {
            break;
          }
        }
      }
      
      // If we got here, all retries failed
      throw lastError || new Error(`Failed to fetch NFTs from ${network}`);
    });
  } catch (error) {
    logger.error(`Error fetching NFTs for ${network}:`, error);
    
    // Report error progress
    if (progressCallback) {
      progressCallback({
        network,
        status: 'error',
        progress: 100,
        error: error.message
      });
    }
    
    return { nfts: [], cursor: null };
  }
};

/**
 * Fetch Solana NFTs with improved error handling
 */
const fetchSolanaNFTs = async (address, progressCallback = null) => {
  try {
    // Report progress
    if (progressCallback) {
      progressCallback({
        network: 'solana',
        status: 'connecting',
        progress: 10
      });
    }
    
    const connection = new Connection("https://api.mainnet-beta.solana.com");
    const publicKey = new PublicKey(address);
    
    // Report progress
    if (progressCallback) {
      progressCallback({
        network: 'solana',
        status: 'fetching',
        progress: 30
      });
    }

    const nftArray = await getParsedNftAccountsByOwner({
      publicAddress: publicKey,
      connection: connection,
    });
    
    // Report progress
    if (progressCallback) {
      progressCallback({
        network: 'solana',
        status: 'processing',
        progress: 60,
        count: nftArray.length
      });
    }

    const nfts = nftArray.map(nft => ({
      id: { tokenId: nft.mint },
      contract: {
        address: nft.data.creators?.[0]?.address || nft.mint,
        name: nft.data.name,
        symbol: nft.data.symbol
      },
      title: nft.data.name,
      description: nft.data.description || '',
      media: [{
        gateway: nft.data.uri || 'https://via.placeholder.com/150?text=No+Image'
      }],
      metadata: nft.data,
      isSpam: false, // Solana doesn't provide spam detection
      network: 'solana'
    }));
    
    // Report complete progress
    if (progressCallback) {
      progressCallback({
        network: 'solana',
        status: 'success',
        progress: 100,
        count: nfts.length
      });
    }

    return { nfts, cursor: null };
  } catch (error) {
    logger.error("Error fetching Solana NFTs:", error);
    
    // Report error progress
    if (progressCallback) {
      progressCallback({
        network: 'solana',
        status: 'error',
        progress: 100,
        error: error.message
      });
    }
    
    return { nfts: [], cursor: null };
  }
};

/**
 * Get image URL with CORS handling
 */
export const getImageUrl = async (nft) => {
  const logDebug = (source, url) => {
    logger.debug(`[NFT: ${nft.title || nft.id?.tokenId}] Image Resolution:`, {
      source,
      url,
      tokenId: nft.id?.tokenId,
      contract: nft.contract?.address
    });
  };

  // Check for audio NFT based on media_type field
  const isAudioNFT = nft.media_type === 'audio';

  if (isAudioNFT) {
    logDebug('Audio NFT detected', null);
    return 'https://via.placeholder.com/400?text=Audio+NFT';
  }

  // First prioritize the cover_image_url field if it exists
  if (nft.cover_image_url) {
    logDebug('Using cover_image_url', nft.cover_image_url);
    return nft.cover_image_url;
  }

  // Gather all possible image sources
  const possibleSources = [
    { key: 'metadata.image', value: nft.metadata?.image },
    { key: 'media.gateway', value: nft.media?.[0]?.gateway },
    { key: 'metadata.image_url', value: nft.metadata?.image_url },
    { key: 'artwork.uri', value: nft.metadata?.artwork?.uri },
    { key: 'tokenUri', value: nft.tokenUri },
    { key: 'external_url', value: nft.metadata?.external_url },
    { key: 'media_url', value: nft.media_url }, // Added media_url as fallback
  ].filter(source => !!source.value);

  logDebug('Possible image sources', possibleSources);

  // First, check for simple image URLs that don't need validation
  for (const source of possibleSources) {
    const url = source.value;
    
    // Direct use cases that are safe and don't need proxying/validation
    if (typeof url === 'string') {
      // Case 1: Data URLs can be used directly
      if (url.startsWith('data:image/')) {
        logDebug('Found data URL image', url);
        return url;
      }
      
      // Case 2: URLs with common image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
      if (imageExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
        logDebug('Found direct image URL with known extension', url);
        return url;
      }
    }
  }

  // For other cases, try our improved approach with less CORS issues
  for (const source of possibleSources) {
    if (!source.value) continue;
    
    logDebug('Processing source', source);
    const url = source.value;
    
    try {
      // Handle IPFS URLs
      if (typeof url === 'string' && (url.startsWith('ipfs://') || url.includes('/ipfs/'))) {
        let ipfsUrl = url;
        
        // Convert ipfs:// to HTTP URL
        if (url.startsWith('ipfs://')) {
          const hash = url.replace('ipfs://', '');
          ipfsUrl = `https://ipfs.io/ipfs/${hash}`;
        }
        
        logDebug('Converted IPFS URL', ipfsUrl);
        return ipfsUrl;
      }

      // Handle Arweave URLs directly
      if (typeof url === 'string' && (url.startsWith('ar://') || url.includes('arweave.net'))) {
        let arweaveUrl = url;
        
        // Convert ar:// to HTTP URL
        if (url.startsWith('ar://')) {
          const hash = url.replace('ar://', '');
          arweaveUrl = `https://arweave.net/${hash}`;
        }
        
        logDebug('Using Arweave URL directly', arweaveUrl);
        return arweaveUrl;
      }

      // For all other URLs, return as-is
      return url;
    } catch (error) {
      logDebug('Error processing source', {
        source: source.value,
        error: error.message
      });
    }
  }

  // Special placeholder based on media type if no valid URL found
  if (nft.media_type) {
    switch (nft.media_type) {
      case 'audio':
        return 'https://via.placeholder.com/400?text=Audio+Content';
      case 'video':
        return 'https://via.placeholder.com/400?text=Video+Content';
      case 'article':
        return 'https://via.placeholder.com/400?text=Article+Content';
      case '3d':
        return 'https://via.placeholder.com/400?text=3D+Model';
      case 'animation':
        return 'https://via.placeholder.com/400?text=Animation';
      default:
        break;
    }
  }

  // Fallback to generic placeholder if no valid URL found
  logDebug('No valid image URL found, using placeholder', null);
  return 'https://via.placeholder.com/400?text=No+Image';
};

/**
 * Helper function for Base addresses
 */
export const normalizeBaseAddress = (address) => {
  try {
    if (!address) {
      logger.error('Attempted to normalize null/undefined Base address');
      return '';
    }
    
    // Handle Moralis EvmAddress object
    if (typeof address === 'object' && address._value) {
      return address._value.toLowerCase();
    }
    
    if (typeof address !== 'string') {
      logger.error('Invalid address type:', {
        address,
        type: typeof address
      });
      // Try to get string representation
      if (address.toString && typeof address.toString === 'function') {
        address = address.toString();
      } else {
        return '';
      }
    }
    
    // Remove '0x' prefix if it exists and convert to lowercase
    const cleanAddress = address.toLowerCase().replace('0x', '');
    // Add '0x' prefix back and return
    return `0x${cleanAddress}`;
  } catch (error) {
    logger.error('Error normalizing Base address:', {
      error: error.message,
      address
    });
    return address || '';
  }
};

/**
 * Check if Base address is valid
 */
export const isValidBaseAddress = (address) => {
  try {
    const normalized = normalizeBaseAddress(address);
    return normalized.length === 42 && normalized.startsWith('0x');
  } catch {
    return false;
  }
};

/**
 * Resolve ENS domain to address
 */
export const resolveENS = async (ensName) => {
  const mainnetProvider = new ethers.providers.JsonRpcProvider(MAINNET_RPC_URL);
  
  try {
    // Set a timeout for ENS resolution to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('ENS resolution timeout')), 5000)
    );
    
    // Handle special case for .base.eth domains
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

        // Race against timeout
        const rawAddressPromise = baseRegistry.resolve(ensName);
        const rawAddress = await Promise.race([rawAddressPromise, timeoutPromise]);
        
        if (rawAddress && rawAddress !== ethers.constants.AddressZero) {
          // Use our custom normalization for Base addresses
          const normalizedAddress = normalizeBaseAddress(rawAddress);
          return { success: true, address: normalizedAddress, type: 'evm' };
        }
      } catch (baseError) {
        logger.error('Error resolving Base domain:', baseError);
        // Continue to try regular ENS resolution
      }
    }

    // Try regular ENS resolution with timeout
    const addressPromise = mainnetProvider.resolveName(ensName);
    const address = await Promise.race([addressPromise, timeoutPromise]);
    
    if (address) {
      return { success: true, address, type: 'evm' };
    }

    return { success: false, message: 'ENS name not found or no address associated' };
  } catch (error) {
    logger.error('Error resolving ENS:', error);
    return { success: false, message: error.message || 'Error resolving ENS name' };
  }
};

/**
 * Resolve Unstoppable Domains
 */
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

/**
 * Check if Solana address is valid
 */
export const isValidSolanaAddress = (address) => {
  try {
    new PublicKey(address);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if any wallet address is valid
 */
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

/**
 * Fetch ENS avatar
 */
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

/**
 * Check if NFT is spam
 */
export const isNftSpam = (tokenId, contractAddress, spamNfts) => {
  return Object.values(spamNfts).flat().some(spam => spam.tokenId === tokenId && spam.contractAddress === contractAddress);
};

/**
 * Get available ENS names from wallets
 */
export const getAvailableENS = (wallets) => {
  if (!wallets || !Array.isArray(wallets)) {
    return [];
  }
  return wallets
    .filter(wallet => wallet.nickname && wallet.nickname.endsWith('.eth'))
    .map(wallet => wallet.nickname);
};