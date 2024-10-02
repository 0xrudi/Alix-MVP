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
import { filterAndSortNFTs } from '../utils/nftUtils';
import { useCustomColorMode } from '../hooks/useColorMode';
import { StyledContainer } from '../styles/commonStyles';

const NFTGrid = ({ 
  nfts = [], 
  selectedNFTs, 
  onNFTSelect, 
  onMarkAsSpam, 
  isSpamFolder = false,
  isSelectMode,
  onNFTClick,
  gridColumns
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');
  const { bgColor, borderColor } = useCustomColorMode();

  logger.log("NFTGrid received nfts:", nfts);

  const filteredAndSortedNFTs = filterAndSortNFTs(nfts, searchTerm, sortOption, isSpamFolder);

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
          Showing {filteredAndSortedNFTs.length} of {nfts.length} NFTs
        </Text>
        <SimpleGrid 
          columns={gridColumns}
          spacing={{ base: 2, md: 4 }}
          width="100%"
        >
          {filteredAndSortedNFTs.map((nft) => (
            <NFTCard
              key={`${nft.contract?.address}-${nft.id?.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(selectedNFT => 
                selectedNFT.id?.tokenId === nft.id?.tokenId && 
                selectedNFT.contract?.address === nft.contract?.address
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