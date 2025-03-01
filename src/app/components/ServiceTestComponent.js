// src/components/ServiceTestComponent.js
import React, { useEffect, useState } from 'react';
import { 
  Box, 
  VStack, 
  Heading, 
  Text, 
  Button,
  Badge,
  useToast
} from "@chakra-ui/react";
import { useServices } from '../../services/service-provider';
import { useCustomColorMode } from '../hooks/useColorMode';

const ServiceTestComponent = () => {
  const { user, userService, walletService } = useServices();
  const [profile, setProfile] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { cardBg, borderColor } = useCustomColorMode();
  const toast = useToast();

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Try to get user profile
        const userProfile = await userService.getProfile(user.id);
        setProfile(userProfile);
        
        // Try to get wallets
        const userWallets = await walletService.getUserWallets(user.id);
        setWallets(userWallets);
      } catch (error) {
        console.error('Error loading profile data:', error);
        toast({
          title: 'Error loading data',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userService, walletService, toast]);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Supabase Service Test</Heading>
        
        {loading ? (
          <Text>Loading data...</Text>
        ) : (
          <>
            <Box p={4} borderWidth="1px" borderRadius="md" bg={cardBg} borderColor={borderColor}>
              <Heading size="md" mb={4}>User Profile</Heading>
              {profile ? (
                <VStack align="start" spacing={2}>
                  <Text><strong>ID:</strong> {profile.id}</Text>
                  <Text><strong>Nickname:</strong> {profile.nickname || 'Not set'}</Text>
                  <Text><strong>Avatar:</strong> {profile.avatar_url ? 'Set' : 'Not set'}</Text>
                  <Text><strong>Created:</strong> {new Date(profile.created_at).toLocaleString()}</Text>
                </VStack>
              ) : (
                <Text>No profile data available</Text>
              )}
            </Box>

            <Box p={4} borderWidth="1px" borderRadius="md" bg={cardBg} borderColor={borderColor}>
              <Heading size="md" mb={4}>Wallets</Heading>
              {wallets.length > 0 ? (
                <VStack align="stretch" spacing={3}>
                  {wallets.map(wallet => (
                    <Box 
                      key={wallet.id} 
                      p={3} 
                      borderWidth="1px" 
                      borderRadius="md"
                      borderColor={borderColor}
                    >
                      <Text><strong>Address:</strong> {wallet.address}</Text>
                      <Text><strong>Nickname:</strong> {wallet.nickname || 'None'}</Text>
                      <Badge colorScheme={wallet.type === 'evm' ? 'blue' : 'purple'}>
                        {wallet.type.toUpperCase()}
                      </Badge>
                    </Box>
                  ))}
                </VStack>
              ) : (
                <Text>No wallets found</Text>
              )}
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default ServiceTestComponent;