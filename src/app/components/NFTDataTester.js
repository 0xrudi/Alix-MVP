// src/components/NFTDataTester.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container,
  Heading, 
  Text, 
  Button, 
  Input, 
  VStack,
  HStack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Spinner,
  useToast,
  FormControl,
  FormLabel,
  Select,
  Code,
  Alert,
  AlertIcon,
  Flex,
  Badge,
  Divider,
  Progress,
  Checkbox,
  CheckboxGroup,
  SimpleGrid,
  IconButton,
  Stack
} from "@chakra-ui/react";
import { FaPlus, FaSync, FaDownload, FaCode } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addWalletAndFetchNFTs } from '../redux/thunks/walletThunks';
import { fetchNFTs } from '../../utils/web3Utils';
import { logger } from '../../utils/logger';
import NFTDebugger from './NFTDebugger';

// List of available networks
const NETWORKS = [
  { value: 'eth', label: 'Ethereum' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'base', label: 'Base' },
  { value: 'solana', label: 'Solana' }
];

const NFTDataTester = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  
  // State for wallet input and network selection
  const [address, setAddress] = useState('');
  const [selectedNetworks, setSelectedNetworks] = useState(NETWORKS.map(n => n.value));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Redux state
  const wallets = useSelector(state => state.wallets.list);
  const nftsByWallet = useSelector(state => state.nfts.byWallet);
  
  // State for displaying raw response data
  const [rawData, setRawData] = useState(null);
  const [activeCalls, setActiveCalls] = useState(0);
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [networkResponses, setNetworkResponses] = useState({});
  const [progress, setProgress] = useState(0);
  
  // Handle network selection
  const handleNetworkChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedNetworks([...selectedNetworks, value]);
    } else {
      setSelectedNetworks(selectedNetworks.filter(n => n !== value));
    }
  };
  
  // Handle form submission to add wallet and fetch NFTs
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!address.trim()) {
      setError('Please enter a wallet address or domain');
      return;
    }
    
    if (selectedNetworks.length === 0) {
      setError('Please select at least one network');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRawData(null);
    setNetworkResponses({});
    setProgress(0);
    
    try {
      // Direct raw API call approach
      await fetchDirectly();
      
      /* Alternative: Use the Redux thunk approach
      const result = await dispatch(addWalletAndFetchNFTs({
        walletData: {
          address: address.trim(),
          type: 'evm', // Default to EVM
          nickname: ''
        },
        networks: selectedNetworks
      })).unwrap();
      
      console.log('Wallet added with NFTs:', result);
      */
      
      toast({
        title: "Success",
        description: `NFT data fetched and logged to console`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
    } catch (err) {
      console.error('Error in NFT fetching:', err);
      setError(err.message || 'Failed to fetch NFTs');
      
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch NFTs',
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };
  
  // Direct fetch approach using web3Utils directly
  const fetchDirectly = async () => {
    setActiveCalls(selectedNetworks.length);
    const responses = {};
    
    // Process each network in sequence for cleaner logs
    for (let i = 0; i < selectedNetworks.length; i++) {
      const network = selectedNetworks[i];
      setCurrentNetwork(network);
      
      try {
        console.log(`Fetching NFTs from ${network} for ${address}...`);
        setProgress(Math.round(i / selectedNetworks.length * 90)); // Save some progress for processing
        
        // Progress callback function to track fetch progress
        const progressCallback = (update) => {
          console.log(`${network} progress:`, update);
        };
        
        // Fetch NFTs directly using web3Utils
        const response = await fetchNFTs(address, network, null, 100, progressCallback);
        responses[network] = response;
        
        // Log the raw response
        console.log(`Raw ${network} NFT response:`, response);
        logger.info(`Found ${response.nfts?.length || 0} NFTs on ${network}`);
        
        // Process a sample NFT to understand structure
        if (response.nfts && response.nfts.length > 0) {
          const sampleNFT = response.nfts[0];
          console.log(`Sample NFT from ${network}:`, sampleNFT);
          
          // Log key properties for analysis
          console.log(`Sample NFT structure from ${network}:`, {
            keys: Object.keys(sampleNFT),
            hasId: !!sampleNFT.id,
            idProps: sampleNFT.id ? Object.keys(sampleNFT.id) : null,
            hasContract: !!sampleNFT.contract,
            contractProps: sampleNFT.contract ? Object.keys(sampleNFT.contract) : null,
            hasMetadata: !!sampleNFT.metadata,
            metadataType: sampleNFT.metadata ? typeof sampleNFT.metadata : null,
            hasMedia: !!sampleNFT.media,
            mediaLength: sampleNFT.media ? sampleNFT.media.length : 0
          });
        }
        
      } catch (err) {
        console.error(`Error fetching from ${network}:`, err);
        responses[network] = { error: err.message };
      }
      
      setNetworkResponses({...responses});
      setActiveCalls(prev => prev - 1);
    }
    
    // Save all responses for reference
    setRawData(responses);
    setProgress(100);
    return responses;
  };
  
  // Download the raw data as JSON
  const downloadRawData = () => {
    if (!rawData) return;
    
    try {
      const dataStr = JSON.stringify(rawData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `nft-raw-data-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Raw NFT data is being downloaded as a JSON file",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error downloading data:', err);
    }
  };
  
  // Render the component
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>NFT Data Tester</Heading>
          <Text color="gray.600">Debug tool for exploring raw NFT API responses</Text>
        </Box>
        
        <Tabs variant="enclosed" colorScheme="blue">
          <TabList>
            <Tab>Direct Fetch</Tab>
            <Tab>NFT Debugger</Tab>
          </TabList>
          
          <TabPanels>
            {/* Direct Fetch Tab */}
            <TabPanel>
              <VStack spacing={6} align="stretch">
                {/* Input Form */}
                <Box 
                  as="form" 
                  onSubmit={handleSubmit}
                  p={6}
                  borderWidth="1px"
                  borderRadius="lg"
                  boxShadow="sm"
                  bg="white"
                >
                  <VStack spacing={4} align="stretch">
                    <FormControl isRequired>
                      <FormLabel>Wallet Address or Domain</FormLabel>
                      <Input 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter ETH address, ENS, or Unstoppable Domain"
                        isDisabled={isLoading}
                      />
                    </FormControl>
                    
                    <FormControl>
                      <FormLabel>Select Networks</FormLabel>
                      <CheckboxGroup colorScheme="blue" defaultValue={selectedNetworks}>
                        <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} spacing={4}>
                          {NETWORKS.map(network => (
                            <Checkbox 
                              key={network.value}
                              value={network.value}
                              isChecked={selectedNetworks.includes(network.value)}
                              onChange={handleNetworkChange}
                              isDisabled={isLoading}
                            >
                              {network.label}
                            </Checkbox>
                          ))}
                        </SimpleGrid>
                      </CheckboxGroup>
                    </FormControl>
                    
                    <Flex justifyContent="space-between" alignItems="center">
                      <Button
                        type="submit"
                        colorScheme="blue"
                        leftIcon={<FaPlus />}
                        isLoading={isLoading}
                        loadingText="Fetching..."
                      >
                        Fetch NFT Data
                      </Button>
                      
                      {rawData && (
                        <Button
                          colorScheme="green"
                          leftIcon={<FaDownload />}
                          onClick={downloadRawData}
                          isDisabled={isLoading}
                        >
                          Download Raw Data
                        </Button>
                      )}
                    </Flex>
                  </VStack>
                </Box>
                
                {/* Error Message */}
                {error && (
                  <Alert status="error">
                    <AlertIcon />
                    {error}
                  </Alert>
                )}
                
                {/* Progress Information */}
                {isLoading && (
                  <Box>
                    <Progress value={progress} size="sm" colorScheme="blue" mb={4} />
                    <Flex justify="space-between" align="center">
                      <Text>Fetching from {currentNetwork || '...'}</Text>
                      <Text>{activeCalls} calls remaining</Text>
                    </Flex>
                  </Box>
                )}
                
                {/* Results Summary */}
                {rawData && (
                  <Box borderWidth="1px" borderRadius="lg" p={6} bg="white">
                    <Heading size="md" mb={4}>Results Summary</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                      {Object.entries(networkResponses).map(([network, response]) => (
                        <Box 
                          key={network}
                          p={4}
                          borderWidth="1px"
                          borderRadius="md"
                          bg={response.error ? "red.50" : "blue.50"}
                        >
                          <Flex justify="space-between" mb={2}>
                            <Text fontWeight="bold">{network.toUpperCase()}</Text>
                            <Badge colorScheme={response.error ? "red" : "green"}>
                              {response.error 
                                ? "Error" 
                                : `${response.nfts?.length || 0} NFTs`
                              }
                            </Badge>
                          </Flex>
                          
                          {response.error ? (
                            <Text fontSize="sm" color="red.500">{response.error}</Text>
                          ) : (
                            <VStack align="start" spacing={1} fontSize="sm">
                              <Text>Has cursor: {response.cursor ? "Yes" : "No"}</Text>
                              {response.nfts && response.nfts.length > 0 && (
                                <Text>First NFT: {response.nfts[0].title || response.nfts[0].id?.tokenId || 'Unnamed'}</Text>
                              )}
                            </VStack>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                    
                    <Text mt={6} fontSize="sm" color="gray.600">
                      Full API responses have been logged to the browser console. Check the console for detailed information.
                    </Text>
                  </Box>
                )}
              </VStack>
            </TabPanel>
            
            {/* NFT Debugger Tab */}
            <TabPanel>
              <NFTDebugger />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default NFTDataTester;