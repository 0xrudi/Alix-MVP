import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Box, 
  Heading, 
  VStack,
  Text,
  IconButton,
  Flex,
  Collapse,
  SimpleGrid,
  Input,
  InputGroup,
  InputLeftElement,
  ButtonGroup,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { FaList, FaThLarge, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import { selectCatalogNFTs, selectCatalogCount } from '../redux/slices/catalogSlice';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import { useCustomToast } from '../utils/toastUtils';
import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import { logger } from '../utils/logger';

const VIEW_MODES = {
  LIST: 'list',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

const VIEW_SIZES = {
  [VIEW_MODES.LIST]: 0,
  [VIEW_MODES.SMALL]: 160,
  [VIEW_MODES.MEDIUM]: 240,
  [VIEW_MODES.LARGE]: 320
};

const CatalogViewPage = ({ catalog, onBack, onRemoveNFTs, onSpamToggle }) => {
  const { showSuccessToast, showWarningToast } = useCustomToast();
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [viewMode, setViewMode] = useState(VIEW_MODES.MEDIUM);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const catalogNFTs = useSelector(state => selectCatalogNFTs(state, catalog.id)) || [];
  const nftCount = useSelector(state => selectCatalogCount(state, catalog.id));
  
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const isListView = viewMode === VIEW_MODES.LIST;
  const cardSize = VIEW_SIZES[viewMode];

  const getCatalogType = () => {
    if (catalog.id === 'spam') return 'spam';
    if (catalog.id === 'unorganized') return 'unorganized';
    if (catalog.isSystem) return 'system';
    return 'user';
  };

  const filteredNFTs = useMemo(() => 
    catalogNFTs.filter(nft => 
      nft && (
        nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.id?.tokenId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.contract?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [catalogNFTs, searchTerm]
  );

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => {
      const nftKey = `${nft.id.tokenId}-${nft.contract.address}`;
      const isSelected = prev.some(item => 
        `${item.id.tokenId}-${item.contract.address}` === nftKey
      );
      
      return isSelected
        ? prev.filter(item => `${item.id.tokenId}-${item.contract.address}` !== nftKey)
        : [...prev, nft];
    });
  };

  const handleRemoveSelected = () => {
    try {
      onRemoveNFTs(selectedNFTs);
      setSelectedNFTs([]);
      showSuccessToast(
        "NFTs Removed",
        `${selectedNFTs.length} NFT(s) removed from the catalog.`
      );
      logger.log('NFTs removed from catalog:', {
        catalogId: catalog.id,
        count: selectedNFTs.length
      });
    } catch (error) {
      logger.error('Error removing NFTs:', error);
      showWarningToast(
        "Error",
        "Failed to remove some NFTs. Please try again."
      );
    }
  };

  const handleSpamAction = (nft) => {
    if (onSpamToggle) {
      onSpamToggle(nft);
      logger.log('Spam status toggled:', {
        nftId: nft.id.tokenId,
        catalogId: catalog.id
      });
    } else {
      showWarningToast(
        "Action Not Available",
        "Unable to toggle spam state at this time."
      );
    }
  };

  return (
    <StyledContainer>
      {/* Previous JSX remains the same */}
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">{catalog.name}</Heading>
        <StyledButton onClick={onBack}>Back to Catalogs</StyledButton>
      </Flex>

      <Text mb={4}>{nftCount} NFTs in this catalog</Text>
      
      <StyledCard mb={4} maxW="600px">
        {/* Rest of the component JSX remains the same */}
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
              onMarkAsSpam={() => handleSpamAction(nft)}
              isSpamFolder={catalog.id === 'spam'}
              catalogType={getCatalogType()}
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
              onMarkAsSpam={() => handleSpamAction(nft)}
              isSpamFolder={catalog.id === 'spam'}
              catalogType={getCatalogType()}
              cardSize={cardSize}
              onClick={() => navigate('/artifact', { state: { nft } })}  // Add proper navigation
            />
          ))}
        </SimpleGrid>
      )}
    </StyledContainer>
  );
};

export default CatalogViewPage;