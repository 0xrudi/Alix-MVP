import Moralis from 'moralis';
import axios from 'axios';

const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;

let isMoralisStarted = false;

const startMoralis = async () => {
  if (!isMoralisStarted) {
    if (!MORALIS_API_KEY) {
      throw new Error('Moralis API Key is not set');
    }
    await Moralis.start({
      apiKey: MORALIS_API_KEY,
    });
    isMoralisStarted = true;
  }
};

const withMoralis = async (fn) => {
  await startMoralis();
  return fn();
};


export const networks = [
  { value: "eth", label: "Ethereum", chain: "0x1" },
  { value: "polygon", label: "Polygon", chain: "0x89" },
  { value: "bsc", label: "Binance Smart Chain", chain: "0x38" },
  { value: "arbitrum", label: "Arbitrum", chain: "0xa4b1" },
  { value: "base", label: "Base", chain: "0x2105" },
  { value: "optimism", label: "Optimism", chain: "0xa" },
  { value: "linea", label: "Linea", chain: "0xe708" },
  { value: "avalanche", label: "Avalanche", chain: "0xa86a" },
  { value: "fantom", label: "Fantom", chain: "0xfa" },
  { value: "cronos", label: "Cronos", chain: "0x19" },
  { value: "palm", label: "Palm", chain: "0x2a15c308d" },
  { value: "ronin", label: "Ronin", chain: "0x7e4" },
  { value: "gnosis", label: "Gnosis", chain: "0x64" },
  { value: "chiliz", label: "Chiliz", chain: "0x15b38" },
  { value: "pulsechain", label: "Pulsechain", chain: "0x171" },
  { value: "moonbeam", label: "Moonbeam", chain: "0x504" },
  { value: "moonriver", label: "Moonriver", chain: "0x505" },
  { value: "blast", label: "Blast", chain: "0x13e31" },
  { value: "zksync", label: "zkSync", chain: "0x144" },
  { value: "mantle", label: "Mantle", chain: "0x1388" },
  { value: "polygon_zkevm", label: "Polygon zkEVM", chain: "0x44d" },
  { value: "zetachain", label: "Zetachain", chain: "0x1b58" },
  { value: "solana", label: "Solana", chain: "1"},
];

export const getChainForNetwork = (networkValue) => {
  const network = networks.find(n => n.value === networkValue);
  return network ? network.chain : null;
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

export const fetchNFTs = (address, network, cursor = null, limit = 100) => 
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
      metadata: nft.metadata || {}
    }));

    return { 
      nfts, 
      cursor: response.pagination.cursor
    };
  });

export const resolveENS = (ensName) => 
  withMoralis(async () => {
    const response = await Moralis.EvmApi.resolve.resolveENSDomain({
      domain: ensName,
    });

    if (response && response.result && response.result.address) {
      const address = response.result.address.lowercase;
      return { success: true, address };
    } else {
      return { success: false, message: 'ENS name not found or no address associated' };
    }
  });

export const isValidAddress = (address) => {
  // This is a simple regex check, you might want to use a more robust method
  return /^0x[a-fA-F0-9]{40}$/.test(address);
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