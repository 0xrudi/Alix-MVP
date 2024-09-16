import React, { useState } from 'react';
import { Box, Heading, Tabs, TabList, TabPanels, Tab, TabPanel, useColorModeValue, Button, useToast } from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';

const ProfilePage = ({ initialWallets = [], initialUserProfile = {}, updateGlobalState }) => {
  const [wallets, setWallets] = useState(initialWallets);
  const [userProfile, setUserProfile] = useState(initialUserProfile);
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const toast = useToast();

  const handleUpdateWallets = (newWallets) => {
    setWallets(newWallets);
  };

  const handleUpdateUserProfile = (newProfile) => {
    setUserProfile(newProfile);
  };

  const handleSaveProfile = () => {
    updateGlobalState({ wallets, userProfile });
    toast({
      title: "Profile Saved",
      description: "Your profile has been updated successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

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
    </Box>
  );
};

export default ProfilePage;