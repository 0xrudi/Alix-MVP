import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  SimpleGrid, 
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
  Collapse
} from "@chakra-ui/react";
import { FaList, FaThLarge, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';

const CatalogViewPage = ({ catalog, onBack, onRemoveNFTs, onClose }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [cardSize, setCardSize] = useState(270);
  const [isListView, setIsListView] = useState(true);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(true);
  const toast = useToast();

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => 
      prev.some(item => item.id.tokenId === nft.id.tokenId && item.contract.address === nft.contract.address)
        ? prev.filter(item => item.id.tokenId !== nft.id.tokenId || item.contract.address !== nft.contract.address)
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

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading as="h2" size="xl">{catalog.name}</Heading>
        <Button onClick={onBack}>Back to Catalogs</Button>
      </HStack>
      <Text mb={4}>{catalog.nfts.length} NFTs in this catalog</Text>
      {selectedNFTs.length > 0 && (
        <Button 
          onClick={handleRemoveSelected} 
          mb={4}
        >
          Remove Selected ({selectedNFTs.length})
        </Button>
      )}
      
      <Box mb={4}>
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h3" size="md">Display Settings</Heading>
          <IconButton
            icon={isSettingsExpanded ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            aria-label={isSettingsExpanded ? "Collapse settings" : "Expand settings"}
          />
        </Flex>
        <Collapse in={isSettingsExpanded}>
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
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
              <Text>{cardSize}px</Text>
            </HStack>
            <HStack spacing={2}>
              <Text>View:</Text>
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
        </Collapse>
      </Box>

      {isListView ? (
        <VStack align="stretch" spacing={2}>
          {catalog.nfts.map((nft) => (
            <ListViewItem
              key={`${nft.contract.address}-${nft.id.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(item => 
                item.id.tokenId === nft.id.tokenId && item.contract.address === nft.contract.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={() => onRemoveNFTs([nft])}
            />
          ))}
        </VStack>
      ) : (
        <SimpleGrid columns={Math.floor(1200 / cardSize)} spacing={4}>
          {catalog.nfts.map((nft) => (
            <NFTCard
              key={`${nft.contract.address}-${nft.id.tokenId}`}
              nft={nft}
              isSelected={selectedNFTs.some(item => 
                item.id.tokenId === nft.id.tokenId && item.contract.address === nft.contract.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={() => onRemoveNFTs([nft])}
              cardSize={cardSize}
            />
          ))}
        </SimpleGrid>
      )}
    </Box>
  );
};

export default CatalogViewPage;