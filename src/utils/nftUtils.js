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