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
  Input,
  Icon,
  Flex,
  Progress,
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb,
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import NFTCard from './NFTCard';
import LibraryControls from './LibraryControls';
import CatalogViewPage from './CatalogViewPage';
import { useCustomColorMode } from '../hooks/useColorMode';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';
import { selectAllCatalogs, selectAutomatedCatalogs } from '../redux/slices/catalogSlice';
import { selectTotalNFTs, selectTotalSpamNFTs, selectNFTStructure, selectFlattenedWalletNFTs, updateNFT } from '../redux/slices/nftSlice';
import CatalogCard from './CatalogCard';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';
import NewFolderModal from './NewFolderModal';
import NewCatalogModal from './NewCatalogModal';
import FolderCard from './FolderCard';
import { selectAllFolders, removeFolder } from '../redux/slices/folderSlice';
import { cardSizes } from '../constants/sizes';
import { removeCatalog, updateCatalog } from '../redux/slices/catalogSlice';
import EditCatalogModal from './EditCatalogModal';
import { networks } from '../utils/web3Utils';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const LibraryPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Redux Selectors
  const wallets = useSelector(state => state.wallets.list);
  const nfts = useSelector(state => state.nfts.byWallet);
  const catalogs = useSelector(selectAllCatalogs);
  const totalNFTs = useSelector(selectTotalNFTs);
  const folders = useSelector(selectAllFolders);
  const automatedCatalogs = useSelector(selectAutomatedCatalogs);

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

  // Initialize tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location]);

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
  }, [nfts]); // Only re-run when nfts change

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
    return Object.values(nfts).flatMap(walletNFTs =>
      Object.values(walletNFTs).flatMap(networkNFTs => {
        const allNFTs = [...networkNFTs.ERC721, ...networkNFTs.ERC1155];
        return allNFTs.filter(nft => 
          !nft.isSpam && // Exclude spam NFTs
          !catalogs.some(catalog => 
            catalog.nftIds?.some(catalogNft => 
              catalogNft.tokenId === nft.id.tokenId &&
              catalogNft.contractAddress === nft.contract.address
            )
          )
        );
      })
    );
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

  const handleClearSelections = useCallback(() => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, []);

  const handleAddToExistingCatalog = useCallback((catalogId) => {
    const existingCatalog = catalogs.find(c => c.id === catalogId);
    if (!existingCatalog) return;
  
    const updatedCatalog = {
      ...existingCatalog,
      nftIds: [
        ...(existingCatalog.nftIds || []),
        ...selectedNFTs.map(nft => ({
          tokenId: nft.id.tokenId,
          contractAddress: nft.contract.address,
          network: nft.network,
          walletId: nft.walletId
        }))
      ]
    };
  
    dispatch(updateCatalog(updatedCatalog));
    setSelectedNFTs([]); // Clear selections
    setIsSelectMode(false); // Exit select mode
    showSuccessToast(
      "Added to Catalog",
      `${selectedNFTs.length} artifacts added to ${existingCatalog.name}`
    );
  }, [catalogs, selectedNFTs, dispatch, showSuccessToast]);

  const handleEditCatalog = useCallback((catalog) => {
    setEditingCatalog(catalog);
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
  }, [handleSpamToggle]);

  const handleRemoveFromSelection = useCallback((nft) => {
    setSelectedNFTs(prev => 
      prev.filter(selected => 
        selected.id?.tokenId !== nft.id?.tokenId ||
        selected.contract?.address !== nft.contract?.address
      )
    );
  }, []);

  const handleNFTClick = useCallback((nft) => {
    navigate('/artifact', { state: { nft } });
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

  const handleCreateCatalogFromOverlay = () => {
    // This ensures we pass the currently selected artifacts when opening the modal
    setIsNewCatalogModalOpen(true);
  };
  
  // Update the SelectedArtifactsOverlay usage
  {isSelectMode && selectedNFTs.length > 0 && (
    <SelectedArtifactsOverlay 
      selectedArtifacts={selectedNFTs}
      onRemoveArtifact={handleRemoveFromSelection}
      onAddToSpam={handleMarkSelectedAsSpam}
      onCreateCatalog={handleCreateCatalogFromOverlay}  // Use our new handler
      onAddToExistingCatalog={handleAddToExistingCatalog}
      catalogs={catalogs.filter(c => !c.isSystem)}
    />
  )}

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

      if (result.hasNewNFTs) {
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
  folders.forEach(folder => {
    if (folder.catalogIds?.includes(catalogId)) {
      dispatch(removeFolder({
        folderId: folder.id,
        catalogId
      }));
    }
  });

  dispatch(removeCatalog(catalogId));
  showSuccessToast(
    "Catalog Deleted",
    "The catalog has been successfully removed."
  );
}, [dispatch, folders, showSuccessToast]);

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
          .filter(catalog => viewingFolder.catalogIds?.includes(catalog.id))
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
              />

              <Input
                placeholder="Search NFTs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Text fontSize="sm" color="gray.500">
                Showing {filteredAndSortedNFTs.length} of {totalNFTs} NFTs
              </Text>

              <SimpleGrid 
                columns={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                spacing={4}
                w="100%"
              >
                {filteredAndSortedNFTs.map((nft) => (
                  <NFTCard
                    key={`${nft.contract?.address}-${nft.id?.tokenId}-${nft.network}`}
                    nft={nft}
                    isSelected={selectedNFTs.some(selected => 
                      selected.id?.tokenId === nft.id?.tokenId && 
                      selected.contract?.address === nft.contract?.address
                    )}
                    onSelect={handleNFTSelect}
                    onMarkAsSpam={handleSpamToggle}
                    isSpamFolder={false}
                    isSelectMode={isSelectMode}
                    onClick={handleNFTClick}
                    walletNickname={getWalletNickname(nft.walletId)}
                  />
                ))}
              </SimpleGrid>
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
                        key={folder.id}
                        folder={folder}
                        onView={() => setViewingFolder(folder)}
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
                  Unassigned Catalogs
                </Heading>
                <SimpleGrid 
                  columns={cardSizes[cardSize].columns}
                  spacing={2}
                  width="100%"
                >
                  {catalogs
                    .filter(catalog => 
                      catalog.type !== 'automated' &&
                      !catalog.isSystem &&
                      !folders.some(folder => 
                        folder.catalogIds?.includes(catalog.id)
                      )
                    )
                    .map((catalog) => (
                      <CatalogCard
                        key={catalog.id}
                        catalog={catalog}
                        onView={() => handleOpenCatalog(catalog)}  // This was previously undefined
                        onEdit={() => handleEditCatalog(catalog)}
                        onDelete={() => handleDeleteCatalog(catalog.id)}
                        cardSize={cardSize}
                      />
                    ))}
                </SimpleGrid>
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
      onClose={() => setIsNewCatalogModalOpen(false)}
      folders={folders}  // Make sure folders is defined
      selectedArtifacts={selectedNFTs}
    />

    <EditCatalogModal 
      isOpen={editingCatalog !== null}
      onClose={() => setEditingCatalog(null)}
      catalog={editingCatalog}
    />

    {/* Selected Artifacts Overlay */}
    {isSelectMode && selectedNFTs.length > 0 && (
      <SelectedArtifactsOverlay 
        selectedArtifacts={selectedNFTs}
        onRemoveArtifact={handleRemoveFromSelection}
        onAddToSpam={handleMarkSelectedAsSpam}
        onCreateCatalog={() => setIsNewCatalogModalOpen(true)}
        onAddToExistingCatalog={handleAddToExistingCatalog}
        catalogs={catalogs.filter(c => !c.isSystem)}
      />
    )}
  </StyledContainer>
);
};

export default LibraryPage;