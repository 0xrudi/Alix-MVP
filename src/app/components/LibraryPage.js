import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  updateNFT 
} from '../redux/slices/nftSlice';
import { 
  selectAllFolders, 
  removeFolder,
  removeCatalogFromFolder
} from '../redux/slices/folderSlice';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';
import { networks } from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { cardSizes } from './constants/sizes';

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
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';

// Hooks
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
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
  const { showSuccessToast, showInfoToast } = useCustomToast();
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

  // Initialize tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location.search]);

  // Initialize all NFTs
  useEffect(() => {
    const allNFTs = Object.entries(nfts).flatMap(([walletId, walletNFTs]) =>
      Object.entries(walletNFTs).flatMap(([network, networkNFTs]) => {
        const combined = [...networkNFTs.ERC721, ...networkNFTs.ERC1155];
        return combined.map(nft => ({
          ...nft,
          walletId,
          network
        }));
      })
    );
    setFilteredNFTs(allNFTs);
  }, [nfts]);

  // Utility functions for system catalogs
  const getSpamCount = useCallback(() => {
    return Object.values(nfts).reduce((total, walletNFTs) =>
      total + Object.values(walletNFTs).reduce((walletTotal, networkNFTs) =>
        walletTotal + 
        (networkNFTs.ERC721?.filter(nft => nft.isSpam)?.length || 0) +
        (networkNFTs.ERC1155?.filter(nft => nft.isSpam)?.length || 0)
      , 0)
    , 0);
  }, [nfts]);

  // Function to get NFTs that are marked as spam
  const getSpamNFTs = useCallback(() => {
    const spamNFTs = [];
    
    Object.entries(nfts).forEach(([walletId, walletNFTs]) => {
      Object.entries(walletNFTs).forEach(([network, networkNFTs]) => {
        const spamERC721 = (networkNFTs.ERC721 || [])
          .filter(nft => nft.isSpam)
          .map(nft => ({ ...nft, walletId, network }));
          
        const spamERC1155 = (networkNFTs.ERC1155 || [])
          .filter(nft => nft.isSpam)
          .map(nft => ({ ...nft, walletId, network }));
          
        spamNFTs.push(...spamERC721, ...spamERC1155);
      });
    });
    
    return spamNFTs;
  }, [nfts]);

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
      const unorganizedNFTs = [];
      
      Object.entries(nfts).forEach(([walletId, walletNfts]) => {
        Object.entries(walletNfts || {}).forEach(([network, networkNfts]) => {
          if (!networkNfts) return;
          
          const allWalletNFTs = [
            ...(networkNfts.ERC721 || []), 
            ...(networkNfts.ERC1155 || [])
          ];
          
          allWalletNFTs.forEach(nft => {
            if (!nft || !nft.id || !nft.contract) return;
            
            const nftKey = `${nft.id.tokenId}-${nft.contract.address}-${network}`;
            if (!nft.isSpam && !catalogedNFTs.has(nftKey)) {
              unorganizedNFTs.push({
                ...nft,
                network,
                walletId
              });
            }
          });
        });
      });
  
      return unorganizedNFTs;
    } catch (error) {
      console.error('Error in getUnorganizedNFTs:', error);
      return [];
    }
  }, [nfts, catalogItems, systemCatalogs]);

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

  // Update unorganized catalog - separate to avoid dependency issues
  useEffect(() => {
    const unorganizedNFTs = getUnorganizedNFTs();
    if (unorganizedNFTs.length > 0) {
      dispatch(updateUnorganizedCatalog(unorganizedNFTs));
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
    // Convert nested nfts object structure into flat array before filtering
    if (!value.trim()) {
      const allNFTs = Object.entries(nfts).flatMap(([walletId, walletNFTs]) =>
        Object.entries(walletNFTs).flatMap(([network, networkNFTs]) => {
          const combined = [...networkNFTs.ERC721, ...networkNFTs.ERC1155];
          return combined.map(nft => ({
            ...nft,
            walletId,
            network
          }));
        })
      );
      setFilteredNFTs(allNFTs);
    } else {
      const filtered = Object.entries(nfts).flatMap(([walletId, walletNFTs]) =>
        Object.entries(walletNFTs).flatMap(([network, networkNFTs]) => {
          const combined = [...networkNFTs.ERC721, ...networkNFTs.ERC1155];
          return combined
            .filter(nft => 
              nft.title?.toLowerCase().includes(value.toLowerCase()) ||
              nft.contract?.name?.toLowerCase().includes(value.toLowerCase())
            )
            .map(nft => ({
              ...nft,
              walletId,
              network
            }));
        })
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
  const handleSpamToggle = useCallback((nft) => {
    dispatch(updateNFT({ 
      walletId: nft.walletId, 
      nft: { ...nft, isSpam: !nft.isSpam } 
    }));
  
    showSuccessToast(
      nft.isSpam ? "NFT Unmarked" : "NFT Marked as Spam",
      nft.isSpam ? "The NFT has been removed from your spam folder." : "The NFT has been moved to your spam folder."
    );
  }, [dispatch, showSuccessToast]);

  // Handle marking selected NFTs as spam
  const handleMarkSelectedAsSpam = useCallback(() => {
    selectedNFTs.forEach(nft => handleSpamToggle(nft));
    setSelectedNFTs([]);
  }, [handleSpamToggle, selectedNFTs]);

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
    const filteredNFTs = Object.entries(nfts).flatMap(([walletId, walletNFTs]) =>
      Object.entries(walletNFTs).flatMap(([network, networkNFTs]) => {
        const allNFTs = [...networkNFTs.ERC721, ...networkNFTs.ERC1155];
        return allNFTs.filter(nft => {
          return Object.entries(filters).every(([category, values]) => {
            switch (category) {
              case 'wallet':
                const walletName = getWalletNickname(nft.walletId);
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
      })
    );
    setFilteredNFTs(filteredNFTs);
  }, [nfts, getWalletNickname]);

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
            compareResult = getWalletNickname(a.walletId).localeCompare(getWalletNickname(b.walletId));
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
        nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.contract?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ),
    [filteredNFTs, searchTerm]
  );

  // Helper function to refresh NFTs
  const handleRefreshNFTs = async () => {
    setIsRefreshing(true);
    setRefreshProgress(0);
    
    let totalFetches = wallets.reduce((sum, wallet) => sum + wallet.networks.length, 0);
    let completedFetches = 0;
  
    for (const wallet of wallets) {
      try {
        const result = await dispatch(fetchWalletNFTs({
          walletId: wallet.id,
          address: wallet.address,
          networks: wallet.networks
        })).unwrap();
  
        if (result.includesNewNFTs) {
          showSuccessToast(
            "New NFTs Found", 
            `Found new or updated NFTs for ${wallet.nickname || wallet.address}`
          );
        }
        
        completedFetches++;
        setRefreshProgress((completedFetches / totalFetches) * 100);
      } catch (error) {
        handleError(error, `refreshing NFTs for ${wallet.address}`);
      }
    }
  
    setIsRefreshing(false);
    showSuccessToast(
      "Refresh Complete", 
      "Your NFT collection has been updated."
    );
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
          <StyledButton
            leftIcon={<Icon as={FaSync} />}
            onClick={handleRefreshNFTs}
            isLoading={isRefreshing}
            loadingText="Refreshing..."
            size={buttonSize}
          >
            {showFullText ? "Refresh Artifacts" : null}
          </StyledButton>
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
                  contracts={[...new Set(Object.values(nfts).flatMap(wallet => 
                    Object.values(wallet).flatMap(network => 
                      [...network.ERC721, ...network.ERC1155].map(nft => nft.contract?.name)
                    )
                  ))]}
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
                <Text fontSize="sm" color="gray.500">
                  Showing {filteredAndSortedNFTs.length} of {totalNFTs} NFTs
                </Text>
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
              </VStack>
            </TabPanel>
            
            {/* Library Tab */}
            <TabPanel>
              <HStack spacing={4} mb={6}>
                <Button
                  leftIcon={<Icon as={FaFolderPlus} />}
                  onClick={() => setIsNewFolderModalOpen(true)}
                  bg="var(--warm-brown)"
                  color="white"
                  fontFamily="Inter"
                  _hover={{
                    bg: "var(--deep-brown)"
                  }}
                >
                  New Folder
                </Button>
                
                <Button
                  leftIcon={<Icon as={FaBook} />}
                  onClick={() => setIsNewCatalogModalOpen(true)}
                  bg="var(--warm-brown)"
                  color="white"
                  fontFamily="Inter"
                  _hover={{
                    bg: "var(--deep-brown)"
                  }}
                >
                  New Catalog
                </Button>
              </HStack>
  
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