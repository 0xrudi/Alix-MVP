// src/components/NFTDebugger.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Input, 
  VStack,
  HStack,
  Spinner,
  useToast,
  Code,
  Alert,
  AlertIcon,
  IconButton,
  Collapse
} from "@chakra-ui/react";
import { FaPlus, FaDownload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { resolveENS, resolveUnstoppableDomain, isValidAddress } from '../../utils/web3Utils';
import { fetchNFTs } from '../../utils/web3Utils';
import { logger } from '../../utils/logger';

// List of networks to query
const NETWORKS = ['eth', 'polygon', 'optimism', 'arbitrum', 'base', 'solana'];

const NFTDebugger = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  
  // State for wallet input and validation
  const [walletInput, setWalletInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State for storing raw NFT responses
  const [rawResponses, setRawResponses] = useState({});
  const [expandedNetwork, setExpandedNetwork] = useState(null);
  
  // Handle wallet input change
  const handleInputChange = (e) => {
    setWalletInput(e.target.value);
    setError(null);
  };
  
  // Fetch NFTs for the wallet
  const fetchWalletNFTs = async () => {
    if (!walletInput.trim()) {
      setError("Please enter a wallet address or domain");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setRawResponses({});
    
    try {
      // Resolve the address if it's a domain
      let address = walletInput.trim();
      let addressType = 'evm'; // Default to EVM
      
      // Check if it's a domain
      if (address.includes('.')) {
        if (address.endsWith('.eth')) {
          console.log('Resolving ENS domain:', address);
          const result = await resolveENS(address);
          if (result.success) {
            address = result.address;
            addressType = result.type;
          } else {
            throw new Error(`Could not resolve ENS domain: ${result.message}`);
          }
        } else {
          console.log('Trying Unstoppable Domain resolution:', address);
          const result = await resolveUnstoppableDomain(address);
          if (result.success) {
            address = result.address;
            addressType = result.type;
          } else {
            throw new Error('Could not resolve domain. Please try a valid address.');
          }
        }
      } else {
        // Validate address format
        const validation = isValidAddress(address);
        if (!validation.isValid) {
          throw new Error('Invalid wallet address format');
        }
        addressType = validation.type;
      }
      
      console.log('Resolved address:', address, 'Type:', addressType);
      
      // Clear previous results
      const newRawResponses = {};
      
      // Fetch from each network
      for (const network of NETWORKS) {
        try {
          console.log(`Fetching NFTs from ${network}...`);
          
          // Status update
          toast({
            title: `Fetching from ${network}...`,
            status: "info",
            duration: 2000,
            isClosable: true,
            position: "top-right"
          });
          
          // Fetch NFTs for this network
          const response = await fetchNFTs(address, network);
          
          // Store the raw response
          newRawResponses[network] = response;
          
          // Immediately update state after each network for better UX
          setRawResponses(prev => ({ ...prev, [network]: response }));
          
          // Log the full raw response to console for debugging
          console.log(`Raw ${network} response:`, response);
          
          const nftCount = response.nfts ? response.nfts.length : 0;
          logger.info(`Found ${nftCount} NFTs on ${network}`);
          
          toast({
            title: `${network}: ${nftCount} NFTs found`,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top-right"
          });
        } catch (networkError) {
          console.error(`Error fetching from ${network}:`, networkError);
          newRawResponses[network] = { error: networkError.message };
          
          // Update state with the error for this network
          setRawResponses(prev => ({ 
            ...prev, 
            [network]: { error: networkError.message }
          }));
          
          toast({
            title: `Error: ${network}`,
            description: networkError.message,
            status: "error",
            duration: 4000,
            isClosable: true,
            position: "top-right"
          });
        }
      }
      
      // Final success message
      toast({
        title: "Fetching complete",
        description: "NFT data has been fetched from all networks",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
      
    } catch (error) {
      console.error('Error fetching wallet NFTs:', error);
      setError(error.message || "Failed to fetch NFTs");
      
      toast({
        title: "Error",
        description: error.message || "Failed to fetch NFTs",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle expanding/collapsing a network
  const toggleNetwork = (network) => {
    setExpandedNetwork(expandedNetwork === network ? null : network);
  };
  
  // Download the raw responses as JSON
  const downloadResponses = () => {
    try {
      const dataStr = JSON.stringify(rawResponses, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `nft-responses-${new Date().toISOString()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: "Your NFT data is being downloaded as a JSON file",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    } catch (error) {
      console.error('Error downloading responses:', error);
      toast({
        title: "Download Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top-right"
      });
    }
  };
  
  return (
    <Box>
      <Heading mb={4} size="lg">NFT Data Debugger</Heading>
      <Text mb={4}>This component fetches raw NFT data from all networks without processing</Text>
      
      {/* Input section */}
      <HStack mb={6}>
        <Input
          placeholder="Enter wallet address, ENS or Unstoppable Domain"
          value={walletInput}
          onChange={handleInputChange}
          isDisabled={isLoading}
          width="full"
        />
        <Button
          leftIcon={<FaPlus />}
          colorScheme="blue"
          onClick={fetchWalletNFTs}
          isLoading={isLoading}
          loadingText="Fetching..."
        >
          Fetch NFTs
        </Button>
      </HStack>
      
      {/* Error message */}
      {error && (
        <Alert status="error" mb={4}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {/* Results section */}
      {Object.keys(rawResponses).length > 0 && (
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Heading size="md">Raw API Responses</Heading>
            <Button
              leftIcon={<FaDownload />}
              colorScheme="green"
              size="sm"
              onClick={downloadResponses}
            >
              Download JSON
            </Button>
          </HStack>
          
          {/* Response summary */}
          {NETWORKS.map(network => {
            const response = rawResponses[network];
            const isExpanded = expandedNetwork === network;
            
            if (!response) return null;
            
            const hasError = response.error;
            const nftCount = response.nfts ? response.nfts.length : 0;
            
            return (
              <Box 
                key={network}
                borderWidth="1px"
                borderRadius="md"
                p={4}
                bg={hasError ? "red.50" : "gray.50"}
              >
                <HStack justify="space-between">
                  <Text fontWeight="bold">
                    {network.toUpperCase()}: {hasError ? "Error" : `${nftCount} NFTs found`}
                  </Text>
                  <IconButton
                    icon={isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleNetwork(network)}
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  />
                </HStack>
                
                <Collapse in={isExpanded} animateOpacity>
                  <Box 
                    mt={4} 
                    p={3} 
                    borderWidth="1px" 
                    borderRadius="md"
                    bg="gray.100"
                    overflow="auto"
                    maxHeight="300px"
                  >
                    <Code
                      display="block"
                      whiteSpace="pre"
                      fontSize="xs"
                      overflowX="auto"
                    >
                      {JSON.stringify(response, null, 2)}
                    </Code>
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </VStack>
      )}
      
      {isLoading && (
        <Box textAlign="center" my={8}>
          <Spinner size="xl" />
          <Text mt={4}>Fetching NFT data from all networks...</Text>
        </Box>
      )}
    </Box>
  );
};

export default NFTDebugger;