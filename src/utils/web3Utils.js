import axios from 'axios';

const MORALIS_API_KEY = process.env.REACT_APP_MORALIS_API_KEY;

export const networks = [
  { value: "eth", label: "Ethereum" },
  { value: "polygon", label: "Polygon PoS" },
  { value: "optimism", label: "Optimism" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "bsc", label: "BNB Chain" },
  { value: "avalanche", label: "Avalanche" },
  { value: "fantom", label: "Fantom" },
  { value: "cronos", label: "Cronos" },
  // Add more networks as needed
];

class NFTFetchQueue {
  constructor(concurrency = 2) {
    this.concurrency = concurrency;
    this.queue = [];
    this.running = 0;
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this.run();
    });
  }

  async run() {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    this.running++;
    const { task, resolve, reject } = this.queue.shift();

    try {
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.run();
    }
  }
}

const fetchQueue = new NFTFetchQueue();

export const fetchNFTs = async (address, chain, retries = 3, initialDelay = 1000) => {
  if (!MORALIS_API_KEY) {
    console.error('Moralis API Key is not set');
    return [];
  }

  const fetchTask = async () => {
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(`https://deep-index.moralis.io/api/v2/${address}/nft`, {
          params: {
            chain: chain,
            format: 'decimal',
            limit: 100,
          },
          headers: {
            'X-API-Key': MORALIS_API_KEY,
          },
        });

        console.log(`Successfully fetched NFTs for ${address} on ${chain}`);
        
        return response.data.result.map(nft => ({
          id: { tokenId: nft.token_id },
          contract: { 
            address: nft.token_address,
            name: nft.name,
            symbol: nft.symbol
          },
          title: nft.name || `Token ID: ${nft.token_id}`,
          description: nft.metadata ? JSON.parse(nft.metadata).description : '',
          media: [{
            gateway: nft.token_uri || 'https://via.placeholder.com/150?text=No+Image'
          }],
          metadata: nft.metadata ? JSON.parse(nft.metadata) : {}
        }));

      } catch (error) {
        console.error(`Error fetching NFTs for ${address} on ${chain} (Attempt ${attempt + 1}/${retries}):`, error);
        
        if (error.response && error.response.status === 429) {
          console.log(`Rate limited. Waiting for ${currentDelay}ms before retrying...`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
          currentDelay *= 2; // Exponential backoff
        } else if (attempt === retries - 1) {
          throw error; // Rethrow the error if we've exhausted all retries
        } else {
          await new Promise(resolve => setTimeout(resolve, currentDelay));
        }
      }
    }
  };

  return fetchQueue.add(fetchTask);
};

export const resolveENS = async (ensName) => {
  if (!MORALIS_API_KEY) {
    console.error('Moralis API Key is not set');
    return { success: false, message: 'Moralis API Key is not set' };
  }

  try {
    const response = await axios.get(`https://deep-index.moralis.io/api/v2/resolve/ens/${ensName}`, {
      headers: {
        'X-API-Key': MORALIS_API_KEY,
      },
    });

    if (response.data && response.data.address) {
      return { success: true, address: response.data.address };
    } else {
      return { success: false, message: 'ENS name not found' };
    }
  } catch (error) {
    console.error('Error resolving ENS:', error);
    return { 
      success: false, 
      message: `Error resolving ENS: ${error.message}. Please check your network connection and Moralis API Key.` 
    };
  }
};

export const isValidAddress = (address) => {
  // This is a simple regex check, you might want to use a more robust method
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const fetchENSAvatar = async (ensName) => {
  if (!MORALIS_API_KEY) {
    console.error('Moralis API Key is not set');
    return null;
  }

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
};

export const isNftSpam = (tokenId, contractAddress, spamNfts) => {
  return Object.values(spamNfts).flat().some(spam => spam.tokenId === tokenId && spam.contractAddress === contractAddress);
};

export const getAvailableENS = (wallets) => {
  return wallets
    .filter(wallet => wallet.nickname && wallet.nickname.endsWith('.eth'))
    .map(wallet => wallet.nickname);
};