import React from 'react';
import { useSelector } from 'react-redux';
import { 
  Heading, 
  Tabs, 
  TabList, 
  TabPanels, 
  Tab, 
  TabPanel, 
  Text,
  Flex
} from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';
import { useAppContext } from '../context/AppContext';
import { useCustomToast } from '../utils/toastUtils';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import { useResponsive } from '../hooks/useResponsive';

const ProfilePage = () => {
  const { userProfile, updateUserProfile } = useAppContext();
  const { showSuccessToast } = useCustomToast();
  const { buttonSize, headingSize } = useResponsive();
  const wallets = useSelector(state => state.wallets.wallets);

  const handleSaveProfile = () => {
    showSuccessToast("Profile Saved", "Your profile has been updated successfully.");
  };

  return (
    <StyledContainer>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h1" size={headingSize}>Your Profile</Heading>
        <StyledButton 
          onClick={handleSaveProfile} 
          size={buttonSize}
        >
          Save Profile
        </StyledButton>
      </Flex>
        
      <StyledCard>
        <Tabs variant="enclosed" size={buttonSize}>
          <TabList>
            <Tab>User Profile</Tab>
            <Tab>Manage Wallets</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <UserProfile />
            </TabPanel>
            <TabPanel>
              <WalletManager />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </StyledCard>

      <StyledCard title="Debug Info" mt={6}>
        <Text fontSize="sm">Wallet Count: {wallets ? wallets.length : 0}</Text>
        <Text fontSize="sm">User Nickname: {userProfile?.nickname || 'Not set'}</Text>
      </StyledCard>
    </StyledContainer>
  );
};

export default ProfilePage;