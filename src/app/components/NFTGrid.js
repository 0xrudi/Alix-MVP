import React, { useState } from 'react';
import { 
  SimpleGrid, 
  VStack, 
  Text, 
  Box,
  Divider,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import { filterAndSortNFTs } from '../../utils/nftUtils';

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
  showControls = true,
  gridColumns, // Accept custom grid columns
  renderActions // Accept custom render function for actions
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');

  const filteredAndSortedNFTs = filterAndSortNFTs(nfts, searchTerm, sortOption);

  // Default grid columns configuration for responsive design
  const defaultGridColumns = {
    base: viewMode === VIEW_MODES.GRID ? 2 : 1,
    sm: viewMode === VIEW_MODES.GRID ? 3 : 1,
    md: viewMode === VIEW_MODES.GRID ? 4 : 1,
    lg: viewMode === VIEW_MODES.GRID ? 5 : 1,
    xl: viewMode === VIEW_MODES.GRID ? 6 : 1
  };

  // Use provided gridColumns or fall back to default
  const actualGridColumns = gridColumns || defaultGridColumns;

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
    <Box width="100%">
      {viewMode === VIEW_MODES.LIST ? (
        // List View with consistent styling
        <VStack spacing={0} align="stretch" divider={<Divider opacity={0.3} />}>
          {filteredAndSortedNFTs.map((nft, index) => (
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
              isLastItem={index === filteredAndSortedNFTs.length - 1}
              index={index}
              totalItems={filteredAndSortedNFTs.length}
            />
          ))}
        </VStack>
      ) : (
        // Grid View with consistent card sizing and custom columns
        <SimpleGrid 
          columns={actualGridColumns}
          spacing={4}
          width="100%"
        >
          {filteredAndSortedNFTs.map((nft) => (
            <Box 
              key={`${nft.contract?.address}-${nft.id?.tokenId}-${nft.network}`}
              height="100%"
              role="group"
            >
              <NFTCard
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
                renderActions={renderActions ? () => renderActions(nft) : undefined}
              />
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default NFTGrid;