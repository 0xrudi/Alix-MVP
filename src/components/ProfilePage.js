import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  useColorModeValue, 
  Button, 
  useToast, 
  Text, 
  useBreakpointValue,
  VStack,
  HStack,
  Flex
} from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';
import { logger } from '../utils/logger';

const ProfilePage = ({ initialWallets = [], initialUserProfile = {}, updateGlobalState, onWalletsUpdate }) => {
  const [wallets, setWallets] = useState(initialWallets);
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const tableSize = useBreakpointValue({ base: "sm", md: "md" });
  const toast = useToast();

  const handleUpdateWallets = useCallback((newWallets) => {
    logger.log('Updating wallets:', newWallets);
    setWallets(newWallets);
    // Ensure we're passing an array of wallet objects, not just addresses
    const newWalletAddresses = newWallets.filter(newWallet => 
      !initialWallets.some(oldWallet => oldWallet.address === newWallet.address)
    ).map(wallet => wallet.address);
    
    if (newWalletAddresses.length > 0 && onWalletsUpdate) {
      onWalletsUpdate(newWalletAddresses);
    }
  }, [initialWallets, onWalletsUpdate]);

  const handleUpdateUserProfile = useCallback((newProfile) => {
    setUserProfile(newProfile);
  }, []);

  const handleSaveProfile = useCallback(() => {
    updateGlobalState({ wallets, userProfile });
    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }, [wallets, userProfile, updateGlobalState, toast]);

  return (
    <Box bg={bgColor} minHeight="100vh" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
      <VStack spacing={6} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading as="h1" size={{ base: "xl", md: "2xl" }}>Your Profile</Heading>
          <Button 
            onClick={handleSaveProfile} 
            colorScheme="green" 
            size={useBreakpointValue({ base: "sm", md: "md" })}
          >
            Save Profile
          </Button>
        </Flex>
        
        <Box bg={cardBg} borderRadius="lg" overflow="hidden" boxShadow="md">
          <Tabs variant="enclosed" size={useBreakpointValue({ base: "sm", md: "md" })}>
            <TabList>
              <Tab>User Profile</Tab>
              <Tab>Manage Wallets</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <UserProfile 
                  wallets={wallets} 
                  updateUserProfile={handleUpdateUserProfile} 
                />
              </TabPanel>
              <TabPanel>
                <WalletManager 
                  wallets={wallets} 
                  updateWallets={handleUpdateWallets}
                  tableSize={tableSize}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>

        {/* Debug information */}
        <Box bg={cardBg} p={4} borderRadius="md" boxShadow="sm">
          <Heading as="h3" size="sm" mb={2}>Debug Info:</Heading>
          <Text fontSize="sm">Wallet Count: {wallets.length}</Text>
          <Text fontSize="sm" noOfLines={3}>User Profile: {JSON.stringify(userProfile)}</Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default ProfilePage;