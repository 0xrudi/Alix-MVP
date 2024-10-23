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
  ModalCloseButton
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
import { addCatalog, updateCatalog, removeCatalog, setCatalogs, selectAllCatalogs } from '../redux/slices/catalogSlice';
import { fetchNFTsStart, fetchNFTsSuccess, fetchNFTsFailure, updateNFT, selectTotalNFTs, selectTotalSpamNFTs, selectNFTStructure, selectFlattenedWalletNFTs } from '../redux/slices/nftSlice';
import debounce from 'lodash/debounce';
import WalletNFTGrid from './WalletNFTGrid';

const LibraryPage = () => {
  const dispatch = useDispatch();

  const wallets = useSelector(state => state.wallets.list);
  const nfts = useSelector(state => state.nfts.byWallet);
  const catalogs = useSelector(selectAllCatalogs);
  const totalNFTs = useSelector(selectTotalNFTs);
  const spamNFTs = useSelector(selectTotalSpamNFTs);
  const nftStructure = useSelector(selectNFTStructure);

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

  const location = useLocation();
  const navigate = useNavigate();

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
  }, []);

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
    dispatch(updateNFT({ walletId, nft: { ...nft, isSpam: !nft.isSpam } }));
    showInfoToast(`Marked NFT as ${nft.isSpam ? 'Not Spam' : 'Spam'}`, `The NFT has been ${nft.isSpam ? 'removed from' : 'moved to'} the Spam folder.`);
  }, [dispatch, showInfoToast]);

  const handleWalletToggle = useCallback((walletId) => {
    setSelectedWallets(prev => 
      prev.includes(walletId)
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  }, []);

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
    dispatch(fetchNFTsStart());
  
    let totalFetches = wallets.reduce((sum, wallet) => sum + wallet.networks.length, 0);
    let completedFetches = 0;
  
    for (const wallet of wallets) {
      for (const networkValue of wallet.networks) {
        try {
          const { nfts: networkNfts } = await fetchNFTs(wallet.address, networkValue);
          dispatch(fetchNFTsSuccess({ walletId: wallet.id, networkValue, nfts: networkNfts }));
          
          completedFetches++;
          setRefreshProgress((completedFetches / totalFetches) * 100);
        } catch (error) {
          handleError(error, `fetching NFTs for ${wallet.address} on ${networkValue}`);
          dispatch(fetchNFTsFailure({ walletId: wallet.id, networkValue, error: error.message }));
          showErrorToast("NFT Fetch Error", `Failed to fetch NFTs for ${wallet.nickname || wallet.address} on ${networkValue}. Please try again later.`);
        }
      }
    }
  
    setIsRefreshing(false);
    showSuccessToast("NFTs Refreshed", "Your NFTs have been refreshed and categorized.");
  };

  const filteredCatalogs = useMemo(() => 
    catalogs.filter(catalog => 
      catalog.name.toLowerCase().includes(catalogSearch.toLowerCase())
    ),
    [catalogs, catalogSearch]
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
            <Tab fontSize="1rem">Catalogs</Tab>
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
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="1rem">
                {filteredCatalogs.map((catalog) => (
                  <StyledCard key={catalog.id}>
                    <Heading as="h4" size="sm">{catalog.name}</Heading>
                    <Text>{catalog.nftIds ? catalog.nftIds.length : 0} Artifacts</Text>
                    <HStack mt="0.5rem">
                      <StyledButton size="sm" onClick={() => handleOpenCatalog(catalog)}>
                        View
                      </StyledButton>
                      {!catalog.isSystem && ( // Don't show edit/delete for system catalogs
                        <>
                          <StyledButton size="sm" onClick={() => handleOpenCatalog(catalog)}>
                            Edit
                          </StyledButton>
                          <StyledButton 
                            size="sm" 
                            colorScheme="red" 
                            onClick={() => handleDeleteCatalog(catalog.id)}
                          >
                            Delete
                          </StyledButton>
                        </>
                      )}
                    </HStack>
                  </StyledCard>
                ))}
              </SimpleGrid>
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
    </StyledContainer>
  );
};

export default LibraryPage;