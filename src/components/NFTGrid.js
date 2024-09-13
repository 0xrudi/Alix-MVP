import React from 'react';
import { SimpleGrid } from "@chakra-ui/react";
import NFTCard from './NFTCard';

const NFTGrid = ({ nfts, onMarkAsSpam }) => {
  return (
    <SimpleGrid columns={4} spacing={4}>
      {nfts.map((nft) => (
        <NFTCard
          key={`${nft.contract.address}-${nft.id.tokenId}`}
          nft={nft}
          onMarkAsSpam={() => onMarkAsSpam(nft)}
        />
      ))}
    </SimpleGrid>
  );
};

export default NFTGrid;