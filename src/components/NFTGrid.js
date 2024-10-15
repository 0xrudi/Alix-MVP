// src/components/NFTGrid.js

import React, { useState } from 'react';
import { 
  SimpleGrid, 
  VStack, 
  HStack, 
  Text, 
  Select, 
  Input, 
  InputGroup, 
  InputLeftElement,
} from "@chakra-ui/react";
import { FaSearch } from 'react-icons/fa';
import NFTCard from './NFTCard';
import { logger } from '../utils/logger';
import { filterAndSortNFTs, generateNFTId, isERC1155 } from '../utils/nftUtils';
import { useCustomColorMode } from '../hooks/useColorMode';
import { StyledContainer } from '../styles/commonStyles';

const NFTGrid = ({ 
  nfts = {}, 
  selectedNFTs, 
  onNFTSelect, 
  onMarkAsSpam, 
  isSpamFolder = false,
  isSelectMode,
  onNFTClick,
  gridColumns,
  isSearchResult = false,
  onAddToCatalog
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');
  const { bgColor, borderColor } = useCustomColorMode();

  logger.log("NFTGrid received nfts:", nfts);

  const nftsArray = Array.isArray(nfts) ? nfts : Object.values(nfts).flat();
  const filteredAndSortedNFTs = filterAndSortNFTs(nftsArray, searchTerm, sortOption, isSpamFolder);

  return (
    <StyledContainer>
      <VStack spacing={6} align="stretch" w="100%">
        <HStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
            <Input
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="title">Sort by Title</option>
            <option value="contractName">Sort by Contract</option>
          </Select>
        </HStack>
        <Text fontSize="sm" color="gray.500">
          Showing {filteredAndSortedNFTs.length} of {nftsArray.length} NFTs
        </Text>
        <SimpleGrid 
          columns={gridColumns}
          spacing={{ base: 2, md: 4 }}
          width="100%"
        >
          {filteredAndSortedNFTs.map((nft, index) => {
            const nftId = generateNFTId(nft, index);
            const quantity = isERC1155(nft) ? parseInt(nft.balance) || 1 : 1;

            return Array.from({ length: quantity }, (_, i) => (
              <NFTCard
                key={`${nftId}-${i}`}
                nft={nft}
                isSelected={selectedNFTs.some(selectedNFT => generateNFTId(selectedNFT) === nftId)}
                onSelect={() => onNFTSelect(nft)}
                onMarkAsSpam={() => onMarkAsSpam(nft)}
                isSpamFolder={isSpamFolder}
                isSelectMode={isSelectMode}
                onClick={() => onNFTClick(nft)}
                isSearchResult={isSearchResult}
                onAddToCatalog={onAddToCatalog}
              />
            ));
          })}
        </SimpleGrid>
      </VStack>
    </StyledContainer>
  );
};

export default NFTGrid;