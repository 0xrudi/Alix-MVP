import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { logger } from '../utils/logger';
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
  useColorModeValue,
  Container,
  SimpleGrid,
  Stat,
  Collapse,
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  Input,
  Icon,
  HStack,
  Flex,
  Checkbox,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Progress,
  useDisclosure,
  useBreakpointValue
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaChevronLeft, FaChevronUp, FaTrash, FaTimes, FaCheck, FaFolderPlus } from 'react-icons/fa';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { fetchNFTs } from '../utils/web3Utils';
import { useLocation, useNavigate } from 'react-router-dom';

const LibraryPage = ({ wallets, nfts, setNfts, spamNfts, setSpamNfts, catalogs: initialCatalogs, setCatalogs: setInitialCatalogs }) => {
    const [selectedNFTs, setSelectedNFTs] = useState([]);
    const [catalogName, setCatalogName] = useState('');
    const [localCatalogs, setLocalCatalogs] = useState(initialCatalogs);
    const [totalNFTs, setTotalNFTs] = useState(0);
    const [spamNFTs, setSpamNFTs] = useState(0);
    const [selectedWallets, setSelectedWallets] = useState(wallets.map(w => w.address));
    const [selectedContracts, setSelectedContracts] = useState(() => {
        const allContracts = new Set();
        Object.values(nfts).forEach(walletNfts => {
          Object.values(walletNfts).forEach(networkNfts => {
            if (Array.isArray(networkNfts)) {
              networkNfts.forEach(nft => {
                if (nft.contract?.address) {
                  allContracts.add(nft.contract.address);
                }
              });
            } else {
              logger.warn('Expected networkNfts to be an array, but got:', networkNfts);
            }
          });
        });
        return Array.from(allContracts);
    });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(0);
    const { isOpen, onOpen, onClose, onToggle } = useDisclosure();
    const [collapsedWallets, setCollapsedWallets] = useState({});
    const [contractNames, setContractNames] = useState({});
    const [viewingCatalog, setViewingCatalog] = useState(null);
    const [selectedCatalog, setSelectedCatalog] = useState(null);
    const toast = useToast();
    const [activeTab, setActiveTab] = useState(0);
    const location = useLocation();
    const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
    const showButtonText = useBreakpointValue({ base: false, md: true });
    const [isSelectMode, setIsSelectMode] = useState(false);
    const { isOpen: isCreateCatalogOpen, onToggle: onCreateCatalogToggle, onClose: onCreateCatalogClose } = useDisclosure();
    const { isOpen: isAddToCatalogOpen, onToggle: onAddToCatalogToggle, onClose: onAddToCatalogClose } = useDisclosure();
    const [selectedCatalogs, setSelectedCatalogs] = useState([]);
    const [catalogSearch, setCatalogSearch] = useState('');
    const cardBg = useColorModeValue('white', 'gray.800');
  
    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab === 'nfts') setActiveTab(0);
      if (tab === 'catalogs') setActiveTab(1);
    }, [location]);
  

    logger.log("Initial nfts:", nfts);

    useEffect(() => {
      setLocalCatalogs(initialCatalogs);
    }, [initialCatalogs]);

    const setCatalogs = useCallback((newCatalogs) => {
        setLocalCatalogs(newCatalogs);
        setInitialCatalogs(newCatalogs);
    }, [setInitialCatalogs]);

    useEffect(() => {
        logger.log("Selected Contracts updated:", selectedContracts);
      }, [selectedContracts]);

    useEffect(() => {
        // Initialize the "Spam" catalog
        setCatalogs(prevCatalogs => {
          if (!prevCatalogs.some(catalog => catalog.name === "Spam")) {
            return [...prevCatalogs, { id: "spam", name: "Spam", nfts: [] }];
          }
          return prevCatalogs;
        });
    }, [setCatalogs, setInitialCatalogs]);
  
    useEffect(() => {
      try {
        // Extract unique contract names from NFTs
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
        setContractNames(names);
      } catch (error) {
        logger.error('Error processing NFT data:', error);
      }
    }, [nfts]);

    useEffect(() => {
      const total = Object.values(nfts).reduce((acc, wallet) => 
        acc + Object.values(wallet).reduce((sum, network) => sum + (network.nfts ? network.nfts.length : 0), 0), 0);
      setTotalNFTs(total);
    
      const spam = localCatalogs.find(cat => cat.name === "Spam")?.nfts.length || 0;
      setSpamNFTs(spam);
    }, [nfts, localCatalogs]);

    const navigate = useNavigate();

    const handleNFTClick = (nft) => {
      navigate('/artifact', { state: { nft } });
    };
  
    const handleWalletCollapse = (address) => {
        setCollapsedWallets(prev => ({
          ...prev,
          [address]: !prev[address]
        }));
     };
  
    const handleRefreshNFTs = useCallback(async () => {
      setIsRefreshing(true);
      setRefreshProgress(0);
      const fetchedNfts = {};
      let totalFetches = wallets.reduce((sum, wallet) => sum + wallet.networks.length, 0);
      let completedFetches = 0;
    
      // Get the current spam NFTs
      const spamCatalog = localCatalogs.find(cat => cat.name === "Spam") || { nfts: [] };
      const spamNftIds = new Set(spamCatalog.nfts.map(nft => `${nft.contract.address}-${nft.id.tokenId}`));
    
      for (const wallet of wallets) {
        fetchedNfts[wallet.address] = {};
        for (const networkValue of wallet.networks) {
          try {
            const { nfts: networkNfts } = await fetchNFTs(wallet.address, networkValue);
            
            // Filter out spam NFTs
            const filteredNfts = networkNfts.filter(nft => {
              const nftId = `${nft.contract.address}-${nft.id.tokenId}`;
              return !spamNftIds.has(nftId);
            });
    
            fetchedNfts[wallet.address][networkValue] = { nfts: filteredNfts };
            completedFetches++;
            setRefreshProgress((completedFetches / totalFetches) * 100);
          } catch (error) {
            console.error(`Error fetching NFTs for ${wallet.address} on ${networkValue}:`, error);
            fetchedNfts[wallet.address][networkValue] = { nfts: [] };
            toast({
              title: "NFT Fetch Error",
              description: `Failed to fetch NFTs for ${wallet.nickname || wallet.address} on ${networkValue}. Please try again later.`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
    
      console.log('Fetched NFTs:', fetchedNfts);
      setNfts(fetchedNfts);
    
      // Update total NFTs count
      const totalNftsCount = Object.values(fetchedNfts).reduce(
        (total, wallet) => total + Object.values(wallet).reduce((sum, network) => sum + network.nfts.length, 0),
        0
      );
      setTotalNFTs(totalNftsCount);
    
      setIsRefreshing(false);
      toast({
        title: "NFTs Refreshed",
        description: "Your NFTs have been refreshed, excluding spam NFTs.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }, [wallets, setNfts, localCatalogs, toast, setTotalNFTs]);
  
    useEffect(() => {
        const fetchAllNFTs = async () => {
          try {
            const fetchedNfts = {};
            for (const wallet of wallets) {
              fetchedNfts[wallet.address] = {};
              for (const network of wallet.networks) {
                fetchedNfts[wallet.address][network] = await fetchNFTs(wallet.address, network);
              }
            }
            logger.log("Fetched NFTs:", fetchedNfts);
            setNfts(fetchedNfts);
          } catch (error) {
            logger.error('Error fetching NFTs:', error);
          }   
        };
      
        fetchAllNFTs();
    }, [wallets, setNfts]);
  
    const handleMarkAsSpam = useCallback((address, network, nfts) => {
      const nftsToSpam = Array.isArray(nfts) ? nfts : [nfts];
      
      setNfts(prevNfts => {
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
  
      setCatalogs(prevCatalogs => {
        const newCatalogs = prevCatalogs.map(catalog => {
          if (catalog.name === "Spam") {
            const newSpamNfts = nftsToSpam.filter(nft => 
              !catalog.nfts.some(spamNft => 
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
            return {
              ...catalog,
              nfts: [...catalog.nfts, ...newSpamNfts]
            };
          }
          return catalog;
        });
        return newCatalogs;
      });
  
      setTotalNFTs(prevTotal => prevTotal - nftsToSpam.length);
      setSpamNFTs(prevSpam => prevSpam + nftsToSpam.length);
  
      toast({
        title: `Marked ${nftsToSpam.length} NFT${nftsToSpam.length > 1 ? 's' : ''} as Spam`,
        description: "The NFT(s) have been moved to the Spam folder.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
  
      if (isSelectMode) {
        setSelectedNFTs([]);
        setIsSelectMode(false);
      }
    }, [setCatalogs, setNfts, setTotalNFTs, setSpamNFTs, toast, isSelectMode]);  
  
    const handleWalletToggle = (address) => {
        setSelectedWallets(prevSelectedWallets => 
          prevSelectedWallets.includes(address)
            ? prevSelectedWallets.filter(wallet => wallet !== address)
            : [...prevSelectedWallets, address]
        );
    };
  
    const handleContractToggle = (contractAddress) => {
        setSelectedContracts(prev =>
          prev.includes(contractAddress)
            ? prev.filter(address => address !== contractAddress)
            : [...prev, contractAddress]
        );
    };
  
    const handleNFTSelect = (nft) => {
      setSelectedNFTs(prev => 
        prev.some(selected => selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address)
          ? prev.filter(selected => !(selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address))
          : [...prev, nft]
      );
    };
  
    const handleCreateCatalog = () => {
      if (catalogName.trim() === '') {
        toast({
          title: "Catalog Name Required",
          description: "Please enter a name for your catalog.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      if (selectedNFTs.length === 0) {
        toast({
          title: "No NFTs Selected",
          description: "Please select at least one NFT for your catalog.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      const newCatalog = {
        id: Date.now().toString(),
        name: catalogName,
        nfts: selectedNFTs,
      };
  
      setCatalogs(prev => [...prev, newCatalog]);
      setCatalogName('');
      setSelectedNFTs([]);
  
      toast({
        title: "Catalog Created",
        description: `Your catalog "${catalogName}" has been created successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
  
    const handleEditCatalog = (catalog) => {
      setSelectedCatalog(catalog);
      setCatalogName(catalog.name);
      setSelectedNFTs(catalog.nfts);
      onOpen();
    };
  
    const handleUpdateCatalog = () => {
      if (catalogName.trim() === '') {
        toast({
          title: "Catalog Name Required",
          description: "Please enter a name for your catalog.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      setCatalogs(prevCatalogs => 
        prevCatalogs.map(cat => 
          cat.id === selectedCatalog.id 
            ? { ...cat, name: catalogName, nfts: selectedNFTs }
            : cat
        )
      );
      onClose();
      setCatalogName('');
      setSelectedNFTs([]);
      setSelectedCatalog(null);
  
      toast({
        title: "Catalog Updated",
        description: `Your catalog "${catalogName}" has been updated successfully.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
  
    const handleDeleteCatalog = (catalogId) => {
      setCatalogs(prevCatalogs => prevCatalogs.filter(cat => cat.id !== catalogId));
      toast({
        title: "Catalog Deleted",
        description: "The catalog has been deleted successfully.",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    };
  
    const filteredNfts = useMemo(() => {
      logger.log("Filtering NFTs. Input data:", { nfts, selectedWallets, selectedContracts });
      
      return Object.entries(nfts).reduce((acc, [address, walletData]) => {
        logger.log(`Processing wallet: ${address}`, walletData);
        
        if (selectedWallets.includes(address)) {
          if (typeof walletData !== 'object' || walletData === null) {
            logger.warn(`Invalid wallet data for address ${address}:`, walletData);
            return acc;
          }
          
          acc[address] = Object.entries(walletData).reduce((networkAcc, [network, networkData]) => {
            logger.log(`Processing network: ${network}`, networkData);
            
            if (typeof networkData !== 'object' || networkData === null) {
              logger.warn(`Invalid network data for ${address} on ${network}:`, networkData);
              return networkAcc;
            }
            
            const nftArray = networkData.nfts || [];
            if (!Array.isArray(nftArray)) {
              logger.warn(`Invalid NFT array for ${address} on ${network}:`, nftArray);
              return networkAcc;
            }
            
            const filteredNftArray = nftArray.filter(nft => {
              if (typeof nft !== 'object' || nft === null) {
                logger.warn(`Invalid NFT object:`, nft);
                return false;
              }
              const isSelected = selectedContracts.length === 0 || selectedContracts.includes(nft.contract?.address);
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
    }, [nfts, selectedWallets, selectedContracts]);

    const filteredCatalogs = useMemo(() => 
      localCatalogs.filter(catalog => 
        catalog.name.toLowerCase().includes(catalogSearch.toLowerCase())
      ),
      [localCatalogs, catalogSearch]
    );
  
  
    logger.log("Filtered NFTs result:", filteredNfts);

    const consolidatedNfts = useMemo(() => {
      return Object.entries(filteredNfts).reduce((acc, [address, networkNfts]) => {
        acc[address] = Object.entries(networkNfts).flatMap(([network, nfts]) => 
          nfts.map(nft => ({ ...nft, network }))
        );
        return acc;
      }, {});
    }, [filteredNfts]);
    
  
    const handleOpenCatalog = (catalog) => {
      setViewingCatalog(catalog);
    };
  
    const handleRemoveNFTsFromCatalog = (catalogId, nftsToRemove) => {
      setCatalogs(prevCatalogs => 
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
    };
  
    const handleRemoveNFTsFromViewingCatalog = (nftsToRemove) => {
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
    };
  
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

    logger.log("Rendering LibraryPage");
    logger.log("filteredNfts:", filteredNfts);

    const handleSelectMode = () => {
      setIsSelectMode(true);
      setSelectedNFTs([]);
    };

    const handleCancelSelectMode = () => {
      setIsSelectMode(false);
      setSelectedNFTs([]);
      onCreateCatalogClose();
      onAddToCatalogClose();
    };

    const handleAddToExistingCatalog = () => {
      const selectedCatalogIds = selectedCatalogs.map(cat => cat.id);
      setCatalogs(prevCatalogs => 
        prevCatalogs.map(catalog => 
          selectedCatalogIds.includes(catalog.id)
            ? { ...catalog, nfts: [...catalog.nfts, ...selectedNFTs] }
            : catalog
        )
      );
      setSelectedNFTs([]);
      setSelectedCatalogs([]);
      setIsSelectMode(false);
      onAddToCatalogClose();
      toast({
        title: "NFTs Added to Catalogs",
        description: `Added ${selectedNFTs.length} NFTs to ${selectedCatalogs.length} catalogs.`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
  



    return (
      <Box className="container">
        <VStack spacing="1.5rem" align="stretch">
          <Flex justify="space-between" align="center">
            <Heading as="h1" fontSize="2rem">Your NFT Library</Heading>
            <Button
              leftIcon={<Icon as={FaSync} />}
              onClick={handleRefreshNFTs}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
              size={buttonSize}
            >
              {showButtonText ? "Refresh Artifacts" : null}
            </Button>
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
              <StatNumber fontSize="1.5rem">{localCatalogs.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel fontSize="1rem">Spam NFTs</StatLabel>
              <StatNumber fontSize="1.5rem">{spamNFTs}</StatNumber>
            </Stat>
          </StatGroup>

          {!isSelectMode ? (
          <Button onClick={handleSelectMode} colorScheme="blue" width="100%">
            Select
          </Button>
        ) : (
          <HStack>
            <Button leftIcon={<Icon as={FaTrash} />} onClick={() => handleMarkAsSpam(null, null, selectedNFTs)} colorScheme="red">
              Add to Spam
            </Button>
            <Button leftIcon={<Icon as={FaPlus} />} onClick={onCreateCatalogToggle} colorScheme="green">
              Create Catalog
            </Button>
            <Button leftIcon={<Icon as={FaFolderPlus} />} onClick={onAddToCatalogToggle} colorScheme="blue">
              Add to Existing Catalog
            </Button>
            <Button leftIcon={<Icon as={FaTimes} />} onClick={handleCancelSelectMode} colorScheme="gray">
              Cancel
            </Button>
          </HStack>
        )}

        
        <Collapse in={isCreateCatalogOpen} animateOpacity>
          <Box bg={cardBg} p="1rem" borderRadius="md" boxShadow="md">
            <Heading as="h3" size="md" mb="0.5rem">Create New Catalog</Heading>
            <HStack>
              <Input 
                placeholder="Catalog Name" 
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
              />
              <Button leftIcon={<Icon as={FaCheck} />} onClick={handleCreateCatalog} colorScheme="blue">
                Create
              </Button>
            </HStack>
            <Text mt="0.5rem" fontSize="sm" color="gray.500">
              {selectedNFTs.length} NFTs selected
            </Text>
          </Box>
        </Collapse>

        <Collapse in={isAddToCatalogOpen} animateOpacity>
          <Box bg={cardBg} p="1rem" borderRadius="md" boxShadow="md">
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
            <Button 
              mt="1rem" 
              colorScheme="blue" 
              onClick={handleAddToExistingCatalog}
              isDisabled={selectedCatalogs.length === 0 || selectedNFTs.length === 0}
            >
              Add to Selected Catalogs
            </Button>
          </Box>
        </Collapse>

          
          <Tabs index={activeTab} onChange={setActiveTab} variant="enclosed">
            <TabList>
              <Tab fontSize="1rem">NFTs</Tab>
              <Tab fontSize="1rem">Catalogs</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <Box mb="1rem">
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
                </Box>
    
                {Object.entries(consolidatedNfts).map(([address, nfts]) => (
                  <Box key={address} mb="2rem">
                    <Flex align="center" mb="1rem">
                      <Button 
                        leftIcon={collapsedWallets[address] ? <FaChevronRight /> : <FaChevronDown />}
                        variant="ghost" 
                        onClick={() => handleWalletCollapse(address)}
                      >
                        <Heading as="h3" size="md">
                          {wallets.find(wallet => wallet.address === address)?.nickname || address}
                        </Heading>
                      </Button>
                    </Flex>
                    {!collapsedWallets[address] && (
                      <NFTGrid 
                        nfts={nfts}
                        selectedNFTs={selectedNFTs}
                        onNFTSelect={handleNFTSelect}
                        onMarkAsSpam={(nft) => handleMarkAsSpam(address, nft.network, nft)}
                        walletAddress={address}
                        cardSize={270}
                        isSpamFolder={false}
                        isSelectMode={isSelectMode}
                        onNFTClick={handleNFTClick}
                      />
                    )}
                  </Box>
                ))}
              </TabPanel>
              
              <TabPanel>
                <VStack spacing="1rem" align="stretch">
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="1rem">
                    {localCatalogs.map((catalog) => (
                      <Box key={catalog.id} p="1rem" borderWidth={1} borderRadius="md" bg={cardBg}>
                        <Heading as="h4" size="sm">{catalog.name}</Heading>
                        <Text>{catalog.nfts.length} NFTs</Text>
                        <HStack mt="0.5rem">
                          <Button size="sm" onClick={() => handleOpenCatalog(catalog)}>View</Button>
                          {catalog.name !== "Spam" && (
                            <>
                              <Button size="sm" onClick={() => handleEditCatalog(catalog)}>Edit</Button>
                              <Button size="sm" colorScheme="red" onClick={() => handleDeleteCatalog(catalog.id)}>Delete</Button>
                            </>
                          )}
                        </HStack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
                
                <Box mt="1rem">
                  <Heading as="h3" size="md" mb="0.5rem">Known Contracts</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing="1rem">
                    {Object.entries(contractNames).map(([address, name]) => (
                      <Box key={address} p="0.5rem" borderWidth={1} borderRadius="md">
                        <Text fontWeight="bold">{name}</Text>
                        <Text fontSize="sm">{address}</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
        
        {/* <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Edit Catalog</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Input 
                placeholder="Catalog Name" 
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                mb="1rem"
              />
              <Text mb="0.5rem">Selected NFTs:</Text>
              {selectedNFTs.map(nft => (
                <Text key={`${nft.contract.address}-${nft.id.tokenId}`}>
                  {nft.title || `Token ID: ${nft.id.tokenId}`}
                </Text>
              ))}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={handleUpdateCatalog}>
                Update Catalog
              </Button>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </ModalFooter>
          </ModalContent>
        </Modal> */}
      </Box>
    );
};


export default LibraryPage;