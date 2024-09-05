import { ethers } from 'ethers';

let provider;

export const initializeWeb3 = () => {
  if (window.ethereum) {
    provider = new ethers.providers.Web3Provider(window.ethereum);
  } else {
    console.warn('No Ethereum browser extension detected');
  }
};

export const connectWallet = async () => {
  if (!provider) {
    throw new Error('Web3 not initialized');
  }
  
  try {
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();
    return await signer.getAddress();
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const getEnsName = async (address) => {
  if (!provider) {
    throw new Error('Web3 not initialized');
  }
  
  try {
    return await provider.lookupAddress(address);
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
};

// Add more Web3-related functions as needed

export default { initializeWeb3, connectWallet, getEnsName };