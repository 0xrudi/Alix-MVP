import React from 'react';
import { Box, Heading, Text, VStack, Button, useColorModeValue } from "@chakra-ui/react";

const HomePage = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');

  return (
    <Box bg={bgColor} minHeight="100vh" py={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 4, md: 8 }} align="stretch" maxWidth="container.xl" margin="auto">
        <Heading as="h1" size={{ base: "xl", md: "2xl" }} mb={{ base: 2, md: 6 }}>Welcome to Alix</Heading>
        <Text fontSize={{ base: "md", md: "xl" }}>
          Your personal Web3 organizing application for managing NFTs and digital assets.
        </Text>
        <Box bg={cardBg} p={{ base: 4, md: 6 }} borderRadius="md" boxShadow="md">
          <Heading as="h2" size={{ base: "md", md: "lg" }} mb={{ base: 2, md: 4 }}>Quick Actions</Heading>
          <VStack spacing={{ base: 2, md: 4 }} align="stretch">
            <Button colorScheme="blue" size={{ base: "md", md: "lg" }}>View My NFTs</Button>
            <Button colorScheme="green" size={{ base: "md", md: "lg" }}>Create a New Catalog</Button>
            <Button colorScheme="purple" size={{ base: "md", md: "lg" }}>Manage Wallets</Button>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default HomePage;