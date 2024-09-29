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
  useColorModeValue,
} from "@chakra-ui/react";
import { FaSearch } from 'react-icons/fa';
import NFTCard from './NFTCard';
import { logger } from '../utils/logger';

const NFTGrid = ({ 
  nfts = [], 
  selectedNFTs, 
  onNFTSelect, 
  onMarkAsSpam, 
  walletAddress, 
  network, 
  cardSize, 
  isSpamFolder = false,
  isSelectMode,
  onNFTClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('title');

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  logger.log("NFTGrid received nfts:", nfts);

  const filteredAndSortedNFTs = (nfts || [])
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

  return (
    <VStack spacing={6} align="stretch" w="100%" bg={bgColor} p={6} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
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
        columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }} 
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
            walletAddress={walletAddress}
            network={network}
            isSpamFolder={isSpamFolder}
            cardSize={cardSize}
            isSelectMode={isSelectMode}
            onClick={() => onNFTClick(nft)}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
};

export default NFTGrid;