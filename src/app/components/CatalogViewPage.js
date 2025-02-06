// src/components/CatalogView/CatalogViewPage.jsx
import React, { useState, useMemo } from 'react';
import {
  VStack,
  Box,
  Text,
  Heading,
  Button,
  SimpleGrid,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  HStack,
} from "@chakra-ui/react";
import { FaChevronLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';

import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import LibraryControls from './LibraryControls';
import { useCustomToast } from './../utils/toastUtils';

const MotionBox = motion(Box);

const VIEW_MODES = {
  LIST: 'list',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large'
};

const CatalogViewPage = ({ 
  catalog, 
  onBack, 
  onRemoveNFTs, 
  onSpamToggle 
}) => {
  const nfts = useSelector(state => state.nfts.byWallet);
  const [viewMode, setViewMode] = useState(VIEW_MODES.MEDIUM);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const { showSuccessToast } = useCustomToast();

  // State for filtering and sorting
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });
  
  const filteredNFTs = useMemo(() => {
    if (!catalog?.nftIds) return [];
    
    // First, get all NFTs from the wallet's collection that match our catalog's NFT IDs
    let matchedNFTs = catalog.nftIds.map(nftId => {
      const matchingNFT = nfts[nftId.walletId]?.[nftId.network]?.['ERC721']?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      ) || nfts[nftId.walletId]?.[nftId.network]?.['ERC1155']?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      );

      if (matchingNFT) {
        return {
          ...matchingNFT,
          walletId: nftId.walletId,
          network: nftId.network
        };
      }
      return null;
    }).filter(Boolean);

    // Apply search filter
    if (searchTerm) {
      matchedNFTs = matchedNFTs.filter(nft => 
        nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.id?.tokenId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.contract?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      matchedNFTs = matchedNFTs.filter(nft => {
        return Object.entries(activeFilters).every(([category, values]) => {
          switch (category) {
            case 'wallet':
              return values.some(value => 
                nft.walletId === value || 
                nft.walletNickname === value
              );
            case 'contract':
              return values.includes(nft.contract?.name);
            case 'network':
              return values.includes(nft.network);
            case 'mediaType':
              const mediaType = nft.metadata?.mimeType?.split('/')[0] || 'image';
              return values.includes(mediaType);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (activeSort) {
      matchedNFTs.sort((a, b) => {
        let comparison = 0;
        switch (activeSort.field) {
          case 'name':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'wallet':
            comparison = (a.walletId || '').localeCompare(b.walletId || '');
            break;
          case 'contract':
            comparison = (a.contract?.name || '').localeCompare(b.contract?.name || '');
            break;
          case 'network':
            comparison = (a.network || '').localeCompare(b.network || '');
            break;
          default:
            comparison = 0;
        }
        return activeSort.ascending ? comparison : -comparison;
      });
    }

    return matchedNFTs;
  }, [catalog?.nftIds, nfts, searchTerm, activeFilters, activeSort]);

  const handleNFTSelect = (nft) => {
    setSelectedNFTs(prev => {
      const isSelected = prev.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );
      
      return isSelected
        ? prev.filter(selected => 
            selected.id?.tokenId !== nft.id?.tokenId ||
            selected.contract?.address !== nft.contract?.address
          )
        : [...prev, nft];
    });
  };

  const handleClearSelections = () => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  };

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  const handleSortChange = (sort) => {
    setActiveSort(sort);
  };

  // Get list of wallets and networks for filters
  const availableWallets = useMemo(() => {
    const wallets = new Set();
    filteredNFTs.forEach(nft => {
      if (nft.walletId) wallets.add(nft.walletId);
      if (nft.walletNickname) wallets.add(nft.walletNickname);
    });
    return Array.from(wallets);
  }, [filteredNFTs]);

  const availableNetworks = useMemo(() => {
    const networks = new Set();
    filteredNFTs.forEach(nft => {
      if (nft.network) networks.add(nft.network);
    });
    return Array.from(networks);
  }, [filteredNFTs]);

  const availableContracts = useMemo(() => {
    const contracts = new Set();
    filteredNFTs.forEach(nft => {
      if (nft.contract?.name) contracts.add(nft.contract.name);
    });
    return Array.from(contracts);
  }, [filteredNFTs]);

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      maxW="container.xl"
      mx="auto"
      px={{ base: 4, md: 8 }}
      py={8}
    >
      {/* Header Section */}
      <VStack spacing={6} align="stretch" mb={8}>
        <Button
          leftIcon={<FaChevronLeft />}
          variant="ghost"
          onClick={onBack}
          alignSelf="flex-start"
          color="var(--ink-grey)"
          fontFamily="Inter"
          _hover={{ 
            bg: "var(--highlight)",
            color: "var(--rich-black)"
          }}
        >
          Back to Library
        </Button>

        <Box>
          <Heading 
            as="h1" 
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            mb={3}
          >
            {catalog.name}
          </Heading>
          {catalog.description && (
            <Text 
              fontSize="lg"
              fontFamily="Fraunces"
              color="var(--ink-grey)"
              mb={4}
            >
              {catalog.description}
            </Text>
          )}
        </Box>

        {/* Collection Details */}
        <Accordion allowToggle>
          <AccordionItem 
            border="1px solid"
            borderColor="var(--shadow)"
            borderRadius="md"
            bg="var(--paper-white)"
          >
            <AccordionButton py={3}>
              <Box flex="1" textAlign="left">
                <Text 
                  fontFamily="Space Grotesk"
                  fontSize="md"
                  color="var(--rich-black)"
                >
                  Collection Details
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={2}>
                <HStack justify="space-between">
                  <Text fontFamily="Inter" color="var(--ink-grey)">Items</Text>
                  <Text fontFamily="Fraunces">{filteredNFTs.length} artifacts</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontFamily="Inter" color="var(--ink-grey)">Created</Text>
                  <Text fontFamily="Fraunces">
                    {new Date(catalog.createdAt).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontFamily="Inter" color="var(--ink-grey)">Last Updated</Text>
                  <Text fontFamily="Fraunces">
                    {new Date(catalog.updatedAt).toLocaleDateString()}
                  </Text>
                </HStack>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>

        {/* Library Controls */}
        <LibraryControls
          wallets={availableWallets}
          networks={availableNetworks}
          contracts={availableContracts}
          mediaTypes={['Image', 'Video', 'Audio', '3D']}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          isSelectMode={isSelectMode}
          onSelectModeChange={setIsSelectMode}
          onClearSelections={handleClearSelections}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showViewModes={true}
        />
      </VStack>

      {/* Content Section */}
      <Box>
        {viewMode === VIEW_MODES.LIST ? (
          <VStack spacing={2} align="stretch">
            {filteredNFTs.map((nft) => (
              <ListViewItem
                key={`${nft.contract?.address}-${nft.id?.tokenId}`}
                nft={nft}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => onSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
              />
            ))}
          </VStack>
        ) : (
          <SimpleGrid 
            columns={{ 
              base: viewMode === VIEW_MODES.LARGE ? 1 : 2,
              sm: viewMode === VIEW_MODES.LARGE ? 2 : 3,
              md: viewMode === VIEW_MODES.LARGE ? 3 : 4,
              lg: viewMode === VIEW_MODES.LARGE ? 4 : 5
            }}
            spacing={4}
          >
            {filteredNFTs.map((nft) => (
              <NFTCard
                key={`${nft.contract?.address}-${nft.id?.tokenId}`}
                nft={nft}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => onSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                isSelectMode={isSelectMode}
                onClick={isSelectMode ? () => handleNFTSelect(nft) : null}
                size={viewMode}
                catalogType={catalog.type}
              />
            ))}
          </SimpleGrid>
        )}

        {filteredNFTs.length === 0 && (
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
      </Box>
    </MotionBox>
  );
};

export default CatalogViewPage;