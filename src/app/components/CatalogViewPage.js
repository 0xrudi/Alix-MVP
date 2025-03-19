import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  Alert,
  AlertIcon,
  useToast
} from "@chakra-ui/react";
import { FaChevronLeft, FaSync } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { supabase } from '../../utils/supabase';

import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import LibraryControls from './LibraryControls';
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { extractNFTAttributes } from '../../utils/nftUtils';

const MotionBox = motion(Box);

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

// Circuit breaker to avoid infinite loops
const MAX_FETCH_ATTEMPTS = 3;
const FETCH_LOCKOUT_TIME = 10000; // 10 seconds

// Simple IPFS URL transformer
const transformIpfsUrl = (url) => {
  if (!url) return '';
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  return url;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [catalogNFTs, setCatalogNFTs] = useState([]);
  const [error, setError] = useState(null);
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();

  // Circuit breaker state
  const fetchAttempts = useRef(0);
  const lastFetchTime = useRef(0);
  const isMounted = useRef(true);
  const processingBatch = useRef(false);
  const catalogIdRef = useRef(catalog?.id);
  
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

  // Effect to prevent fetch loops on unmount
  useEffect(() => {
    isMounted.current = true;
    // Reset circuit breaker when catalog changes
    if (catalog?.id !== catalogIdRef.current) {
      catalogIdRef.current = catalog?.id;
      fetchAttempts.current = 0;
      lastFetchTime.current = 0;
    }
    return () => {
      isMounted.current = false;
    };
  }, [catalog?.id]);
  
  const fetchNFTsFromSupabase = useCallback(async (forceRefresh = false) => {
    // Check if we're in a circuit breaker lockout period
    const now = Date.now();
    if (!forceRefresh && fetchAttempts.current >= MAX_FETCH_ATTEMPTS && 
        now - lastFetchTime.current < FETCH_LOCKOUT_TIME) {
      logger.warn('Circuit breaker active: Too many fetch attempts in short period');
      setError("Too many data fetch attempts. Please try again in a few seconds.");
      setIsLoading(false);
      return;
    }
    
    // Don't run if we're already processing a batch or component is unmounted
    if (processingBatch.current || !isMounted.current) {
      return;
    }
    
    // Update circuit breaker state
    lastFetchTime.current = now;
    fetchAttempts.current += 1;
    
    if (!catalog?.nftIds || catalog.nftIds.length === 0) {
      setCatalogNFTs([]);
      setIsLoading(false);
      setError(null);
      processingBatch.current = false;
      return;
    }

    processingBatch.current = true;
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    try {
      logger.log('Fetching NFTs for catalog:', catalog.id);
      
      // For system catalogs (spam, unorganized), we already have the NFT objects
      if (catalog.isSystem) {
        logger.log('System catalog, using provided NFT objects');
        if (isMounted.current) {
          setCatalogNFTs(catalog.nftIds);
          setIsLoading(false);
        }
        processingBatch.current = false;
        return;
      }
      
      // Get unique nftIds to avoid duplicates
      const uniqueNftIds = Array.from(
        new Map(
          catalog.nftIds.map(nft => [
            `${nft.tokenId}-${nft.contractAddress}-${nft.walletId}`, 
            nft
          ])
        ).values()
      );
      
      // First fill with data from Redux store - this is fast
      const initialNFTs = uniqueNftIds.map(nftId => {
        // Try to find in Redux store
        const reduxNFT = findNFTInReduxStore(nftId);
        return reduxNFT || createPlaceholderNFT(nftId);
      });
      
      if (isMounted.current) {
        setCatalogNFTs(initialNFTs);
        setLoadingProgress(50);
      }

      // If we have placeholders, try to fetch them from Supabase
      const missingNFTs = initialNFTs.filter(nft => nft.isPlaceholder);
      
      if (missingNFTs.length > 0 && isMounted.current) {
        try {
          // Create a list of promises
          const promises = missingNFTs.map(async (nft) => {
            try {
              const { data: artifacts, error } = await supabase
                .from('artifacts')
                .select('*')
                .eq('wallet_id', nft.walletId)
                .eq('token_id', nft.id.tokenId)
                .eq('contract_address', nft.contract.address)
                .limit(1);
                
              if (error) throw error;
              
              if (artifacts && artifacts.length > 0) {
                return convertArtifactToNFT(artifacts[0], nft.walletId);
              }
              
              return nft; // Keep placeholder if not found
            } catch (error) {
              logger.error('Error fetching NFT details:', error);
              return nft; // Keep placeholder if error
            }
          });
          
          // Execute all promises in parallel
          const fetchedNFTs = await Promise.all(promises);
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            // Replace placeholders with actual data
            setCatalogNFTs(prevNFTs => {
              return prevNFTs.map(prevNFT => {
                const updatedNFT = fetchedNFTs.find(fetchedNFT => 
                  fetchedNFT.id.tokenId === prevNFT.id.tokenId && 
                  fetchedNFT.contract.address === prevNFT.contract.address &&
                  fetchedNFT.walletId === prevNFT.walletId
                );
                
                return updatedNFT || prevNFT;
              });
            });
          }
        } catch (error) {
          if (isMounted.current) {
            logger.error('Error fetching missing NFTs:', error);
            setError("Some artifacts could not be loaded completely.");
          }
        }
      }
      
      // Reset circuit breaker on successful load
      fetchAttempts.current = 0;
      
    } catch (error) {
      if (isMounted.current) {
        logger.error('Error fetching NFTs for catalog:', {
          error: error.message,
          catalogId: catalog.id
        });
        setError("Failed to load catalog artifacts. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setLoadingProgress(100);
      }
      processingBatch.current = false;
    }
  }, [catalog, findNFTInReduxStore, convertArtifactToNFT, createPlaceholderNFT]);

  // Define these functions here to avoid dependency errors in the useCallback
  function findNFTInReduxStore(nftId) {
    if (!nftId || !nftId.walletId || !nfts[nftId.walletId]) return null;

    for (const network in nfts[nftId.walletId]) {
      // Check in ERC721 collection
      const erc721Match = nfts[nftId.walletId][network].ERC721?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      );
      
      if (erc721Match) {
        return {
          ...erc721Match,
          walletId: nftId.walletId,
          network,
          walletNickname: getWalletNickname(nftId.walletId)
        };
      }
      
      // Check in ERC1155 collection
      const erc1155Match = nfts[nftId.walletId][network].ERC1155?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      );
      
      if (erc1155Match) {
        return {
          ...erc1155Match,
          walletId: nftId.walletId,
          network,
          walletNickname: getWalletNickname(nftId.walletId)
        };
      }
    }
    
    return null;
  }

  // Create a placeholder NFT when not found
  function createPlaceholderNFT(nftId) {
    return {
      id: { tokenId: nftId.tokenId },
      contract: { 
        address: nftId.contractAddress,
        name: 'Unknown Collection'
      },
      title: `Token ID: ${nftId.tokenId}`,
      description: 'NFT details unavailable',
      walletId: nftId.walletId,
      network: nftId.network || 'unknown',
      isPlaceholder: true,
      media: [{
        gateway: 'https://via.placeholder.com/400?text=Loading...'
      }]
    };
  }

  // Convert a Supabase artifact to NFT format
  function convertArtifactToNFT(artifact, walletId) {
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
      
      // Process image URL for IPFS compatibility
      let imageUrl = artifact.media_url || metadata?.image || '';
      imageUrl = transformIpfsUrl(imageUrl);

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
          gateway: imageUrl || 'https://via.placeholder.com/400?text=No+Image'
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
        isSpam: artifact.is_spam || false,
        walletId: walletId,
        network: artifact.network || 'unknown'
      };
    }
  }

  useEffect(() => {
    // Only run this effect once on mount, not on every render or on every catalog change
    if (catalog && !processingBatch.current) {
      fetchNFTsFromSupabase();
    }
    
    // Cleanup function
    return () => {
      processingBatch.current = false;
    };
  }, []);  // Empty dependency array to run once on mount

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
    
    // Apply search filter
    let result = [...catalogNFTs];
    
    if (searchTerm) {
      result = result.filter(nft => 
        (nft.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.id?.tokenId || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.contract?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(nft => {
        return Object.entries(activeFilters).every(([category, values]) => {
          if (!values.length) return true; // Skip empty filter categories
          
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
      result.sort((a, b) => {
        let comparison = 0;
        switch (activeSort.field) {
          case 'name':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'wallet':
            comparison = (a.walletNickname || '').localeCompare(b.walletNickname || '');
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
  
    return result;
  }, [catalogNFTs, searchTerm, activeFilters, activeSort]);
  

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

  const handleRefresh = () => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    fetchNFTsFromSupabase(true) // Pass true to force refresh bypassing circuit breaker
      .then(() => {
        showSuccessToast(
          "Refresh Complete",
          "Catalog artifacts have been refreshed."
        );
      })
      .catch((error) => {
        logger.error('Error refreshing catalog:', error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
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
      // Find the artifact in Supabase
      const { data: existingArtifact, error: findError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('token_id', nft.id.tokenId)
        .eq('contract_address', nft.contract.address)
        .eq('wallet_id', nft.walletId)
        .maybeSingle();
      
      if (findError) {
        logger.error('Error finding artifact:', findError);
        return;
      }
      
      if (existingArtifact) {
        // Update existing artifact
        const { error: updateError } = await supabase
          .from('artifacts')
          .update({ is_spam: !nft.isSpam })
          .eq('id', existingArtifact.id);
          
        if (updateError) {
          logger.error('Error updating spam status:', updateError);
          throw updateError;
        }
      } else {
        // Insert new artifact with spam status
        const { error: insertError } = await supabase
          .from('artifacts')
          .insert([{
            token_id: nft.id.tokenId,
            contract_address: nft.contract.address,
            wallet_id: nft.walletId,
            network: nft.network || 'unknown',
            is_spam: !nft.isSpam,
            title: nft.title || '',
            description: nft.description || '',
            metadata: nft.metadata || {}
          }]);
          
        if (insertError) {
          logger.error('Error creating artifact with spam status:', insertError);
          throw insertError;
        }
      }
      
      // Update local state to reflect the change
      setCatalogNFTs(prev => 
        prev.map(item => 
          item.id?.tokenId === nft.id?.tokenId && 
          item.contract?.address === nft.contract?.address && 
          item.walletId === nft.walletId
            ? { ...item, isSpam: !nft.isSpam }
            : item
        )
      );
      
      showInfoToast(
        nft.isSpam ? "Removed from Spam" : "Marked as Spam",
        nft.isSpam 
          ? "The artifact has been removed from your spam folder"
          : "The artifact has been marked as spam"
      );
      
    } catch (error) {
      logger.error('Error in Supabase spam update:', error);
      showErrorToast(
        "Update Error",
        "Failed to update artifact status in database"
      );
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

        <HStack justify="space-between" align="flex-start">
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
          
          <Button
            leftIcon={<FaSync />}
            isLoading={isRefreshing || isLoading}
            loadingText="Refreshing"
            onClick={handleRefresh}
            size="sm"
            aria-label="Refresh catalog"
            colorScheme="blue"
            variant="outline"
          >
            Refresh
          </Button>
        </HStack>

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
                  <Text fontFamily="Fraunces">{catalogNFTs.length} artifacts</Text>
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

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm" fontFamily="Inter">{error}</Text>
          <Button 
            size="sm" 
            ml="auto" 
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading Progress */}
      {(isLoading || isRefreshing) && (
        <Box mb={6}>
          <Progress 
            value={loadingProgress} 
            size="xs" 
            colorScheme="blue" 
            isAnimated
            hasStripe
            borderRadius="full"
          />
          <Text 
            fontSize="xs" 
            color="var(--ink-grey)" 
            textAlign="center" 
            mt={1}
            fontFamily="Inter"
          >
            {isRefreshing ? "Refreshing catalog..." : "Loading artifacts..."} {loadingProgress}%
          </Text>
        </Box>
      )}
      
      {/* Content Section */}
      <Box>
        {isLoading ? (
          <SimpleGrid columns={gridColumns} spacing={4}>
            {Array(8).fill(0).map((_, i) => (
              <Skeleton
                key={i}
                height="280px"
                borderRadius="md"
              />
            ))}
          </SimpleGrid>
        ) : viewMode === VIEW_MODES.LIST ? (
          <VStack spacing={2} align="stretch">
            {filteredNFTs.map((nft, index) => (
              <ListViewItem
                key={`${nft.contract?.address}-${nft.id?.tokenId}-${index}`}
                nft={{
                  ...nft,
                  // Transform IPFS URLs if needed
                  media: nft.media?.map(media => ({
                    ...media,
                    gateway: transformIpfsUrl(media.gateway)
                  }))
                }}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                onClick={() => handleNFTClick(nft)}
                isSelectMode={isSelectMode}
                isLastItem={index === filteredNFTs.length - 1}
              />
            ))}
          </VStack>
        ) : (
          <SimpleGrid 
            columns={gridColumns}
            spacing={4}
          >
            {filteredNFTs.map((nft, index) => (
              <NFTCard
                key={`${nft.contract?.address}-${nft.id?.tokenId}-${index}`}
                nft={{
                  ...nft,
                  // Transform IPFS URLs if needed
                  media: nft.media?.map(media => ({
                    ...media,
                    gateway: transformIpfsUrl(media.gateway)
                  }))
                }}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                isSelectMode={isSelectMode}
                onClick={isSelectMode ? () => handleNFTSelect(nft) : () => handleNFTClick(nft)}
                catalogType={catalog.id === 'spam' ? 'spam' : 'user'}
              />
            ))}
          </SimpleGrid>
        )}

        {!isLoading && !isRefreshing && filteredNFTs.length === 0 && (
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
            {(!searchTerm && !error) && (
              <Button
                mt={4}
                size="sm"
                onClick={handleRefresh}
                leftIcon={<FaSync />}
                colorScheme="blue"
                variant="outline"
              >
                Refresh Catalog
              </Button>
            )}
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default CatalogViewPage;