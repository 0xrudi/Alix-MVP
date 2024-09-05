const { ethers } = require('ethers');
const Moralis = require('moralis').default;

const provider = new ethers.providers.JsonRpcProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);

/**
 * Fetches the ENS name for a given address
 * @param {string} address - Ethereum address
 * @returns {Promise<string|null>} ENS name or null if not found
 */
exports.getEnsName = async (address) => {
  try {
    const ensName = await provider.lookupAddress(address);
    return ensName;
  } catch (error) {
    console.error('Error fetching ENS name:', error);
    return null;
  }
};

/**
 * Fetches transactions for a given address
 * @param {string} address - Ethereum address
 * @param {number} limit - Number of transactions to fetch
 * @returns {Promise<Array>} List of transactions
 */
exports.getTransactions = async (address, limit = 10) => {
  try {
    await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });

    const response = await Moralis.EvmApi.transaction.getWalletTransactions({
      address,
      chain: 'eth',
      limit,
    });

    return response.result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

// Add more Web3-related functions as needed