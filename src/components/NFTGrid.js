import React from 'react';
import { SimpleGrid } from "@chakra-ui/react";
import NFTCard from './NFTCard';

const NFTGrid = ({ nfts, selectedNFTs, onNFTSelect, onMarkAsSpam }) => {
  return (
    <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
      {nfts.map((nft) => (
        <NFTCard
          key={`${nft.contract.address}-${nft.id.tokenId}`}
          nft={nft}
          isSelected={selectedNFTs.some(selectedNFT => 
            selectedNFT.id.tokenId === nft.id.tokenId && 
            selectedNFT.contract.address === nft.contract.address
          )}
          onSelect={() => onNFTSelect(nft)}
          onMarkAsSpam={() => onMarkAsSpam(nft)}
        />
      ))}
    </SimpleGrid>
  );
};

export default NFTGrid;