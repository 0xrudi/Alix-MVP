// src/app/components/ServiceTestComponent.js
import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Textarea,
  Center,
} from '@chakra-ui/react';
import { useServices } from '../../services/service-provider';
import { logger } from '../../utils/logger';
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

// TestResult component to display results
const TestResult = ({ result }) => {
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

const ServiceTestComponent = () => {
  // Get all services from context (single call to avoid recreation)
  const services = useServices();
  const { user, userService, walletService, catalogService, folderService, artifactService } = services;
  
  // Redux selectors
  const reduxWallets = useSelector((state) => state.wallets.list);
  const reduxCatalogs = useSelector((state) => state.catalogs.items);
  const reduxFolders = useSelector((state) => state.folders.folders);
  
  // State for test operations grouped by service type
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [loadingInitial, setLoadingInitial] = useState(false);
  
  // Local state for dropdown options
  const [walletOptions, setWalletOptions] = useState([]);
  const [catalogOptions, setCatalogOptions] = useState([]);
  const [folderOptions, setFolderOptions] = useState([]);
  
  // Form state for different services
  const [selectedWallet, setSelectedWallet] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [newFolder, setNewFolder] = useState({ name: '', description: '' });
  const [newCatalog, setNewCatalog] = useState({ name: '', description: '' });
  const [artifactData, setArtifactData] = useState({
    contractAddress: '',
    tokenId: '',
    network: 'eth',
    metadata: '{}'
  });
  
  // Toast for notifications
  const toast = useToast();
  
  const networkOptions = [
    { value: 'eth', label: 'Ethereum' },
    { value: 'polygon', label: 'Polygon' },
    { value: 'base', label: 'Base' },
    { value: 'solana', label: 'Solana' }
  ];
  
  // Function to reload data from Supabase directly
  const refreshComponentData = useCallback(async () => {
    try {
      if (user) {
        logger.log('Refreshing component data from Supabase');
        
        // Reload wallets, folders and catalogs from Supabase
        const [freshWallets, freshFolders, freshCatalogs] = await Promise.all([
          walletService.getUserWallets(user.id),
          folderService.getUserFolders(user.id),
          catalogService.getUserCatalogs(user.id)
        ]);
        
        // Update the local component state
        setWalletOptions(freshWallets.map(wallet => ({
          value: wallet.id,
          label: wallet.nickname || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
        })));
        
        setFolderOptions(freshFolders.map(folder => ({
          value: folder.id,
          label: folder.name
        })));
        
        setCatalogOptions(freshCatalogs.map(catalog => ({
          value: catalog.id,
          label: catalog.name
        })));
        
        // If there are options but no selection, auto-select the first one
        if (freshWallets.length && !selectedWallet) {
          setSelectedWallet(freshWallets[0].id);
        }
        
        if (freshFolders.length && !selectedFolder) {
          setSelectedFolder(freshFolders[0].id);
        }
        
        if (freshCatalogs.length && !selectedCatalog) {
          setSelectedCatalog(freshCatalogs[0].id);
        }
      }
    } catch (error) {
      logger.error('Error refreshing component data:', error);
      toast({
        title: 'Refresh Error',
        description: error.message || 'Failed to refresh data from Supabase',
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
  }, [user, walletService, folderService, catalogService, selectedWallet, selectedFolder, selectedCatalog, toast]);
  
  // Enhanced test runner function that refreshes data after success
  const runTest = useCallback(async (testName, testFn) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    setResults(prev => ({ ...prev, [testName]: null }));
    
    try {
      const result = await testFn();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      
      // Refresh data after successful operation
      await refreshComponentData();
      
      toast({
        title: 'Success',
        description: `${testName} completed successfully`,
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      logger.error(`${testName} failed:`, error);
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  }, [toast, refreshComponentData]);
  
  // Initialize component data when it mounts
  useEffect(() => {
    if (user) {
      const initializeComponentData = async () => {
        try {
          setLoadingInitial(true);
          await refreshComponentData();
        } catch (error) {
          logger.error('Error initializing component data:', error);
          toast({
            title: 'Initialization Error',
            description: 'Failed to load initial data',
            status: 'error',
            duration: 5000,
            isClosable: true
          });
        } finally {
          setLoadingInitial(false);
        }
      };
      
      initializeComponentData();
    }
  }, [user, refreshComponentData, toast]);
  
  // Sync Redux data with component state when Redux state changes
  useEffect(() => {
    // Only update from Redux if we're not still initializing from Supabase
    if (!loadingInitial && reduxWallets.length) {
      setWalletOptions(prevOptions => {
        const newOptions = reduxWallets.map(wallet => ({
          value: wallet.id,
          label: wallet.nickname || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
        }));
        
        // Only update if different to avoid render cycles
        if (JSON.stringify(prevOptions) !== JSON.stringify(newOptions)) {
          return newOptions;
        }
        return prevOptions;
      });
    }
  }, [reduxWallets, loadingInitial]);
  
  // ==== USER SERVICE TESTS ====
  
  const testGetProfile = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    return await userService.getProfile(user.id);
  }, [user, userService]);
  
  const testUpdateProfile = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    
    // Generate a random nickname to test profile updates
    const randomNickname = `Test User ${Math.floor(Math.random() * 1000)}`;
    
    return await userService.updateProfile(user.id, {
      nickname: randomNickname
    });
  }, [user, userService]);
  
  // ==== WALLET SERVICE TESTS ====
  
  const testGetWallets = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    return await walletService.getUserWallets(user.id);
  }, [user, walletService]);
  
  const testWalletDetails = useCallback(async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    const wallets = await walletService.getUserWallets(user.id);
    const wallet = wallets.find(w => w.id === selectedWallet);
    
    if (!wallet) throw new Error('Wallet not found');
    return wallet;
  }, [user, walletService, selectedWallet]);
  
  // ==== FOLDER SERVICE TESTS ====
  
  const testCreateFolder = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    if (!newFolder.name) throw new Error('Folder name is required');
    
    return await folderService.createFolder(
      user.id,
      newFolder.name,
      newFolder.description
    );
  }, [user, folderService, newFolder]);
  
  const testGetFolders = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    return await folderService.getUserFolders(user.id);
  }, [user, folderService]);
  
  const testFolderDetails = useCallback(async () => {
    if (!selectedFolder) throw new Error('No folder selected');
    
    const folders = await folderService.getUserFolders(user.id);
    const folder = folders.find(f => f.id === selectedFolder);
    
    if (!folder) throw new Error('Folder not found');
    return folder;
  }, [user, folderService, selectedFolder]);
  
  // ==== CATALOG SERVICE TESTS ====
  
  const testCreateCatalog = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    if (!newCatalog.name) throw new Error('Catalog name is required');
    
    return await catalogService.createCatalog(
      user.id,
      newCatalog.name,
      newCatalog.description
    );
  }, [user, catalogService, newCatalog]);
  
  const testGetCatalogs = useCallback(async () => {
    if (!user) throw new Error('No user is authenticated');
    return await catalogService.getUserCatalogs(user.id);
  }, [user, catalogService]);
  
  const testCatalogDetails = useCallback(async () => {
    if (!selectedCatalog) throw new Error('No catalog selected');
    
    const catalogs = await catalogService.getUserCatalogs(user.id);
    const catalog = catalogs.find(c => c.id === selectedCatalog);
    
    if (!catalog) throw new Error('Catalog not found');
    return catalog;
  }, [user, catalogService, selectedCatalog]);
  
  // ==== CATALOG-FOLDER RELATIONSHIP TESTS ====
  
  const testAddCatalogToFolder = useCallback(async () => {
    if (!selectedCatalog) throw new Error('No catalog selected');
    if (!selectedFolder) throw new Error('No folder selected');
    
    await folderService.addCatalogToFolder(selectedFolder, selectedCatalog);
    return {
      catalogId: selectedCatalog,
      folderId: selectedFolder,
      status: 'added'
    };
  }, [folderService, selectedCatalog, selectedFolder]);
  
  const testRemoveCatalogFromFolder = useCallback(async () => {
    if (!selectedCatalog) throw new Error('No catalog selected');
    if (!selectedFolder) throw new Error('No folder selected');
    
    await folderService.removeCatalogFromFolder(selectedFolder, selectedCatalog);
    return {
      catalogId: selectedCatalog,
      folderId: selectedFolder,
      status: 'removed'
    };
  }, [folderService, selectedCatalog, selectedFolder]);
  
  // ==== ARTIFACT SERVICE TESTS ====
  
  const testAddArtifact = useCallback(async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    const { contractAddress, tokenId, network } = artifactData;
    
    if (!contractAddress) throw new Error('Contract address is required');
    if (!tokenId) throw new Error('Token ID is required');
    
    let metadata;
    try {
      metadata = JSON.parse(artifactData.metadata || '{}');
    } catch (error) {
      throw new Error('Invalid metadata JSON: ' + error.message);
    }
    
    // Get the wallet details to ensure we have the correct data
    const walletDetails = await walletService.getUserWallets(user.id)
      .then(wallets => wallets.find(w => w.id === selectedWallet));
      
    if (!walletDetails) {
      throw new Error('Wallet not found in Supabase');
    }
    
    // Add artifact to the database with verified wallet
    return await artifactService.addArtifact(
      walletDetails.id, // Use the verified wallet ID
      tokenId,
      contractAddress,
      network,
      metadata
    );
  }, [artifactService, selectedWallet, artifactData, walletService, user]);
  
  const testGetArtifacts = useCallback(async () => {
    if (!selectedWallet) throw new Error('No wallet selected');
    
    const artifacts = await artifactService.getWalletArtifacts(selectedWallet);
    return {
      count: artifacts.length,
      artifacts: artifacts.slice(0, 5) // Only return first 5 to keep response small
    };
  }, [artifactService, selectedWallet]);
  
  // Show loading state while initializing data
  if (loadingInitial) {
    return (
      <StyledContainer>
        <Center h="300px">
          <VStack spacing={4}>
            <Spinner size="xl" color="var(--warm-brown)" />
            <Text color="var(--ink-grey)" fontFamily="Fraunces">
              Loading service data...
            </Text>
          </VStack>
        </Center>
      </StyledContainer>
    );
  }
  
  // Render the component
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
          <HStack spacing={2}>
            <Text>Logged in as:</Text>
            <Badge colorScheme="blue" p={1}>
              {user.email || user.id}
            </Badge>
          </HStack>
        </Alert>
      )}
      
      <HStack spacing={4} mb={6}>
        <Button 
          onClick={refreshComponentData} 
          colorScheme="blue" 
          variant="outline"
          isDisabled={!user}
        >
          Refresh Data from Supabase
        </Button>
      </HStack>
      
      <Tabs colorScheme="blue" variant="enclosed" mb={4}>
        <TabList>
          <Tab>User Services</Tab>
          <Tab>Wallet Services</Tab>
          <Tab>Folder Services</Tab>
          <Tab>Catalog Services</Tab>
          <Tab>Artifact Services</Tab>
        </TabList>
        
        <TabPanels>
          {/* USER SERVICES PANEL */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <ServiceTestCard title="User Profile">
                <HStack spacing={4} mb={3}>
                  <Button
                    onClick={() => runTest('getProfile', testGetProfile)}
                    isLoading={loading.getProfile}
                    colorScheme="blue"
                  >
                    Get Profile
                  </Button>
                  <Button
                    onClick={() => runTest('updateProfile', testUpdateProfile)}
                    isLoading={loading.updateProfile}
                    colorScheme="green"
                  >
                    Update Profile
                  </Button>
                </HStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.getProfile} />
                      <TestResult result={results.updateProfile} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
            </VStack>
          </TabPanel>
          
          {/* WALLET SERVICES PANEL */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <ServiceTestCard title="Wallet Management">
                <HStack spacing={4} mb={3}>
                  <Button
                    onClick={() => runTest('getWallets', testGetWallets)}
                    isLoading={loading.getWallets}
                    colorScheme="blue"
                  >
                    List All Wallets
                  </Button>
                </HStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.getWallets} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
              
              <ServiceTestCard title="Wallet Details">
                <FormControl mb={3}>
                  <FormLabel>Select Wallet</FormLabel>
                  <Select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    placeholder="Select wallet"
                  >
                    {walletOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  onClick={() => runTest('walletDetails', testWalletDetails)}
                  isLoading={loading.walletDetails}
                  colorScheme="blue"
                  isDisabled={!selectedWallet}
                  mb={3}
                >
                  Get Wallet Details
                </Button>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.walletDetails} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
            </VStack>
          </TabPanel>
          
          {/* FOLDER SERVICES PANEL */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
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
                    isLoading={loading.createFolder}
                    colorScheme="blue"
                    isDisabled={!newFolder.name}
                  >
                    Create Folder
                  </Button>
                </VStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.createFolder} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
              
              <ServiceTestCard title="Folder Management">
                <HStack spacing={4} mb={3}>
                  <Button
                    onClick={() => runTest('getFolders', testGetFolders)}
                    isLoading={loading.getFolders}
                    colorScheme="blue"
                  >
                    List All Folders
                  </Button>
                </HStack>
                <FormControl mb={3}>
                  <FormLabel>Select Folder</FormLabel>
                  <Select
                    value={selectedFolder}
                    onChange={(e) => setSelectedFolder(e.target.value)}
                    placeholder="Select folder"
                  >
                    {folderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  onClick={() => runTest('folderDetails', testFolderDetails)}
                  isLoading={loading.folderDetails}
                  colorScheme="blue"
                  isDisabled={!selectedFolder}
                  mb={3}
                >
                  Get Folder Details
                </Button>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.getFolders} />
                      <TestResult result={results.folderDetails} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
            </VStack>
          </TabPanel>
          
          {/* CATALOG SERVICES PANEL */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <ServiceTestCard title="Create Catalog">
                <VStack spacing={3} align="stretch" mb={3}>
                  <FormControl>
                    <FormLabel>Catalog Name</FormLabel>
                    <Input
                      value={newCatalog.name}
                      onChange={(e) => setNewCatalog({ ...newCatalog, name: e.target.value })}
                      placeholder="Enter catalog name"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Description (Optional)</FormLabel>
                    <Input
                      value={newCatalog.description}
                      onChange={(e) => setNewCatalog({ ...newCatalog, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </FormControl>
                  
                  <Button
                    onClick={() => runTest('createCatalog', testCreateCatalog)}
                    isLoading={loading.createCatalog}
                    colorScheme="blue"
                    isDisabled={!newCatalog.name}
                  >
                    Create Catalog
                  </Button>
                </VStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.createCatalog} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
              
              <ServiceTestCard title="Catalog Management">
                <HStack spacing={4} mb={3}>
                  <Button
                    onClick={() => runTest('getCatalogs', testGetCatalogs)}
                    isLoading={loading.getCatalogs}
                    colorScheme="blue"
                  >
                    List All Catalogs
                  </Button>
                </HStack>
                <FormControl mb={3}>
                  <FormLabel>Select Catalog</FormLabel>
                  <Select
                    value={selectedCatalog}
                    onChange={(e) => setSelectedCatalog(e.target.value)}
                    placeholder="Select catalog"
                  >
                    {catalogOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  onClick={() => runTest('catalogDetails', testCatalogDetails)}
                  isLoading={loading.catalogDetails}
                  colorScheme="blue"
                  isDisabled={!selectedCatalog}
                  mb={3}
                >
                  Get Catalog Details
                </Button>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.getCatalogs} />
                      <TestResult result={results.catalogDetails} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
              
              <ServiceTestCard title="Catalog-Folder Relationships">
                <VStack spacing={3} align="stretch" mb={3}>
                  <HStack spacing={4}>
                    <FormControl flex="1">
                      <FormLabel>Folder</FormLabel>
                      <Select
                        value={selectedFolder}
                        onChange={(e) => setSelectedFolder(e.target.value)}
                        placeholder="Select folder"
                      >
                        {folderOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl flex="1">
                      <FormLabel>Catalog</FormLabel>
                      <Select
                        value={selectedCatalog}
                        onChange={(e) => setSelectedCatalog(e.target.value)}
                        placeholder="Select catalog"
                      >
                        {catalogOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    </FormControl>
                  </HStack>
                  
                  <HStack spacing={4}>
                    <Button
                      onClick={() => runTest('addCatalogToFolder', testAddCatalogToFolder)}
                      isLoading={loading.addCatalogToFolder}
                      colorScheme="blue"
                      isDisabled={!selectedCatalog || !selectedFolder}
                      flex="1"
                    >
                      Add to Folder
                    </Button>
                    
                    <Button
                      onClick={() => runTest('removeCatalogFromFolder', testRemoveCatalogFromFolder)}
                      isLoading={loading.removeCatalogFromFolder}
                      colorScheme="red"
                      isDisabled={!selectedCatalog || !selectedFolder}
                      flex="1"
                    >
                      Remove from Folder
                    </Button>
                  </HStack>
                </VStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.addCatalogToFolder} />
                      <TestResult result={results.removeCatalogFromFolder} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
            </VStack>
          </TabPanel>
          
          {/* ARTIFACT SERVICES PANEL */}
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <ServiceTestCard title="Create Artifact">
                <VStack spacing={3} align="stretch" mb={3}>
                  <FormControl>
                    <FormLabel>Wallet</FormLabel>
                    <Select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      placeholder="Select wallet"
                    >
                      {walletOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Contract Address</FormLabel>
                    <Input
                      value={artifactData.contractAddress}
                      onChange={(e) => setArtifactData({ ...artifactData, contractAddress: e.target.value })}
                      placeholder="0x..."
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Token ID</FormLabel>
                    <Input
                      value={artifactData.tokenId}
                      onChange={(e) => setArtifactData({ ...artifactData, tokenId: e.target.value })}
                      placeholder="Token ID"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Network</FormLabel>
                    <Select
                      value={artifactData.network}
                      onChange={(e) => setArtifactData({ ...artifactData, network: e.target.value })}
                    >
                      {networkOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Metadata (JSON)</FormLabel>
                    <Textarea
                      value={artifactData.metadata}
                      onChange={(e) => setArtifactData({ ...artifactData, metadata: e.target.value })}
                      placeholder="{}"
                      rows={4}
                      fontFamily="monospace"
                    />
                  </FormControl>
                  
                  <Button
                    onClick={() => runTest('addArtifact', testAddArtifact)}
                    isLoading={loading.addArtifact}
                    colorScheme="blue"
                    isDisabled={!selectedWallet || !artifactData.contractAddress || !artifactData.tokenId}
                  >
                    Add Artifact
                  </Button>
                </VStack>
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.addArtifact} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
              
              <ServiceTestCard title="Fetch Artifacts">
                <FormControl mb={3}>
                  <FormLabel>Wallet</FormLabel>
                  <Select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    placeholder="Select wallet"
                  >
                    {walletOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  onClick={() => runTest('getArtifacts', testGetArtifacts)}
                  isLoading={loading.getArtifacts}
                  colorScheme="blue"
                  isDisabled={!selectedWallet}
                  mb={3}
                >
                  Get Wallet Artifacts
                </Button>
                
                <Accordion allowToggle>
                  <AccordionItem>
                    <AccordionButton>
                      <Box flex="1" textAlign="left">
                        View Test Results
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                      <TestResult result={results.getArtifacts} />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </ServiceTestCard>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </StyledContainer>
  );
};

export default ServiceTestComponent;