import React, { useState, useEffect, useMemo } from 'react';
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
  useDisclosure,
} from "@chakra-ui/react";
import { FaPlus } from 'react-icons/fa';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';
import { fetchNFTs } from '../utils/web3Utils';

const LibraryPage = ({ wallets, nfts, setNfts, spamNfts, setSpamNfts, catalogs: initialCatalogs, setCatalogs: setInitialCatalogs }) => {
    const [selectedNFTs, setSelectedNFTs] = useState([]);
    const [catalogName, setCatalogName] = useState('');
    const [localCatalogs, setLocalCatalogs] = useState(initialCatalogs);
    const [selectedWallets, setSelectedWallets] = useState([]);
    const [selectedContracts, setSelectedContracts] = useState([]);
    const [selectedCatalog, setSelectedCatalog] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshProgress, setRefreshProgress] = useState(0);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const [collapsedWallets, setCollapsedWallets] = useState({});
    const [contractNames, setContractNames] = useState({});
    const [viewingCatalog, setViewingCatalog] = useState(null);
    const toast = useToast();
  
    const bgColor = useColorModeValue('gray.50', 'gray.900');
    const cardBg = useColorModeValue('white', 'gray.800');

    useEffect(() => {
      setLocalCatalogs(initialCatalogs);
    }, [initialCatalogs]);

    const setCatalogs = (newCatalogs) => {
      setLocalCatalogs(newCatalogs);
      setInitialCatalogs(newCatalogs);
    };

    useEffect(() => {
      // Initialize the "Spam" catalog
      setCatalogs(prevCatalogs => {
        if (!prevCatalogs.some(catalog => catalog.name === "Spam")) {
          return [...prevCatalogs, { id: "spam", name: "Spam", nfts: [] }];
        }
        return prevCatalogs;
      });
    }, []);
  
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
        console.error('Error processing NFT data:', error);
      }
    }, [nfts]);
  
    const handleWalletCollapse = (address) => {
      setCollapsedWallets(prev => ({
        ...prev,
        [address]: !prev[address]
      }));
    };
  
    const handleRefreshNFTs = async () => {
      setIsRefreshing(true);
      setRefreshProgress(0);
      const fetchedNfts = {};
      let totalFetches = wallets.reduce((sum, wallet) => sum + wallet.networks.length, 0);
      let completedFetches = 0;
  
      for (const wallet of wallets) {
        fetchedNfts[wallet.address] = {};
        for (const network of wallet.networks) {
          try {
            const networkNfts = await fetchNFTs(wallet.address, network);
            fetchedNfts[wallet.address][network] = networkNfts;
            completedFetches++;
            setRefreshProgress((completedFetches / totalFetches) * 100);
          } catch (error) {
            console.error(`Error fetching NFTs for ${wallet.address} on ${network}:`, error);
            toast({
              title: "NFT Fetch Error",
              description: `Failed to fetch NFTs for ${wallet.nickname || wallet.address} on ${network}. Please try again later.`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
          }
        }
      }
  
      setNfts(fetchedNfts);
      setIsRefreshing(false);
      toast({
        title: "NFTs Refreshed",
        description: "Your NFTs have been successfully refreshed.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    };
  
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
          setNfts(fetchedNfts);
        } catch (error) {
          console.error('Error fetching NFTs:', error);
          // Handle error...
        }   
      };
  
      fetchAllNFTs();
    }, [wallets, setNfts]);
  
    const handleMarkAsSpam = (address, network, nft) => {
      console.log("handleMarkAsSpam called with:", { address, network, nft });
    
      setNfts(prevNfts => {
        console.log("Previous nfts state:", prevNfts);
        const updatedNfts = JSON.parse(JSON.stringify(prevNfts)); // Deep clone
        if (updatedNfts[address] && updatedNfts[address][network]) {
          updatedNfts[address][network] = updatedNfts[address][network].map(item => {
            if (item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address) {
              console.log("Marking NFT as spam:", item);
              return { ...item, isSpam: true };
            }
            return item;
          });
        }
        console.log("Updated nfts state:", updatedNfts);
        return updatedNfts;
      });
    
      setCatalogs(prevCatalogs => {
        const newCatalogs = prevCatalogs.map(catalog => {
          if (catalog.name === "Spam") {
            const isAlreadyInSpam = catalog.nfts.some(
              spamNft => spamNft.id?.tokenId === nft.id?.tokenId && spamNft.contract?.address === nft.contract?.address
            );
            console.log("Is NFT already in Spam?", isAlreadyInSpam);
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
      return Object.entries(nfts)
        .filter(([address]) => 
          selectedWallets.length === 0 || selectedWallets.includes(address)
        )
        .reduce((acc, [address, networkNfts]) => {
          const filteredNetworkNfts = Object.entries(networkNfts).reduce((netAcc, [network, nftArray]) => {
            const filteredNftArray = nftArray.filter(nft =>
              selectedContracts.length === 0 || selectedContracts.includes(nft.contract?.address)
            );
            if (filteredNftArray.length > 0) {
              netAcc[network] = filteredNftArray;
            }
            return netAcc;
          }, {});
    
          if (Object.keys(filteredNetworkNfts).length > 0) {
            acc[address] = filteredNetworkNfts;
          }
          return acc;
        }, {});
    }, [nfts, selectedWallets, selectedContracts]);
  
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
  
    const totalNFTs = Object.values(nfts).reduce((acc, wallet) => 
        acc + Object.values(wallet).reduce((sum, network) => sum + network.length, 0), 0
        );
  
    const spamNFTs = localCatalogs.find(cat => cat.name === "Spam")?.nfts.length || 0;

    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl">Your NFT Library</Heading>
          
          <StatGroup>
            <Stat>
              <StatLabel>Total NFTs</StatLabel>
              <StatNumber>{totalNFTs}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Catalogs</StatLabel>
              <StatNumber>{localCatalogs.length}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Spam NFTs</StatLabel>
              <StatNumber>{spamNFTs}</StatNumber>
            </Stat>
          </StatGroup>
        
        <Tabs variant="enclosed">
          <TabList>
            <Tab>NFTs</Tab>
            <Tab>Catalogs</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Box mb={4}>
                <Heading as="h3" size="md" mb={2}>Filters</Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Wallets:</Text>
                    {wallets.map(wallet => (
                      <Checkbox
                        key={wallet.address}
                        isChecked={selectedWallets.includes(wallet.address)}
                        onChange={() => handleWalletToggle(wallet.address)}
                      >
                        {wallet.nickname || wallet.address}
                      </Checkbox>
                    ))}
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Contracts:</Text>
                    {Object.entries(contractNames).map(([address, name]) => (
                      <Checkbox
                        key={address}
                        isChecked={selectedContracts.includes(address)}
                        onChange={() => handleContractToggle(address)}
                      >
                        {name}
                      </Checkbox>
                    ))}
                  </Box>
                </SimpleGrid>
              </Box>
  
              {Object.entries(filteredNfts).map(([address, networkNfts]) => (
                <Box key={address} mb={8}>
                  <Flex align="center" mb={4}>
                    <Heading as="h3" size="md">
                      {wallets.find(wallet => wallet.address === address)?.nickname || address}
                    </Heading>
                    <Button ml={2} size="sm" onClick={() => handleWalletCollapse(address)}>
                      {collapsedWallets[address] ? 'Expand' : 'Collapse'}
                    </Button>
                  </Flex>
                  {!collapsedWallets[address] && (
                    <VStack spacing={4} align="stretch">
                      {Object.entries(networkNfts).map(([network, nftArray]) => (
                        <Box key={network}>
                          <Heading as="h4" size="sm" mb={2}>{network}</Heading>
                          <NFTGrid 
                            nfts={nftArray}
                            selectedNFTs={selectedNFTs}
                            onNFTSelect={handleNFTSelect}
                            onMarkAsSpam={handleMarkAsSpam}
                            walletAddress={address}
                            network={network}
                            cardSize={270}
                            isSpamFolder={false}
                          />
                        </Box>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </TabPanel>
  
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box bg={cardBg} p={4} borderRadius="md" boxShadow="md">
                  <Heading as="h3" size="md" mb={2}>Create New Catalog</Heading>
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
                  <Text mt={2} fontSize="sm" color="gray.500">
                    {selectedNFTs.length} NFTs selected
                  </Text>
                </Box>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {localCatalogs.map((catalog) => (
                    <Box key={catalog.id} p={4} borderWidth={1} borderRadius="md" bg={cardBg}>
                        <Heading as="h4" size="sm">{catalog.name}</Heading>
                        <Text>{catalog.nfts.length} NFTs</Text>
                        <HStack mt={2}>
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
  
              <Box mt={4}>
                <Heading as="h3" size="md" mb={2}>Known Contracts</Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                  {Object.entries(contractNames).map(([address, name]) => (
                    <Box key={address} p={2} borderWidth={1} borderRadius="md">
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
              mb={4}
            />
            <Text mb={2}>Selected NFTs:</Text>
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
    </Container>
  );
};


export default LibraryPage;