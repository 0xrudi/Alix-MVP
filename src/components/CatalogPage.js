import React, { useState, useEffect } from 'react';
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
  Progress
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
    const fetchAllNFTs = async () => {
      try {
        const fetchedNfts = {};
        for (const wallet of wallets) {
          fetchedNfts[wallet.address] = await fetchNFTs(wallet.address);
        }
        setNfts(fetchedNfts);
      } catch (error) {
        console.error('Error fetching NFTs:', error);
        toast({
          title: "NFT Fetch Failed",
          description: "There was an error fetching the NFTs. Please try again.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchAllNFTs();
  }, [wallets, setNfts, toast]);

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
      // Optionally, you could show a toast notification here
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

    console.log('Fetched NFTs:', JSON.stringify(fetchedNfts, null, 2));

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

  const handleMarkAsSpam = (address, network, nft) => {
    // Remove the NFT from the main nfts state
    setNfts(prevNfts => {
      const updatedNfts = { ...prevNfts };
      updatedNfts[address][network] = updatedNfts[address][network].filter(
        item => item.id.tokenId !== nft.id.tokenId || item.contract.address !== nft.contract.address
      );
      return updatedNfts;
    });

    // Add the NFT to the Spam catalog
    setCatalogs(prevCatalogs => {
      const updatedCatalogs = prevCatalogs.map(catalog => {
        if (catalog.name === "Spam") {
          return {
            ...catalog,
            nfts: [...catalog.nfts, { ...nft, walletAddress: address, network }]
          };
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

  const handleContractToggle = (contractName) => {
    setSelectedContracts(prev =>
      prev.includes(contractName)
        ? prev.filter(name => name !== contractName)
        : [...prev, contractName]
    );
  };

  const handleNFTSelect = (nft) => {
    if (selectedNFTs.some(selected => selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address)) {
      setSelectedNFTs(selectedNFTs.filter(selected => 
        !(selected.id.tokenId === nft.id.tokenId && selected.contract.address === nft.contract.address)
      ));
    } else {
      setSelectedNFTs([...selectedNFTs, nft]);
    }
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

    setCatalogs([...catalogs, newCatalog]);
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

    const updatedCatalogs = catalogs.map(cat => 
      cat.id === selectedCatalog.id 
        ? { ...cat, name: catalogName, nfts: selectedNFTs }
        : cat
    );

    setCatalogs(updatedCatalogs);
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
    setCatalogs(catalogs.filter(cat => cat.id !== catalogId));
    toast({
      title: "Catalog Deleted",
      description: "The catalog has been deleted successfully.",
      status: "info",
      duration: 3000,
      isClosable: true,
    });
  };

  const filteredNfts = Object.entries(nfts).filter(([address, walletNfts]) =>
    selectedWallets.length === 0 || selectedWallets.includes(address)
  ).map(([address, walletNfts]) => ({
    address,
    nfts: Object.entries(walletNfts).flatMap(([network, networkNfts]) => {
      if (Array.isArray(networkNfts)) {
        return networkNfts.filter(nft =>
          selectedContracts.length === 0 || selectedContracts.includes(nft.contract.address)
        );
      } else {
        console.warn(`Unexpected data structure for NFTs in wallet ${address}, network ${network}`);
        return [];
      }
    }),
  }));


  // const contractAddresses = Array.from(new Set(Object.values(nfts).flat().map(nft => nft.contract.address)));

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
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">NFT Catalogs</Heading>
        <Button onClick={onUpdateProfile}>Update Profile</Button>
      </Flex>
      <HStack alignItems="flex-start" spacing={8}>
        <Box flex={3}>
          <Button 
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
  
          <Accordion allowMultiple>
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
                      isChecked={selectedContracts.includes(name)}
                      onChange={() => handleContractToggle(name)}
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
              {!collapsedWallets[address] && Array.isArray(nfts) && nfts.length > 0 && (
                <NFTGrid 
                  nfts={nfts}
                  spamNfts={spamNfts}
                  selectedNFTs={selectedNFTs}
                  onNFTSelect={handleNFTSelect}
                  onMarkAsSpam={(nft) => handleMarkAsSpam(address, nft)}
                />
              )}
              {!collapsedWallets[address] && (!Array.isArray(nfts) || nfts.length === 0) && (
                <Text>No NFTs found for this wallet.</Text>
              )}
            </Box>
          ))}
        </Box>
        <VStack flex={1} alignItems="stretch" spacing={4}>
          <Heading as="h3" size="md">Create New Catalog</Heading>
          <Input 
            placeholder="Catalog Name" 
            value={catalogName}
            onChange={(e) => setCatalogName(e.target.value)}
          />
          <Text>{selectedNFTs.length} NFTs selected</Text>
          <Button colorScheme="blue" onClick={handleCreateCatalog}>
            Create Catalog
          </Button>
          <VStack alignItems="stretch" mt={8}>
            <Heading as="h3" size="md">Your Catalogs</Heading>
            {catalogs.map((catalog) => (
              <Box key={catalog.id} p={4} borderWidth={1} borderRadius="md">
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
          </VStack>
        </VStack>
      </HStack>

  
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
    </Box>
  );
};

export default CatalogPage;