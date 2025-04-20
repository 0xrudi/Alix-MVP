// src/components/NFTRawDataPage.js
import React, { useState } from 'react';
import { 
  Box, 
  Container,
  Heading, 
  Text, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel,
  VStack,
  Link as ChakraLink,
  Code,
  Button,
  useColorModeValue
} from "@chakra-ui/react";
import { Link } from 'react-router-dom';
import NFTDebugger from './NFTDebugger';
import NFTDataTester from './NFTDataTester';

/**
 * A test page that combines our NFT data inspection tools
 * This allows us to explore and analyze raw NFT data before implementing
 * more sophisticated processing
 */
const NFTRawDataPage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box bg={cardBg} p={6} borderRadius="lg" boxShadow="sm">
          <Heading as="h1" size="xl" mb={2}>NFT Raw Data Analysis</Heading>
          <Text fontSize="lg" color="gray.600" mb={4}>
            Tools for exploring and analyzing raw NFT data from different sources
          </Text>
          
          <Text mb={4}>
            This page contains tools for examining the raw NFT data returned by APIs before
            any processing occurs. This helps us understand the data structure and plan how to
            best handle the metadata in our application.
          </Text>
          
          <Box as="ul" pl={5} mt={2} spacing={1}>
            <Text as="li" display="list-item">
              See the exact format of NFT data as returned by APIs
            </Text>
            <Text as="li" display="list-item">
              Analyze the structure of metadata across different networks
            </Text>
            <Text as="li" display="list-item">
              Download raw data as JSON for further analysis
            </Text>
            <Text as="li" display="list-item">
              Test how different NFTs are represented across networks
            </Text>
          </Box>
          
          <ChakraLink as={Link} to="/app/library" color="blue.500" mt={4} display="inline-block">
            ← Return to Library
          </ChakraLink>
        </Box>
        
        <Tabs variant="enclosed-colored" colorScheme="blue" bg={cardBg} borderRadius="lg" boxShadow="sm">
          <TabList mx={4} mt={4}>
            <Tab>Data Tester</Tab>
            <Tab>NFT Debugger</Tab>
            <Tab>Tech Notes</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <NFTDataTester />
            </TabPanel>
            
            <TabPanel>
              <NFTDebugger />
            </TabPanel>
            
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="lg">Technical Notes</Heading>
                
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Heading size="md" mb={3}>Data Structure</Heading>
                  <Text mb={3}>
                    NFT data typically contains these key components across different networks:
                  </Text>
                  
                  <Box as="ul" pl={5} mt={2} spacing={1}>
                    <Text as="li" display="list-item">
                      <Code>id</Code> - Object containing token identifier information
                    </Text>
                    <Text as="li" display="list-item">
                      <Code>contract</Code> - Information about the NFT's contract
                    </Text>
                    <Text as="li" display="list-item">
                      <Code>metadata</Code> - The token's metadata (can be a string or object)
                    </Text>
                    <Text as="li" display="list-item">
                      <Code>media</Code> - Array of media resources associated with the NFT
                    </Text>
                    <Text as="li" display="list-item">
                      <Code>title</Code> - The NFT's name or title
                    </Text>
                  </Box>
                </Box>
                
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Heading size="md" mb={3}>Metadata Variations</Heading>
                  <Text mb={3}>
                    NFT metadata can vary significantly between collections and networks:
                  </Text>
                  
                  <Box as="ul" pl={5} mt={2} spacing={1}>
                    <Text as="li" display="list-item">
                      Sometimes <Code>metadata</Code> is a JSON string that needs parsing
                    </Text>
                    <Text as="li" display="list-item">
                      Media URLs can be in <Code>metadata.image</Code>, <Code>media[0].gateway</Code>, or other places
                    </Text>
                    <Text as="li" display="list-item">
                      IPFS URLs may need conversion from <Code>ipfs://</Code> format
                    </Text>
                    <Text as="li" display="list-item">
                      Attributes can be in various formats and locations
                    </Text>
                  </Box>
                </Box>
                
                <Box p={4} borderWidth="1px" borderRadius="md">
                  <Heading size="md" mb={3}>Using Console</Heading>
                  <Text mb={3}>
                    For the most detailed analysis, check your browser's development console:
                  </Text>
                  
                  <Box bg="gray.100" p={3} borderRadius="md" fontSize="sm" fontFamily="monospace">
                    1. Open developer tools (F12 or Ctrl+Shift+I / Cmd+Option+I)<br/>
                    2. Go to the Console tab<br/>
                    3. Look for logs starting with "Raw NFT Response" or "Sample NFT structure"
                  </Box>
                  
                  <Text mt={3}>
                    These console logs contain detailed information about the structure of 
                    the NFT data, which helps when planning our database schema and processing logic.
                  </Text>
                </Box>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default NFTRawDataPage;