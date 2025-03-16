import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Button,
  Icon,
  Flex,
  Progress,
  HStack,
} from "@chakra-ui/react";
import { FaBook, FaSync, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllCatalogs, 
  selectAutomatedCatalogs,
  removeCatalog,
  updateCatalog,
  updateSpamCatalog, 
  updateUnorganizedCatalog,
} from '../redux/slices/catalogSlice';
import { 
  selectTotalNFTs, 
  updateNFT,
  updateTotalNFTs
} from '../redux/slices/nftSlice';
import { 
  selectAllFolders, 
  removeFolder,
  removeCatalogFromFolder
} from '../redux/slices/folderSlice';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';
import { networks } from '../../utils/web3Utils';
import { logger } from '../../utils/logger';
import { cardSizes } from './constants/sizes';
import { supabase } from '../../utils/supabase';

// Components
import NFTCard from './NFTCard';
import NFTGrid from './NFTGrid';
import LibraryControls from './LibraryControls';
import CatalogViewPage from './CatalogViewPage';
import CatalogCard from './CatalogCard';
import NewFolderModal from './NewFolderModal';
import NewCatalogModal from './NewCatalogModal';
import FolderCard from './FolderCard';
import EditCatalogModal from './EditCatalogModal';
import EditFolderModal from './EditFolderModal';
import NewMenuPopover from './NewMenuPopover';
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';

// Hooks
import { useCustomToast } from '../../utils/toastUtils';
import { useErrorHandler } from '../../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { StyledButton, StyledContainer } from '../styles/commonStyles';

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

// Helper function
const truncateAddress = (address) => 
  address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

const LibraryPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux Selectors
  const wallets = useSelector(state => state.wallets.list);
  const nfts = useSelector(state => state.nfts.byWallet);
  const catalogs = useSelector(selectAllCatalogs);
  const catalogItems = useSelector(state => state.catalogs.items) || {};
  const systemCatalogs = useSelector(state => state.catalogs.systemCatalogs) || {};  
  const folders = useSelector(selectAllFolders);
  const folderRelationships = useSelector(state => state.folders.relationships);
  const totalNFTs = useSelector(selectTotalNFTs);
  const automatedCatalogs = useSelector(selectAutomatedCatalogs);

  // Custom Hooks
  const { showSuccessToast, showInfoToast, showErrorToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, showFullText } = useResponsive();

  // Local State
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [viewingCatalog, setViewingCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCatalogModalOpen, setIsNewCatalogModalOpen] = useState(false);
  const [viewingFolder, setViewingFolder] = useState(null);
  const [cardSize] = useState("md");
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNFTs, setFilteredNFTs] = useState([]);
  const [isEditCatalogModalOpen, setIsEditCatalogModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isLoadingArtifacts, setIsLoadingArtifacts] = useState(true);

  // Initialize tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location.search]);

  // Fetch artifacts from Supabase when component mounts
  useEffect(() => {
    fetchArtifactsFromSupabase();
  }, []);

  // Function to fetch artifacts from Supabase
  const fetchArtifactsFromSupabase = async () => {
    setIsLoadingArtifacts(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        logger.warn('No authenticated user found when fetching artifacts');
        setIsLoadingArtifacts(false);
        return;
      }

      logger.log('Fetching artifacts for user:', user.id);

      // Fetch all wallets for the current user
      const { data: userWallets, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);

      if (walletError) {
        throw walletError;
      }

      logger.log('User wallets:', userWallets);
      
      if (!userWallets || userWallets.length === 0) {
        logger.info('No wallets found for user');
        setFilteredNFTs([]);
        setIsLoadingArtifacts(false);
        return;
      }

      // For each wallet, fetch its artifacts
      const artifactPromises = userWallets.map(async (wallet) => {
        const { data: artifacts, error: artifactsError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('wallet_id', wallet.id);

        if (artifactsError) {
          logger.error('Error fetching artifacts for wallet:', {
            walletId: wallet.id,
            error: artifactsError
          });
          return [];
        }
        
        logger.log(`Found ${artifacts.length} artifacts for wallet:`, wallet.id);
        
        // Attach wallet info to each artifact
        return artifacts.map(artifact => ({
          ...artifact,
          walletId: wallet.id,
          walletAddress: wallet.address,
          walletNickname: wallet.nickname || truncateAddress(wallet.address)
        }));
      });

      const artifactsByWallet = await Promise.all(artifactPromises);
      const allArtifacts = artifactsByWallet.flat();
      
      logger.log(`Total artifacts across all wallets: ${allArtifacts.length}`);
      
      // Convert Supabase artifacts to the format expected by your components
      const processedArtifacts = allArtifacts.map(convertSupabaseArtifactToNFT);
      
      // Update state with the fetched artifacts
      setFilteredNFTs(processedArtifacts);
      
      // Update total NFT count in Redux
      dispatch(updateTotalNFTs(processedArtifacts.length));
      
      if (processedArtifacts.length > 0) {
        showSuccessToast(
          "Artifacts Loaded",
          `Successfully loaded ${processedArtifacts.length} artifacts from your library`
        );
      }

    } catch (error) {
      handleError(error, 'fetching artifacts from Supabase');
      showErrorToast(
        "Error Loading Artifacts",
        "Failed to load your artifacts. Please try again."
      );
    } finally {
      setIsLoadingArtifacts(false);
    }
  };

  // Helper function to convert Supabase artifact format to your app's NFT format
  const convertSupabaseArtifactToNFT = (artifact) => {
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
        walletId: artifact.walletId,
        network: artifact.network,
        walletNickname: artifact.walletNickname
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
        walletId: artifact.walletId,
        network: artifact.network || 'unknown'
      };
    }
  };

  // Utility functions for system catalogs
  const getSpamCount = useCallback(() => {
    return filteredNFTs.filter(nft => nft.isSpam).length;
  }, [filteredNFTs]);

  // Function to get NFTs that are marked as spam
  const getSpamNFTs = useCallback(() => {
    return filteredNFTs.filter(nft => nft.isSpam);
  }, [filteredNFTs]);

  // Function to get unorganized NFTs
  const getUnorganizedNFTs = useCallback(() => {
    try {
      // Create a Set of all NFTs in catalogs for faster lookup
      const catalogsFromItems = Object.values(catalogItems || {});
      const catalogsFromSystem = Object.values(systemCatalogs || {});
      const allCatalogObjects = [...catalogsFromItems, ...catalogsFromSystem];
      
      // Create a Set of catalog NFT identifiers for efficient lookups
      const catalogedNFTs = new Set();
      
      allCatalogObjects.forEach(catalog => {
        if (catalog && Array.isArray(catalog.nftIds)) {
          catalog.nftIds.forEach(nft => {
            const key = `${nft.tokenId}-${nft.contractAddress}-${nft.network}`;
            catalogedNFTs.add(key);
          });
        }
      });
  
      // Find NFTs that aren't in any catalog and aren't spam
      return filteredNFTs.filter(nft => {
        if (nft.isSpam) return false;
        
        const nftKey = `${nft.id.tokenId}-${nft.contract.address}-${nft.network}`;
        return !catalogedNFTs.has(nftKey);
      });
    } catch (error) {
      console.error('Error in getUnorganizedNFTs:', error);
      return [];
    }
  }, [filteredNFTs, catalogItems, systemCatalogs]);

  // Unassigned catalogs calculation
  const unassignedCatalogs = useMemo(() => {
    // Get all assigned catalog IDs from folder relationships
    const assignedCatalogIds = Object.values(folderRelationships)
      .flat()
      .filter(Boolean);
  
    // Get all non-system catalogs from the items object
    return Object.values(catalogItems)
      .filter(catalog => 
        // Make sure catalog exists and is not a system catalog
        catalog && 
        !catalog.isSystem &&
        // Make sure it's not in any folder
        !assignedCatalogIds.includes(catalog.id)
      );
  }, [catalogItems, folderRelationships]);

  // Update system catalogs when NFTs change
  useEffect(() => {
    // Update spam catalog
    const spamNFTs = getSpamNFTs();
    if (spamNFTs.length > 0) {
      dispatch(updateSpamCatalog(spamNFTs));
    }
  }, [getSpamNFTs, dispatch]);

  const prevUnorganizedCount = useRef(0);

  useEffect(() => {
    const unorganizedNFTs = getUnorganizedNFTs();
    // Only update if the count has changed to prevent unnecessary updates
    if (unorganizedNFTs.length !== prevUnorganizedCount.current) {
      prevUnorganizedCount.current = unorganizedNFTs.length;
      if (unorganizedNFTs.length > 0) {
        dispatch(updateUnorganizedCatalog(unorganizedNFTs));
      }
    }
  }, [getUnorganizedNFTs, dispatch]);

  // Calculated counts for system catalogs
  const automatedCatalogsWithCounts = useMemo(() => {
    return Object.values(systemCatalogs).map(catalog => ({
      ...catalog,
      count: catalog.id === 'spam' ? getSpamCount() :
             catalog.id === 'unorganized' ? getUnorganizedNFTs().length : 0,
      // Add this to ensure nftIds is always an array
      nftIds: catalog.nftIds || []
    }));
  }, [systemCatalogs, getSpamCount, getUnorganizedNFTs]);

  // Handle removing NFTs from a catalog
  const handleRemoveFromCatalog = (catalogId, nftsToRemove) => {
    const catalog = catalogs.find(c => c.id === catalogId);
    if (!catalog) return;
  
    const updatedCatalog = {
      ...catalog,
      nftIds: catalog.nftIds.filter(nftId => 
        !nftsToRemove.some(nft => 
          nft.id.tokenId === nftId.tokenId && 
          nft.contract.address === nftId.contractAddress
        )
      )
    };
  
    dispatch(updateCatalog(updatedCatalog));
    showSuccessToast(
      "NFTs Removed",
      `${nftsToRemove.length} NFT(s) removed from ${catalog.name}`
    );
  };

  // Handle search in the NFT grid
  const handleSearch = (value) => {
    setSearchTerm(value);
    
    if (!value.trim()) {
      // Reset to show all NFTs
      setFilteredNFTs(prevNFTs => [...prevNFTs]);
    } else {
      // Filter NFTs by search term
      const searchLower = value.toLowerCase();
      const filtered = filteredNFTs.filter(nft => 
        (nft.title || '').toLowerCase().includes(searchLower) ||
        (nft.contract?.name || '').toLowerCase().includes(searchLower) ||
        (nft.id?.tokenId || '').toString().toLowerCase().includes(searchLower)
      );
      setFilteredNFTs(filtered);
    }
  };
  
  // Change view mode between list and grid
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  // Handle clearing selections
  const handleClearSelections = useCallback(() => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, []);

  // Add selected NFTs to an existing catalog
  const handleAddToExistingCatalog = useCallback((catalogId) => {
    const existingCatalog = catalogItems[catalogId];
    if (!existingCatalog) return;
  
    // Ensure nftIds exists and is an array
    const existingNftIds = existingCatalog.nftIds || [];
  
    // Create a set of existing NFT identifiers for faster lookup
    const existingNftSet = new Set(
      existingNftIds.map(nft => 
        `${nft.tokenId}-${nft.contractAddress}-${nft.network}`
      )
    );
  
    // Filter out NFTs that are already in the catalog
    const newNftIds = selectedNFTs
      .filter(nft => !existingNftSet.has(
        `${nft.id.tokenId}-${nft.contract.address}-${nft.network}`
      ))
      .map(nft => ({
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract.address,
        network: nft.network,
        walletId: nft.walletId
      }));
  
    if (newNftIds.length === 0) {
      showInfoToast("No Changes", "These artifacts are already in the catalog");
      return;
    }
  
    dispatch(updateCatalog({
      id: catalogId,
      nftIds: [...existingNftIds, ...newNftIds]
    }));
  
    setSelectedNFTs([]);
    setIsSelectMode(false);
    showSuccessToast(
      "Added to Catalog",
      `${newNftIds.length} artifacts added to ${existingCatalog.name}`
    );
    logger.log('Added NFTs to catalog:', { catalogId, count: newNftIds.length });
  }, [catalogItems, selectedNFTs, dispatch, showSuccessToast, showInfoToast]);

  // Handle editing a catalog
  const handleEditCatalog = useCallback((catalog) => {
    logger.log('Editing catalog:', catalog);
    setEditingCatalog(catalog);
    setIsEditCatalogModalOpen(true);
  }, []);
  
  // Handle editing a folder
  const handleEditFolder = useCallback((folder) => {
    logger.log('Editing folder:', folder);
    setEditingFolder(folder);
    setIsEditFolderModalOpen(true);
  }, []);
  
  // Handle opening a catalog
  const handleOpenCatalog = useCallback((catalog) => {
    setViewingCatalog(catalog);
  }, []);

  // Handle toggling spam status for NFTs
  const handleSpamToggle = useCallback(async (nft) => {
    // First update the UI state
    const newSpamValue = !nft.isSpam;
    const updatedNFT = { ...nft, isSpam: newSpamValue };
    
    // Update in Redux
    dispatch(updateNFT({ 
      walletId: nft.walletId, 
      nft: updatedNFT
    }));

    // Update filtered NFTs state
    setFilteredNFTs(prev => 
      prev.map(item => 
        item.id.tokenId === nft.id.tokenId && 
        item.contract.address === nft.contract.address
          ? updatedNFT
          : item
      )
    );
  
    showSuccessToast(
      nft.isSpam ? "NFT Unmarked" : "NFT Marked as Spam",
      nft.isSpam ? "The NFT has been removed from your spam folder." : "The NFT has been moved to your spam folder."
    );

    // Then persist to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showErrorToast("Authentication Error", "Failed to update artifact spam status");
        return;
      }

      const { error } = await supabase
        .from('artifacts')
        .update({ is_spam: newSpamValue })
        .match({ 
          wallet_id: nft.walletId,
          token_id: nft.id.tokenId,
          contract_address: nft.contract.address
        });

      if (error) {
        logger.error('Error updating artifact spam status in Supabase:', error);
        showErrorToast("Update Error", "Failed to update artifact status in database");
      }
    } catch (error) {
      logger.error('Error updating spam status:', error);
    }
  }, [dispatch, showSuccessToast, showErrorToast]);

  // Handle marking selected NFTs as spam
  const handleMarkSelectedAsSpam = useCallback(() => {
    // Display toast first as visual feedback
    showInfoToast(
      "Processing...",
      `Marking ${selectedNFTs.length} artifacts as spam`
    );

    // Process in batches to avoid overwhelming Supabase
    const processInBatches = async () => {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < selectedNFTs.length; i += batchSize) {
        batches.push(selectedNFTs.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await Promise.all(batch.map(nft => handleSpamToggle(nft)));
      }
      
      setSelectedNFTs([]);
      setIsSelectMode(false);
    };

    processInBatches();
  }, [handleSpamToggle, selectedNFTs, showInfoToast]);

  // Handle removing NFT from selection
  const handleRemoveFromSelection = useCallback((nft) => {
    setSelectedNFTs(prev => 
      prev.filter(selected => 
        selected.id?.tokenId !== nft.id?.tokenId ||
        selected.contract?.address !== nft.contract?.address
      )
    );
  }, []);

  // Handle clicking on an NFT
  const handleNFTClick = useCallback((nft) => {
    navigate('/app/artifact', { state: { nft } });
  }, [navigate]);

  // Handle selecting an NFT
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

  // Utility function for wallet display
  const getWalletNickname = useCallback((walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? (wallet.nickname || truncateAddress(wallet.address)) : 'Unknown Wallet';
  }, [wallets]);

  // Get media type for filter
  const getMediaType = (nft) => {
    if (nft.metadata?.mimeType?.startsWith('video/')) return 'Video';
    if (nft.metadata?.mimeType?.startsWith('audio/')) return 'Audio';
    if (nft.metadata?.mimeType?.startsWith('model/')) return '3D';
    return 'Image';
  };

  // Handle filtering NFTs
  const handleFilterChange = useCallback((filters) => {
    // If no filters are active, reset to show all NFTs
    if (Object.keys(filters).length === 0) {
      fetchArtifactsFromSupabase();
      return;
    }

    // Filter the NFTs based on the active filters
    const filtered = filteredNFTs.filter(nft => {
      return Object.entries(filters).every(([category, values]) => {
        if (!values.length) return true; // Skip empty filter categories
        
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

    setFilteredNFTs(filtered);
  }, [filteredNFTs, getWalletNickname, fetchArtifactsFromSupabase]);

  // Handle sorting NFTs
  const handleSortChange = useCallback(({ field, ascending }) => {
    setFilteredNFTs(prev => {
      const sorted = [...prev].sort((a, b) => {
        let compareResult;
        switch (field) {
          case 'name':
            compareResult = (a.title || '').localeCompare(b.title || '');
            break;
          case 'wallet':
            const aWalletName = a.walletNickname || getWalletNickname(a.walletId);
            const bWalletName = b.walletNickname || getWalletNickname(b.walletId);
            compareResult = aWalletName.localeCompare(bWalletName);
            break;
          case 'contract':
            compareResult = (a.contract?.name || '').localeCompare(b.contract?.name || '');
            break;
          case 'network':
            compareResult = (a.network || '').localeCompare(b.network || '');
            break;
          default:
            compareResult = 0;
        }
        return ascending ? compareResult : -compareResult;
      });
      return sorted;
    });
  }, [getWalletNickname]);

  // Filter NFTs based on search term
  const filteredAndSortedNFTs = useMemo(() => 
    filteredNFTs.filter(nft => 
      !nft.isSpam && (
        !searchTerm ||
        (nft.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.contract?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.id?.tokenId || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [filteredNFTs, searchTerm]
  );

  // Helper function to refresh NFTs
  const handleRefreshNFTs = async () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    
    try {
      await fetchArtifactsFromSupabase();
      showSuccessToast(
        "Refresh Complete", 
        "Your NFT collection has been updated."
      );
    } catch (error) {
      handleError(error, 'refreshing NFTs');
      showErrorToast(
        "Refresh Failed",
        "There was an error refreshing your NFTs. Please try again."
      );
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handle folder deletion
  const handleDeleteFolder = (folderId) => {
    dispatch(removeFolder(folderId));
    showInfoToast("Folder Deleted", "The folder has been deleted successfully.");
  };
  
  // Handle catalog deletion
  const handleDeleteCatalog = useCallback((catalogId) => {
    if (Object.keys(folderRelationships).length > 0) {
      Object.entries(folderRelationships).forEach(([folderId, catalogs]) => {
        if (catalogs.includes(catalogId)) {
          dispatch(removeCatalogFromFolder({ folderId, catalogId }));
        }
      });
    }
  
    dispatch(removeCatalog(catalogId));
    showSuccessToast("Catalog Deleted", "The catalog has been successfully removed.");
    logger.log('Catalog deleted:', { catalogId });
  }, [dispatch, folderRelationships, showSuccessToast]);
  
  // Render folder view
  const renderFolderView = () => {
    if (!viewingFolder) return null;
    
    return (
      <Box>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading as="h2" size="lg">{viewingFolder.name}</Heading>
          <StyledButton onClick={() => setViewingFolder(null)}>
            Back to Library
          </StyledButton>
        </Flex>
        
        {viewingFolder.description && (
          <Text mb={6} color="gray.600">{viewingFolder.description}</Text>
        )}
  
        <SimpleGrid 
          columns={cardSizes[cardSize].columns}
          spacing={2}
          width="100%"
        >
          {catalogs
            .filter(catalog => 
              folderRelationships[viewingFolder.id]?.includes(catalog.id)
            )
            .map(catalog => (
              <CatalogCard
                key={catalog.id}
                catalog={catalog}
                onView={() => handleOpenCatalog(catalog)}
                cardSize={cardSize}
              />
            ))}
        </SimpleGrid>
      </Box>
    );
  };
  
  // Render main content based on current view
  if (viewingCatalog) {
    return (
      <CatalogViewPage
        catalog={viewingCatalog}
        onBack={() => setViewingCatalog(null)}
        onRemoveNFTs={(nfts) => handleRemoveFromCatalog(viewingCatalog.id, nfts)}
        onSpamToggle={handleSpamToggle}
      />
    );
  }
  
  if (viewingFolder) {
    return renderFolderView();
  }
  
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
            Library
          </Text>
          <HStack spacing={2}>
            <NewMenuPopover 
              onNewFolder={() => setIsNewFolderModalOpen(true)}
              onNewCatalog={() => setIsNewCatalogModalOpen(true)}
            />
            <StyledButton
              leftIcon={<Icon as={FaSync} />}
              onClick={handleRefreshNFTs}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
              size={buttonSize}
            >
              {showFullText ? "Refresh Artifacts" : null}
            </StyledButton>
          </HStack>
        </Flex>
      
        {isRefreshing && (
          <Progress value={refreshProgress} size="sm" colorScheme="blue" />
        )}
  
        <Tabs 
          index={activeTab} 
          onChange={setActiveTab} 
          variant="enclosed"
        >
          <TabList
            bg="var(--paper-white)"
            borderBottom="1px solid"
            borderColor="var(--shadow)"
            width="fit-content"
          >
            <Tab
              fontFamily="Inter"
              fontSize="14px"
              color="var(--ink-grey)"
              bg="transparent"
              _selected={{
                bg: "white",
                color: "var(--warm-brown)",
                borderColor: "var(--shadow)",
                borderBottomColor: "white"
              }}
            >
              Artifacts
            </Tab>
            <Tab
              fontFamily="Inter"
              fontSize="14px"
              color="var(--ink-grey)"
              bg="transparent"
              _selected={{
                bg: "white",
                color: "var(--warm-brown)",
                borderColor: "var(--shadow)",
                borderBottomColor: "white"
              }}
            >
              Catalogs
            </Tab>
          </TabList>
        
          <TabPanels>
            {/* Artifacts Tab */}
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <LibraryControls
                  wallets={wallets}
                  contracts={[...new Set(filteredNFTs.map(nft => nft.contract?.name).filter(Boolean))]}
                  networks={networks.map(n => n.label)}
                  mediaTypes={['Image', 'Video', 'Audio', '3D']}
                  onFilterChange={handleFilterChange}
                  onSortChange={handleSortChange}
                  isSelectMode={isSelectMode}
                  onSelectModeChange={setIsSelectMode}
                  onClearSelections={handleClearSelections}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  searchTerm={searchTerm}
                  onSearchChange={handleSearch}
                />
                
                {isLoadingArtifacts ? (
                  <Box textAlign="center" py={8}>
                    <Text color="var(--ink-grey)">Loading your artifacts...</Text>
                    <Progress mt={4} size="xs" isIndeterminate colorScheme="blue" />
                  </Box>
                ) : (
                  <>
                    <Text fontSize="sm" color="gray.500">
                      Showing {filteredAndSortedNFTs.length} of {filteredNFTs.length} NFTs
                    </Text>
                    
                    {filteredAndSortedNFTs.length === 0 ? (
                      <Box textAlign="center" py={12}>
                        <Text fontFamily="Fraunces" fontSize="lg" color="var(--ink-grey)">
                          {searchTerm ? 
                            `No artifacts matching "${searchTerm}"` : 
                            "No artifacts found in your library"
                          }
                        </Text>
                        {!searchTerm && (
                          <Button 
                            mt={4} 
                            colorScheme="blue"
                            onClick={() => navigate('/app/profile?tab=1')}
                          >
                            Add a Wallet
                          </Button>
                        )}
                      </Box>
                    ) : (
                      <NFTGrid
                        nfts={filteredAndSortedNFTs}
                        selectedNFTs={selectedNFTs}
                        onNFTSelect={handleNFTSelect}
                        onMarkAsSpam={handleSpamToggle}
                        isSpamFolder={false}
                        isSelectMode={isSelectMode}
                        onNFTClick={handleNFTClick}
                        viewMode={viewMode}
                        showControls={false}
                      />
                    )}
                  </>
                )}
              </VStack>
            </TabPanel>
            
            {/* Catalogs Tab */}
            <TabPanel>  
              <VStack spacing={6} align="stretch">
                {/* Folders Section */}
                {folders.length > 0 && (
                  <Box>
                    <Heading as="h3" size="md" mb={4}>
                      Folders
                    </Heading>
                    <SimpleGrid 
                      columns={cardSizes[cardSize].columns}
                      spacing={2}
                      width="100%"
                    >
                      {folders.map((folder) => (
                        <FolderCard
                          key={`folder-${folder.id}`}
                          folder={folder}
                          onView={() => setViewingFolder(folder)}
                          onEdit={() => handleEditFolder(folder)}
                          onDelete={() => handleDeleteFolder(folder.id)}
                          cardSize="md"
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {/* Automated Catalogs Section */}
                <Box>
                  <Heading as="h3" size="md" mb={4}>
                    Automated Catalogs
                  </Heading>
                  <SimpleGrid 
                    columns={cardSizes[cardSize].columns}
                    spacing={2}
                    width="100%"
                  >
                    {automatedCatalogsWithCounts.map((catalog) => (
                      <CatalogCard
                        key={catalog.id}
                        catalog={{
                          ...catalog,
                          nftCount: catalog.count
                        }}
                        onView={() => handleOpenCatalog(catalog)}
                        cardSize="md"
                        isSystem={true}
                      />
                    ))}
                  </SimpleGrid>
                </Box>

                {/* Unassigned Catalogs Section */}
                <Box>
                  <Heading as="h3" size="md" mb={4}>
                    Unassigned Catalogs ({unassignedCatalogs?.length || 0})
                  </Heading>
                  {unassignedCatalogs?.length > 0 ? (
                    <SimpleGrid 
                      columns={cardSizes[cardSize].columns}
                      spacing={2}
                      width="100%"
                    >
                      {unassignedCatalogs.map((catalog) => (
                        <CatalogCard
                          key={catalog.id}
                          catalog={catalog}
                          onView={() => handleOpenCatalog(catalog)}
                          onEdit={() => handleEditCatalog(catalog)}
                          onDelete={() => handleDeleteCatalog(catalog.id)}
                          cardSize="md"
                        />
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text color="gray.500">No unassigned catalogs</Text>
                  )}
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      {/* Modals */}
      <NewFolderModal 
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
      />

      <NewCatalogModal 
        isOpen={isNewCatalogModalOpen}
        onClose={() => {
          setIsNewCatalogModalOpen(false);
          setSelectedNFTs([]); 
          setIsSelectMode(false);
        }}
        selectedArtifacts={selectedNFTs}
      />

      <EditCatalogModal 
        isOpen={isEditCatalogModalOpen}
        onClose={() => {
          setIsEditCatalogModalOpen(false);
          setEditingCatalog(null);
        }}
        catalog={editingCatalog}
      />

      <EditFolderModal
        isOpen={isEditFolderModalOpen}
        onClose={() => {
          setIsEditFolderModalOpen(false);
          setEditingFolder(null);
        }}
        folder={editingFolder}
      />

      {/* Selected Artifacts Overlay */}
      {isSelectMode && selectedNFTs.length > 0 && (
        <SelectedArtifactsOverlay 
          selectedArtifacts={selectedNFTs}
          onRemoveArtifact={handleRemoveFromSelection}
          onAddToSpam={handleMarkSelectedAsSpam}
          onCreateCatalog={() => setIsNewCatalogModalOpen(true)}
          onAddToExistingCatalog={handleAddToExistingCatalog}
          onClearSelections={handleClearSelections}
          catalogs={Object.values(catalogItems)
            .filter(catalog => !catalog.isSystem)
          }
        />
      )}
    </StyledContainer>
  );
};

export default LibraryPage;