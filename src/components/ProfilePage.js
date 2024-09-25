import React, { useState, useCallback } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, useColorModeValue, Button, useToast, Text } from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';

const ProfilePage = ({ initialWallets = [], initialUserProfile = {}, updateGlobalState, onWalletsUpdate }) => {
  const [wallets, setWallets] = useState(initialWallets);
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();

  const handleUpdateWallets = useCallback((newWallets) => {
    console.log('Updating wallets:', newWallets);
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
      <Heading as="h1" size={{ base: "xl", md: "2xl" }} mb={6}>Your Profile</Heading>
      <Tabs variant="enclosed">
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
            />
          </TabPanel>
        </TabPanels>
      </Tabs>
      <Button onClick={handleSaveProfile} colorScheme="green" mt={4}>Save Profile</Button>
      {/* Debug information */}
      <Box mt={4}>
        <Text>Debug Info:</Text>
        <Text>Wallet Count: {wallets.length}</Text>
        <Text>User Profile: {JSON.stringify(userProfile)}</Text>
      </Box>
    </Box>
  );
};

export default ProfilePage;