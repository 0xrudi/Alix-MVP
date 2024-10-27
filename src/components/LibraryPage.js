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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaTrash, FaTimes, FaCheck, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { fetchNFTs } from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { useCustomColorMode } from '../hooks/useColorMode';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import SelectedArtifactsOverlay from './SelectedArtifactsOverlay';
import { addCatalog, updateCatalog, removeCatalog, setCatalogs, selectAllCatalogs, updateSpamCatalog, selectAutomatedCatalogs } from '../redux/slices/catalogSlice';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure, updateNFT, selectTotalNFTs, selectTotalSpamNFTs, selectNFTStructure, selectFlattenedWalletNFTs, selectSpamNFTs } from '../redux/slices/nftSlice';
import debounce from 'lodash/debounce';
import WalletNFTGrid from './WalletNFTGrid';
import CatalogCard from './CatalogCard';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks'
import NewFolderModal from './NewFolderModal';
import FolderCard from './FolderCard';
import { selectAllFolders, removeFolder, selectFoldersForCatalog, selectCatalogsInFolder } from '../redux/slices/folderSlice';
import EditFolderModal from './EditFolderModal';
import { cardSizes } from '../constants/sizes';


const LibraryPage = () => {
  const dispatch = useDispatch();

  const wallets = useSelector(state => state.wallets.list);
  const nfts = useSelector(state => state.nfts.byWallet);
  const catalogs = useSelector(selectAllCatalogs);
  const totalNFTs = useSelector(selectTotalNFTs);
  const spamNFTs = useSelector(selectTotalSpamNFTs);
  const nftStructure = useSelector(selectNFTStructure);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const folders = useSelector(selectAllFolders);

  const { bgColor, cardBg, textColor, borderColor } = useCustomColorMode();
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, headingSize, showFullText, gridColumns } = useResponsive();
  
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [catalogName, setCatalogName] = useState('');
  const [selectedWallets, setSelectedWallets] = useState(wallets.map(w => w.id));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [collapsedWallets, setCollapsedWallets] = useState({});
  const [viewingCatalog, setViewingCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isCreateCatalogOpen, setIsCreateCatalogOpen] = useState(false);
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [viewingFolder, setViewingFolder] = useState(null);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [cardSize, setCardSize] = useState("md");
  const automatedCatalogs = useSelector(selectAutomatedCatalogs);
  

  const location = useLocation();
  const navigate = useNavigate();

  const sizes = {
    sm: {
      icon: '1.5rem',
      fontSize: 'sm',
      padding: 2,
      width: '150px', // Base width for small cards
      spacing: 0.5,
    },
    md: {
      icon: '2rem',
      fontSize: 'md',
      padding: 3,
      width: '200px', // Base width for medium cards
      spacing: 1,
    },
    lg: {
      icon: '3rem',
      fontSize: 'lg',
      padding: 4,
      width: '250px', // Base width for large cards
      spacing: 2,
    }
  };

  useEffect(() => {
    try {
      if (Array.isArray(spamNFTs)) {
        dispatch(updateSpamCatalog(spamNFTs));
      } else {
        console.warn('spamNFTs is not an array:', spamNFTs);
        dispatch(updateSpamCatalog([]));
      }
    } catch (error) {
      console.error('Error updating spam catalog:', error);
      dispatch(updateSpamCatalog([]));
    }
  }, [dispatch, spamNFTs]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'nfts') setActiveTab(0);
    if (tab === 'catalogs') setActiveTab(1);
  }, [location]);

  useEffect(() => {
    // Initialize with default spam catalog if none exists
    if (!catalogs.some(cat => cat.name === "Spam")) {
      dispatch(addCatalog({
        id: 'spam',
        name: 'Spam',
        nftIds: [],
        isSystem: true // Flag to identify system catalogs
      }));
    }
  }, [catalogs, dispatch]);

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
  
  const handleEditFolder = (folder) => {
    setSelectedFolder(folder);
    setIsEditFolderModalOpen(true);
  };

  const handleNFTClick = useCallback((nft) => {
    navigate('/artifact', { state: { nft } });
  }, [navigate]);

  const handleWalletCollapse = useCallback((walletId) => {
    setCollapsedWallets(prev => ({
      ...prev,
      [walletId]: !prev[walletId]
    }));
  }, []);

  const handleMarkAsSpam = useCallback((walletId, nft) => {
    dispatch(updateNFT({ 
      walletId, 
      nft: { ...nft, isSpam: !nft.isSpam } 
    }));
    
    showInfoToast(
      `Marked NFT as ${nft.isSpam ? 'Not Spam' : 'Spam'}`,
      `The NFT has been ${nft.isSpam ? 'removed from' : 'moved to'} the Spam folder.`
    );
  }, [dispatch, showInfoToast]);

  const handleWalletToggle = useCallback((walletId) => {
    setSelectedWallets(prev => 
      prev.includes(walletId)
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  }, []);

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
          columns={{ 
            base: 2,
            sm: 3,
            md: 4,
            lg: 6
          }} 
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
                onEdit={() => handleOpenCatalog(catalog)}
                onDelete={() => handleDeleteCatalog(catalog.id)}
                cardSize={cardSize}
              />
            ))}
        </SimpleGrid>
      </Box>
    );
  };

  const handleCreateCatalog = useCallback(() => {
    if (catalogName.trim() === '') {
      showErrorToast("Catalog Name Required", "Please enter a name for your catalog.");
      return;
    }
  
    if (selectedNFTs.length === 0) {
      showErrorToast("No NFTs Selected", "Please select at least one NFT for your catalog.");
      return;
    }
  
    const newCatalog = {
      id: `catalog-${Date.now()}`,
      name: catalogName.trim(),
      nftIds: selectedNFTs.map(nft => ({
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract.address,
        network: nft.network
      })),
      createdAt: new Date().toISOString(),
      isSystem: false
    };
  
    dispatch(addCatalog(newCatalog));
    setCatalogName('');
    setSelectedNFTs([]);
    setIsCreateCatalogOpen(false);
    showSuccessToast(
      "Catalog Created", 
      `Your catalog "${catalogName}" has been created successfully.`
    );
  }, [catalogName, selectedNFTs, dispatch, showErrorToast, showSuccessToast]);

  const handleDeleteCatalog = useCallback((catalogId) => {
    dispatch(removeCatalog(catalogId));
    showInfoToast("Catalog Deleted", "The catalog has been deleted successfully.");
  }, [dispatch, showInfoToast]);

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

  const filteredCatalogs = useMemo(() => 
    catalogs.filter(catalog => 
      catalog.name.toLowerCase().includes(catalogSearch.toLowerCase())
    ),
    [catalogs, catalogSearch]
  );

  const catalogFoldersMap = useSelector(state => 
    filteredCatalogs.reduce((acc, catalog) => {
      acc[catalog.id] = selectFoldersForCatalog(state, catalog.id);
      return acc;
    }, {})
  );

  if (viewingCatalog) {
    return (
      <CatalogViewPage
        catalog={viewingCatalog}
        onBack={() => setViewingCatalog(null)}
        onRemoveNFTs={(nftIds) => {
          dispatch(updateCatalog({ 
            id: viewingCatalog.id, 
            nftIds: viewingCatalog.nftIds.filter(id => !nftIds.includes(id))
          }));
        }}
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
      
        <StatGroup>
          <Stat>
            <StatLabel fontSize="1rem">Total Artifacts</StatLabel>
            <StatNumber fontSize="1.5rem">{totalNFTs}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="1rem">Catalogs</StatLabel>
            <StatNumber fontSize="1.5rem">{catalogs.length}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel fontSize="1rem">Spam Artifacts</StatLabel>
            <StatNumber fontSize="1.5rem">{spamNFTs}</StatNumber>
          </Stat>
        </StatGroup>
  
        {/* Create Catalog Modal */}
        <Modal isOpen={isCreateCatalogOpen} onClose={() => setIsCreateCatalogOpen(false)}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Create New Catalog</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Input
                placeholder="Enter catalog name"
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
              />
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleCreateCatalog}>
                Create
              </Button>
              <Button variant="ghost" onClick={() => setIsCreateCatalogOpen(false)}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
  
        <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
          <TabList>
            <Tab fontSize="1rem">Artifacts</Tab>
            <Tab fontSize="1rem">Library</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Grid templateColumns="3fr 1fr" gap={6}>
                <Box>
                {wallets.map((wallet) => (
                  <Box key={wallet.id} mt="2rem">
                    <Flex align="center" mb="1rem">
                      <StyledButton 
                        leftIcon={collapsedWallets[wallet.id] ? <FaChevronRight /> : <FaChevronDown />}
                        variant="ghost" 
                        onClick={() => handleWalletCollapse(wallet.id)}
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
                        onNFTSelect={(nft) => setSelectedNFTs(prev => 
                          prev.some(n => n.id === nft.id) 
                            ? prev.filter(n => n.id !== nft.id) 
                            : [...prev, nft]
                        )}
                        onMarkAsSpam={(nft) => handleMarkAsSpam(wallet.id, nft)}
                        isSpamFolder={false}
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
                            onChange={() => handleWalletToggle(wallet.id)}
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
                        <StyledButton onClick={() => setIsCreateCatalogOpen(true)} width="100%">
                          Create Catalog
                        </StyledButton>
                      )}
                    </VStack>
                  </StyledCard>
                </VStack>
              </Grid>
            </TabPanel>
            
            <TabPanel>
              <Flex justify="space-between" align="center" mb={4}>
                <Button
                  leftIcon={<FaFolderPlus />}
                  onClick={() => setIsNewFolderModalOpen(true)}
                  colorScheme="blue"
                >
                  New Folder
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
                    {automatedCatalogs.map((catalog) => (
                      <CatalogCard
                        key={catalog.id}
                        catalog={catalog}
                        onView={() => handleOpenCatalog(catalog)}
                        onEdit={() => handleOpenCatalog(catalog)}
                        onDelete={() => handleDeleteCatalog(catalog.id)}
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
                    {filteredCatalogs
                      .filter(catalog => 
                        !catalog.type === 'automated' && 
                        catalogFoldersMap[catalog.id]?.length === 0
                      )
                      .map((catalog) => (
                        <CatalogCard
                          key={catalog.id}
                          catalog={catalog}
                          onView={() => handleOpenCatalog(catalog)}
                          onEdit={() => handleOpenCatalog(catalog)}
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
      {isSelectMode && (
        <SelectedArtifactsOverlay 
          selectedArtifacts={selectedNFTs}
          onRemoveArtifact={(nft) => setSelectedNFTs(prev => prev.filter(n => n.id !== nft.id))}
          onAddToSpam={(nft) => handleMarkAsSpam(nft.walletId, nft)}
          onCreateCatalog={() => setIsCreateCatalogOpen(true)}
          onAddToExistingCatalog={() => setIsAddToCatalogOpen(true)}
        />
      )}
      <NewFolderModal 
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
      />
      <EditFolderModal
        isOpen={isEditFolderModalOpen}
        onClose={() => {
          setIsEditFolderModalOpen(false);
          setSelectedFolder(null);
        }}
        folder={selectedFolder}
      />
    </StyledContainer>
  );
};

export default LibraryPage;