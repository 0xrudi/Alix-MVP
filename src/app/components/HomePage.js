import React, { useState } from 'react';
import { Box, Heading, Text, VStack, Button, Input, InputGroup, InputRightElement, useColorModeValue, SimpleGrid, useToast, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { searchNFTs } from '../utils/zoraUtils';
import NFTCard from './NFTCard';
import { logger } from '../utils/logger';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const navigate = useNavigate();
  const toast = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query is empty",
        description: "Please enter a search term",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      logger.log('Initiating search with query:', searchQuery);
      const results = await searchNFTs(searchQuery);
      logger.log('Search results:', results);
      setSearchResults(results);
      if (results.length === 0) {
        setSearchError("No results found. Try a different search term.");
      }
    } catch (error) {
      logger.error('Error during search:', error);
      setSearchError(error.message || "An unexpected error occurred while searching. Please try again.");
      toast({
        title: "Search failed",
        description: error.message || "An unexpected error occurred",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNFTClick = (nft) => {
    navigate('/artifact', { state: { nft, isSearchResult: true } });
  };

  const handleAddToCatalog = (nft) => {
    navigate('/library', { state: { addToCatalog: nft } });
  };

  return (
    <Box bg={bgColor} minHeight="100vh" py={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 4, md: 8 }} align="stretch" maxWidth="container.xl" margin="auto">
        <Heading as="h1" size={{ base: "xl", md: "2xl" }} mb={{ base: 2, md: 6 }}>Welcome to Alix</Heading>
        <Text fontSize={{ base: "md", md: "xl" }}>
          Your personal Web3 organizing application for managing NFTs and digital assets.
        </Text>
        
        <InputGroup size="lg">
          <Input
            pr="4.5rem"
            type="text"
            placeholder="Search for NFTs or collections"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleSearch} isLoading={isSearching}>
              <FaSearch />
            </Button>
          </InputRightElement>
        </InputGroup>

        {searchError && (
          <Alert status="error">
            <AlertIcon />
            <AlertTitle mr={2}>Search Error</AlertTitle>
            <AlertDescription>{searchError}</AlertDescription>
          </Alert>
        )}

        {searchResults.length > 0 && (
          <Box>
            <Heading as="h2" size="lg" mb={4}>Search Results</Heading>
            <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={6}>
              {searchResults.map((nft) => (
                <NFTCard
                  key={`${nft.contract?.address}-${nft.id?.tokenId}`}
                  nft={nft}
                  onClick={() => handleNFTClick(nft)}
                  isSearchResult={true}
                  onAddToCatalog={() => handleAddToCatalog(nft)}
                />
              ))}
            </SimpleGrid>
          </Box>
        )}

        <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="md" boxShadow="md">
          <Heading as="h2" size={{ base: "md", md: "lg" }} mb={{ base: 2, md: 4 }}>Quick Actions</Heading>
          <VStack spacing={{ base: 2, md: 4 }} align="stretch">
            <Button 
              colorScheme="blue" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/library?tab=nfts')}
            >
              View My Artifacts
            </Button>
            <Button 
              colorScheme="green" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/library?tab=catalogs')}
            >
              Create a New Catalog
            </Button>
            <Button 
              colorScheme="purple" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/profile?tab=wallets')}
            >
              Manage Wallets
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default HomePage;