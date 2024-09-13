import { ethers } from 'ethers';
import axios from 'axios';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const networkEndpoints = {
  ethereum: "https://eth-mainnet.g.alchemy.com/v2/",
  polygon: "https://polygon-mainnet.g.alchemy.com/v2/",
  optimism: "https://opt-mainnet.g.alchemy.com/v2/",
  arbitrum: "https://arb-mainnet.g.alchemy.com/v2/",
  zksync: "https://zksync-mainnet.g.alchemy.com/v2/",
  starknet: "https://starknet-mainnet.g.alchemy.com/v2/",
  mantle: "https://mantle-mainnet.g.alchemy.com/v2/",
  linea: "https://linea-mainnet.g.alchemy.com/v2/",
  base: "https://base-mainnet.g.alchemy.com/v2/",
  zora: "https://zora-mainnet.g.alchemy.com/v2/",
  polygon_zkevm: "https://polygonzkevm-mainnet.g.alchemy.com/v2/",
  solana: "https://solana-mainnet.g.alchemy.com/v2/"
};

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

export const fetchNFTs = async (address, network, retries = 3, initialDelay = 1000) => {
  const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!alchemyApiKey) {
    console.error('Alchemy API Key is not set');
    return [];
  }

  const endpoint = networkEndpoints[network];
  if (!endpoint) {
    console.error(`Unsupported network: ${network}`);
    return [];
  }

  const fetchTask = async () => {
    let currentDelay = initialDelay;

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios.get(`${endpoint}${alchemyApiKey}/getNFTs/`, {
          params: {
            owner: address,
            withMetadata: true,
            pageSize: 100
          }
        });

        return response.data.ownedNfts;
      } catch (error) {
        console.error(`Error fetching NFTs for ${address} on ${network} (Attempt ${attempt + 1}/${retries}):`, error);
        
        if (error.response && error.response.status === 429) {
          console.log(`Rate limited. Waiting for ${currentDelay}ms before retrying...`);
          await delay(currentDelay);
          currentDelay *= 2; // Exponential backoff
        } else if (attempt === retries - 1) {
          throw error; // Rethrow the error if we've exhausted all retries
        } else {
          await delay(currentDelay);
        }
      }
    }
  };

  return fetchQueue.add(fetchTask);
};


export const resolveENS = async (ensName, network) => {
  const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!alchemyApiKey) {
    console.error('Alchemy API Key is not set');
    return { success: false, message: 'Alchemy API Key is not set' };
  }

  const endpoint = networkEndpoints[network];
  if (!endpoint) {
    return { success: false, message: 'Invalid network selected' };
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      `${endpoint}${alchemyApiKey}`
    );

    const address = await provider.resolveName(ensName);

    if (address) {
      return { success: true, address };
    } else {
      return { success: false, message: `ENS name not found on ${network}` };
    }
  } catch (error) {
    console.error('Error resolving ENS:', error);
    return { 
      success: false, 
      message: `Error resolving ENS: ${error.message}. Please check your network connection and Alchemy API Key.` 
    };
  }
};

export const isValidAddress = (address) => {
  return ethers.utils.isAddress(address);
};

export const fetchENSAvatar = async (ensName) => {
  try {
    const response = await axios.get(`https://metadata.ens.domains/mainnet/avatar/${ensName}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching ENS avatar:', error);
    return null;
  }
};

export const isNftSpam = (tokenId, contractAddress, spamNfts) => {
  return Object.values(spamNfts).flat().some(spam => spam.tokenId === tokenId && spam.contractAddress === contractAddress);
};