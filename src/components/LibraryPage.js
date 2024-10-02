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
  StatGroup,
  Button,
  Input,
  Icon,
  HStack,
  Flex,
  Checkbox,
  Progress,
  Collapse,
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaTrash, FaTimes, FaCheck, FaFolderPlus } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { fetchNFTs } from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { useAppContext } from '../context/AppContext';
import { useCustomColorMode } from '../hooks/useColorMode';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';

const LibraryPage = () => {
  const {
      wallets,
      nfts,
      updateNfts,
      spamNfts,
      updateSpamNfts,
      catalogs,
      updateCatalogs
  } = useAppContext();

  console.log('AppContext in LibraryPage:', { wallets, nfts, spamNfts, catalogs }); // Debug log

  const { bgColor, cardBg, textColor, borderColor } = useCustomColorMode();
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, headingSize, showFullText, gridColumns } = useResponsive();
  
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [catalogName, setCatalogName] = useState('');
  const [totalNFTs, setTotalNFTs] = useState(0);
  const [selectedWallets, setSelectedWallets] = useState(wallets.map(w => w.address));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [collapsedWallets, setCollapsedWallets] = useState({});
  const [contractNames, setContractNames] = useState({});
  const [viewingCatalog, setViewingCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isCreateCatalogOpen, setIsCreateCatalogOpen] = useState(false);
  const [isAddToCatalogOpen, setIsAddToCatalogOpen] = useState(false);
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [catalogSearch, setCatalogSearch] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

    const allContracts = useMemo(() => {
      const contracts = new Set();
      Object.values(nfts).forEach(walletNfts => {
        Object.values(walletNfts).forEach(networkNfts => {
          if (Array.isArray(networkNfts)) {
            networkNfts.forEach(nft => {
              if (nft.contract?.address) {
                contracts.add(nft.contract.address);
              }
            });
          }
        });
      });
      return Array.from(contracts);
    }, [nfts]);

    const [selectedContracts, setSelectedContracts] = useState([]);

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'nfts') setActiveTab(0);
      if (tab === 'catalogs') setActiveTab(1);
    }, [location]);

    useEffect(() => {
      setSelectedContracts(allContracts);
    }, []); // Empty dependency array means this runs only once on mount

    useEffect(() => {
      updateCatalogs(prevCatalogs => {
          if (!prevCatalogs.some(cat => cat.name === "Spam")) {
              return [...prevCatalogs, { id: "spam", name: "Spam", nfts: [] }];
          }
          return prevCatalogs;
      });
    }, [updateCatalogs]);

    const calculatedContractNames = useMemo(() => {
      const names = {};
      Object.values(nfts).forEach(walletNfts => {
        if (typeof walletNfts === 'object' && walletNfts !== null) {
          Object.values(walletNfts).forEach(networkNfts => {
            if (Array.isArray(networkNfts)) {
              networkNfts.forEach(nft => {
                if (nft && nft.contract && nft.contract.name && nft.contract.address) {
                  names[nft.contract.address] = nft.contract.name;
                }
              });
            }
          });
        }
      });
      return names;
    }, [nfts]);
    
    useEffect(() => {
      try {
        setContractNames(prevNames => {
          if (JSON.stringify(prevNames) !== JSON.stringify(calculatedContractNames)) {
            return calculatedContractNames;
          }
          return prevNames;
        });
      } catch (error) {
        handleError(error, 'processing NFT data');
      }
    }, [calculatedContractNames, handleError]);

    useEffect(() => {
      const total = Object.values(nfts).reduce((acc, wallet) => 
        acc + Object.values(wallet).reduce((sum, network) => sum + (network.nfts ? network.nfts.length : 0), 0), 0);
      setTotalNFTs(total);
    
      const spam = catalogs.find(cat => cat.name === "Spam")?.nfts.length || 0;
      updateSpamNfts(spam);
    }, [nfts, catalogs, updateSpamNfts]);

    const handleNFTClick = useCallback((nft) => {
      navigate('/artifact', { state: { nft } });
    }, [navigate]);

    const handleWalletCollapse = useCallback((address) => {
      setCollapsedWallets(prev => ({
        ...prev,
        [address]: !prev[address]
      }));
    }, []);

    const handleRefreshNFTs = useCallback(async () => {
      setIsRefreshing(true);
      setRefreshProgress(0);
      const fetchedNfts = {};
      let totalFetches = wallets.reduce((sum, wallet) => sum + wallet.networks.length, 0);
      let completedFetches = 0;
    
      const spamCatalog = catalogs.find(cat => cat.name === "Spam") || { nfts: [] };
      const spamNftIds = new Set(spamCatalog.nfts.map(nft => `${nft.contract.address}-${nft.id.tokenId}`));
    
      for (const wallet of wallets) {
        fetchedNfts[wallet.address] = {};
        for (const networkValue of wallet.networks) {
          try {
            const { nfts: networkNfts } = await fetchNFTs(wallet.address, networkValue);
            
            const filteredNfts = networkNfts.filter(nft => {
              const nftId = `${nft.contract.address}-${nft.id.tokenId}`;
              return !spamNftIds.has(nftId);
            });
    
            fetchedNfts[wallet.address][networkValue] = { nfts: filteredNfts };
            completedFetches++;
            setRefreshProgress((completedFetches / totalFetches) * 100);
          } catch (error) {
            handleError(error, `fetching NFTs for ${wallet.address} on ${networkValue}`);
            fetchedNfts[wallet.address][networkValue] = { nfts: [] };
            showErrorToast("NFT Fetch Error", `Failed to fetch NFTs for ${wallet.nickname || wallet.address} on ${networkValue}. Please try again later.`);
          }
        }
      }
    
      updateNfts(fetchedNfts);
    
      const totalNftsCount = Object.values(fetchedNfts).reduce(
        (total, wallet) => total + Object.values(wallet).reduce((sum, network) => sum + network.nfts.length, 0),
        0
      );
      setTotalNFTs(totalNftsCount);
    
      setIsRefreshing(false);
      showSuccessToast("NFTs Refreshed", "Your NFTs have been refreshed, excluding spam NFTs.");
    }, [wallets, updateNfts, catalogs, showSuccessToast, showErrorToast, handleError]);

    const handleMarkAsSpam = useCallback((address, network, nfts) => {
      console.log('handleMarkAsSpam called');
      if (typeof updateNfts !== 'function' || typeof updateCatalogs !== 'function' || typeof updateSpamNfts !== 'function') {
          console.error('Required update functions are not available');
          return;
      }
  
      const nftsToSpam = Array.isArray(nfts) ? nfts : [nfts];
      
      updateNfts(prevNfts => {
          const updatedNfts = JSON.parse(JSON.stringify(prevNfts));
          nftsToSpam.forEach(nft => {
              if (updatedNfts[address] && updatedNfts[address][network]) {
                  updatedNfts[address][network].nfts = updatedNfts[address][network].nfts.filter(item => 
                      !(item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address)
                  );
              }
          });
          return updatedNfts;
      });
  
      updateCatalogs(prevCatalogs => {
          let spamCatalog = prevCatalogs.find(cat => cat.name === "Spam");
          if (!spamCatalog) {
              spamCatalog = { id: "spam", name: "Spam", nfts: [] };
              prevCatalogs.push(spamCatalog);
          }
          
          const newSpamNfts = nftsToSpam.filter(nft => 
              !spamCatalog.nfts.some(spamNft => 
                  spamNft.id?.tokenId === nft.id?.tokenId && 
                  spamNft.contract?.address === nft.contract?.address
              )
          ).map(nft => ({
              ...nft,
              walletAddress: address,
              network,
              isSpam: true,
              spamInfo: {
                  dateMarked: new Date().toISOString(),
                  markedBy: 'user',
              }
          }));
          
          spamCatalog.nfts = [...spamCatalog.nfts, ...newSpamNfts];
          
          return [...prevCatalogs];
      });
  
      // Update spam NFT count
      updateSpamNfts(prevSpamNfts => prevSpamNfts + nftsToSpam.length);
  
      setTotalNFTs(prevTotal => prevTotal - nftsToSpam.length);
  
      showInfoToast(`Marked ${nftsToSpam.length} NFT${nftsToSpam.length > 1 ? 's' : ''} as Spam`, "The NFT(s) have been moved to the Spam folder.");
  
      if (isSelectMode) {
          setSelectedNFTs([]);
          setIsSelectMode(false);
      }
  }, [updateNfts, updateCatalogs, updateSpamNfts, showInfoToast, isSelectMode, setSelectedNFTs, setIsSelectMode, setTotalNFTs]);

    const handleWalletToggle = useCallback((address) => {
      setSelectedWallets(prevSelectedWallets => 
        prevSelectedWallets.includes(address)
          ? prevSelectedWallets.filter(wallet => wallet !== address)
          : [...prevSelectedWallets, address]
      );
    }, []);

    const handleContractToggle = useCallback((contractAddress) => {
      setSelectedContracts(prevSelected => {
        if (prevSelected.includes(contractAddress)) {
          return prevSelected.filter(address => address !== contractAddress);
        } else {
          return [...prevSelected, contractAddress];
        }
      });
    }, []);

    const handleNFTSelect = useCallback((nft) => {
      setSelectedNFTs(prev => 
        prev.some(selected => selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address)
          ? prev.filter(selected => !(selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address))
          : [...prev, nft]
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
        id: Date.now().toString(),
        name: catalogName,
        nfts: selectedNFTs,
      };

       updateCatalogs(prev => [...prev, newCatalog]);
      setCatalogName('');
      setSelectedNFTs([]);

      showSuccessToast("Catalog Created", `Your catalog "${catalogName}" has been created successfully.`);
    }, [catalogName, selectedNFTs,  updateCatalogs, showErrorToast, showSuccessToast]);

    const handleDeleteCatalog = useCallback((catalogId) => {
       updateCatalogs(prevCatalogs => prevCatalogs.filter(cat => cat.id !== catalogId));
      showInfoToast("Catalog Deleted", "The catalog has been deleted successfully.");
    }, [ updateCatalogs, showInfoToast]);

    const filteredNfts = useMemo(() => {
      const isAllSelected = selectedContracts.length === allContracts.length;
      return Object.entries(nfts).reduce((acc, [address, walletData]) => {
        if (selectedWallets.includes(address)) {
          acc[address] = Object.entries(walletData).reduce((networkAcc, [network, networkData]) => {
            const nftArray = networkData.nfts || [];
            const filteredNftArray = nftArray.filter(nft => {
              const isSelected = isAllSelected || selectedContracts.includes(nft.contract?.address);
              const isNotSpam = !nft.isSpam;
              return isSelected && isNotSpam;
            });
            
            if (filteredNftArray.length > 0) {
              networkAcc[network] = filteredNftArray;
            }
            
            return networkAcc;
          }, {});
        }
        return acc;
      }, {});
    }, [nfts, selectedWallets, selectedContracts, allContracts]);

    const filteredCatalogs = useMemo(() => 
      catalogs.filter(catalog => 
        catalog.name.toLowerCase().includes(catalogSearch.toLowerCase())
      ),
      [catalogs, catalogSearch]
    );

    const consolidatedNfts = useMemo(() => {
      return Object.entries(filteredNfts).reduce((acc, [address, networkNfts]) => {
        acc[address] = Object.entries(networkNfts).flatMap(([network, nfts]) => 
          nfts.map(nft => ({ ...nft, network }))
        );
        return acc;
      }, {});
    }, [filteredNfts]);

    const handleOpenCatalog = useCallback((catalog) => {
      setViewingCatalog(catalog);
    }, []);
  
    const handleRemoveNFTsFromCatalog = useCallback((catalogId, nftsToRemove) => {
       updateCatalogs(prevCatalogs => 
        prevCatalogs.map(catalog => 
          catalog.id === catalogId
            ? {
                ...catalog,
                nfts: catalog.nfts.filter(nft => 
                  !nftsToRemove.some(removeNft => 
                    removeNft.id.tokenId === nft.id.tokenId && 
                    removeNft.contract.address === nft.contract.address
                  )
                )
              }
            : catalog
        )
      );
    }, [ updateCatalogs]);

    const handleRemoveNFTsFromViewingCatalog = useCallback((nftsToRemove) => {
      handleRemoveNFTsFromCatalog(viewingCatalog.id, nftsToRemove);
      setViewingCatalog(prev => ({
        ...prev,
        nfts: prev.nfts.filter(nft => 
          !nftsToRemove.some(removeNft => 
            removeNft.id.tokenId === nft.id.tokenId && 
            removeNft.contract.address === nft.contract.address
          )
        )
      }));
    }, [handleRemoveNFTsFromCatalog, viewingCatalog]);

    const handleSelectMode = useCallback(() => {
      setIsSelectMode(true);
      setSelectedNFTs([]);
    }, []);

    const handleCancelSelectMode = useCallback(() => {
      setIsSelectMode(false);
      setSelectedNFTs([]);
      setIsCreateCatalogOpen(false);
      setIsAddToCatalogOpen(false);
    }, []);

    const handleAddToExistingCatalog = useCallback(() => {
      const selectedCatalogIds = selectedCatalogs.map(cat => cat.id);
       updateCatalogs(prevCatalogs => 
        prevCatalogs.map(catalog => 
          selectedCatalogIds.includes(catalog.id)
            ? { ...catalog, nfts: [...catalog.nfts, ...selectedNFTs] }
            : catalog
        )
      );
      setSelectedNFTs([]);
      setSelectedCatalogs([]);
      setIsSelectMode(false);
      setIsAddToCatalogOpen(false);
      showSuccessToast("NFTs Added to Catalogs", `Added ${selectedNFTs.length} NFTs to ${selectedCatalogs.length} catalogs.`);
    }, [selectedCatalogs, selectedNFTs,  updateCatalogs, showSuccessToast]);

    if (viewingCatalog) {
      return (
        <CatalogViewPage
          catalog={viewingCatalog}
          onBack={() => setViewingCatalog(null)}
          onRemoveNFTs={handleRemoveNFTsFromViewingCatalog}
          onClose={() => setViewingCatalog(null)}
        />
      );
    }

    return (
      <StyledContainer>
        <VStack spacing="1.5rem" align="stretch">
          <Flex justify="space-between" align="center">
            <Heading as="h1" fontSize={headingSize}>Your NFT Library</Heading>
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
              <StatLabel fontSize="1rem">Total NFTs</StatLabel>
              <StatNumber fontSize="1.5rem">{totalNFTs}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="1rem">Catalogs</StatLabel>
              <StatNumber fontSize="1.5rem">{catalogs.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="1rem">Spam NFTs</StatLabel>
              <StatNumber fontSize="1.5rem">{spamNfts}</StatNumber>
            </Stat>
          </StatGroup>

          {!isSelectMode ? (
            <StyledButton onClick={handleSelectMode} width="100%">
              Select
            </StyledButton>
          ) : (
            <HStack>
              <StyledButton leftIcon={<Icon as={FaTrash} />} onClick={() => handleMarkAsSpam(null, null, selectedNFTs)} colorScheme="red">
                Add to Spam
              </StyledButton>
              <StyledButton leftIcon={<Icon as={FaPlus} />} onClick={() => setIsCreateCatalogOpen(true)} colorScheme="green">
                Create Catalog
              </StyledButton>
              <StyledButton leftIcon={<Icon as={FaFolderPlus} />} onClick={() => setIsAddToCatalogOpen(true)} colorScheme="blue">
                Add to Existing Catalog
              </StyledButton>
              <StyledButton leftIcon={<Icon as={FaTimes} />} onClick={handleCancelSelectMode} colorScheme="gray">
                Cancel
              </StyledButton>
            </HStack>
          )}

          <Collapse in={isCreateCatalogOpen} animateOpacity>
            <StyledCard>
              <Heading as="h3" size="md" mb="0.5rem">Create New Catalog</Heading>
              <HStack>
                <Input 
                  placeholder="Catalog Name" 
                  value={catalogName}
                  onChange={(e) => setCatalogName(e.target.value)}
                />
                <StyledButton leftIcon={<Icon as={FaCheck} />} onClick={handleCreateCatalog}>
                  Create
                </StyledButton>
              </HStack>
              <Text mt="0.5rem" fontSize="sm" color="gray.500">
                {selectedNFTs.length} NFTs selected
              </Text>
            </StyledCard>
          </Collapse>

          <Collapse in={isAddToCatalogOpen} animateOpacity>
            <StyledCard>
              <Heading as="h3" size="md" mb="0.5rem">Add to Existing Catalog</Heading>
              <Input 
                placeholder="Search catalogs" 
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                mb="1rem"
              />
              <VStack align="stretch" maxHeight="200px" overflowY="auto">
                {filteredCatalogs.map(catalog => (
                  <Checkbox 
                    key={catalog.id} 
                    isChecked={selectedCatalogs.some(c => c.id === catalog.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCatalogs([...selectedCatalogs, catalog]);
                      } else {
                        setSelectedCatalogs(selectedCatalogs.filter(c => c.id !== catalog.id));
                      }
                    }}
                  >
                    {catalog.name}
                  </Checkbox>
                ))}
              </VStack>
              <StyledButton 
                mt="1rem" 
                onClick={handleAddToExistingCatalog}
                isDisabled={selectedCatalogs.length === 0 || selectedNFTs.length === 0}
              >
                Add to Selected Catalogs
              </StyledButton>
            </StyledCard>
          </Collapse>

          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList>
              <Tab fontSize="1rem">NFTs</Tab>
              <Tab fontSize="1rem">Catalogs</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <StyledCard>
                  <Heading as="h3" size="md" mb="0.5rem">Filters</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1rem">
                    <Box>
                      <Text fontWeight="bold" mb="0.5rem">Wallets:</Text>
                      {wallets.map(wallet => (
                        <Checkbox
                          key={wallet.address}
                          isChecked={selectedWallets.includes(wallet.address)}
                          onChange={() => handleWalletToggle(wallet.address)}
                          mb="0.25rem"
                        >
                          {wallet.nickname || wallet.address}
                        </Checkbox>
                      ))}
                    </Box>
                    <Box>
                      <Text fontWeight="bold" mb="0.5rem">Contracts:</Text>
                      {Object.entries(contractNames).map(([address, name]) => (
                        <Checkbox
                          key={address}
                          isChecked={selectedContracts.includes(address)}
                          onChange={() => handleContractToggle(address)}
                          mb="0.25rem"
                        >
                          {name || address}
                        </Checkbox>
                      ))}
                    </Box>
                  </SimpleGrid>
                </StyledCard>
    
                {Object.entries(consolidatedNfts).map(([address, nfts]) => (
                  <Box key={address} mt="2rem">
                    <Flex align="center" mb="1rem">
                      <StyledButton 
                        leftIcon={collapsedWallets[address] ? <FaChevronRight /> : <FaChevronDown />}
                        variant="ghost" 
                        onClick={() => handleWalletCollapse(address)}
                      >
                        <Heading as="h3" size="md">
                          {wallets.find(wallet => wallet.address === address)?.nickname || address}
                        </Heading>
                      </StyledButton>
                    </Flex>
                    {!collapsedWallets[address] && (
                      <NFTGrid 
                        nfts={nfts}
                        selectedNFTs={selectedNFTs}
                        onNFTSelect={handleNFTSelect}
                        onMarkAsSpam={(nft) => handleMarkAsSpam(address, nft.network, nft)}
                        walletAddress={address}
                        isSpamFolder={false}
                        isSelectMode={isSelectMode}
                        onNFTClick={handleNFTClick}
                        gridColumns={gridColumns}
                      />
                    )}
                  </Box>
                ))}
              </TabPanel>
              
              <TabPanel>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="1rem">
                  {catalogs.map((catalog) => (
                    <StyledCard key={catalog.id}>
                      <Heading as="h4" size="sm">{catalog.name}</Heading>
                      <Text>{catalog.nfts.length} NFTs</Text>
                      <HStack mt="0.5rem">
                        <StyledButton size="sm" onClick={() => handleOpenCatalog(catalog)}>View</StyledButton>
                        {catalog.name !== "Spam" && (
                          <>
                            <StyledButton size="sm" onClick={() => handleOpenCatalog(catalog)}>Edit</StyledButton>
                            <StyledButton size="sm" colorScheme="red" onClick={() => handleDeleteCatalog(catalog.id)}>Delete</StyledButton>
                          </>
                        )}
                      </HStack>
                    </StyledCard>
                  ))}
                </SimpleGrid>
                
                <StyledCard mt="1rem">
                  <Heading as="h3" size="md" mb="0.5rem">Known Contracts</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="1rem">
                    {Object.entries(contractNames).map(([address, name]) => (
                      <Box key={address} p="0.5rem" borderWidth={1} borderRadius="md">
                        <Text fontWeight="bold">{name}</Text>
                        <Text fontSize="sm">{address}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </StyledCard>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </StyledContainer>
    );
};

export default LibraryPage;