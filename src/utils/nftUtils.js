// src/utils/nftUtils.js

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
  return nft.contract?.type === 'ERC1155';
};

export const filterAndSortNFTs = (nfts, searchTerm, sortOption, isSpamFolder = false) => {
  // Convert nfts to array if it's an object
  const nftsArray = Array.isArray(nfts) ? nfts : Object.values(nfts).flat();

  return nftsArray
    .filter(nft => !nft.isSpam || isSpamFolder)
    .filter(nft => 
      nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.contract?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOption === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      } else if (sortOption === 'contractName') {
        return (a.contract?.name || '').localeCompare(b.contract?.name || '');
      }
      return 0;
    });
};

export const consolidateNFTs = (filteredNfts) => {
  return Object.entries(filteredNfts).reduce((acc, [address, networkNfts]) => {
    acc[address] = Object.entries(networkNfts).flatMap(([network, nfts]) => 
      nfts.map(nft => ({ ...nft, network }))
    );
    return acc;
  }, {});
};