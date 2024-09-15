import React from 'react';
import { Box, Heading, VStack, useColorModeValue } from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';

const ProfilePage = ({ wallets, setWallets, setNfts }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  return (
    <Box bg={bgColor} minHeight="100vh" py={{ base: 4, md: 8 }}>
      <VStack spacing={{ base: 4, md: 8 }} align="stretch" maxWidth="container.xl" margin="auto">
        <Heading as="h1" size={{ base: "xl", md: "2xl" }}>Your Profile</Heading>
        <UserProfile wallets={wallets} />
        <WalletManager 
          wallets={wallets} 
          setWallets={setWallets} 
          setNfts={setNfts}
        />
      </VStack>
    </Box>
  );
};

export default ProfilePage;