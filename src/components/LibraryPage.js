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
  StatLabel,
  StatNumber,
  StatGroup,
  Button,
  Input,
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
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaChevronRight, FaChevronDown, FaChevronLeft, FaChevronUp } from 'react-icons/fa';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { fetchNFTs } from '../utils/web3Utils';

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
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [collapsedWallets, setCollapsedWallets] = useState({});
    const [contractNames, setContractNames] = useState({});
    const [viewingCatalog, setViewingCatalog] = useState(null);
    const [selectedCatalog, setSelectedCatalog] = useState(null);
    const toast = useToast();
  
    // const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');

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
  
    const handleMarkAsSpam = (address, network, nft) => {
      console.log("handleMarkAsSpam called with:", { address, network, nft });
    
      // Remove the NFT from the main library
      setNfts(prevNfts => {
        const updatedNfts = JSON.parse(JSON.stringify(prevNfts)); // Deep clone
        if (updatedNfts[address] && updatedNfts[address][network]) {
          updatedNfts[address][network].nfts = updatedNfts[address][network].nfts.filter(item => 
            !(item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address)
          );
        }
        console.log("Updated nfts state:", updatedNfts);
        return updatedNfts;
      });
    
      // Add the NFT to the spam catalog
      setCatalogs(prevCatalogs => {
        const newCatalogs = prevCatalogs.map(catalog => {
          if (catalog.name === "Spam") {
            const isAlreadyInSpam = catalog.nfts.some(
              spamNft => spamNft.id?.tokenId === nft.id?.tokenId && spamNft.contract?.address === nft.contract?.address
            );
            if (!isAlreadyInSpam) {
              return {
                ...catalog,
                nfts: [...catalog.nfts, {
                  ...nft,
                  walletAddress: address,
                  network,
                  isSpam: true,
                  spamInfo: {
                    dateMarked: new Date().toISOString(),
                    markedBy: 'user',
                  }
                }]
              };
            }
          }
          return catalog;
        });
        console.log("Updated catalogs:", newCatalogs);
        return newCatalogs;
      });
    
      // Update the UI stats
      setTotalNFTs(prevTotal => prevTotal - 1);
      setSpamNFTs(prevSpam => prevSpam + 1);
    
      toast({
        title: "Marked as Spam",
        description: "The NFT has been moved to the Spam folder.",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    };
  
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

    return (
      <Box className="container">
        <VStack spacing="1.5rem" align="stretch">
          <Flex justify="space-between" align="center">
            <Heading as="h1" fontSize="2rem">Your NFT Library</Heading>
            <Button
              leftIcon={<FaSync />}
              onClick={handleRefreshNFTs}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
              size="sm"
            >
              Refresh Artifacts
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
    
          {/* Create Catalog Component */}
          <Box bg={cardBg} p="1rem" borderRadius="md" boxShadow="md">
            <Heading as="h3" size="md" mb="0.5rem">Create New Catalog</Heading>
            <HStack>
              <Input 
                placeholder="Catalog Name" 
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
              />
              <Button leftIcon={<FaPlus />} onClick={handleCreateCatalog} colorScheme="blue">
                Create
              </Button>
            </HStack>
            <Text mt="0.5rem" fontSize="sm" color="gray.500">
              {selectedNFTs.length} NFTs selected
            </Text>
          </Box>
          
          <Tabs variant="enclosed">
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
                        onMarkAsSpam={(nft) => handleMarkAsSpam(address, nft)}
                        walletAddress={address}
                        cardSize={270}
                        isSpamFolder={false}
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
        
        <Modal isOpen={isOpen} onClose={onClose}>
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
        </Modal>
      </Box>
    );
};


export default LibraryPage;