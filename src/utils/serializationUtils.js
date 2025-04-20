// src/utils/serializationUtils.js
import { logger } from './logger';

/**
 * Normalizes an Ethereum address from various possible formats
 */
export const serializeAddress = (address) => {
  try {
    // Handle null/undefined
    if (!address) return null;
    
    // Handle Moralis EvmAddress objects with their full structure
    if (address instanceof Object && '_value' in address) {
      return address._value.toLowerCase();
    }

    // Handle nested EvmAddress objects
    if (address?.address?._value) {
      return address.address._value.toLowerCase();
    }

    // Handle string addresses
    if (typeof address === 'string') {
      return address.toLowerCase();
    }

    logger.warn('Unhandled address format:', { 
      type: typeof address,
      hasValue: '_value' in (address || {}),
      structure: JSON.stringify(address)
    });
    return null;

  } catch (error) {
    logger.error('Error serializing address:', { error, address });
    return null;
  }
};

/**
 * Validates Ethereum address format
 */
export const isValidAddress = (address) => {
  const serialized = serializeAddress(address);
  return serialized?.match(/^0x[a-f0-9]{40}$/i) !== null;
};

/**
 * Normalizes contract information
 */
export const serializeContract = (contract) => {
  if (!contract) return null;
  
  try {
    return {
      ...contract,
      address: serializeAddress(contract.address) || contract.address
    };
  } catch (error) {
    logger.error('Error serializing contract:', error, { contract });
    return contract;
  }
};

export const serializeNFT = (nft) => {
  try {
    if (!nft) return null;

    // Handle tokenId first to ensure proper string conversion
    const tokenId = nft.id?.tokenId?.toString() || '';

    // Properly serialize the contract first
    const serializedContract = serializeContract(nft.contract);
    
    const serializedNFT = {
      ...nft,
      id: {
        ...nft.id,
        tokenId
      },
      contract: serializedContract,
      balance: nft.balance?.toString() || '1',
      // Add the new fields
      creator: nft.creator || null,
      contractName: nft.contractName || nft.contract?.name || null,
      // Generate a stable unique identifier
      uniqueId: `${serializedContract?.address || ''}-${tokenId}-${nft.network || ''}`
    };

    // Clean up any leftover address properties
    if (serializedNFT.address) {
      serializedNFT.address = serializeAddress(serializedNFT.address);
    }

    return serializedNFT;
  } catch (error) {
    logger.error('Error serializing NFT:', error, { nft });
    return null;
  }
};