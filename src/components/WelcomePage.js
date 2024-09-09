import React from 'react';
import { Box, Heading, Button } from "@chakra-ui/react";

const WelcomePage = ({ onStart }) => {
  return (
    <Box textAlign="center">
      <Heading as="h1" size="xl" mb={8}>Welcome to Alix</Heading>
      <Button colorScheme="blue" size="lg" onClick={onStart}>
        Begin Onboarding
      </Button>
    </Box>
  );
};

export default WelcomePage;