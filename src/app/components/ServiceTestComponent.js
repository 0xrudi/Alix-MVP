// src/app/components/ServiceTestComponent.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Heading,
  Button,
  VStack,
  Text,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Code,
  Badge,
  Spinner,
  Select,
  FormControl,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import { useServices } from '../../services/service-provider';
import { logger } from '../../utils/logger';
import { useCustomToast } from '../../utils/toastUtils';
import { useSelector } from 'react-redux';
import { StyledContainer } from '../styles/commonStyles';

// ServiceTestCard component for consistent styling
const ServiceTestCard = ({ title, children }) => (
  <Box
    bg="white"
    borderWidth="1px"
    borderColor="var(--shadow)"
    borderRadius="lg"
    p={4}
    mb={4}
    width="100%"
  >
    <Heading size="md" mb={4} fontFamily="Space Grotesk">
      {title}
    </Heading>
    {children}
  </Box>
);

const ServiceTestComponent = () => {
  // Get services from the service provider (but only once)
  const services = useServices();
  
  // Destructure necessary services
  const { user, userService, walletService, catalogService, folderService } = services;
  
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const wallets = useSelector((state) => state.wallets.list);
  
  // Local state for test operations
  const [testResults, setTestResults] = useState({});
  const [selectedWallet, setSelectedWallet] = useState('');
  const [isLoading, setIsLoading] = useState({});
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });
  const [lastSynced, setLastSynced] = useState(null);
  
  // Set initial selected wallet when wallets data is loaded
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets, selectedWallet]);
  
  // Generic test runner function
  const runTest = useCallback(async (testName, testFn) => {
    setIsLoading((prev) => ({ ...prev, [testName]: true }));
    setTestResults((prev) => ({ ...prev, [testName]: null }));
    
    try {
      const result = await testFn();
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: true, data: result },
      }));
      showSuccessToast(`${testName} Success`, 'The operation was successful');
    } catch (error) {
      logger.error(`${testName} failed:`, error);
      setTestResults((prev) => ({
        ...prev,
        [testName]: { success: false, error: error.message },
      }));
      showErrorToast(`${testName} Failed`, error.message);
    } finally {
      setIsLoading((prev) => ({ ...prev, [testName]: false }));
    }
  }, [showSuccessToast, showErrorToast]);
  
  // Test 1: Get User Profile - memoized to prevent recreation on each render
  const testGetUserProfile = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    const profile = await userService.getProfile(user.id);
    return profile;
  }, [user, userService]);
  
  // Test 2: Create Folder - memoized to prevent recreation on each render
  const testCreateFolder = useCallback(async () => {
    if (!newFolder.name) throw new Error('Folder name is required');
    if (!user) throw new Error('No user is authenticated');
    
    const folder = await folderService.createFolder(
      user.id,
      newFolder.name,
      newFolder.description
    );
    
    // Clear the form
    setNewFolder({ name: '', description: '' });
    
    return folder;
  }, [newFolder, user, folderService]);
  
  // Test 3: Get Wallet Info - memoized to prevent recreation on each render
  const testGetWalletInfo = useCallback(async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    const wallets = await walletService.getUserWallets(user.id);
    const selectedWalletInfo = wallets.find(w => w.id === selectedWallet);
    
    if (!selectedWalletInfo) {
      throw new Error('Selected wallet not found');
    }
    
    return selectedWalletInfo;
  }, [selectedWallet, user, walletService]);
  
  // Test 4: List Catalogs - memoized to prevent recreation on each render
  const testListCatalogs = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    
    const catalogs = await catalogService.getUserCatalogs(user.id);
    return {
      count: catalogs.length,
      catalogs: catalogs.map(c => ({ id: c.id, name: c.name }))
    };
  }, [user, catalogService]);
  
  // Render test result
  const renderTestResult = (testName) => {
    const result = testResults[testName];
    if (!result) return null;
    
    return (
      <Box mt={2}>
        {result.success ? (
          <Alert status="success" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                <Code whiteSpace="pre-wrap" fontSize="sm">
                  {JSON.stringify(result.data, null, 2)}
                </Code>
              </AlertDescription>
            </Box>
          </Alert>
        ) : (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{result.error}</AlertDescription>
            </Box>
          </Alert>
        )}
      </Box>
    );
  };
  
  return (
    <StyledContainer>
      <Heading size="xl" mb={6} fontFamily="Space Grotesk" color="var(--rich-black)">
        Service Integration Tests
      </Heading>
      
      {!user ? (
        <Alert status="warning" borderRadius="md" mb={4}>
          <AlertIcon />
          No user authenticated. Please log in to test services.
        </Alert>
      ) : (
        <Alert status="info" borderRadius="md" mb={4}>
          <AlertIcon />
          Logged in as: {user.email || user.id}
        </Alert>
      )}
      
      <VStack spacing={4} align="stretch">
        {/* User Profile Test */}
        <ServiceTestCard title="User Profile">
          <Button
            onClick={() => runTest('userProfile', testGetUserProfile)}
            isLoading={isLoading.userProfile}
            colorScheme="blue"
            mb={3}
          >
            Get User Profile
          </Button>
          {renderTestResult('userProfile')}
        </ServiceTestCard>
        
        {/* Create Folder Test */}
        <ServiceTestCard title="Create Folder">
          <VStack spacing={3} align="stretch" mb={3}>
            <FormControl>
              <FormLabel>Folder Name</FormLabel>
              <Input
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                placeholder="Enter folder name"
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Input
                value={newFolder.description}
                onChange={(e) => setNewFolder({ ...newFolder, description: e.target.value })}
                placeholder="Enter description"
              />
            </FormControl>
            
            <Button
              onClick={() => runTest('createFolder', testCreateFolder)}
              isLoading={isLoading.createFolder}
              colorScheme="blue"
              isDisabled={!newFolder.name}
            >
              Create Folder
            </Button>
          </VStack>
          {renderTestResult('createFolder')}
        </ServiceTestCard>
        
        {/* Wallet Info Test */}
        <ServiceTestCard title="Wallet Information">
          <VStack spacing={3} align="stretch" mb={3}>
            <FormControl>
              <FormLabel>Select Wallet</FormLabel>
              <Select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                placeholder="Select wallet"
              >
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.id}>
                    {wallet.nickname || wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4)}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <Button
              onClick={() => runTest('getWalletInfo', testGetWalletInfo)}
              isLoading={isLoading.getWalletInfo}
              colorScheme="blue"
              isDisabled={!selectedWallet}
            >
              Get Wallet Info
            </Button>
          </VStack>
          {renderTestResult('getWalletInfo')}
        </ServiceTestCard>
        
        {/* List Catalogs Test */}
        <ServiceTestCard title="List Catalogs">
          <Button
            onClick={() => runTest('listCatalogs', testListCatalogs)}
            isLoading={isLoading.listCatalogs}
            colorScheme="blue"
            mb={3}
          >
            List User Catalogs
          </Button>
          {renderTestResult('listCatalogs')}
        </ServiceTestCard>
      </VStack>
    </StyledContainer>
  );
};

export default ServiceTestComponent;