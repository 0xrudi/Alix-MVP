import React, { useState } from 'react';
import { 
  SimpleGrid, 
  VStack, 
  Text, 
  Box,
} from "@chakra-ui/react";
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import { filterAndSortNFTs } from '../utils/nftUtils';

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};


const NFTGrid = ({ 
  nfts = [], 
  selectedNFTs = [],
  onNFTSelect, 
  onMarkAsSpam, 
  isSpamFolder = false,
  isSelectMode = false,
  onNFTClick,
  viewMode = VIEW_MODES.GRID,
  showControls = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');

  const filteredAndSortedNFTs = filterAndSortNFTs(nfts, searchTerm, sortOption);

  const gridColumns = {
    base: viewMode === VIEW_MODES.GRID ? 1 : 1,
    sm: viewMode === VIEW_MODES.GRID ? 2 : 1,
    md: viewMode === VIEW_MODES.GRID ? 3 : 1,
    lg: viewMode === VIEW_MODES.GRID ? 4 : 1,
    xl: viewMode === VIEW_MODES.GRID ? 5 : 1
  };

  // No items found state
  if (!filteredAndSortedNFTs.length) {
    return (
      <Box 
        textAlign="center" 
        py={12}
        color="var(--ink-grey)"
      >
        <Text 
          fontFamily="Fraunces" 
          fontSize="lg"
        >
          No items found
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch" w="100%">
      {viewMode === VIEW_MODES.LIST ? (
        <VStack spacing={2} align="stretch">
          {filteredAndSortedNFTs.map((nft) => (
            <ListViewItem
              key={`${nft.contract?.address}-${nft.id?.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(selected => 
                selected.id?.tokenId === nft.id?.tokenId &&
                selected.contract?.address === nft.contract?.address
              )}
              onSelect={() => onNFTSelect(nft)}
              onMarkAsSpam={() => onMarkAsSpam(nft)}
              isSpamFolder={isSpamFolder}
              onClick={() => onNFTClick(nft)}
              isSelectMode={isSelectMode}
            />
          ))}
        </VStack>
      ) : (
        <SimpleGrid 
          columns={gridColumns}
          spacing={4}
          width="100%"
        >
          {filteredAndSortedNFTs.map((nft) => (
            <NFTCard
              key={`${nft.contract?.address}-${nft.id?.tokenId}-${nft.network}`}
              nft={nft}
              isSelected={selectedNFTs.some(selected => 
                selected.id?.tokenId === nft.id?.tokenId && 
                selected.contract?.address === nft.contract?.address
              )}
              onSelect={() => onNFTSelect(nft)}
              onMarkAsSpam={() => onMarkAsSpam(nft)}
              isSpamFolder={isSpamFolder}
              isSelectMode={isSelectMode}
              onClick={() => onNFTClick(nft)}
              viewMode={VIEW_MODES.GRID}
            />
          ))}
        </SimpleGrid>
      )}
    </VStack>
  );
};

export default NFTGrid;