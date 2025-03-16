import { logger } from './logger';

/**
 * Generates a unique identifier for an NFT, supporting both ERC-721 and ERC-1155 tokens.
 * @param {Object} nft - The NFT object
 * @param {number} index - The index of the NFT in the list (useful for ERC-1155 tokens with quantity > 1)
 * @returns {string} A unique identifier for the NFT
 */
export const generateNFTId = (nft, index = 0) => {
  const contractAddress = nft.contract?.address || 'unknown';
  const tokenId = nft.id?.tokenId || 'unknown';
  const tokenType = nft.contract?.type || 'ERC721';
  
  if (tokenType === 'ERC1155') {
    const quantity = nft.balance || '1';
    return `${contractAddress}-${tokenId}-${quantity}-${index}`;
  }
  
  return `${contractAddress}-${tokenId}`;
};

/**
 * Determines if an NFT is an ERC-1155 token
 * @param {Object} nft - The NFT object
 * @returns {boolean} True if the NFT is an ERC-1155 token, false otherwise
 */
export const isERC1155 = (nft) => {
  return nft?.contract?.type === 'ERC1155';
};

/**
 * Process and standardize NFT data to ensure all required fields
 * @param {Object} nft - The raw NFT object
 * @returns {Object} Processed and standardized NFT object
 */
export const processNFTData = (nft) => {
  if (!nft) return {};
  
  let attributes = nft.attributes || [];
  
  // Extract attributes from metadata if needed
  if (attributes.length === 0 && nft.metadata) {
    try {
      // If metadata is a string, try to parse it
      if (typeof nft.metadata === 'string') {
        const parsedMetadata = JSON.parse(nft.metadata);
        attributes = parsedMetadata.attributes || [];
      } else if (typeof nft.metadata === 'object') {
        // If metadata is already an object, extract attributes
        attributes = nft.metadata.attributes || [];
      }
    } catch (error) {
      logger.error('Error processing NFT metadata:', error);
      attributes = [];
    }
  }
  
  // Ensure we have a valid title/name
  const displayTitle = nft.title || nft.name || `Token ID: ${nft.id?.tokenId || 'Unknown'}`;
  
  // Ensure we have a valid collection name
  const collectionName = nft.contract?.name || nft.collection?.name || "Unknown Collection";
  
  // Ensure we have a valid network value
  const networkDisplay = nft.network || 'unknown';
  
  return {
    ...nft,
    attributes,
    displayTitle,
    collectionName,
    networkDisplay
  };
};

/**
 * Parse NFT metadata to extract useful information
 * @param {Object|string} metadata - The NFT metadata to parse
 * @returns {Object} Parsed NFT metadata
 */
export const parseNFTMetadata = (metadata) => {
  if (!metadata) return {};

  try {
    // If metadata is a string, try to parse it as JSON
    if (typeof metadata === 'string') {
      try {
        return JSON.parse(metadata);
      } catch (error) {
        logger.error('Error parsing NFT metadata string:', error);
        return { rawContent: metadata };
      }
    }

    // If metadata is already an object, return it
    if (typeof metadata === 'object') {
      return metadata;
    }

    return {};
  } catch (error) {
    logger.error('Error in parseNFTMetadata:', error);
    return {};
  }
};

/**
 * Filter and sort NFTs based on criteria
 * @param {Array} nfts - Array of NFT objects
 * @param {string} searchTerm - Search term to filter by
 * @param {string} sortOption - Field to sort by
 * @param {boolean} isSpamFolder - Whether this is the spam folder
 * @returns {Array} Filtered and sorted NFTs
 */
export const filterAndSortNFTs = (nfts, searchTerm, sortOption, isSpamFolder = false) => {
  // Convert nfts to array if it's an object
  const nftsArray = Array.isArray(nfts) ? nfts : Object.values(nfts).flat();
  
  // Process each NFT to standardize data
  const processedNFTs = nftsArray.map(processNFTData);

  return processedNFTs
    .filter(nft => !nft.isSpam || isSpamFolder)
    .filter(nft => 
      !searchTerm || 
      nft.displayTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.collectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.id?.tokenId?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'title') {
        return (a.displayTitle || '').localeCompare(b.displayTitle || '');
      } else if (sortOption === 'contractName') {
        return (a.collectionName || '').localeCompare(b.collectionName || '');
      } else if (sortOption === 'network') {
        return (a.networkDisplay || '').localeCompare(b.networkDisplay || '');
      }
      return 0;
    });
};

/**
 * Consolidate NFTs from different networks into a single array
 * @param {Object} filteredNfts - NFTs by wallet/network
 * @returns {Object} Consolidated NFTs by wallet
 */
export const consolidateNFTs = (filteredNfts) => {
  return Object.entries(filteredNfts).reduce((acc, [address, networkNfts]) => {
    acc[address] = Object.entries(networkNfts).flatMap(([network, nfts]) => 
      nfts.map(nft => processNFTData({ ...nft, network }))
    );
    return acc;
  }, {});
};

/**
 * Group NFTs by collection/contract
 * @param {Array} nfts - Array of NFT objects
 * @returns {Object} NFTs grouped by collection
 */
export const groupNFTsByCollection = (nfts) => {
  return nfts.reduce((groups, nft) => {
    const processedNFT = processNFTData(nft);
    const collectionKey = processedNFT.collectionName || 'Unknown Collection';
    
    if (!groups[collectionKey]) {
      groups[collectionKey] = [];
    }
    
    groups[collectionKey].push(processedNFT);
    return groups;
  }, {});
};

/**
 * Extract traits/attributes from an array of NFTs
 * @param {Array} nfts - Array of NFT objects
 * @returns {Object} Traits grouped by trait type
 */
export const extractTraits = (nfts) => {
  const traits = {};
  
  nfts.forEach(nft => {
    const processedNFT = processNFTData(nft);
    
    if (processedNFT.attributes && Array.isArray(processedNFT.attributes)) {
      processedNFT.attributes.forEach(attr => {
        const traitType = attr.trait_type || 'Other';
        const value = attr.value;
        
        if (!traits[traitType]) {
          traits[traitType] = {};
        }
        
        if (!traits[traitType][value]) {
          traits[traitType][value] = 0;
        }
        
        traits[traitType][value]++;
      });
    }
  });
  
  return traits;
};