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
  Stat,
  StatLabel,
  StatNumber,
  Grid,
  StatGroup,
  Button,
  Input,
  Icon,
  HStack,
  Flex,
  Checkbox,
  Progress,
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { logger } from '../utils/logger';
import { useCustomColorMode } from '../hooks/useColorMode';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';
import { selectAllCatalogs, selectAutomatedCatalogs } from '../redux/slices/catalogSlice';
import { selectTotalNFTs, selectTotalSpamNFTs, selectNFTStructure, selectFlattenedWalletNFTs, updateNFT } from '../redux/slices/nftSlice';
import WalletNFTGrid from './WalletNFTGrid';
import CatalogCard from './CatalogCard';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';
import NewFolderModal from './NewFolderModal';
import NewCatalogModal from './NewCatalogModal';
import FolderCard from './FolderCard';
import { selectAllFolders, removeFolder } from '../redux/slices/folderSlice';
import { cardSizes } from '../constants/sizes';
import { removeCatalog, updateCatalog } from '../redux/slices/catalogSlice';
import EditCatalogModal from './EditCatalogModal';

const LibraryPage = () => {
  const dispatch = useDispatch();

  // Redux Selectors
  const wallets = useSelector(state => state.wallets.list);
  const nfts = useSelector(state => state.nfts.byWallet);
  const catalogs = useSelector(selectAllCatalogs);
  const totalNFTs = useSelector(selectTotalNFTs);
  const spamNFTs = useSelector(selectTotalSpamNFTs);
  const nftStructure = useSelector(selectNFTStructure);
  const folders = useSelector(selectAllFolders);
  const automatedCatalogs = useSelector(selectAutomatedCatalogs);

  // Custom Hooks
  const { bgColor, cardBg, textColor, borderColor } = useCustomColorMode();
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, headingSize, showFullText, gridColumns } = useResponsive();
  const [editingCatalog, setEditingCatalog] = useState(null);
  
  // Local State
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [selectedWallets, setSelectedWallets] = useState(wallets.map(w => w.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [collapsedWallets, setCollapsedWallets] = useState({});
  const [viewingCatalog, setViewingCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [isNewCatalogModalOpen, setIsNewCatalogModalOpen] = useState(false);
  const [viewingFolder, setViewingFolder] = useState(null);
  const [cardSize, setCardSize] = useState("md");

  const location = useLocation();
  const navigate = useNavigate();

  // Initialize tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location]);

  const handleMarkAsSpam = useCallback((nft) => {
    dispatch(updateNFT({ 
      walletId: nft.walletId, 
      nft: { ...nft, isSpam: true } 
    }));
    showSuccessToast('NFT marked as spam', 'The NFT has been moved to your spam folder.');
  }, [dispatch, showSuccessToast]);
  
  const handleNFTClick = useCallback((nft) => {
    navigate('/artifact', { state: { nft } });
  }, [navigate]);

  const handleNFTSelect = useCallback((nft) => {
    setSelectedNFTs(prev => {
      // Ensure prev is an array
      const currentSelected = Array.isArray(prev) ? prev : [];
      
      const isSelected = currentSelected.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );

      if (isSelected) {
        return currentSelected.filter(selected => 
          selected.id?.tokenId !== nft.id?.tokenId ||
          selected.contract?.address !== nft.contract?.address
        );
      } else {
        return [...currentSelected, nft];
      }
    });
  }, []);

  const handleDeleteCatalog = useCallback((catalogId) => {
    // First remove catalog from any folders it might be in
    folders.forEach(folder => {
      if (folder.catalogIds?.includes(catalogId)) {
        dispatch(removeFolder({
          folderId: folder.id,
          catalogId
        }));
      }
    });
  
    // Then remove the catalog itself
    dispatch(removeCatalog(catalogId));
    showSuccessToast(
      "Catalog Deleted",
      "The catalog has been successfully removed."
    );
  }, [dispatch, folders, showSuccessToast]);
  
  const handleEditCatalog = useCallback((catalog) => {
    setEditingCatalog(catalog);
  }, []);

  const handleSizeChange = (value) => {
    const sizes = {
      0: "sm",
      1: "md",
      2: "lg"
    };
    setCardSize(sizes[value]);
  };

  const handleDeleteFolder = (folderId) => {
    dispatch(removeFolder(folderId));
    showInfoToast("Folder Deleted", "The folder has been deleted successfully.");
  };
  
  const handleOpenFolder = (folder) => {
    setViewingFolder(folder);
  };

  const handleOpenCatalog = useCallback((catalog) => {
    setViewingCatalog(catalog);
  }, []);

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
              <Grid templateColumns="3fr 1fr" gap={6}>
                <Box>
                  {wallets.map((wallet) => (
                    <Box key={wallet.id} mt="2rem">
                      <Flex align="center" mb="1rem">
                        <StyledButton 
                          leftIcon={collapsedWallets[wallet.id] ? <FaChevronRight /> : <FaChevronDown />}
                          variant="ghost" 
                          onClick={() => setCollapsedWallets(prev => ({
                            ...prev,
                            [wallet.id]: !prev[wallet.id]
                          }))}
                        >
                          <Heading as="h3" size="md">
                            {wallet.nickname || wallet.address}
                          </Heading>
                        </StyledButton>
                      </Flex>
                      {!collapsedWallets[wallet.id] && (
                        <WalletNFTGrid 
                          walletId={wallet.id}
                          selectedNFTs={selectedNFTs}
                          onNFTSelect={handleNFTSelect}
                          onMarkAsSpam={handleMarkAsSpam}
                          isSelectMode={isSelectMode}
                          onNFTClick={handleNFTClick}
                          gridColumns={gridColumns}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
                <VStack spacing={6}>
                  <StyledCard>
                    <Heading as="h3" size="md" mb="0.5rem">Filters</Heading>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Text fontWeight="bold" mb="0.5rem">Wallets:</Text>
                        {wallets.map(wallet => (
                          <Checkbox
                            key={wallet.id}
                            isChecked={selectedWallets.includes(wallet.id)}
                            onChange={() => setSelectedWallets(prev => 
                              prev.includes(wallet.id)
                                ? prev.filter(id => id !== wallet.id)
                                : [...prev, wallet.id]
                            )}
                            mb="0.25rem"
                          >
                            {wallet.nickname || wallet.address}
                          </Checkbox>
                        ))}
                      </Box>
                    </VStack>
                  </StyledCard>
                  <StyledCard>
                    <Heading as="h3" size="md" mb="0.5rem">Manage</Heading>
                    <VStack spacing={4} align="stretch">
                      <StyledButton onClick={() => setIsSelectMode(!isSelectMode)} width="100%">
                        {isSelectMode ? "Cancel Selection" : "Select Artifacts"}
                      </StyledButton>
                      {isSelectMode && (
                        <StyledButton 
                          onClick={() => setIsNewCatalogModalOpen(true)} 
                          width="100%"
                        >
                          Create Catalog
                        </StyledButton>
                      )}
                    </VStack>
                  </StyledCard>
                </VStack>
              </Grid>
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
                          onView={() => handleOpenFolder(folder)}
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
                    {automatedCatalogs.map((catalog) => (
                      <CatalogCard
                        key={catalog.id}
                        catalog={catalog}
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
                        catalog.type !== 'automated' && // Changed from !catalog.type === 'automated'
                        !catalog.isSystem &&
                        !folders.some(folder => 
                          folder.catalogIds?.includes(catalog.id)
                        )
                      )
                      .map((catalog) => (
                        <CatalogCard
                          key={catalog.id}
                          catalog={catalog}
                          onView={() => handleOpenCatalog(catalog)}
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
      />

      <EditCatalogModal 
        isOpen={editingCatalog !== null}
        onClose={() => setEditingCatalog(null)}
        catalog={editingCatalog}
      />

      {/* Selected Artifacts Overlay */}
      {isSelectMode && (
        <SelectedArtifactsOverlay 
          selectedArtifacts={selectedNFTs}
          onRemoveArtifact={(nft) => setSelectedNFTs(prev => 
            prev.filter(n => n.id !== nft.id)
          )}
          onAddToSpam={(nft) => {
            dispatch(updateNFT({ 
              walletId: nft.walletId, 
              nft: { ...nft, isSpam: true } 
            }));
          }}
          onCreateCatalog={() => setIsNewCatalogModalOpen(true)}
        />
      )}
    </StyledContainer>
  );
};

export default LibraryPage;