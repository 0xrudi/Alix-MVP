// src/components/NFTGrid/NFTGrid.jsx
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
  Icon,
  Box,
} from "@chakra-ui/react";
import { FaSearch } from 'react-icons/fa';
import NFTCard from '../NFTCard';
import { filterAndSortNFTs } from '../../utils/nftUtils';

const NFTGrid = ({ 
  nfts = [], 
  selectedNFTs = [],
  onNFTSelect, 
  onMarkAsSpam, 
  isSpamFolder = false,
  isSelectMode = false,
  onNFTClick,
  size = "medium",
  showControls = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');

  const filteredAndSortedNFTs = filterAndSortNFTs(nfts, searchTerm, sortOption);

  const gridColumns = {
    small: {
      base: 2,
      sm: 3,
      md: 4,
      lg: 6,
      xl: 8
    },
    medium: {
      base: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5
    },
    large: {
      base: 1,
      sm: 2,
      md: 2,
      lg: 3,
      xl: 4
    }
  };

  const currentColumns = gridColumns[size] || gridColumns.medium;

  return (
    <VStack spacing={6} align="stretch" w="100%">
      {showControls && (
        <>
          <Box
            bg="var(--paper-white)"
            borderWidth="1px"
            borderColor="var(--shadow)"
            borderRadius="md"
            p={4}
          >
            <VStack spacing={4}>
              <HStack spacing={4} width="100%">
                <InputGroup flex={1}>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={FaSearch} color="var(--ink-grey)" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="white"
                    borderColor="var(--shadow)"
                    _placeholder={{ color: "var(--ink-grey)" }}
                    fontFamily="Inter"
                  />
                </InputGroup>
                <Select 
                  value={sortOption} 
                  onChange={(e) => setSortOption(e.target.value)}
                  maxW="200px"
                  bg="white"
                  borderColor="var(--shadow)"
                  fontFamily="Inter"
                >
                  <option value="title">Sort by Title</option>
                  <option value="contractName">Sort by Contract</option>
                  <option value="network">Sort by Network</option>
                </Select>
              </HStack>

              <Text 
                fontSize="sm" 
                color="var(--ink-grey)"
                fontFamily="Fraunces"
              >
                Showing {filteredAndSortedNFTs.length} of {nfts.length} items
              </Text>
            </VStack>
          </Box>
        </>
      )}
      
      <SimpleGrid 
        columns={currentColumns}
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
            size={size}
          />
        ))}
      </SimpleGrid>

      {filteredAndSortedNFTs.length === 0 && (
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
      )}
    </VStack>
  );
};

export default NFTGrid;