import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Heading, 
  Flex,
  Box,
  VStack,
  Text,
  Spinner,
  Avatar,
  Button,
  Divider,
  HStack,
  IconButton,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Badge,
  SimpleGrid,
  Circle,
  Select,
  Alert,
  AlertIcon,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Input,
  InputGroup,
  InputRightElement,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useDisclosure,
  Collapse,
  Portal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip
} from "@chakra-ui/react";
import { 
  FaUser, 
  FaCog, 
  FaLink, 
  FaChartBar, 
  FaChevronRight,
  FaArrowLeft,
  FaWallet,
  FaPlus,
  FaLayerGroup,
  FaFolderOpen,
  FaTrash,
  FaTags,
  FaCubes,
  FaEthereum,
  FaNetworkWired,
  FaSearch,
  FaChevronDown,
  FaEdit,
  FaInfoCircle,
  FaCamera,
  FaPencilAlt,
  FaChevronUp,
  FaImage,
  FaExclamationTriangle
} from 'react-icons/fa';

import { useAppContext } from '../../context/app/AppContext';
import { useCustomToast } from '../../utils/toastUtils';
import { StyledContainer } from '../styles/commonStyles';
import { useCustomColorMode } from '../hooks/useColorMode';
import { useResponsive } from '../hooks/useResponsive';
import { selectTotalNFTs, selectTotalSpamNFTs } from '../redux/slices/nftSlice';
import { selectAllCatalogs, selectUserCatalogs, selectSystemCatalogs } from '../redux/slices/catalogSlice';
import { selectAllFolders } from '../redux/slices/folderSlice';
import { useServices } from '../../services/service-provider';
import { loadWallets, addWalletAndFetchNFTs } from '../redux/thunks/walletThunks';
import { isValidAddress, resolveENS, resolveUnstoppableDomain } from '../../utils/web3Utils';
import { logger } from '../../utils/logger';

/**
 * Enhanced ProfilePage component with refined UI interactions
 */
const ProfilePage = () => {
  const dispatch = useDispatch();
  const { userProfile } = useAppContext();
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { cardBg, borderColor, textColor } = useCustomColorMode();
  const { buttonSize, isMobile, showFullText } = useResponsive();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Current view state (profile, accounts, stats)
  const [currentView, setCurrentView] = useState('profile');
  
  // Wallet management states
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddWallet, setShowAddWallet] = useState(false);
  const [walletsExpanded, setWalletsExpanded] = useState(true);
  
  // Profile management states with refinements per feedback
  const [showUsernameEdit, setShowUsernameEdit] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [showProfilePicEdit, setShowProfilePicEdit] = useState(false);
  const [isEditingProfilePic, setIsEditingProfilePic] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState('');
  
  // States for wallet management
  const [isEditingWalletNickname, setIsEditingWalletNickname] = useState(null);
  const [newWalletNickname, setNewWalletNickname] = useState('');
  const [expandedWalletId, setExpandedWalletId] = useState(null);
  
  // Wallet deletion confirmation
  const [walletToDelete, setWalletToDelete] = useState(null);
  const { isOpen: isDeleteModalOpen, onOpen: openDeleteModal, onClose: closeDeleteModal } = useDisclosure();
  
  // Stats page time filter
  const [timeFilter, setTimeFilter] = useState('all');
  
  // Redux selectors
  const totalArtifacts = useSelector(selectTotalNFTs);
  const spamArtifacts = useSelector(selectTotalSpamNFTs);
  const allCatalogs = useSelector(selectAllCatalogs);
  const userCatalogs = useSelector(selectUserCatalogs);
  const systemCatalogs = useSelector(selectSystemCatalogs);
  const folders = useSelector(selectAllFolders);
  const wallets = useSelector(state => state.wallets.list);
  const nftsByWallet = useSelector(state => state.nfts.byWallet);
  
  // Supabase integration
  const { user, userService, walletService } = useServices();
  const [supabaseProfile, setSupabaseProfile] = useState(null);
  const [error, setError] = useState(null);
  
  // Networks for wallet fetching
  const networks = ['eth', 'polygon', 'optimism', 'arbitrum', 'base', 'solana'];
  
  // Extract view from URL path
  useEffect(() => {
    if (location.pathname.includes('/profile/account-manager')) {
      setCurrentView('accounts');
    } else if (location.pathname.includes('/profile/stats')) {
      setCurrentView('stats');
    } else {
      setCurrentView('profile');
    }
  }, [location.pathname]);

  // Load user profile from Supabase
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await userService.getProfile(user.id);
        setSupabaseProfile(profile);
        
        // Set initial values
        if (profile?.nickname) {
          setNewUsername(profile.nickname);
        }
        if (profile?.avatar_url) {
          setProfilePicUrl(profile.avatar_url);
        }
      } catch (error) {
        logger.error('Error loading user profile from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserProfile();
    } else {
      setIsLoading(false);
    }
  }, [user, userService]);
  
  // Load wallets when accounts view is activated
  useEffect(() => {
    const loadUserWallets = async () => {
      try {
        await dispatch(loadWallets()).unwrap();
      } catch (err) {
        setError('Failed to load wallets. Please try again.');
        showErrorToast('Error', 'Failed to load wallet information');
      }
    };

    if (currentView === 'accounts' && user) {
      loadUserWallets();
    }
  }, [currentView, dispatch, user, showErrorToast]);

  /**
   * Initiates username edit mode 
   */
  const handleEditUsername = () => {
    setIsEditingUsername(true);
    setNewUsername(supabaseProfile?.nickname || user?.email || '');
  };
  
  /**
   * Handles username update submission
   */
  const handleUsernameSubmit = async () => {
    if (!newUsername.trim()) {
      showErrorToast('Error', 'Username cannot be empty');
      return;
    }
    
    try {
      // Update profile in Supabase
      await userService.updateProfile(user.id, { nickname: newUsername });
      
      // Update local state
      setSupabaseProfile(prev => ({
        ...prev,
        nickname: newUsername
      }));
      
      setIsEditingUsername(false);
      showSuccessToast('Success', 'Your username has been updated');
    } catch (error) {
      logger.error('Error updating username:', error);
      showErrorToast('Error', 'Failed to update username');
    }
  };
  
  /**
   * Opens the profile picture editor
   */
  const handleEditProfilePic = () => {
    setIsEditingProfilePic(true);
    setProfilePicUrl(supabaseProfile?.avatar_url || '');
  };
  
  /**
   * Handles profile picture update submission
   */
  const handleProfilePicSubmit = async () => {
    try {
      // Update profile in Supabase
      await userService.updateProfile(user.id, { avatar_url: profilePicUrl });
      
      // Update local state
      setSupabaseProfile(prev => ({
        ...prev,
        avatar_url: profilePicUrl
      }));
      
      setIsEditingProfilePic(false);
      showSuccessToast('Success', 'Your profile picture has been updated');
    } catch (error) {
      logger.error('Error updating profile picture:', error);
      showErrorToast('Error', 'Failed to update profile picture');
    }
  };

  /**
   * Toggles wallet details expansion
   */
  const toggleWalletDetails = (walletId) => {
    setExpandedWalletId(expandedWalletId === walletId ? null : walletId);
  };

  /**
   * Handle wallet nickname edit
   */
  const handleEditWalletNickname = (wallet) => {
    setIsEditingWalletNickname(wallet.id);
    setNewWalletNickname(wallet.nickname || '');
  };
  
  /**
   * Handle wallet nickname update submission
   */
  const handleWalletNicknameSubmit = async (walletId) => {
    if (!newWalletNickname.trim()) {
      // If nickname is empty, we can use a default value
      setNewWalletNickname(formatAddress(wallets.find(w => w.id === walletId)?.address || ''));
    }
    
    try {
      // Update wallet in Supabase
      await walletService.updateWallet(walletId, { nickname: newWalletNickname });
      
      // Update Redux state
      dispatch({
        type: 'wallets/updateWallet',
        payload: { id: walletId, nickname: newWalletNickname }
      });
      
      setIsEditingWalletNickname(null);
      showSuccessToast('Success', 'Wallet nickname updated');
    } catch (error) {
      logger.error('Error updating wallet nickname:', error);
      showErrorToast('Error', 'Failed to update wallet nickname');
    }
  };

  /**
   * Prepare for wallet deletion
   */
  const handleWalletDelete = (wallet) => {
    setWalletToDelete(wallet);
    openDeleteModal();
  };
  
  /**
   * Confirm and execute wallet deletion
   */
  const confirmWalletDelete = async () => {
    if (!walletToDelete) return;
    
    try {
      // Delete wallet from Supabase
      await walletService.deleteWallet(walletToDelete.id);
      
      // Remove wallet from Redux state
      dispatch({
        type: 'wallets/removeWallet',
        payload: walletToDelete.id
      });
      
      // Clear NFTs for this wallet
      dispatch({
        type: 'nfts/clearWalletNFTs',
        payload: { walletId: walletToDelete.id }
      });
      
      closeDeleteModal();
      showSuccessToast('Success', 'Wallet has been removed from your account');
    } catch (error) {
      logger.error('Error deleting wallet:', error);
      showErrorToast('Error', 'Failed to delete wallet');
    }
  };

  /**
   * Navigate back to main profile view
   */
  const navigateBack = () => {
    setCurrentView('profile');
    navigate('/app/profile');
  };
  
  /**
   * Format wallet address for display
   */
  const formatAddress = (address) => {
    if (!address) return '';
    return address.length > 12 ? 
      `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : 
      address;
  };
  
  /**
   * Handle wallet search and add functionality
   */
  const handleAddWallet = async () => {
    if (!inputValue.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      let address = inputValue.trim();
      let type = 'evm';
      
      // Check if input is an ENS domain or Unstoppable Domain
      if (address.includes('.')) {
        if (address.endsWith('.eth')) {
          const result = await resolveENS(address);
          if (result.success) {
            address = result.address;
            type = result.type;
          } else {
            throw new Error(`Could not resolve ENS domain: ${result.message}`);
          }
        } else {
          // Try Unstoppable Domains
          const result = await resolveUnstoppableDomain(address);
          if (result.success) {
            address = result.address;
            type = result.type;
          } else {
            throw new Error('Could not resolve domain. Please try a valid address or ENS/UD domain.');
          }
        }
      } else {
        // Validate address format
        const { isValid, type: addrType } = isValidAddress(address);
        if (!isValid) {
          throw new Error('Invalid wallet address. Please try again with a valid address.');
        }
        type = addrType;
      }
      
      // Check if wallet already exists
      const walletExists = wallets.find(wallet => 
        wallet.address.toLowerCase() === address.toLowerCase()
      );
      
      if (walletExists) {
        throw new Error('This wallet is already connected to your account.');
      }
      
      setIsAdding(true);
      
      // Add wallet to the store
      await dispatch(addWalletAndFetchNFTs({
        walletData: {
          address,
          type,
          nickname: inputValue.includes('.') ? inputValue : ''
        },
        networks
      })).unwrap();
      
      showSuccessToast(
        "Wallet Added",
        `${inputValue} has been successfully added to your account.`
      );
      
      setInputValue('');
      setShowAddWallet(false);
      
    } catch (error) {
      logger.error('Error adding wallet:', error);
      showErrorToast(
        "Error Adding Wallet",
        error.message || "Failed to add wallet. Please try again."
      );
    } finally {
      setIsSearching(false);
      setIsAdding(false);
    }
  };

  // Profile action items
  const profileActions = [
    {
      id: 'personal',
      label: 'Personal',
      icon: FaUser,
      onClick: () => { 
        showSuccessToast("Personal", "Personal settings functionality will be implemented here.");
      }
    },
    {
      id: 'linked-accounts',
      label: 'Linked Accounts',
      icon: FaLink,
      onClick: () => {
        setCurrentView('accounts');
        navigate('/app/profile/account-manager');
      }
    },
    {
      id: 'app-preferences',
      label: 'App Preferences',
      icon: FaCog,
      onClick: () => {
        showSuccessToast("App Preferences", "App preferences functionality will be implemented here.");
      }
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: FaChartBar,
      onClick: () => {
        setCurrentView('stats');
        navigate('/app/profile/stats');
      }
    }
  ];
  
  // Calculate organizing ratio for stats
  const organizingRatio = useMemo(() => {
    if (totalArtifacts === 0) return 0;
    // Organized artifacts are those not in spam and not unorganized
    const organizedArtifacts = totalArtifacts - spamArtifacts;
    return (organizedArtifacts / totalArtifacts) * 100;
  }, [totalArtifacts, spamArtifacts]);
  
  // Calculate network distribution for stats
  const networkDistribution = useMemo(() => {
    const networks = {};
    
    // Count NFTs by network
    Object.values(nftsByWallet).forEach(walletData => {
      Object.entries(walletData).forEach(([network, networkData]) => {
        const count = (networkData.ERC721?.length || 0) + (networkData.ERC1155?.length || 0);
        if (count > 0) {
          networks[network] = (networks[network] || 0) + count;
        }
      });
    });
    
    // Convert to array for rendering
    return Object.entries(networks)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [nftsByWallet]);
  
  // Calculate catalog distribution for stats
  const catalogDistribution = useMemo(() => {
    const result = allCatalogs.map(catalog => ({
      name: catalog.name,
      count: catalog.nftIds?.length || 0,
      isSystem: catalog.isSystem
    })).sort((a, b) => b.count - a.count);
    
    return result;
  }, [allCatalogs]);

  // Show loading state while fetching profile
  if (isLoading) {
    return (
      <StyledContainer>
        <Flex justify="center" align="center" height="400px">
          <Spinner size="xl" color="var(--warm-brown)" />
        </Flex>
      </StyledContainer>
    );
  }
  
  // SECTION 1: MAIN PROFILE VIEW
  const renderMainProfile = () => (
    <VStack spacing={8} align="stretch" width="100%">
      {/* Profile Header Card - Two Column Layout */}
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
        width="100%"
        boxShadow="md"
        maxWidth={{ base: "100%", md: "700px" }}
        mx="auto"
        p={6}
      >
        <Flex 
          direction={{ base: "column", md: "row" }}
          align={{ base: "center", md: "flex-start" }}
          gap={{ base: 4, md: 6 }}
        >
          {/* Left column: Profile picture with edit capability */}
          <Box 
            position="relative" 
            minWidth={{ base: "120px", md: "180px" }}
            height={{ base: "120px", md: "180px" }}
            onMouseEnter={() => setShowProfilePicEdit(true)}
            onMouseLeave={() => setShowProfilePicEdit(false)}
          >
            <Avatar 
              size={{ base: "xl", md: "2xl" }}
              name={supabaseProfile?.nickname || user?.email || "User"} 
              src={supabaseProfile?.avatar_url} 
              bg="var(--warm-brown)"
              color="white"
              width="100%"
              height="100%"
              borderRadius="xl"
            />
            
            {/* Profile picture edit button - shown on hover */}
            {showProfilePicEdit && !isEditingProfilePic && (
              <Box
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                bg="rgba(0, 0, 0, 0.5)"
                color="white"
                p={2}
                cursor="pointer"
                onClick={handleEditProfilePic}
                display="flex"
                alignItems="center"
                justifyContent="center"
                transition="all 0.2s"
              >
                <HStack spacing={2}>
                  <FaCamera />
                  <Text fontSize="sm" fontWeight="medium">Change Photo</Text>
                </HStack>
              </Box>
            )}
            
            {/* Profile picture edit form */}
            {isEditingProfilePic && (
              <Box
                position="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                bg={cardBg}
                borderRadius="xl"
                p={4}
                boxShadow="md"
                zIndex={10}
              >
                <VStack spacing={4}>
                  <Text fontWeight="bold" fontFamily="Space Grotesk">
                    Update Profile Picture
                  </Text>
                  
                  <Input
                    placeholder="Enter image URL"
                    value={profilePicUrl}
                    onChange={(e) => setProfilePicUrl(e.target.value)}
                    size="sm"
                  />
                  
                  <HStack width="100%">
                    <Button
                      variant="outline"
                      size="sm"
                      width="50%"
                      onClick={() => setIsEditingProfilePic(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      bg="var(--warm-brown)"
                      color="white"
                      _hover={{ bg: "var(--deep-brown)" }}
                      size="sm"
                      width="50%"
                      onClick={handleProfilePicSubmit}
                    >
                      Save
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}
          </Box>

          {/* Right column: User info with edit capability */}
          <Flex 
            flex="1" 
            direction="column" 
            justify="center" 
            align={{ base: "center", md: "flex-start" }}
            position="relative"
          >
            {isEditingUsername ? (
              <VStack align={{ base: "center", md: "flex-start" }} spacing={3} width="100%">
                <Input
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  size="lg"
                  fontWeight="bold"
                  fontFamily="Space Grotesk"
                  maxWidth="100%"
                  autoFocus
                />
                <HStack>
                  <Button
                    size="sm"
                    onClick={() => setIsEditingUsername(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    bg="var(--warm-brown)"
                    color="white"
                    _hover={{ bg: "var(--deep-brown)" }}
                    onClick={handleUsernameSubmit}
                  >
                    Save
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <HStack 
                spacing={2} 
                onMouseEnter={() => setShowUsernameEdit(true)}
                onMouseLeave={() => setShowUsernameEdit(false)}
                p={2}
                borderRadius="md"
                _hover={{ bg: "var(--highlight)" }}
                cursor="pointer"
                width={{ base: "100%", md: "auto" }}
                justify={{ base: "center", md: "flex-start" }}
                onClick={() => setIsEditingUsername(true)}
              >
                <Text
                  fontSize="2xl"
                  fontWeight="bold"
                  fontFamily="Space Grotesk"
                  color={textColor}
                >
                  {supabaseProfile?.nickname || user?.email || "User"}
                </Text>
                {showUsernameEdit && (
                  <IconButton
                    icon={<FaPencilAlt />}
                    aria-label="Edit username"
                    size="sm"
                    variant="ghost"
                    color="var(--ink-grey)"
                  />
                )}
              </HStack>
            )}
            
            <Text
              fontSize="md"
              color="gray.500"
              fontFamily="Inter"
              mt={2}
            >
              {user?.email || ""}
            </Text>
          </Flex>
        </Flex>
      </Box>
      
      {/* Account & Settings Section */}
      <VStack spacing={0} align="stretch" width="100%" maxWidth={{ base: "100%", md: "700px" }} mx="auto">
        <Text
          px={4}
          py={2}
          fontSize="sm"
          fontWeight="medium"
          color="gray.500"
          textTransform="uppercase"
          letterSpacing="wider"
          fontFamily="Inter"
        >
          ACCOUNT & SETTINGS
        </Text>
        
        {/* Menu Items */}
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          width="100%"
        >
          <VStack spacing={0} divider={<Divider />}>
            {profileActions.map((action) => (
              <Box
                key={action.id}
                as="button"
                width="100%"
                textAlign="left"
                py={4}
                px={6}
                onClick={action.onClick}
                _hover={{ bg: "var(--highlight)" }}
                transition="background 0.2s"
                bg={action.id === 'stats' && location.pathname.includes('/stats') ? "var(--highlight)" : "transparent"}
              >
                <Flex justify="space-between" align="center">
                  <HStack spacing={3}>
                    <Box color="var(--ink-grey)">
                      <action.icon size={20} />
                    </Box>
                    <Text fontFamily="Inter" fontWeight="medium" color="var(--rich-black)">
                      {action.label}
                    </Text>
                  </HStack>
                  <FaChevronRight color="gray" size={14} />
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      </VStack>
    </VStack>
  );

// Part 2: Continuing from the previous part of ProfilePage.js
// This adds the account manager and stats view sections

  // SECTION 2: ACCOUNT MANAGER VIEW
  const renderAccountManager = () => (
    <VStack spacing={6} align="stretch" maxWidth={{ base: "100%", md: "700px" }} mx="auto">
      {/* Custom Back Button */}
      {!isMobile ? (
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={navigateBack}
          color="var(--ink-grey)"
          size={buttonSize}
          variant="ghost"
          alignSelf="flex-start"
          _hover={{ color: "var(--warm-brown)" }}
        >
          Return to profile
        </Button>
      ) : (
        <IconButton
          icon={<FaArrowLeft />}
          onClick={navigateBack}
          color="var(--ink-grey)"
          size={buttonSize}
          variant="ghost"
          alignSelf="flex-start"
          _hover={{ color: "var(--warm-brown)" }}
          aria-label="Return to profile"
        />
      )}
      
      {/* Account Manager Header */}
      <Box>
        <Heading 
          as="h2" 
          size="lg" 
          fontFamily="Space Grotesk"
          color={textColor}
          mb={2}
        >
          Linked Accounts
        </Heading>
        <Text color="gray.500" fontFamily="Inter">
          Manage your connected wallets and accounts
        </Text>
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      )}

      {/* Wallets Summary */}
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
        width="100%"
      >
        {/* Wallet Header */}
        <Flex 
          p={4} 
          justify="space-between" 
          align="center" 
          borderBottomWidth={walletsExpanded ? "1px" : "0"}
          borderColor={borderColor}
          onClick={() => setWalletsExpanded(!walletsExpanded)}
          cursor="pointer"
          _hover={{ bg: "var(--highlight)" }}
        >
          <HStack>
            <FaWallet color="var(--ink-grey)" />
            <Text fontWeight="medium" fontFamily="Inter" color="var(--rich-black)">Connected Wallets</Text>
          </HStack>
          <HStack>
            <Text fontFamily="Space Grotesk" color="var(--ink-grey)" mr={2}>
              {wallets.length} {wallets.length === 1 ? 'wallet' : 'wallets'}
            </Text>
            <Box 
              as="span"
              transform={walletsExpanded ? "rotate(0deg)" : "rotate(180deg)"}
              transition="transform 0.2s"
            >
              <FaChevronUp size={14} color="var(--ink-grey)" />
            </Box>
          </HStack>
        </Flex>
        
        {/* Wallet List - Collapsible */}
        <Collapse in={walletsExpanded} animateOpacity>
          <VStack spacing={0} divider={<Divider />} align="stretch">
            {wallets.map((wallet, index) => (
              <Box key={wallet.id}>
                {isEditingWalletNickname === wallet.id ? (
                  <Flex p={4} align="center" justify="space-between" bg={cardBg}>
                    <Input
                      value={newWalletNickname}
                      onChange={(e) => setNewWalletNickname(e.target.value)}
                      size="md"
                      width="auto"
                      maxWidth="70%"
                      autoFocus
                      placeholder={formatAddress(wallet.address)}
                    />
                    <HStack>
                      <Button
                        size="sm"
                        onClick={() => setIsEditingWalletNickname(null)}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        bg="var(--warm-brown)"
                        color="white"
                        _hover={{ bg: "var(--deep-brown)" }}
                        onClick={() => handleWalletNicknameSubmit(wallet.id)}
                      >
                        Save
                      </Button>
                    </HStack>
                  </Flex>
                ) : (
                  <>
                    {/* Wallet row - clickable to expand */}
                    <Flex 
                      p={4} 
                      justify="space-between" 
                      align="center"
                      bg={cardBg}
                      _hover={{ bg: "var(--highlight)" }}
                      cursor="pointer"
                      onClick={() => toggleWalletDetails(wallet.id)}
                    >
                      <HStack spacing={2}>
                        <Text fontFamily="Inter" color="var(--rich-black)" fontWeight="medium">
                          {wallet.nickname || formatAddress(wallet.address)}
                        </Text>
                        <Tooltip
                          label="View address"
                          placement="top"
                          hasArrow
                        >
                          <IconButton
                            icon={<FaInfoCircle />}
                            aria-label="Wallet info"
                            size="xs"
                            variant="ghost"
                            color="var(--ink-grey)"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWalletDetails(wallet.id);
                            }}
                          />
                        </Tooltip>
                      </HStack>
                      
                      <HStack>
                        <IconButton
                          icon={<FaPencilAlt />}
                          aria-label="Edit wallet nickname"
                          size="sm"
                          variant="ghost"
                          color="var(--ink-grey)"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditWalletNickname(wallet);
                          }}
                          _hover={{ color: "var(--warm-brown)" }}
                        />
                        <IconButton
                          icon={<FaTrash />}
                          aria-label="Delete wallet"
                          size="sm"
                          variant="ghost"
                          color="var(--ink-grey)"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWalletDelete(wallet);
                          }}
                          _hover={{ color: "red.500" }}
                        />
                      </HStack>
                    </Flex>
                    
                    {/* Expanded wallet details */}
                    <Collapse in={expandedWalletId === wallet.id} animateOpacity>
                      <Box 
                        p={4} 
                        bg="var(--highlight)" 
                        borderTopWidth="1px" 
                        borderColor="var(--shadow)"
                      >
                        <VStack align="start" spacing={3}>
                          <Box>
                            <Text fontWeight="medium" mb={1}>Full Address:</Text>
                            <Box 
                              p={2}
                              bg="white"
                              borderRadius="md"
                              fontSize="sm"
                              fontFamily="monospace"
                              overflowX="auto"
                            >
                              {wallet.address}
                            </Box>
                          </Box>
                          
                          <Box width="100%">
                            <Text fontWeight="medium" mb={1}>Networks:</Text>
                            <Flex wrap="wrap" gap={2}>
                              {wallet.networks && wallet.networks.length > 0 ? (
                                wallet.networks.map(network => (
                                  <Badge 
                                    key={network} 
                                    bg="var(--warm-brown)" 
                                    color="white" 
                                    borderRadius="full"
                                    px={2}
                                    py={1}
                                  >
                                    {network}
                                  </Badge>
                                ))
                              ) : (
                                <Text fontSize="sm" color="gray.500">No networks detected yet</Text>
                              )}
                            </Flex>
                          </Box>
                        </VStack>
                      </Box>
                    </Collapse>
                  </>
                )}
              </Box>
            ))}
            
            {wallets.length === 0 && (
              <Box p={4} textAlign="center" bg={cardBg}>
                <Text color="gray.500" fontFamily="Inter">
                  No wallets connected yet
                </Text>
              </Box>
            )}
          </VStack>
        </Collapse>
        
        {/* Add Wallet Button */}
        <Box p={4} display="flex" justifyContent="center" bg={cardBg}>
          <Button
            leftIcon={<FaPlus />}
            onClick={() => setShowAddWallet(!showAddWallet)}
            color="white"
            bg="var(--warm-brown)"
            size={buttonSize}
            alignSelf="center"
            px={6}
            _hover={{ bg: "var(--deep-brown)" }}
            fontFamily="Inter"
          >
            Add Wallet
          </Button>
        </Box>
      </Box>

      {/* Add Wallet Section */}
      {showAddWallet && (
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          width="100%"
          p={5}
        >
          <Text
            fontSize="lg"
            fontWeight="bold"
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            mb={4}
          >
            Add New Wallet
          </Text>
          
          <InputGroup size="md" mb={4}>
            <Input
              placeholder="Enter wallet address, ENS, or Unstoppable Domain"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              borderColor="var(--shadow)"
              _hover={{ borderColor: "var(--warm-brown)" }}
              _focus={{ 
                borderColor: "var(--warm-brown)",
                boxShadow: "0 0 0 1px var(--warm-brown)"
              }}
              fontFamily="Inter"
              isDisabled={isSearching || isAdding}
            />
            <InputRightElement width="4.5rem">
              <IconButton
                h="1.75rem"
                size="sm"
                icon={<FaPlus />}
                onClick={handleAddWallet}
                isLoading={isSearching || isAdding}
                bg="var(--warm-brown)"
                color="white"
                _hover={{ bg: "var(--deep-brown)" }}
                aria-label="Add wallet"
              />
            </InputRightElement>
          </InputGroup>
          
          <Accordion allowToggle>
            <AccordionItem border="none">
              <AccordionButton 
                px={0}
                color="var(--ink-grey)"
                fontFamily="Inter"
                fontSize="sm"
                _hover={{ bg: "transparent", color: "var(--warm-brown)" }}
              >
                <Box flex="1" textAlign="left">
                  Supported Wallet Types
                </Box>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel pb={4} px={0}>
                <VStack align="start" spacing={2}>
                  <HStack>
                    <FaEthereum size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Ethereum (ETH)</Text>
                  </HStack>
                  <HStack>
                    <FaNetworkWired size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Polygon</Text>
                  </HStack>
                  <HStack>
                    <FaNetworkWired size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Optimism</Text>
                  </HStack>
                  <HStack>
                    <FaNetworkWired size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Arbitrum</Text>
                  </HStack>
                  <HStack>
                    <FaNetworkWired size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Base</Text>
                  </HStack>
                  <HStack>
                    <FaNetworkWired size={14} />
                    <Text fontSize="sm" fontFamily="Inter">Solana</Text>
                  </HStack>
                </VStack>
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Box>
      )}
      
      {/* Wallet Deletion Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="lg">
          <ModalHeader fontFamily="Space Grotesk" color="var(--rich-black)">
            Remove Wallet
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="start">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Warning</Text>
                  <Text fontSize="sm">
                    Removing this wallet will also remove all artifacts associated with it.
                    This action cannot be undone.
                  </Text>
                </Box>
              </Alert>
              
              <Text>
                Are you sure you want to remove the wallet 
                <Text as="span" fontWeight="bold"> {walletToDelete?.nickname || formatAddress(walletToDelete?.address || '')} </Text>
                from your account?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button 
              bg="red.500" 
              color="white"
              _hover={{ bg: "red.600" }}
              onClick={confirmWalletDelete}
              leftIcon={<FaTrash />}
            >
              Remove Wallet
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  );

  // SECTION 3: STATS VIEW
  const renderStatsPage = () => (
    <VStack spacing={6} align="stretch" maxWidth={{ base: "100%", md: "700px" }} mx="auto">
      {/* Custom Back Button for Stats */}
      {!isMobile ? (
        <Button
          leftIcon={<FaArrowLeft />}
          onClick={navigateBack}
          color="var(--ink-grey)"
          size={buttonSize}
          variant="ghost"
          alignSelf="flex-start"
          _hover={{ color: "var(--warm-brown)" }}
        >
          Return to profile
        </Button>
      ) : (
        <IconButton
          icon={<FaArrowLeft />}
          onClick={navigateBack}
          color="var(--ink-grey)"
          size={buttonSize}
          variant="ghost"
          alignSelf="flex-start"
          _hover={{ color: "var(--warm-brown)" }}
          aria-label="Return to profile"
        />
      )}
      
      {/* Stats Header */}
      <Box>
        <Heading 
          as="h2" 
          size="lg" 
          fontFamily="Space Grotesk"
          color={textColor}
          mb={2}
        >
          Your Statistics
        </Heading>
        <Text color="gray.500">
          Insights about your artifacts and organizing habits
        </Text>
      </Box>
      
      {/* Time Filter */}
      <Flex justify="flex-end">
        <Select 
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          maxWidth="200px"
          size="sm"
          borderColor="var(--shadow)"
          _hover={{ borderColor: "var(--warm-brown)" }}
          _focus={{ 
            borderColor: "var(--warm-brown)",
            boxShadow: "0 0 0 1px var(--warm-brown)"
          }}
        >
          <option value="all">All Time</option>
          <option value="month">Last Month</option>
          <option value="week">Last Week</option>
        </Select>
      </Flex>
      
      {/* Stats Summary */}
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
        width="100%"
        p={4}
      >
        <Text
          fontSize="sm"
          fontWeight="medium"
          color="gray.500"
          textTransform="uppercase"
          letterSpacing="wider"
          fontFamily="Inter"
          mb={4}
        >
          STATS SUMMARY
        </Text>
        
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontFamily="Inter" fontWeight="medium">Total Artifacts</Text>
          <Text fontFamily="Space Grotesk" fontWeight="bold">{totalArtifacts || 0}</Text>
        </Flex>
        
        <Flex justify="space-between" align="center" mb={2}>
          <Text fontFamily="Inter" fontWeight="medium">Catalogs</Text>
          <Text fontFamily="Space Grotesk" fontWeight="bold">{allCatalogs?.length || 0}</Text>
        </Flex>
        
        <Flex justify="space-between" align="center">
          <Text fontFamily="Inter" fontWeight="medium">Spam Artifacts</Text>
          <Text fontFamily="Space Grotesk" fontWeight="bold">{spamArtifacts || 0}</Text>
        </Flex>
      </Box>
      
      {/* Overview Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          p={5}
        >
          <Stat>
            <StatLabel 
              fontSize="sm"
              fontFamily="Inter"
              color="gray.500"
            >
              Total Artifacts
            </StatLabel>
            <StatNumber 
              fontFamily="Space Grotesk"
              fontSize="3xl"
              color={textColor}
            >
              {totalArtifacts || 0}
            </StatNumber>
            <StatHelpText>
              Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          p={5}
        >
          <Stat>
            <StatLabel 
              fontSize="sm"
              fontFamily="Inter"
              color="gray.500"
            >
              Catalogs Created
            </StatLabel>
            <StatNumber 
              fontFamily="Space Grotesk"
              fontSize="3xl"
              color={textColor}
            >
              {userCatalogs.length || 0}
            </StatNumber>
            <StatHelpText>
              Plus {systemCatalogs.length || 0} system catalogs
            </StatHelpText>
          </Stat>
        </Box>
        
        <Box
          bg={cardBg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="xl"
          overflow="hidden"
          p={5}
        >
          <Stat>
            <StatLabel 
              fontSize="sm"
              fontFamily="Inter"
              color="gray.500"
            >
              Folders
            </StatLabel>
            <StatNumber 
              fontFamily="Space Grotesk"
              fontSize="3xl"
              color={textColor}
            >
              {folders.length || 0}
            </StatNumber>
            <StatHelpText>
              For organizing catalogs
            </StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>
      
      {/* Organization Progress */}
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
        p={5}
      >
        <Text
          fontFamily="Space Grotesk"
          fontSize="lg"
          fontWeight="bold"
          mb={4}
        >
          Organization Progress
        </Text>
        
        <Progress 
          value={organizingRatio} 
          size="lg" 
          colorScheme="green" 
          borderRadius="md"
          mb={3}
        />
        
        <Flex justify="space-between" align="center">
          <Text fontFamily="Inter" fontSize="sm" color="gray.500">
            {Math.round(organizingRatio)}% Organized
          </Text>
          <HStack spacing={4}>
            <HStack>
              <Circle size="10px" bg="green.500" />
              <Text fontFamily="Inter" fontSize="sm">Organized: {totalArtifacts - spamArtifacts}</Text>
            </HStack>
            <HStack>
              <Circle size="10px" bg="red.500" />
              <Text fontFamily="Inter" fontSize="sm">Spam: {spamArtifacts}</Text>
            </HStack>
          </HStack>
        </Flex>
      </Box>
      
      {/* Additional Stats in Tabs */}
      <Box
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        overflow="hidden"
      >
        <Tabs colorScheme="brown">
          <TabList px={4} pt={2}>
            <Tab fontFamily="Inter">By Network</Tab>
            <Tab fontFamily="Inter">By Catalog</Tab>
          </TabList>
          
          <TabPanels>
            {/* Networks Tab */}
            <TabPanel>
              <Text
                fontFamily="Space Grotesk"
                fontSize="lg"
                fontWeight="bold"
                mb={4}
              >
                Artifacts by Network
              </Text>
              
              <VStack spacing={4} align="stretch">
                {networkDistribution.map((network, index) => (
                  <Box key={network.name}>
                    <Flex justify="space-between" mb={1}>
                      <HStack>
                        <FaNetworkWired />
                        <Text fontFamily="Inter" fontWeight="medium">
                          {network.name}
                        </Text>
                      </HStack>
                      <Text fontFamily="Space Grotesk">
                        {network.count} artifact{network.count !== 1 ? 's' : ''}
                      </Text>
                    </Flex>
                    <Progress 
                      value={(network.count / totalArtifacts) * 100} 
                      size="sm" 
                      colorScheme={index % 2 === 0 ? "green" : "teal"} 
                      borderRadius="md"
                    />
                  </Box>
                ))}
              </VStack>
            </TabPanel>
            
            {/* Catalogs Tab */}
            <TabPanel>
              <Text
                fontFamily="Space Grotesk"
                fontSize="lg"
                fontWeight="bold"
                mb={4}
              >
                Artifacts by Catalog
              </Text>
              
              <VStack spacing={4} align="stretch">
                {catalogDistribution.map((catalog, index) => (
                  <Box key={catalog.name}>
                    <Flex justify="space-between" mb={1}>
                      <HStack>
                        <FaLayerGroup />
                        <Text fontFamily="Inter" fontWeight="medium">
                          {catalog.name}
                        </Text>
                        {catalog.isSystem && (
                          <Badge bg="var(--warm-brown)" color="white" fontSize="xs">System</Badge>
                        )}
                      </HStack>
                      <Text fontFamily="Space Grotesk">
                        {catalog.count} artifact{catalog.count !== 1 ? 's' : ''}
                      </Text>
                    </Flex>
                    <Progress 
                      value={(catalog.count / totalArtifacts) * 100} 
                      size="sm" 
                      colorScheme={catalog.isSystem ? "green" : "teal"} 
                      borderRadius="md"
                    />
                  </Box>
                ))}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </VStack>
  );
  
  return (
    <StyledContainer>
      {currentView === 'profile' && renderMainProfile()}
      {currentView === 'accounts' && renderAccountManager()}
      {currentView === 'stats' && renderStatsPage()}
    </StyledContainer>
  );
};

export default ProfilePage;