import { ethers } from 'ethers';

export async function getENSName(address) {
  const provider = new ethers.providers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID');
  
  try {
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
}