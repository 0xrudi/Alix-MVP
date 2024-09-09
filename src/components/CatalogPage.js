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
  Flex
} from "@chakra-ui/react";
import { fetchNFTs } from '../utils/web3Utils';
import NFTGrid from './NFTGrid';

const CatalogPage = ({ wallets, nfts, setNfts, spamNfts, setSpamNfts, onUpdateProfile }) => {
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [catalogName, setCatalogName] = useState('');
  const [catalogs, setCatalogs] = useState([]);
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [selectedContracts, setSelectedContracts] = useState([]);
  const toast = useToast();

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

  const handleRefreshNFTs = async () => {
    // ... (handleRefreshNFTs function implementation)
  };

  const handleMarkAsSpam = (address, tokenId, contractAddress) => {
    setSpamNfts(prevSpamNfts => {
      const walletSpamNfts = prevSpamNfts[address] || [];
      return {
        ...prevSpamNfts,
        [address]: [...walletSpamNfts, { tokenId, contractAddress }]
      };
    });
    toast({
      title: "Marked as Spam",
      description: "The NFT has been marked as spam.",
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
    setSelectedContracts(prevSelectedContracts =>
      prevSelectedContracts.includes(contractAddress)
        ? prevSelectedContracts.filter(contract => contract !== contractAddress)
        : [...prevSelectedContracts, contractAddress]
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

  const filteredNfts = Object.entries(nfts).filter(([address, userNfts]) =>
    selectedWallets.length === 0 || selectedWallets.includes(address)
  ).map(([address, userNfts]) => ({
    address,
    nfts: userNfts.filter(nft =>
      selectedContracts.length === 0 || selectedContracts.includes(nft.contract.address)
    ),
  }));

  const contractAddresses = Array.from(new Set(Object.values(nfts).flat().map(nft => nft.contract.address)));

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">NFT Catalogs</Heading>
        <Button onClick={onUpdateProfile}>Update Profile</Button>
      </Flex>
      <HStack alignItems="flex-start" spacing={8}>
        <Box flex={3}>
          <Button onClick={handleRefreshNFTs} mb={4}>
            Refresh NFTs
          </Button>

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
                  {contractAddresses.map(contractAddress => (
                    <Checkbox
                      key={contractAddress}
                      isChecked={selectedContracts.includes(contractAddress)}
                      onChange={() => handleContractToggle(contractAddress)}
                    >
                      {contractAddress}
                    </Checkbox>
                  ))}
                </Stack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>

          {filteredNfts.map(({ address, nfts }) => (
            <Box key={address} mb={8}>
              <Heading as="h3" size="md" mb={4}>
                {wallets.find(wallet => wallet.address === address)?.nickname || address}
              </Heading>
              <NFTGrid 
                nfts={nfts} 
                spamNfts={spamNfts}
                selectedNFTs={selectedNFTs}
                onNFTSelect={handleNFTSelect}
                onMarkAsSpam={(tokenId, contractAddress) => handleMarkAsSpam(address, tokenId, contractAddress)}
              />
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
            {catalogs.map((catalog, index) => (
              <Box key={index} p={4} borderWidth={1} borderRadius="md">
                <Heading as="h4" size="sm">{catalog.name}</Heading>
                <Text>{catalog.nfts.length} NFTs</Text>
              </Box>
            ))}
          </VStack>
        </VStack>
      </HStack>
    </Box>
  );
};

export default CatalogPage;