import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Progress,
  Skeleton,
  useToast
} from "@chakra-ui/react";
import { FaChevronLeft } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { supabase } from '../../utils/supabase';

import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import LibraryControls from './LibraryControls';
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';

const MotionBox = motion(Box);

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

const CatalogViewPage = ({ 
  catalog, 
  onBack, 
  onRemoveNFTs, 
  onSpamToggle 
}) => {
  const navigate = useNavigate();
  const nfts = useSelector(state => state.nfts.byWallet);
  const wallets = useSelector(state => state.wallets.list);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogNFTs, setCatalogNFTs] = useState([]);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // State for filtering and sorting
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });

  // Grid columns configuration
  const gridColumns = {
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  };
  
  const fetchNFTsFromSupabase = useCallback(async () => {
    if (!catalog?.nftIds || catalog.nftIds.length === 0) {
      setCatalogNFTs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      logger.log('Fetching NFTs for catalog:', catalog.id);
      
      // For system catalogs (spam, unorganized), we already have the NFT objects
      if (catalog.isSystem) {
        logger.log('System catalog, using provided NFT objects');
        setCatalogNFTs(catalog.nftIds);
        setIsLoading(false);
        return;
      }
      
      // For user catalogs, we need to fetch the NFTs from Supabase
      const nftPromises = catalog.nftIds.map(async (nftId) => {
        try {
          // Query Supabase for this NFT
          const { data: artifacts, error } = await supabase
            .from('artifacts')
            .select('*')
            .eq('wallet_id', nftId.walletId)
            .eq('token_id', nftId.tokenId)
            .eq('contract_address', nftId.contractAddress);
            
          if (error) {
            logger.error('Error fetching artifact from Supabase:', {
              error,
              nftId
            });
            return null;
          }
          
          if (!artifacts || artifacts.length === 0) {
            logger.warn('Artifact not found in Supabase:', nftId);
            
            // Try to find it in Redux store as fallback
            const nftFromStore = findNFTInReduxStore(nftId);
            if (nftFromStore) {
              return nftFromStore;
            }
            
            // Return a placeholder if not found
            return createPlaceholderNFT(nftId);
          }
          
          // Convert the first matching artifact to NFT format
          const artifact = artifacts[0];
          return convertArtifactToNFT(artifact, nftId.walletId);
        } catch (error) {
          logger.error('Error processing NFT:', {
            error: error.message,
            nftId
          });
          return createPlaceholderNFT(nftId);
        }
      });
      
      // Wait for all promises to resolve
      const resolvedNFTs = await Promise.all(nftPromises);
      
      // Filter out null values and set state
      setCatalogNFTs(resolvedNFTs.filter(Boolean));
    } catch (error) {
      logger.error('Error fetching NFTs for catalog:', {
        error: error.message,
        catalogId: catalog.id
      });
      showErrorToast(
        "Error Loading Catalog",
        "There was a problem loading the artifacts in this catalog."
      );
    } finally {
      setIsLoading(false);
    }
  }, [catalog, showErrorToast]);

  useEffect(() => {
    // Load NFTs when the component mounts or catalog changes
    fetchNFTsFromSupabase();
  }, [fetchNFTsFromSupabase]);

  // Helper function to find an NFT in the Redux store
  const findNFTInReduxStore = (nftId) => {
    for (const walletId in nfts) {
      if (walletId !== nftId.walletId) continue;
      
      for (const network in nfts[walletId]) {
        // Check in ERC721 collection
        const erc721Match = nfts[walletId][network].ERC721?.find(nft => 
          nft.id?.tokenId === nftId.tokenId && 
          nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
        );
        
        if (erc721Match) {
          return {
            ...erc721Match,
            walletId,
            network
          };
        }
        
        // Check in ERC1155 collection
        const erc1155Match = nfts[walletId][network].ERC1155?.find(nft => 
          nft.id?.tokenId === nftId.tokenId && 
          nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
        );
        
        if (erc1155Match) {
          return {
            ...erc1155Match,
            walletId,
            network
          };
        }
      }
    }
    
    return null;
  };

  // Helper function to create a placeholder NFT when not found
  const createPlaceholderNFT = (nftId) => {
    return {
      id: { tokenId: nftId.tokenId },
      contract: { 
        address: nftId.contractAddress,
        name: 'Unknown Collection'
      },
      title: `Token ID: ${nftId.tokenId}`,
      description: 'NFT details unavailable',
      walletId: nftId.walletId,
      network: nftId.network,
      isPlaceholder: true,
      media: [{
        gateway: 'https://via.placeholder.com/400?text=Not+Found'
      }]
    };
  };

  // Helper function to convert a Supabase artifact to NFT format
  const convertArtifactToNFT = (artifact, walletId) => {
    try {
      // Parse metadata if it's a string
      let metadata = artifact.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          logger.warn('Failed to parse metadata as JSON:', e);
          metadata = {};
        }
      }

      // Find wallet info to add nickname
      const wallet = wallets.find(w => w.id === walletId);
      const walletNickname = wallet?.nickname || truncateAddress(wallet?.address);

      return {
        id: { 
          tokenId: artifact.token_id 
        },
        contract: {
          address: artifact.contract_address,
          name: metadata?.collection?.name || metadata?.contract_name || 'Unknown Collection'
        },
        title: artifact.title || metadata?.name || `Token ID: ${artifact.token_id}`,
        description: artifact.description || metadata?.description || '',
        metadata: metadata || {},
        isSpam: artifact.is_spam || false,
        media: [{
          gateway: artifact.media_url || metadata?.image || 'https://via.placeholder.com/400?text=No+Image'
        }],
        walletId: walletId,
        network: artifact.network,
        walletNickname: walletNickname
      };
    } catch (error) {
      logger.error('Error converting artifact:', {
        error: error.message,
        artifact
      });
      
      // Return a simplified version if conversion fails
      return {
        id: { tokenId: artifact.token_id || 'unknown' },
        contract: { address: artifact.contract_address || 'unknown', name: 'Unknown' },
        title: artifact.title || `Token ID: ${artifact.token_id || 'unknown'}`,
        isSpam: false,
        walletId: walletId,
        network: artifact.network || 'unknown'
      };
    }
  };

  // Helper function to truncate addresses
  const truncateAddress = (address) => 
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Get wallet nickname for filtering
  const getWalletNickname = (walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? (wallet.nickname || truncateAddress(wallet.address)) : 'Unknown Wallet';
  };

  // Get media type for filtering
  const getMediaType = (nft) => {
    if (nft.metadata?.mimeType?.startsWith('video/')) return 'Video';
    if (nft.metadata?.mimeType?.startsWith('audio/')) return 'Audio';
    if (nft.metadata?.mimeType?.startsWith('model/')) return '3D';
    return 'Image';
  };

  const filteredNFTs = useMemo(() => {
    if (!catalogNFTs.length) return [];
    
    let filtered = [...catalogNFTs];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        (nft.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.id?.tokenId || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.contract?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(nft => {
        return Object.entries(activeFilters).every(([category, values]) => {
          if (values.length === 0) return true;
          
          switch (category) {
            case 'wallet':
              const walletName = nft.walletNickname || getWalletNickname(nft.walletId);
              return values.includes(walletName);
            case 'contract':
              return values.includes(nft.contract?.name);
            case 'network':
              return values.includes(nft.network);
            case 'mediaType':
              const mediaType = getMediaType(nft);
              return values.includes(mediaType);
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    if (activeSort) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (activeSort.field) {
          case 'name':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'wallet':
            const aWalletName = a.walletNickname || getWalletNickname(a.walletId);
            const bWalletName = b.walletNickname || getWalletNickname(b.walletId);
            comparison = aWalletName.localeCompare(bWalletName);
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

    return filtered;
  }, [catalogNFTs, searchTerm, activeFilters, activeSort, getWalletNickname]);

  const handleNFTClick = (nft) => {
    navigate('/app/artifact', { state: { nft } });
  };

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

  const handleRemoveSelectedNFTs = () => {
    if (selectedNFTs.length === 0) return;
    
    onRemoveNFTs(selectedNFTs);
    setSelectedNFTs([]);
    setIsSelectMode(false);
  };

  // Get list of wallets and networks for filters
  const availableWallets = useMemo(() => {
    const walletSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.walletNickname) walletSet.add(nft.walletNickname);
      else if (nft.walletId) walletSet.add(getWalletNickname(nft.walletId));
    });
    return Array.from(walletSet);
  }, [catalogNFTs, getWalletNickname]);

  const availableNetworks = useMemo(() => {
    const networkSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.network) networkSet.add(nft.network);
    });
    return Array.from(networkSet);
  }, [catalogNFTs]);

  const availableContracts = useMemo(() => {
    const contractSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.contract?.name) contractSet.add(nft.contract.name);
    });
    return Array.from(contractSet);
  }, [catalogNFTs]);

  // Handle spam toggle with Supabase integration
  const handleSpamToggle = async (nft) => {
    // Call the parent component's handler first for Redux update
    onSpamToggle(nft);
    
    // Additional Supabase update
    try {
      const { error } = await supabase
        .from('artifacts')
        .update({ is_spam: !nft.isSpam })
        .match({ 
          wallet_id: nft.walletId,
          token_id: nft.id.tokenId,
          contract_address: nft.contract.address
        });

      if (error) {
        logger.error('Error updating artifact spam status in Supabase:', error);
        showErrorToast(
          "Update Error",
          "Failed to update artifact status in database"
        );
      }
    } catch (error) {
      logger.error('Error in Supabase spam update:', error);
    }
  };

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
                    {new Date(catalog.createdAt || Date.now()).toLocaleDateString()}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontFamily="Inter" color="var(--ink-grey)">Last Updated</Text>
                  <Text fontFamily="Fraunces">
                    {new Date(catalog.updatedAt || Date.now()).toLocaleDateString()}
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
        />
        
        {isSelectMode && selectedNFTs.length > 0 && (
          <HStack justifyContent="flex-end">
            <Button
              onClick={handleRemoveSelectedNFTs}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Remove {selectedNFTs.length} selected artifacts
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Content Section */}
      <Box>
        {isLoading ? (
          <Box>
            <Progress size="xs" isIndeterminate colorScheme="blue" mb={6} />
            <SimpleGrid columns={gridColumns} spacing={4}>
              {Array(8).fill(0).map((_, i) => (
                <Skeleton 
                  key={i}
                  height="280px"
                  borderRadius="md"
                />
              ))}
            </SimpleGrid>
          </Box>
        ) : viewMode === VIEW_MODES.LIST ? (
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
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                onClick={() => handleNFTClick(nft)}
                isSelectMode={isSelectMode}
              />
            ))}
          </VStack>
        ) : (
          <SimpleGrid 
            columns={gridColumns}
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
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                isSelectMode={isSelectMode}
                onClick={isSelectMode ? () => handleNFTSelect(nft) : () => handleNFTClick(nft)}
                viewMode={VIEW_MODES.GRID}
              />
            ))}
          </SimpleGrid>
        )}

        {!isLoading && filteredNFTs.length === 0 && (
          <Box 
            textAlign="center" 
            py={12}
            color="var(--ink-grey)"
          >
            <Text 
              fontFamily="Fraunces" 
              fontSize="lg"
            >
              {searchTerm 
                ? `No artifacts matching "${searchTerm}"`
                : "No artifacts found in this catalog"
              }
            </Text>
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default CatalogViewPage;