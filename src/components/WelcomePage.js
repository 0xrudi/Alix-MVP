import React from 'react';
import { Box, Heading, Button, VStack } from "@chakra-ui/react";

const WelcomePage = ({ onStart }) => {
  return (
    <Box 
      height="100vh" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      bg="gray.50"
    >
      <VStack spacing={8}>
        <Heading 
          as="h1" 
          size={["xl", "2xl", "3xl"]} 
          textAlign="center"
          color="blue.600"
        >
          Welcome to Alix
        </Heading>
        <Button 
          colorScheme="blue" 
          size="lg" 
          onClick={onStart}
          fontSize={["md", "lg", "xl"]}
          py={[4, 6, 8]}
          px={[8, 10, 12]}
        >
          Begin
        </Button>
      </VStack>
    </Box>
  );
};

export default WelcomePage;