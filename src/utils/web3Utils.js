import { ethers } from 'ethers';
import axios from 'axios';

export const networks = [
  { id: 'mainnet', name: 'Ethereum Mainnet', chainId: 1, rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/' },
  { id: 'sepolia', name: 'Ethereum Sepolia', chainId: 11155111, rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/' },
  { id: 'goerli', name: 'Ethereum Goerli', chainId: 5, rpcUrl: 'https://eth-goerli.g.alchemy.com/v2/' },
];

export const resolveENS = async (ensName, networkId) => {
  const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  
  if (!alchemyApiKey) {
    console.error('ALCHEMY_API_KEY not set');
    return { success: false, message: 'Alchemy API Key is not set' };
  }

  const selectedNetworkConfig = networks.find(n => n.id === networkId);
  if (!selectedNetworkConfig) {
    return { success: false, message: 'Invalid network selected' };
  }

  try {
    const provider = new ethers.providers.JsonRpcProvider(
      `${selectedNetworkConfig.rpcUrl}${alchemyApiKey}`,
      {
        name: selectedNetworkConfig.id,
        chainId: selectedNetworkConfig.chainId
      }
    );

    const address = await provider.resolveName(ensName);

    if (address) {
      return { success: true, address };
    } else {
      return { success: false, message: `ENS name not found on ${selectedNetworkConfig.name}` };
    }
  } catch (error) {
    console.error('Error resolving ENS:', error);
    return { 
      success: false, 
      message: `Error resolving ENS: ${error.message}. Please check your network connection and Alchemy API Key.` 
    };
  }
};

export const fetchNFTs = async (address) => {
  const alchemyApiKey = process.env.REACT_APP_ALCHEMY_API_KEY;
  if (!alchemyApiKey) {
    console.error('Alchemy API Key is not set');
    return [];
  }

  try {
    const response = await axios.get(`https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}/getNFTs/`, {
      params: {
        owner: address,
        withMetadata: true,
        pageSize: 100
      }
    });

    return response.data.ownedNfts;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    return [];
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