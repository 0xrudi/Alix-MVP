// src/components/CatalogViewPage.js

import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  VStack,
  HStack,
  Text,
  useToast,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  IconButton,
  Flex,
  Collapse,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import { FaList, FaThLarge, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';

const CatalogViewPage = ({ catalog, onBack, onRemoveNFTs, onClose, onUnmarkSpam }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [cardSize, setCardSize] = useState(270);
  const [isListView, setIsListView] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => 
      prev.some(item => item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address)
        ? prev.filter(item => item.id?.tokenId !== nft.id?.tokenId || item.contract?.address !== nft.contract?.address)
        : [...prev, nft]
    );
  };

  const handleRemoveSelected = () => {
    onRemoveNFTs(selectedNFTs);
    setSelectedNFTs([]);
    toast({
      title: "NFTs Removed",
      description: `${selectedNFTs.length} NFT(s) removed from the catalog.`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredNFTs = catalog.nfts.filter(nft => 
    nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    nft.id?.tokenId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSpamCatalog = catalog.name === "Spam";

  return (
    <StyledContainer>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">{catalog.name}</Heading>
        <StyledButton onClick={onBack}>Back to Catalogs</StyledButton>
      </Flex>
      <Text mb={4}>{filteredNFTs.length} NFTs in this catalog</Text>
      
      <StyledCard mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h3" size="md">Display Settings</Heading>
          <IconButton
            icon={isSettingsExpanded ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            aria-label={isSettingsExpanded ? "Collapse settings" : "Expand settings"}
          />
        </Flex>
        <Collapse in={isSettingsExpanded}>
          <VStack spacing={4} align="stretch">
            <Flex align="center" justify="space-between">
              <Text>Card Size:</Text>
              <Slider
                min={100}
                max={300}
                step={10}
                value={cardSize}
                onChange={setCardSize}
                width="200px"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Text width="60px" textAlign="right">{cardSize}px</Text>
            </Flex>
            <Flex align="center" justify="space-between">
              <Text>View:</Text>
              <HStack spacing={2}>
                <IconButton
                  icon={<FaList />}
                  onClick={() => setIsListView(true)}
                  aria-label="List view"
                  colorScheme={isListView ? "blue" : "gray"}
                />
                <IconButton
                  icon={<FaThLarge />}
                  onClick={() => setIsListView(false)}
                  aria-label="Grid view"
                  colorScheme={!isListView ? "blue" : "gray"}
                />
              </HStack>
            </Flex>
          </VStack>
        </Collapse>
      </StyledCard>

      <InputGroup mb={4}>
        <InputLeftElement pointerEvents="none" children={<FaSearch color="gray.300" />} />
        <Input
          placeholder="Search NFTs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </InputGroup>

      {selectedNFTs.length > 0 && (
        <StyledButton 
          onClick={handleRemoveSelected} 
          mb={4}
        >
          Remove Selected ({selectedNFTs.length})
        </StyledButton>
      )}
      
      {isListView ? (
        <VStack align="stretch" spacing={2}>
          {filteredNFTs.map((nft) => (
            <ListViewItem
              key={`${nft.contract?.address}-${nft.id?.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(item => 
                item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={isSpamCatalog ? () => onUnmarkSpam(nft) : () => onRemoveNFTs([nft])}
              isSpamFolder={isSpamCatalog}
            />
          ))}
        </VStack>
      ) : (
        <SimpleGrid columns={Math.floor(1200 / cardSize)} spacing={4}>
          {filteredNFTs.map((nft) => (
            <NFTCard
              key={`${nft.contract?.address}-${nft.id?.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(item => 
                item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={isSpamCatalog ? () => onUnmarkSpam(nft) : () => onRemoveNFTs([nft])}
              cardSize={cardSize}
              isSpamFolder={isSpamCatalog}
            />
          ))}
        </SimpleGrid>
      )}
    </StyledContainer>
  );
};

export default CatalogViewPage;