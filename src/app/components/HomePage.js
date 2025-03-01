import React, { useState } from 'react';
import { Box, Heading, Text, VStack, Button, Input, InputGroup, InputRightElement, useColorModeValue, SimpleGrid, useToast, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import { searchNFTs } from '../../utils/zoraUtils';
import NFTCard from './NFTCard';
import { logger } from '../../utils/logger';

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
    <Box width="100%" maxWidth="100%" mx="auto">
      <VStack 
        spacing={{ base: 4, md: 8 }} 
        align="stretch" 
        width="100%"
        px={{ base: 4, md: 6 }}
        py={{ base: 4, md: 8 }}
      >
        <Heading as="h1" size={{ base: "xl", md: "2xl" }} textAlign="center">
          Welcome to Alix
        </Heading>
        
        <Text fontSize={{ base: "md", md: "xl" }} textAlign="center">
          Your personal Web3 organizing application for managing NFTs and digital assets.
        </Text>
        
        <InputGroup size="lg" maxWidth="600px" mx="auto" width="100%">
          <Input
            pr="4.5rem"
            type="text"
            placeholder="Search for NFTs or collections"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleSearch}>
              <FaSearch />
            </Button>
          </InputRightElement>
        </InputGroup>

        <Box 
          bg={cardBg} 
          p={{ base: 4, md: 6 }} 
          borderRadius="md" 
          boxShadow="md"
          width="100%"
          maxWidth="600px"
          mx="auto"
        >
          <Heading as="h2" size={{ base: "md", md: "lg" }} mb={{ base: 2, md: 4 }} textAlign="center">
            Quick Actions
          </Heading>
          <VStack spacing={{ base: 2, md: 4 }} align="stretch">
            <Button 
              colorScheme="blue" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/library?tab=nfts')}
              width="100%"
            >
              View My Artifacts
            </Button>
            <Button 
              colorScheme="green" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/library?tab=catalogs')}
              width="100%"
            >
              Create a New Catalog
            </Button>
            <Button 
              colorScheme="purple" 
              size={{ base: "md", md: "lg" }}
              onClick={() => navigate('/profile?tab=wallets')}
              width="100%"
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