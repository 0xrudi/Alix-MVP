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

  // Calculate total user catalogs (excluding system catalogs)
  const catalogCount = Object.keys(catalogs || {}).length;

  return (
    <VStack spacing={6} align="stretch">
      <StatGroup>
        <Stat>
          <StatLabel fontSize="1rem">Total Artifacts</StatLabel>
          <StatNumber fontSize="2xl">{totalArtifacts || 0}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel fontSize="1rem">Catalogs</StatLabel>
          <StatNumber fontSize="2xl">{catalogCount || 0}</StatNumber>
        </Stat>

        <Stat>
          <StatLabel fontSize="1rem">Spam Artifacts</StatLabel>
          <StatNumber fontSize="2xl">{spamArtifacts || 0}</StatNumber>
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
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size={headingSize}>Your Profile</Heading>
        {userProfile.nickname && (
          <StyledButton 
            onClick={handleSaveProfile} 
            size={buttonSize}
          >
            Save Profile
          </StyledButton>
        )}
      </Flex>
        
      <Box maxW="600px">
        <StyledCard>
          <Tabs variant="enclosed" size={buttonSize}>
            <TabList>
              <Tab>User Profile</Tab>
              <Tab>Manage Wallets</Tab>
              <Tab>Profile Stats</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <UserProfile />
              </TabPanel>
              <TabPanel>
                <WalletManager />
              </TabPanel>
              <TabPanel>
                <ProfileStats />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </StyledCard>
      </Box>
    </StyledContainer>
  );
};

export default ProfilePage;