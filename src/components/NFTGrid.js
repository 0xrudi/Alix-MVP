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
import { filterAndSortNFTs } from '../utils/nftUtils';
import { StyledContainer } from '../styles/commonStyles';

const NFTGrid = ({ 
  nfts = [], 
  selectedNFTs = [], // Ensure this has a default value
  onNFTSelect, 
  onMarkAsSpam, 
  isSpamFolder = false,
  isSelectMode = false,
  onNFTClick,
  gridColumns = 4
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');

  const filteredAndSortedNFTs = filterAndSortNFTs(nfts, searchTerm, sortOption);

  return (
    <StyledContainer>
      <VStack spacing={6} align="stretch" w="100%">
        <HStack spacing={4}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <FaSearch color="gray.300" />
            </InputLeftElement>
            <Input
              placeholder="Search NFTs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <Select 
            value={sortOption} 
            onChange={(e) => setSortOption(e.target.value)}
            maxW="200px"
          >
            <option value="title">Sort by Title</option>
            <option value="contractName">Sort by Contract</option>
            <option value="network">Sort by Network</option>
          </Select>
        </HStack>
        
        <Text fontSize="sm" color="gray.500">
          Showing {filteredAndSortedNFTs.length} of {nfts.length} NFTs
        </Text>
        
        <SimpleGrid 
          columns={gridColumns}
          spacing={{ base: 2, md: 4 }}
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
            />
          ))}
        </SimpleGrid>
      </VStack>
    </StyledContainer>
  );
};

export default NFTGrid;