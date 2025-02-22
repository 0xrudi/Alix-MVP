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
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb,
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllCatalogs, 
  selectAutomatedCatalogs,
  removeCatalog,
  updateCatalog,
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
import StateDebugger from './StateDebugger';

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
  const catalogItems = useSelector(state => {
    console.log('Full catalog state:', state.catalogs);
    console.log('Catalog items:', state.catalogs.items);
    return state.catalogs.items || {};
  });
  const folders = useSelector(selectAllFolders);
  const folderRelationships = useSelector(state => state.folders.relationships);
  const totalNFTs = useSelector(selectTotalNFTs);
  const automatedCatalogs = useSelector(selectAutomatedCatalogs);

  const debugCatalogState = () => {
    console.group('Unassigned Catalogs Debug');
    console.log('Full catalogs state:', catalogs);
    console.log('Catalogs.items:', catalogs.items);
    console.log('All catalogs array:', Object.values(catalogs.items || {}));
    console.log('Folder relationships:', folderRelationships);
    
    // Get all assigned catalog IDs
    const assignedIds = Object.values(folderRelationships)
      .flat()
      .filter(Boolean);
    
    console.log('Assigned catalog IDs:', assignedIds);
    
    // Get all catalog IDs
    const allCatalogIds = Object.values(catalogs.items || {})
      .map(cat => cat.id);
    
    console.log('All catalog IDs:', allCatalogIds);
    
    // Find actually unassigned IDs
    const unassignedIds = allCatalogIds
      .filter(id => !assignedIds.includes(id));
    
    console.log('Calculated unassigned IDs:', unassignedIds);
    console.groupEnd();
    
    return unassignedIds;
  };

  console.log('Catalogs from selector:', catalogs);
  console.log('Catalog items:', catalogs.items);
  
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

  // Custom Hooks
  const { showSuccessToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, headingSize, showFullText } = useResponsive();

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
  const [cardSize, setCardSize] = useState("md");
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNFTs, setFilteredNFTs] = useState([]);
  const [isEditCatalogModalOpen, setIsEditCatalogModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [viewMode, setViewMode] = useState('medium');


  // Initialize tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location.search]); // Only depend on search params

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
  }, [nfts, setFilteredNFTs]); // Add proper dependencies

  // Callback handlers
  const getSpamCount = useCallback(() => {
    return Object.values(nfts).reduce((total, walletNFTs) =>
      total + Object.values(walletNFTs).reduce((walletTotal, networkNFTs) =>
        walletTotal + 
        (networkNFTs.ERC721?.filter(nft => nft.isSpam)?.length || 0) +
        (networkNFTs.ERC1155?.filter(nft => nft.isSpam)?.length || 0)
      , 0)
    , 0);
  }, [nfts]);

  const getUnorganizedNFTs = useCallback(() => {
    try {
      // Create a Set of all NFTs in catalogs for faster lookup
      const allCatalogs = [
        ...Object.values(catalogs.items || {}),
        ...Object.values(catalogs.systemCatalogs || {})
      ];
      
      // Create a Set of catalog NFT identifiers
      const catalogedNFTs = new Set(
        allCatalogs.flatMap(catalog => 
          (catalog.nftIds || []).map(nft => `${nft.tokenId}-${nft.contractAddress}`)
        )
      );
  
      const unorganizedNFTs = Object.entries(nfts).flatMap(([walletId, walletNFTs]) =>
        Object.entries(walletNFTs || {}).flatMap(([network, networkNFTs]) => {
          if (!networkNFTs) return [];
          
          const allNFTs = [
            ...(networkNFTs.ERC721 || []), 
            ...(networkNFTs.ERC1155 || [])
          ];
          
          return allNFTs.filter(nft => {
            if (!nft || !nft.id || !nft.contract) return false;
            const nftKey = `${nft.id.tokenId}-${nft.contract.address}`;
            return !nft.isSpam && !catalogedNFTs.has(nftKey);
          });
        })
      );
  
      return unorganizedNFTs;
    } catch (error) {
      console.error('Error in getUnorganizedNFTs:', error);
      return [];
    }
  }, [nfts, catalogs]);

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
  
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
  };

  const handleClearSelections = useCallback(() => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, []);

  const handleAddToExistingCatalog = useCallback((catalogId) => {
    const existingCatalog = catalogs.find(c => c.id === catalogId);
    if (!existingCatalog) return;

    const existingNftIds = new Set(
      existingCatalog.nftIds.map(nft => `${nft.tokenId}-${nft.contractAddress}`)
    );

    const newNftIds = selectedNFTs
      .filter(nft => !existingNftIds.includes(`${nft.id.tokenId}-${nft.contract.address}`))
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
      nftIds: [...existingCatalog.nftIds, ...newNftIds]
    }));

    setSelectedNFTs([]);
    setIsSelectMode(false);
    showSuccessToast(
      "Added to Catalog",
      `${newNftIds.length} artifacts added to ${existingCatalog.name}`
    );
    logger.log('Added NFTs to catalog:', { catalogId, count: newNftIds.length });
  }, [catalogs, selectedNFTs, dispatch, showSuccessToast, showInfoToast]);

  const handleEditCatalog = useCallback((catalog) => {
    logger.log('Editing catalog:', catalog);
    setEditingCatalog(catalog);
    setIsEditCatalogModalOpen(true);
  }, []);
  
  const handleEditFolder = useCallback((folder) => {
    logger.log('Editing folder:', folder);
    setEditingFolder(folder);
    setIsEditFolderModalOpen(true);
  }, []);
  
  const handleOpenCatalog = useCallback((catalog) => {
    setViewingCatalog(catalog);
  }, []);

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

  const handleMarkSelectedAsSpam = useCallback(() => {
    selectedNFTs.forEach(nft => handleSpamToggle(nft));
    setSelectedNFTs([]);
  }, [handleSpamToggle, selectedNFTs]); // Add selectedNFTs to dependencies

  const handleRemoveFromSelection = useCallback((nft) => {
    setSelectedNFTs(prev => 
      prev.filter(selected => 
        selected.id?.tokenId !== nft.id?.tokenId ||
        selected.contract?.address !== nft.contract?.address
      )
    );
  }, []); // Empty dependency array is fine since we're using functional updates

  const handleNFTClick = useCallback((nft) => {
    navigate('/app/artifact', { state: { nft } });
  }, [navigate]);

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

  const handleSizeChange = (value) => {
    const sizes = {
      0: "sm",
      1: "md",
      2: "lg"
    };
    setCardSize(sizes[value]);
  };

  // Utility functions
  const getWalletNickname = useCallback((walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? (wallet.nickname || truncateAddress(wallet.address)) : 'Unknown Wallet';
  }, [wallets]);

  const getMediaType = (nft) => {
    if (nft.metadata?.mimeType?.startsWith('video/')) return 'Video';
    if (nft.metadata?.mimeType?.startsWith('audio/')) return 'Audio';
    if (nft.metadata?.mimeType?.startsWith('model/')) return '3D';
    return 'Image';
  };

  // Filter and Sort handlers
  const handleFilterChange = useCallback((filters) => {
    const filteredNFTs = Object.values(nfts).flatMap(walletNFTs =>
      Object.values(walletNFTs).flatMap(networkNFTs => {
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

  const automatedCatalogsWithCounts = useMemo(() => 
    automatedCatalogs.map(catalog => ({
      ...catalog,
      count: catalog.id === 'spam' ? getSpamCount() :
             catalog.id === 'unorganized' ? getUnorganizedNFTs().length : 0
    })),
    [automatedCatalogs, getSpamCount, getUnorganizedNFTs]
  );

// Render helper functions
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

const handleDeleteFolder = (folderId) => {
  dispatch(removeFolder(folderId));
  showInfoToast("Folder Deleted", "The folder has been deleted successfully.");
};

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

// Render Folder View
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
      onSpamToggle={handleSpamToggle}  // Changed to use the new handler
    />
  );
}

if (viewingFolder) {
  return renderFolderView();
}

return (
  <StyledContainer>
    <VStack spacing="1.5rem" align="stretch">
      <Flex justify="space-between" align="center">
        <Heading as="h1" fontSize={headingSize}>Your Artifact Library</Heading>
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

      <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
        <TabList>
          <Tab fontSize="1rem">Artifacts</Tab>
          <Tab fontSize="1rem">Library</Tab>
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
            <Flex justify="space-between" align="center" mb={4}>
              <Button
                leftIcon={<FaFolderPlus />}
                onClick={() => setIsNewFolderModalOpen(true)}
                colorScheme="blue"
              >
                New Folder
              </Button>
              <Button
                leftIcon={<FaPlus />}
                onClick={() => setIsNewCatalogModalOpen(true)}
                colorScheme="blue"
              >
                New Catalog
              </Button>
            </Flex>

            <Flex align="center" gap={4} mb={4}>
              <Text fontSize="sm" whiteSpace="nowrap">Card Size:</Text>
              <Slider
                defaultValue={1}
                min={0}
                max={2}
                step={1}
                onChange={handleSizeChange}
                width="150px"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Flex>

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
                        cardSize={cardSize}
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
                        nftCount: catalog.count // Add the count to the display
                      }}
                      onView={() => handleOpenCatalog(catalog)}
                      cardSize={cardSize}
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
                    {unassignedCatalogs.map((catalog) => {
                      console.log('Rendering unassigned catalog:', catalog);
                      return (
                        <CatalogCard
                          key={catalog.id}
                          catalog={catalog}
                          onView={() => handleOpenCatalog(catalog)}
                          onEdit={() => handleEditCatalog(catalog)}
                          onDelete={() => handleDeleteCatalog(catalog.id)}
                          cardSize={cardSize}
                        />
                      );
                    })}
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
        catalogs={Object.values({
          ...catalogs.items,
          ...catalogs.systemCatalogs
        }).filter(c => !c.isSystem)}
      />
    )}
  {/* {process.env.NODE_ENV === 'development' && <StateDebugger />} */}
  </StyledContainer>
);
};

export default LibraryPage;