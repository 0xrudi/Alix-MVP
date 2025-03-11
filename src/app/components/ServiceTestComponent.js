// src/app/components/ServiceTestComponent.js
import React, { useState, useEffect } from 'react';
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
  Divider,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Badge,
  Spinner,
  Select,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Stack
} from '@chakra-ui/react';
import { useServices } from '../../services/service-provider';
import { logger } from '../../utils/logger';
import { useCustomToast } from '../../utils/toastUtils';
import { useSelector } from 'react-redux';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { useFolderService } from '../hooks/useFolderService';
import { useArtifactService } from '../hooks/useArtifactService';

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
  const { user, userService, walletService, catalogService, folderService, artifactService } = useServices();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const wallets = useSelector((state) => state.wallets.list);
  const supabaseSync = useSupabaseSync();
  const folderServiceHook = useFolderService();
  const artifactServiceHook = useArtifactService();
  
  // State for various operations
  const [testResults, setTestResults] = useState({});
  const [selectedWallet, setSelectedWallet] = useState('');
  const [isLoading, setIsLoading] = useState({});
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });
  
  useEffect(() => {
    if (wallets.length > 0 && !selectedWallet) {
      setSelectedWallet(wallets[0].id);
    }
  }, [wallets, selectedWallet]);
  
  const runTest = async (testName, testFn) => {
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
  };
  
  // Test 1: Get User Profile
  const testGetUserProfile = async () => {
    if (!user) throw new Error('No user is authenticated');
    const profile = await userService.getProfile(user.id);
    return profile;
  };
  
  // Test 2: Sync App Data
  const testSyncAppData = async () => {
    await supabaseSync.refreshAppData();
    return {
      lastSynced: supabaseSync.lastSynced,
      syncStatus: supabaseSync.syncStatus,
    };
  };
  
  // Test 3: Create Folder
  const testCreateFolder = async () => {
    if (!newFolder.name) throw new Error('Folder name is required');
    
    const folderId = await folderServiceHook.createNewFolder(
      newFolder.name,
      newFolder.description
    );
    
    // Clear the form
    setNewFolder({ name: '', description: '' });
    
    return { folderId };
  };
  
  // Test 4: Sync Wallet Artifacts
  const testSyncWalletArtifacts = async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    const addedCount = await artifactServiceHook.syncWallet(selectedWallet);
    return { addedCount, walletId: selectedWallet };
  };
  
  // Test 5: Fetch Spam Artifacts
  const testFetchSpamArtifacts = async () => {
    await artifactServiceHook.fetchSpam();
    return { spamCount: artifactServiceHook.spamNFTs.length };
  };
  
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
    <Box>
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
        
        {/* Sync App Data Test */}
        <ServiceTestCard title="Sync App Data">
          <HStack mb={3}>
            <Badge
              colorScheme={supabaseSync.isInitializing ? 'orange' : 'green'}
              p={2}
              borderRadius="full"
            >
              {supabaseSync.isInitializing ? (
                <HStack>
                  <Spinner size="xs" />
                  <Text>Initializing</Text>
                </HStack>
              ) : (
                'Ready'
              )}
            </Badge>
            {supabaseSync.lastSynced && (
              <Text fontSize="sm" color="gray.500">
                Last synced: {new Date(supabaseSync.lastSynced).toLocaleString()}
              </Text>
            )}
          </HStack>
          
          <Button
            onClick={() => runTest('syncAppData', testSyncAppData)}
            isLoading={isLoading.syncAppData}
            colorScheme="blue"
            mb={3}
          >
            Sync All App Data
          </Button>
          {renderTestResult('syncAppData')}
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
        
        {/* Sync Wallet Artifacts Test */}
        <ServiceTestCard title="Sync Wallet Artifacts">
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
              onClick={() => runTest('syncWalletArtifacts', testSyncWalletArtifacts)}
              isLoading={isLoading.syncWalletArtifacts}
              colorScheme="blue"
              isDisabled={!selectedWallet}
            >
              Sync Wallet Artifacts
            </Button>
          </VStack>
          {renderTestResult('syncWalletArtifacts')}
        </ServiceTestCard>
        
        {/* Fetch Spam Artifacts Test */}
        <ServiceTestCard title="Spam Artifacts">
          <Button
            onClick={() => runTest('fetchSpamArtifacts', testFetchSpamArtifacts)}
            isLoading={isLoading.fetchSpamArtifacts}
            colorScheme="blue"
            mb={3}
          >
            Fetch Spam Artifacts
          </Button>
          {renderTestResult('fetchSpamArtifacts')}
        </ServiceTestCard>
      </VStack>
    </Box>
  );
};

export default ServiceTestComponent;