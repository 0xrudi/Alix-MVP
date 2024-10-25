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

const isValidImageExtension = (url) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const isValidMimeType = (contentType) => {
  const validMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/avif'
  ];
  return validMimeTypes.some(mime => contentType.toLowerCase().includes(mime));
};

const convertToGatewayUrl = (uri) => {
  if (!uri) return null;

  logger.debug('[Gateway Conversion] Processing URI:', uri);

  // Handle Arweave protocol - process this first
  if (uri.startsWith('ar://')) {
    const hash = uri.replace('ar://', '');
    const arweaveUrl = `https://arweave.net/${hash}`;
    logger.debug('[Gateway Conversion] Converted Arweave URI:', { original: uri, converted: arweaveUrl });
    return arweaveUrl;
  }

  // Handle raw Arweave hash
  if (uri.match(/^[a-zA-Z0-9_-]{43}$/)) {
    const arweaveUrl = `https://arweave.net/${uri}`;
    logger.debug('[Gateway Conversion] Converted Arweave hash:', { original: uri, converted: arweaveUrl });
    return arweaveUrl;
  }

  // Handle IPFS protocol
  if (uri.startsWith('ipfs://')) {
    const hash = uri.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${hash}`;
  }

  // Handle IPFS gateway URLs that might need normalization
  if (uri.includes('/ipfs/')) {
    const hash = uri.split('/ipfs/')[1];
    return `https://ipfs.io/ipfs/${hash}`;
  }

  // Return original URI if no conversion needed
  return uri;
};


const validateTokenUri = async (uri) => {
  try {
    logger.debug('[TokenURI Validation] Validating URI:', uri);

    // Handle data URIs
    if (uri.startsWith('data:')) {
      return uri.startsWith('data:image/') ? uri : null;
    }

    // Convert URI to gateway URL if needed
    const gatewayUrl = convertToGatewayUrl(uri);
    if (!gatewayUrl) {
      logger.warn('[TokenURI Validation] Invalid URI:', uri);
      return null;
    }

    // If it has a valid image extension, return the URL without validation
    // This helps avoid unnecessary timeouts for known image types
    if (isValidImageExtension(gatewayUrl)) {
      logger.debug('[TokenURI Validation] Valid image extension found, skipping validation:', gatewayUrl);
      return gatewayUrl;
    }

    // Handle known CORS-restricted domains
    const corsRestrictedDomains = [
      'unlock-protocol.com',
      'base.org',
      'storage.unlock-protocol.com'
    ];
    
    if (corsRestrictedDomains.some(domain => gatewayUrl.includes(domain))) {
      logger.debug('[TokenURI Validation] Known CORS-restricted domain, skipping validation:', gatewayUrl);
      return gatewayUrl;
    }

    // Only proceed with HTTP(S) requests
    if (!gatewayUrl.startsWith('http://') && !gatewayUrl.startsWith('https://')) {
      throw new Error(`Unsupported protocol: ${gatewayUrl.split('://')[0]}`);
    }

    try {
      // Try a HEAD request first for faster validation
      const response = await axios.head(gatewayUrl, {
        timeout: 3000, // Shorter timeout for HEAD requests
        validateStatus: status => status === 200,
      });

      // If HEAD request succeeds and it's an image, return immediately
      const contentType = response.headers['content-type'].toLowerCase();
      if (isValidMimeType(contentType)) {
        return gatewayUrl;
      }
    } catch (headError) {
      // If HEAD fails, continue with GET request
      logger.debug('[TokenURI Validation] HEAD request failed, trying GET:', { 
        url: gatewayUrl,
        error: headError.message 
      });
    }

    // Proceed with full GET request
    const response = await axios.get(gatewayUrl, {
      timeout: 5000,
      validateStatus: status => status === 200,
      headers: {
        'Accept': 'application/json, image/*'
      }
    }).catch(error => {
      // Special handling for CORS and timeout errors
      if (error.message.includes('CORS') || error.code === 'ECONNABORTED') {
        logger.debug('[TokenURI Validation] CORS/Timeout error, returning URL without validation:', gatewayUrl);
        return { 
          data: null, 
          headers: { 'content-type': 'unknown' }, 
          bypassValidation: true 
        };
      }
      throw error;
    });

    // If we bypassed validation due to CORS/timeout
    if (response.bypassValidation) {
      return gatewayUrl;
    }

    const contentType = response.headers['content-type'].toLowerCase();
    
    logger.debug('[TokenURI Validation] Response:', {
      uri: gatewayUrl,
      contentType,
      headers: response.headers
    });

    // Handle JSON responses
    if (contentType.includes('application/json')) {
      const data = response.data;
      logger.debug('[TokenURI Validation] JSON response:', { data });

      const possibleImageUrls = [
        data.image,
        data.image_url,
        data.artwork?.uri,
        data.image_data,
        data.animation_url,
        data.metadata?.image,
        data.metadata?.image_url,
        data.properties?.image,
        data.properties?.preview?.image
      ].filter(Boolean);

      logger.debug('[TokenURI Validation] Found possible image URLs:', possibleImageUrls);

      // For JSON responses, don't recursively validate to avoid timeout loops
      for (const imageUrl of possibleImageUrls) {
        if (isValidImageExtension(imageUrl) || 
            imageUrl.startsWith('ar://') || 
            imageUrl.startsWith('ipfs://')) {
          return convertToGatewayUrl(imageUrl);
        }
      }
    }

    // Handle direct image responses
    if (isValidMimeType(contentType)) {
      return gatewayUrl;
    }

    logger.warn('[TokenURI Validation] Invalid content type:', {
      uri: gatewayUrl,
      contentType
    });
    return null;

  } catch (error) {
    logger.error('[TokenURI Validation] Error:', {
      uri,
      gatewayUrl: convertToGatewayUrl(uri),
      error: error.message
    });

    // If validation fails but we have a known image URL, return it anyway
    if (isValidImageExtension(uri) || 
        uri.startsWith('ar://') || 
        uri.startsWith('ipfs://')) {
      return convertToGatewayUrl(uri);
    }

    return null;
  }
};


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
        logger.log('Fetching Base NFTs - Raw Input:', {
          address,
          network,
          cursor,
          limit
        });

        // Use the utility function
        const normalizedAddress = normalizeBaseAddress(address);
        
        logger.log('Base network - Normalized address:', normalizedAddress);
        
        const response = await Moralis.EvmApi.nft.getWalletNFTs({
          address: normalizedAddress,
          chain: getChainForNetwork(network),
          limit,
          cursor,
          normalizeMetadata: true,
        });

        // Log the raw response for Base network
        logger.log('Raw Moralis API Response (Base):', {
          result: response.result.map(nft => ({
            tokenId: nft.tokenId,
            name: nft.name,
            metadata: nft.metadata,
            tokenAddress: nft.tokenAddress,
            tokenUri: nft.tokenUri,
            rawData: nft
          }))
        });

        const nfts = response.result.map(nft => {
          logger.log('Processing Base NFT:', {
            tokenId: nft.tokenId,
            name: nft.name,
            tokenAddress: nft.tokenAddress
          });

          return {
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
          };
        });

        return { 
          nfts, 
          cursor: response.pagination.cursor
        };
      } catch (error) {
        logger.error('Error in Base NFT fetching:', {
          error: error.message,
          stack: error.stack,
          address,
          network
        });
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

    // Log the raw response
    logger.log('Raw Moralis API Response:', {
      result: response.result.map(nft => ({
        tokenId: nft.tokenId,
        name: nft.name,
        metadata: nft.metadata,
        tokenAddress: nft.tokenAddress,
        tokenUri: nft.tokenUri,
        rawData: nft // Include the complete raw NFT data
      }))
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

const normalizeBaseAddress = (address) => {
  try {
    if (!address) {
      logger.error('Attempted to normalize null/undefined Base address');
      return '';
    }
    if (typeof address !== 'string') {
      logger.error('Invalid address type:', {
        address,
        type: typeof address
      });
      // Convert to string if possible
      address = String(address);
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

export const getImageUrl = async (nft) => {
  const logDebug = (source, url) => {
    logger.debug(`[NFT: ${nft.title || nft.id?.tokenId}] Image Resolution:`, {
      source,
      url,
      tokenId: nft.id?.tokenId,
      contract: nft.contract?.address
    });
  };

  // Check for audio NFT
  const isAudioNFT = 
    nft.metadata?.mimeType === 'audio/mpeg' ||
    nft.metadata?.animation_url?.includes('audio') ||
    nft.attributes?.some(attr => 
      attr.trait_type?.toLowerCase().includes('audio') ||
      attr.trait_type?.toLowerCase().includes('song') ||
      attr.trait_type?.toLowerCase().includes('music')
    );

  if (isAudioNFT) {
    logDebug('Audio NFT detected', null);
    return 'https://via.placeholder.com/400?text=Audio+NFT';
  }

  // Gather all possible image sources
  const possibleSources = [
    { key: 'artwork.uri', value: nft.metadata?.artwork?.uri },
    { key: 'metadata.image', value: nft.metadata?.image },
    { key: 'metadata.image_url', value: nft.metadata?.image_url },
    { key: 'media.gateway', value: nft.media?.[0]?.gateway },
    { key: 'tokenUri', value: nft.tokenUri },
    { key: 'external_url', value: nft.metadata?.external_url }
  ];

  logDebug('Possible image sources', possibleSources);

  for (const source of possibleSources) {
    if (source.value) {
      logDebug('Processing source', source);

      try {
        const validatedUrl = await validateTokenUri(source.value);
        if (validatedUrl) {
          logDebug('Valid URL found', validatedUrl);
          return validatedUrl;
        }
      } catch (error) {
        logDebug('Error processing source', {
          source: source.value,
          error: error.message
        });
      }
    }
  }

  logDebug('No valid image URL found', null);
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