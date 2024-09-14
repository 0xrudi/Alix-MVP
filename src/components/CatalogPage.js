import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, 
  Heading, 
  Button, 
  Input, 
  VStack, 
  HStack,
  useToast,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Stack,
  Checkbox,
  Text,
  Flex,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Progress,
  Container,
  SimpleGrid,
  useColorModeValue
} from "@chakra-ui/react";
import { fetchNFTs } from '../utils/web3Utils';
import NFTGrid from './NFTGrid';
import CatalogViewPage from './CatalogViewPage';

const CatalogPage = ({ wallets, nfts, setNfts, spamNfts, setSpamNfts, onUpdateProfile }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [catalogName, setCatalogName] = useState('');
  const [catalogs, setCatalogs] = useState([]);
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

  // Color mode values
  const newCatalogBg = useColorModeValue('gray.100', 'gray.700');
  const catalogItemBg = useColorModeValue('white', 'gray.700');

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
    // Remove the NFT from the main nfts state
    setNfts(prevNfts => {
      const updatedNfts = { ...prevNfts };
      if (updatedNfts[address] && updatedNfts[address][network]) {
        updatedNfts[address][network] = updatedNfts[address][network].filter(
          item => !(item.id?.tokenId === nft.id?.tokenId && item.contract?.address === nft.contract?.address)
        );
        // If the network array is empty, remove it
        if (updatedNfts[address][network].length === 0) {
          delete updatedNfts[address][network];
        }
        // If the address object is empty, remove it
        if (Object.keys(updatedNfts[address]).length === 0) {
          delete updatedNfts[address];
        }
      }
      return updatedNfts;
    });
  
    // Add the NFT to the Spam catalog if it's not already there
    setCatalogs(prevCatalogs => {
      const updatedCatalogs = prevCatalogs.map(catalog => {
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
                media: nft.media || [],
                id: nft.id || {},
                contract: nft.contract || {},
                title: nft.title || `Unknown NFT`
              }]
            };
          }
        }
        return catalog;
      });
      return updatedCatalogs;
    });
  
    toast({
      title: "Marked as Spam",
      description: "The NFT has been moved to the Spam catalog.",
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
      .filter(([address, walletNfts]) =>
        selectedWallets.length === 0 || selectedWallets.includes(address)
      )
      .map(([address, walletNfts]) => ({
        address,
        nfts: Object.entries(walletNfts).flatMap(([network, networkNfts]) => {
          if (Array.isArray(networkNfts)) {
            return networkNfts.filter(nft =>
              selectedContracts.length === 0 || selectedContracts.includes(nft.contract?.address)
            );
          } else {
            console.warn(`Unexpected data structure for NFTs in wallet ${address}, network ${network}`);
            return [];
          }
        }),
      }))
      .filter(({ nfts }) => nfts.length > 0);
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

  return (
    <Container maxW="container.xl" py={8}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">NFT Catalogs</Heading>
        <Button colorScheme="blue" onClick={onUpdateProfile}>Update Profile</Button>
      </Flex>
      
      <Flex direction={{ base: "column", lg: "row" }} spacing={8}>
        <Box flex={3} mr={{ base: 0, lg: 8 }} mb={{ base: 8, lg: 0 }}>
          <Button 
            colorScheme="blue"
            onClick={handleRefreshNFTs} 
            isLoading={isRefreshing}
            loadingText="Refreshing NFTs"
            mb={4}
          >
            Refresh NFTs
          </Button>
          {isRefreshing && (
            <Progress value={refreshProgress} mb={4} />
          )}
  
          <Accordion allowMultiple mb={4}>
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Filter by Wallet
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Stack>
                  {wallets.map(wallet => (
                    <Checkbox
                      key={wallet.address}
                      isChecked={selectedWallets.includes(wallet.address)}
                      onChange={() => handleWalletToggle(wallet.address)}
                    >
                      {wallet.nickname || wallet.address}
                    </Checkbox>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
  
            <AccordionItem>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Filter by Contract
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4}>
                <Stack>
                  {Object.entries(contractNames).map(([address, name]) => (
                    <Checkbox
                      key={address}
                      isChecked={selectedContracts.includes(address)}
                      onChange={() => handleContractToggle(address)}
                    >
                      {name || address}
                    </Checkbox>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
  
          {filteredNfts.map(({ address, nfts }) => (
            <Box key={address} mb={8}>
              <Flex align="center" mb={4}>
                <Heading as="h3" size="md">
                  {wallets.find(wallet => wallet.address === address)?.nickname || address}
                </Heading>
                <Button ml={2} size="sm" onClick={() => handleWalletCollapse(address)}>
                  {collapsedWallets[address] ? 'Expand' : 'Collapse'}
                </Button>
              </Flex>
              {!collapsedWallets[address] && nfts.length > 0 && (
                <NFTGrid 
                  nfts={nfts}
                  selectedNFTs={selectedNFTs}
                  onNFTSelect={handleNFTSelect}
                  onMarkAsSpam={(nft) => handleMarkAsSpam(address, nft.network, nft)}
                  walletAddress={address}
                />
              )}
              {(!nfts.length || collapsedWallets[address]) && (
                <Text>No NFTs found for this wallet.</Text>
              )}
            </Box>
          ))}
        </Box>
        
        <VStack flex={1} align="stretch" spacing={4}>
          <Box bg={newCatalogBg} p={4} borderRadius="md">
            <Heading as="h3" size="md" mb={4}>Create New Catalog</Heading>
            <Input 
              placeholder="Catalog Name" 
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              mb={2}
            />
            <Text mb={2}>{selectedNFTs.length} NFTs selected</Text>
            <Button colorScheme="blue" onClick={handleCreateCatalog} isFullWidth>
              Create Catalog
            </Button>
          </Box>
  
          <Box>
            <Heading as="h3" size="md" mb={4}>Your Catalogs</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {catalogs.map((catalog) => (
                <Box key={catalog.id} p={4} borderWidth={1} borderRadius="md" bg={catalogItemBg}>
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
          </Box>
        </VStack>
      </Flex>
  
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

export default CatalogPage;