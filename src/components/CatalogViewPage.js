import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Heading, 
  Button, 
  VStack,
  HStack,
  Text,
  useToast,
  IconButton,
  Flex,
  Collapse,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaList, FaThLarge, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import { selectCatalogNFTs, selectCatalogCount } from '../redux/slices/catalogSlice';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';

const VIEW_MODES = {
  LIST: 'list',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

const VIEW_SIZES = {
  [VIEW_MODES.LIST]: 0, // Not used for list view
  [VIEW_MODES.SMALL]: 160,
  [VIEW_MODES.MEDIUM]: 240,
  [VIEW_MODES.LARGE]: 320
};

const CatalogViewPage = ({ catalog, onBack, onRemoveNFTs, onClose, onUnmarkSpam }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.MEDIUM);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const catalogNFTs = useSelector(state => selectCatalogNFTs(state, catalog.id)) || [];
  const nftCount = useSelector(state => selectCatalogCount(state, catalog.id));
  const toast = useToast();
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const isListView = viewMode === VIEW_MODES.LIST;
  const cardSize = VIEW_SIZES[viewMode];

  const filteredNFTs = catalogNFTs.filter(nft => 
    nft && (
      nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.id?.tokenId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => 
      prev.some(item => item.id?.tokenId === nft.id?.tokenId && 
                       item.contract?.address === nft.contract?.address)
        ? prev.filter(item => item.id?.tokenId !== nft.id?.tokenId || 
                            item.contract?.address !== nft.contract?.address)
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
    <StyledContainer>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">{catalog.name}</Heading>
        <StyledButton onClick={onBack}>Back to Catalogs</StyledButton>
      </Flex>
      <Text mb={4}>{nftCount} NFTs in this catalog</Text>
      
      <StyledCard mb={4} maxW="600px">
        <Flex justify="space-between" align="center" mb={2}>
          <Heading as="h3" size="md">Display Settings</Heading>
          <IconButton
            icon={isSettingsExpanded ? <FaChevronUp /> : <FaChevronDown />}
            onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
            aria-label={isSettingsExpanded ? "Collapse settings" : "Expand settings"}
          />
        </Flex>
        <Collapse in={isSettingsExpanded}>
          <VStack spacing={4} align="stretch" pt={2}>
            <Flex align="center" justify="space-between">
              <Text>View Mode:</Text>
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  onClick={() => setViewMode(VIEW_MODES.LIST)}
                  colorScheme={isListView ? "blue" : "gray"}
                  leftIcon={<FaList />}
                >
                  List
                </Button>
                <Button
                  onClick={() => setViewMode(VIEW_MODES.SMALL)}
                  colorScheme={viewMode === VIEW_MODES.SMALL ? "blue" : "gray"}
                >
                  Small
                </Button>
                <Button
                  onClick={() => setViewMode(VIEW_MODES.MEDIUM)}
                  colorScheme={viewMode === VIEW_MODES.MEDIUM ? "blue" : "gray"}
                >
                  Medium
                </Button>
                <Button
                  onClick={() => setViewMode(VIEW_MODES.LARGE)}
                  colorScheme={viewMode === VIEW_MODES.LARGE ? "blue" : "gray"}
                >
                  Large
                </Button>
              </ButtonGroup>
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
                item.id?.tokenId === nft.id?.tokenId && 
                item.contract?.address === nft.contract?.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={catalog.id === 'spam' ? 
                () => onUnmarkSpam(nft) : 
                () => onRemoveNFTs([nft])}
              isSpamFolder={catalog.id === 'spam'}
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
                item.id?.tokenId === nft.id?.tokenId && 
                item.contract?.address === nft.contract?.address
              )}
              onSelect={() => handleNFTSelect(nft)}
              onRemove={catalog.id === 'spam' ? 
                () => onUnmarkSpam(nft) : 
                () => onRemoveNFTs([nft])}
              cardSize={cardSize}
              isSpamFolder={catalog.id === 'spam'}
            />
          ))}
        </SimpleGrid>
      )}
    </StyledContainer>
  );
};

export default CatalogViewPage;