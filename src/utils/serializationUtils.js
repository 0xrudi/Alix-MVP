// src/utils/serializationUtils.js
import { logger } from './logger';

export const serializeAddress = (address) => {
  try {
    if (!address) return null;
    
    // Handle string addresses
    if (typeof address === 'string') {
      return address.toLowerCase();
    }
    
    // Handle EvmAddress objects
    if (address && typeof address === 'object') {
      // Handle EvmAddress type
      if (address._value) {
        return address._value.toLowerCase();
      }
      // Handle cases where address might be a complex object
      if (typeof address.toString === 'function') {
        const stringAddr = address.toString();
        if (stringAddr.startsWith('0x')) {
          return stringAddr.toLowerCase();
        }
      }
      if (address.address && typeof address.address === 'string') {
        return address.address.toLowerCase();
      }
    }
    
    logger.warn('Unable to serialize address:', address);
    return null;
  } catch (error) {
    logger.error('Error serializing address:', error);
    return String(address).toLowerCase(); // Fallback to string conversion
  }
};

export const serializeContract = (contract) => {
  if (!contract) return null;
  
  try {
    return {
      ...contract,
      address: serializeAddress(contract.address)
    };
  } catch (error) {
    logger.error('Error serializing contract:', error);
    return contract;
  }
};

export const serializeNFT = (nft) => {
  try {
    if (!nft) return null;

    const serializedNFT = {
      ...nft,
      id: {
        ...nft.id,
        tokenId: nft.id?.tokenId?.toString() || ''
      },
      contract: serializeContract(nft.contract),
      balance: nft.balance?.toString() || '1'
    };

    // Ensure address is properly serialized
    if (serializedNFT.address) {
      serializedNFT.address = serializeAddress(serializedNFT.address);
    }

    return serializedNFT;
  } catch (error) {
    logger.error('Error serializing NFT:', error);
    return nft;
  }
};