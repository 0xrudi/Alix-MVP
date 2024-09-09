import React from 'react';
import { SimpleGrid } from "@chakra-ui/react";
import NFTCard from './NFTCard';
import { isNftSpam } from '../utils/web3Utils';

const NFTGrid = ({ nfts, spamNfts, selectedNFTs, onNFTSelect, onMarkAsSpam }) => {
  return (
    <SimpleGrid columns={4} spacing={4}>
      {nfts.filter(nft => !isNftSpam(nft.id.tokenId, nft.contract.address, spamNfts)).map((nft) => (
        <NFTCard
          key={`${nft.contract.address}-${nft.id.tokenId}`}
          nft={nft}
          isSelected={selectedNFTs.some(selected => 
            selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address
          )}
          onSelect={() => onNFTSelect(nft)}
          onMarkAsSpam={() => onMarkAsSpam(nft.id.tokenId, nft.contract.address)}
        />
      ))}
    </SimpleGrid>
  );
};

export default NFTGrid;