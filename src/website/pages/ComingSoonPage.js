// src/website/pages/ComingSoonPage.js
import React from 'react';
import { Box, Button, Heading, Text } from "@chakra-ui/react";
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComingSoonPage = ({ title }) => {
  const navigate = useNavigate();
  
  return (
    <Box minH="100vh" display="flex" flexDir="column" alignItems="center" justifyContent="center" bg="gray.50">
      <Box textAlign="center" p={8}>
        <Heading mb={4} size="xl">{title}</Heading>
        <Text color="gray.600" mb={8}>Coming Soon</Text>
        <Button 
          variant="outline"
          onClick={() => navigate('/')}
          leftIcon={<ArrowLeft size={16} />}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
};

export default ComingSoonPage;