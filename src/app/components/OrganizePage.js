import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Flex,
  Alert,
  AlertIcon,
  Progress,
  Spinner,
  HStack,
  useBreakpointValue
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaSync, FaPlus } from 'react-icons/fa';

// Import components
import NFTGrid from './NFTGrid';
import LibraryControls from './LibraryControls';
import NewCatalogModal from './NewCatalogModal';
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';

// Import utilities and hooks
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { useErrorHandler } from '../../utils/errorUtils';
import { StyledContainer } from '../styles/commonStyles';

// Import Redux actions and selectors
import { selectNFTsNotInCatalog } from '../redux/slices/nftSlice';
import { toggleArtifactSpam } from '../redux/thunks/artifactThunks';
import { selectUserCatalogs } from '../redux/slices/catalogSlice';
import { addNFTToCatalogWithStatus } from '../redux/slices/catalogSlice';
import { supabase } from '../../utils/supabase';
import { useServices } from '../../services/service-provider';

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

const OrganizePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { user, userService } = useServices();
  
  // Redux selectors
  const unorganizedNFTs = useSelector(selectNFTsNotInCatalog);
  const catalogs = useSelector(selectUserCatalogs);
  
  // Local state
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCatalogModalOpen, setIsNewCatalogModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [artifactsData, setArtifactsData] = useState([]);
  
  // Controlled filter state
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });
  
  // Load unorganized artifacts when component mounts and user is authenticated
  useEffect(() => {
    if (user) {
      fetchUnorganizedArtifacts();
    }
  }, [user]);
  
  // Function to fetch unorganized artifacts directly from Supabase
  const fetchUnorganizedArtifacts = useCallback(async (showLoadingState = true) => {
    if (!user) {
      setError("User not authenticated. Please log in and try again.");
      setIsLoading(false);
      return;
    }
    
    if (showLoadingState) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    setError(null);
    
    try {
      logger.log('Fetching unorganized artifacts from Supabase');
      
      // First, get all artifacts for the user that aren't in any catalog
      const { data: artifacts, error: artifactsError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('is_in_catalog', false)
        .eq('is_spam', false)
        .order('created_at', { ascending: false });
      
      if (artifactsError) {
        throw artifactsError;
      }
      
      logger.log(`Found ${artifacts.length} unorganized artifacts`);
      
      // Process the artifacts to match the NFT format expected by the UI
      const processedArtifacts = artifacts.map(artifact => {
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
        
        return {
          id: { tokenId: artifact.token_id },
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
          walletId: artifact.wallet_id,
          network: artifact.network,
          // Add these properties needed for the UI
          isInCatalog: false,
          cover_image_url: artifact.cover_image_url,
          media_url: artifact.media_url,
          media_type: artifact.media_type
        };
      });
      
      setArtifactsData(processedArtifacts);
      
      if (showLoadingState) {
        showSuccessToast(
          "Artifacts Loaded", 
          `Found ${processedArtifacts.length} artifacts that need organizing.`
        );
      } else {
        showSuccessToast(
          "Artifacts Refreshed", 
          "Updated your unorganized artifacts."
        );
      }
    } catch (error) {
      logger.error('Error fetching unorganized artifacts:', error);
      setError("Failed to load unorganized artifacts. Please try again.");
      showErrorToast(
        "Error Loading Artifacts",
        "Failed to load unorganized artifacts. Please try again."
      );
    } finally {
      if (showLoadingState) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [user, showSuccessToast, showErrorToast]);
  
  // Function to refresh artifacts
  const handleRefresh = useCallback(() => {
    if (isRefreshing || isLoading) return;
    fetchUnorganizedArtifacts(false);
  }, [isRefreshing, isLoading, fetchUnorganizedArtifacts]);
  
  // Handler for marking an NFT as spam
  const handleSpamToggle = useCallback(async (nft) => {
    try {
      setIsRefreshing(true);
      
      // Get the artifact ID from Supabase
      const { data: artifact, error: findError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('token_id', nft.id.tokenId)
        .eq('contract_address', nft.contract.address)
        .eq('wallet_id', nft.walletId)
        .maybeSingle();
      
      if (findError) throw findError;
      
      if (artifact) {
        // Update is_spam flag in Supabase
        const { error: updateError } = await supabase
          .from('artifacts')
          .update({ is_spam: true })
          .eq('id', artifact.id);
        
        if (updateError) throw updateError;
        
        // Also update Redux
        await dispatch(toggleArtifactSpam(nft)).unwrap();
        
        showInfoToast(
          "Marked as Spam",
          "The artifact has been moved to your spam folder."
        );
        
        // Remove from local state
        setArtifactsData(prev => prev.filter(item => 
          item.id.tokenId !== nft.id.tokenId || 
          item.contract.address !== nft.contract.address
        ));
      }
    } catch (error) {
      logger.error('Error toggling spam status:', error);
      showErrorToast(
        "Update Failed",
        "Failed to mark artifact as spam. Please try again."
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, showInfoToast, showErrorToast]);

  // Verify and repair catalog statuses
  const verifyAndRepairCatalogStatuses = useCallback(async () => {
    try {
      if (!user) return;
      
      // Direct Supabase query to fix inconsistencies
      // Fix artifacts that should be marked as in catalog but aren't
      const { data: inCatalogArtifacts } = await supabase
        .from('catalog_artifacts')
        .select('artifact_id')
        .limit(1000);
        
      if (inCatalogArtifacts && inCatalogArtifacts.length > 0) {
        const artifactIds = inCatalogArtifacts.map(item => item.artifact_id);
        
        // Update is_in_catalog flag for all artifacts that are in catalogs
        await supabase
          .from('artifacts')
          .update({ is_in_catalog: true })
          .in('id', artifactIds);
          
        logger.log('Fixed catalog status for artifacts in catalogs:', artifactIds.length);
      }
    } catch (error) {
      logger.error('Error repairing catalog statuses:', error);
    }
  }, [user]);
  
  // Run once on mount
  useEffect(() => {
    verifyAndRepairCatalogStatuses();
  }, [verifyAndRepairCatalogStatuses]);
  
  // Handler for adding an NFT to a catalog
  const handleAddToCatalog = useCallback(async (catalogId) => {
    if (selectedNFTs.length === 0) return;
    
    setIsRefreshing(true);
    let successCount = 0;
    
    try {
      for (const nft of selectedNFTs) {
        try {
          // First, get the artifact ID from Supabase
          const { data: artifact, error: findError } = await supabase
            .from('artifacts')
            .select('id')
            .eq('token_id', nft.id.tokenId)
            .eq('contract_address', nft.contract.address)
            .eq('wallet_id', nft.walletId)
            .maybeSingle();
          
          if (findError) throw findError;
          
          if (artifact) {
            // Add to catalog in Supabase
            const { error: relError } = await supabase
              .from('catalog_artifacts')
              .insert({
                catalog_id: catalogId,
                artifact_id: artifact.id
              });
            
            if (relError) throw relError;
            
            // Update is_in_catalog flag
            const { error: updateError } = await supabase
              .from('artifacts')
              .update({ is_in_catalog: true })
              .eq('id', artifact.id);
            
            if (updateError) throw updateError;
            
            // Also dispatch Redux action
            await dispatch(addNFTToCatalogWithStatus({
              catalogId,
              nft,
              artifactId: artifact.id
            })).unwrap();
            
            successCount++;
            
            // Remove from local state
            setArtifactsData(prev => prev.filter(item => 
              item.id.tokenId !== nft.id.tokenId || 
              item.contract.address !== nft.contract.address
            ));
          }
        } catch (error) {
          logger.error('Error adding NFT to catalog:', error);
        }
      }
      
      if (successCount > 0) {
        showSuccessToast(
          "Added to Catalog",
          `${successCount} artifacts added to catalog.`
        );
        
        // Clear selection
        setSelectedNFTs([]);
        setIsSelectMode(false);
      } else {
        showErrorToast(
          "Update Failed",
          "Failed to add artifacts to catalog. Please try again."
        );
      }
    } catch (error) {
      handleError(error, 'adding artifacts to catalog');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedNFTs, dispatch, showSuccessToast, showErrorToast, handleError]);
  
  // Handler for marking selected NFTs as spam
  const handleMarkSelectedAsSpam = useCallback(async () => {
    if (selectedNFTs.length === 0) return;
    
    setIsRefreshing(true);
    let successCount = 0;
    
    try {
      for (const nft of selectedNFTs) {
        try {
          // Get the artifact ID from Supabase
          const { data: artifact, error: findError } = await supabase
            .from('artifacts')
            .select('id')
            .eq('token_id', nft.id.tokenId)
            .eq('contract_address', nft.contract.address)
            .eq('wallet_id', nft.walletId)
            .maybeSingle();
          
          if (findError) throw findError;
          
          if (artifact) {
            // Update is_spam flag in Supabase
            const { error: updateError } = await supabase
              .from('artifacts')
              .update({ is_spam: true })
              .eq('id', artifact.id);
            
            if (updateError) throw updateError;
            
            // Also update Redux
            await dispatch(toggleArtifactSpam(nft)).unwrap();
            
            successCount++;
            
            // Remove from local state
            setArtifactsData(prev => prev.filter(item => 
              item.id.tokenId !== nft.id.tokenId || 
              item.contract.address !== nft.contract.address
            ));
          }
        } catch (error) {
          logger.error('Error marking NFT as spam:', error);
        }
      }
      
      if (successCount > 0) {
        showSuccessToast(
          "Marked as Spam",
          `${successCount} artifacts marked as spam.`
        );
        
        // Clear selection
        setSelectedNFTs([]);
        setIsSelectMode(false);
      } else {
        showErrorToast(
          "Update Failed",
          "Failed to mark artifacts as spam. Please try again."
        );
      }
    } catch (error) {
      handleError(error, 'marking artifacts as spam');
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedNFTs, dispatch, showSuccessToast, showErrorToast, handleError]);
  
  // Filter NFTs based on search term and active filters
  const filteredNFTs = useMemo(() => {
    let result = [...artifactsData];
    
    // Apply search filter
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
              return values.includes(nft.walletId);
            case 'contract':
              return values.includes(nft.contract?.name);
            case 'network':
              return values.includes(nft.network);
            case 'mediaType':
              // Determine media type
              const mediaType = nft.media_type || 'Image';
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
    
    return result;
  }, [artifactsData, searchTerm, activeFilters, activeSort]);
  
  // Handler for selecting an NFT
  const handleNFTSelect = useCallback((nft) => {
    setSelectedNFTs(prev => {
      const isSelected = prev.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );
      
      if (isSelected) {
        return prev.filter(selected => 
          selected.id?.tokenId !== nft.id?.tokenId ||
          selected.contract?.address !== nft.contract?.address
        );
      } else {
        return [...prev, nft];
      }
    });
  }, []);
  
  // Handler for clearing selections
  const handleClearSelections = useCallback(() => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, []);
  
  // Handler for filtering
  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);
  
  // Handler for sorting
  const handleSortChange = useCallback((sort) => {
    setActiveSort(sort);
  }, []);
  
  // Handler for clicking an NFT
  const handleNFTClick = useCallback((nft) => {
    navigate('/app/artifact', { state: { nft } });
  }, [navigate]);
  
  // Calculate available filter options
  const availableWallets = useMemo(() => {
    const walletIds = [...new Set(artifactsData.map(nft => nft.walletId))];
    return walletIds;
  }, [artifactsData]);
  
  const availableNetworks = useMemo(() => {
    const networks = [...new Set(artifactsData.map(nft => nft.network))];
    return networks;
  }, [artifactsData]);
  
  const availableContracts = useMemo(() => {
    const contracts = [...new Set(artifactsData.map(nft => nft.contract?.name).filter(Boolean))];
    return contracts;
  }, [artifactsData]);
  
  // Handler for removing an NFT from selection
  const handleRemoveFromSelection = useCallback((nft) => {
    setSelectedNFTs(prev => 
      prev.filter(selected => 
        selected.id?.tokenId !== nft.id?.tokenId ||
        selected.contract?.address !== nft.contract?.address
      )
    );
  }, []);
  
  return (
    <StyledContainer>
      <VStack spacing="1.5rem" align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Text
            as="h1"
            fontSize={{ base: "24px", md: "32px" }}
            fontFamily="Space Grotesk"
            letterSpacing="-0.02em"
            color="var(--rich-black)"
          >
            Organize Artifacts
          </Text>
          <HStack spacing={2}>
            <Button
              leftIcon={<FaSync />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
              size={isMobile ? "sm" : "md"}
              colorScheme="blue"
              variant="outline"
            >
              Refresh
            </Button>
            <Button
              leftIcon={<FaPlus />}
              onClick={() => setIsNewCatalogModalOpen(true)}
              size={isMobile ? "sm" : "md"}
              colorScheme="green"
              isDisabled={selectedNFTs.length === 0}
            >
              New Catalog
            </Button>
          </HStack>
        </Flex>
        
        {/* Description */}
        <Text color="var(--ink-grey)" fontSize="md">
          This page shows artifacts that are not yet organized into any catalog. You can add them to 
          catalogs or mark them as spam to organize your library.
        </Text>
        
        {/* Error Alert */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{error}</Text>
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
        
        {/* Loading State */}
        {isLoading ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4} color="var(--ink-grey)">Loading unorganized artifacts...</Text>
          </Box>
        ) : isRefreshing ? (
          <Progress size="xs" isIndeterminate colorScheme="blue" my={4} />
        ) : (
          <>
            {/* NFT Grid */}
            {filteredNFTs.length > 0 ? (
              <NFTGrid
                nfts={filteredNFTs}
                selectedNFTs={selectedNFTs}
                onNFTSelect={handleNFTSelect}
                onMarkAsSpam={handleSpamToggle}
                isSpamFolder={false}
                isSelectMode={isSelectMode}
                onNFTClick={handleNFTClick}
                viewMode={viewMode}
                showControls={true}
              />
            ) : (
              <Box textAlign="center" py={12}>
                <Heading as="h3" size="md" mb={4} color="var(--ink-grey)">
                  No Unorganized Artifacts
                </Heading>
                <Text color="var(--ink-grey)">
                  {searchTerm 
                    ? `No artifacts matching "${searchTerm}"`
                    : "All your artifacts are already organized in catalogs. Good job!"
                  }
                </Text>
                {!searchTerm && (
                  <Button 
                    mt={6} 
                    colorScheme="blue"
                    onClick={() => navigate('/app/library')}
                  >
                    Go to Library
                  </Button>
                )}
              </Box>
            )}
          </>
        )}
      </VStack>
      
      {/* Modals */}
      <NewCatalogModal
        isOpen={isNewCatalogModalOpen}
        onClose={() => {
          setIsNewCatalogModalOpen(false);
          setSelectedNFTs([]);
          setIsSelectMode(false);
        }}
        selectedArtifacts={selectedNFTs}
      />
      
      {/* Selected Artifacts Overlay */}
      {isSelectMode && selectedNFTs.length > 0 && (
        <SelectedArtifactsOverlay
          selectedArtifacts={selectedNFTs}
          onRemoveArtifact={handleRemoveFromSelection}
          onAddToSpam={handleMarkSelectedAsSpam}
          onCreateCatalog={() => setIsNewCatalogModalOpen(true)}
          onAddToExistingCatalog={handleAddToCatalog}
          onClearSelections={handleClearSelections}
          catalogs={catalogs}
        />
      )}
    </StyledContainer>
  );
};

export default OrganizePage;