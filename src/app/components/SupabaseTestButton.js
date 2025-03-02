// src/components/SupabaseTestButton.js
import React, { useState } from 'react';
import { Button, Text, VStack, useToast, Box } from '@chakra-ui/react';
import { useServices } from '../../services/service-provider';

const SupabaseTestButton = () => {
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  let services;
  
  try {
    services = useServices();
  } catch (error) {
    return (
      <Box p={4} borderWidth="1px" borderRadius="md" bg="red.50" color="red.500">
        <Text>ServiceProvider not available. Make sure this component is within a ServiceProvider.</Text>
      </Box>
    );
  }
  
  const { userService, walletService } = services;

  const runTest = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      // Get current user
      const user = services.user;
      
      if (!user) {
        toast({
          title: "Error",
          description: "No user logged in",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setIsLoading(false);
        return;
      }
      
      // Try to get user profile
      const userProfile = await userService.getProfile(user.id);
      
      setTestResult({
        success: true,
        message: "Supabase connection successful!",
        data: {
          userId: user.id,
          profile: userProfile
        }
      });
      
      toast({
        title: "Success",
        description: "Supabase connection test successful",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Supabase test failed:", error);
      setTestResult({
        success: false,
        message: `Error: ${error.message}`,
        error: error
      });
      
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VStack spacing={4} align="stretch" p={4} borderWidth="1px" borderRadius="md">
      <Text fontWeight="bold">Supabase Integration Test</Text>
      <Button 
        colorScheme="blue" 
        onClick={runTest}
        isLoading={isLoading}
      >
        Test Supabase Connection
      </Button>
      
      {testResult && (
        <Box 
          p={3} 
          borderRadius="md" 
          bg={testResult.success ? "green.50" : "red.50"}
          color={testResult.success ? "green.600" : "red.600"}
        >
          <Text fontWeight="bold">{testResult.message}</Text>
          {testResult.success && (
            <Text fontSize="sm" mt={2}>
              Connected as: {testResult.data.userId}
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );
};

export default SupabaseTestButton;