// src/components/ProfilePage.js
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
  Text
} from "@chakra-ui/react";
import UserProfile from './UserProfile';
import WalletManager from './WalletManager';
import { useAppContext } from '../../context/app/AppContext';
import { useCustomToast } from '../utils/toastUtils';
import { StyledButton, StyledCard, StyledContainer } from '../styles/commonStyles';
import { useCustomColorMode } from '../hooks/useColorMode';
import { selectTotalNFTs, selectTotalSpamNFTs } from '../redux/slices/nftSlice';
import { FaSave } from 'react-icons/fa';

const ProfileStats = () => {
  const totalArtifacts = useSelector(selectTotalNFTs);
  const spamArtifacts = useSelector(selectTotalSpamNFTs);
  const catalogs = useSelector(state => state.catalogs.items);
  const { cardBg, borderColor, textColor } = useCustomColorMode();
  
  // Calculate total user catalogs (excluding system catalogs)
  const catalogCount = Object.keys(catalogs || {}).length;

  return (
    <VStack spacing={6} align="stretch">
      <StatGroup 
        display="grid" 
        gridTemplateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
        gap={6}
      >
        <Stat
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="12px"
          p={6}
        >
          <StatLabel 
            fontSize="sm" 
            fontFamily="Inter" 
            color="var(--ink-grey)"
            mb={2}
          >
            Total Artifacts
          </StatLabel>
          <StatNumber 
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily="Space Grotesk"
            color={textColor}
          >
            {totalArtifacts || 0}
          </StatNumber>
        </Stat>

        <Stat
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="12px"
          p={6}
        >
          <StatLabel 
            fontSize="sm" 
            fontFamily="Inter" 
            color="var(--ink-grey)"
            mb={2}
          >
            Catalogs
          </StatLabel>
          <StatNumber 
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily="Space Grotesk"
            color={textColor}
          >
            {catalogCount || 0}
          </StatNumber>
        </Stat>

        <Stat
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="12px"
          p={6}
        >
          <StatLabel 
            fontSize="sm" 
            fontFamily="Inter" 
            color="var(--ink-grey)"
            mb={2}
          >
            Spam Artifacts
          </StatLabel>
          <StatNumber 
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily="Space Grotesk"
            color={textColor}
          >
            {spamArtifacts || 0}
          </StatNumber>
        </Stat>
      </StatGroup>
    </VStack>
  );
};

const ProfilePage = () => {
  const { userProfile } = useAppContext();
  const { showSuccessToast } = useCustomToast();
  const { cardBg, borderColor, textColor } = useCustomColorMode();

  const handleSaveProfile = () => {
    showSuccessToast("Profile Saved", "Your profile has been updated successfully.");
  };

  return (
    <StyledContainer>
      <VStack spacing={8} align="stretch">
        <Flex 
          justify="space-between" 
          align="center" 
          direction={{ base: "column", sm: "row" }}
          gap={4}
        >
          <Text
            as="h1"
            fontSize={{ base: "24px", md: "32px" }}
            fontFamily="Space Grotesk"
            letterSpacing="-0.02em"
            color={textColor}
            mb={8}
          >
            Your Profile
          </Text>
          {userProfile.nickname && (
            <StyledButton
              onClick={handleSaveProfile}
              leftIcon={<FaSave />}
            >
              Save Profile
            </StyledButton>
          )}
        </Flex>

        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="12px"
          overflow="hidden"
          width="100%"
        >
          <Tabs variant="enclosed" width="auto">
            <TabList
              bg="var(--paper-white)"
              borderBottom="1px solid"
              borderColor={borderColor}
              width="fit-content"
            >
              <Tab
                fontFamily="Inter"
                fontSize="14px"
                color="var(--ink-grey)"
                bg="transparent"
                _selected={{
                  bg: cardBg,
                  color: "var(--warm-brown)",
                  borderColor: borderColor,
                  borderBottomColor: cardBg
                }}
              >
                User Profile
              </Tab>
              <Tab
                fontFamily="Inter"
                fontSize="14px"
                color="var(--ink-grey)"
                bg="transparent"
                _selected={{
                  bg: cardBg,
                  color: "var(--warm-brown)",
                  borderColor: borderColor,
                  borderBottomColor: cardBg
                }}
              >
                Manage Wallets
              </Tab>
              <Tab
                fontFamily="Inter"
                fontSize="14px"
                color="var(--ink-grey)"
                bg="transparent"
                _selected={{
                  bg: cardBg,
                  color: "var(--warm-brown)",
                  borderColor: borderColor,
                  borderBottomColor: cardBg
                }}
              >
                Profile Stats
              </Tab>
            </TabList>
            <TabPanels>
              <TabPanel p={6}>
                <UserProfile />
              </TabPanel>
              <TabPanel p={6}>
                <WalletManager />
              </TabPanel>
              <TabPanel p={6}>
                <ProfileStats />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </StyledContainer>
  );
};

export default ProfilePage;