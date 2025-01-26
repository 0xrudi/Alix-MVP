import React from 'react';
import { useSelector } from 'react-redux';
import { 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Flex,
  Box,
  StatGroup,
  Stat,
  StatLabel,
  StatNumber,
  VStack,
} from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';
import { useAppContext } from '../context/AppContext';
import { useCustomToast } from '../utils/toastUtils';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import { useResponsive } from '../hooks/useResponsive';
import { selectTotalNFTs, selectTotalSpamNFTs } from '../redux/slices/nftSlice';

const ProfileStats = () => {
  const totalArtifacts = useSelector(selectTotalNFTs);
  const spamArtifacts = useSelector(selectTotalSpamNFTs);
  const catalogs = useSelector(state => state.catalogs.items);
  const catalogCount = Object.keys(catalogs || {}).length;

  return (
    <VStack spacing={4} align="stretch" width="100%">
      <StatGroup 
        display="grid" 
        gridTemplateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
        gap={4}
      >
        <Stat>
          <StatLabel fontSize="1rem">Total Artifacts</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{totalArtifacts || 0}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel fontSize="1rem">Catalogs</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{catalogCount || 0}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel fontSize="1rem">Spam Artifacts</StatLabel>
          <StatNumber fontSize={{ base: "xl", md: "2xl" }}>{spamArtifacts || 0}</StatNumber>
        </Stat>
      </StatGroup>
    </VStack>
  );
};

const ProfilePage = () => {
  const { userProfile, updateUserProfile } = useAppContext();
  const { showSuccessToast } = useCustomToast();
  const { buttonSize, headingSize } = useResponsive();

  const handleSaveProfile = () => {
    showSuccessToast("Profile Saved", "Your profile has been updated successfully.");
  };

  return (
    <StyledContainer>
      <VStack spacing={4} align="stretch" width="100%">
        <Flex 
          justify="space-between" 
          align="center" 
          direction={{ base: "column", sm: "row" }}
          gap={2}
          width="100%"
        >
          <Heading as="h1" size={headingSize}>Your Profile</Heading>
          {userProfile.nickname && (
            <StyledButton 
              onClick={handleSaveProfile} 
              size={buttonSize}
              width={{ base: "100%", sm: "auto" }}
            >
              Save Profile
            </StyledButton>
          )}
        </Flex>
        
        <Box width="100%">
          <StyledCard>
            <Tabs 
              variant="enclosed" 
              size={buttonSize}
              width="100%"
              isFitted
            >
              <TabList>
                <Tab>User Profile</Tab>
                <Tab>Manage Wallets</Tab>
                <Tab>Profile Stats</Tab>
              </TabList>
              <TabPanels>
                <TabPanel px={{ base: 2, md: 4 }} py={4}>
                  <UserProfile />
                </TabPanel>
                <TabPanel px={{ base: 2, md: 4 }} py={4}>
                  <WalletManager />
                </TabPanel>
                <TabPanel px={{ base: 2, md: 4 }} py={4}>
                  <ProfileStats />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </StyledCard>
        </Box>
      </VStack>
    </StyledContainer>
  );
};

export default ProfilePage;