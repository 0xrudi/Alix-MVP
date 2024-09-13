import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Input, 
  VStack, 
  HStack,
  Text,
  Select,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Container,
  Heading,
  Image,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Select as MultiSelect } from "chakra-react-select";
import { resolveENS, isValidAddress, fetchENSAvatar } from '../utils/web3Utils';

const networks = [
  { value: "ethereum", label: "Ethereum" },
  { value: "polygon", label: "Polygon PoS" },
  { value: "optimism", label: "Optimism" },
  { value: "arbitrum", label: "Arbitrum" },
  { value: "zksync", label: "ZKSync" },
  { value: "starknet", label: "Starknet" },
  { value: "mantle", label: "Mantle" },
  { value: "linea", label: "Linea" },
  { value: "base", label: "Base" },
  { value: "zora", label: "Zora" },
  { value: "polygon_zkevm", label: "Polygon zkEVM" },
  { value: "solana", label: "Solana" },
];

const WalletManager = ({ wallets, setWallets, setNfts, onOrganizeNFTs }) => {
  const [input, setInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [error, setError] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableENS, setAvailableENS] = useState([]);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageUploadMethod, setImageUploadMethod] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const ensDomains = wallets
      .filter(wallet => wallet.nickname && wallet.nickname.endsWith('.eth'))
      .map(wallet => wallet.nickname);
    setAvailableENS(ensDomains);

    if (ensDomains.length > 0) {
      setNickname(ensDomains[0]);
      fetchAndSetAvatar(ensDomains[0]);
    }
  }, [wallets]);

  const fetchAndSetAvatar = async (ensName) => {
    const avatarData = await fetchENSAvatar(ensName);
    if (avatarData) {
      setAvatarUrl(avatarData);
    } else {
      setAvatarUrl(`https://via.placeholder.com/150?text=${ensName}`);
    }
  };

  const handleAddWallet = async () => {
    setError('');
    let address = input;
    let walletNickname = '';

    if (input.endsWith('.eth')) {
      const result = await resolveENS(input, selectedNetwork);
      if (result.success) {
        address = result.address;
        walletNickname = input;
      } else {
        setError(result.message);
        return;
      }
    } else if (!isValidAddress(input)) {
      setError('Invalid address format');
      return;
    }

    const newWallet = {
      address,
      nickname: walletNickname,
      networks: [selectedNetwork],
    };

    setWallets(prevWallets => [...prevWallets, newWallet]);
    setInput('');
    toast({
      title: "Wallet Added",
      description: "The wallet has been successfully added to your list.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const handleNetworkChange = (address, selectedOptions) => {
    setWallets(prevWallets => 
      prevWallets.map(wallet => 
        wallet.address === address 
          ? { ...wallet, networks: selectedOptions.map(option => option.value) }
          : wallet
      )
    );
  };

  const handleDeleteWallet = (addressToDelete) => {
    setWallets(prevWallets => prevWallets.filter(wallet => wallet.address !== addressToDelete));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      // Validate input
      if (!nickname.trim()) {
        toast({
          title: "Error",
          description: "Please enter a nickname.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
  
      // Prepare profile data
      const profileData = {
        nickname,
        avatarUrl,
        wallets: wallets.map(wallet => ({
          address: wallet.address,
          nickname: wallet.nickname,
          networks: wallet.networks,
        })),
      };
  
      // Update local state
      setWallets(profileData.wallets);
  
      // If you have a backend service, send the data there
      // const response = await fetch('/api/save-profile', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(profileData),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to save profile on the server');
      // }
  
      // For now, we'll just simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));
  
      // Update any other necessary state or context
      // For example, you might have a global user context:
      // updateUserContext(profileData);
  
      toast({
        title: "Profile Saved",
        description: "Your profile has been updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
  
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "There was a problem saving your profile. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }  finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
    onClose();
  };

  const handlePasteImage = useCallback(async (e) => {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
        const blob = await item.getType(item.types.find(type => type.startsWith('image/')));
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarUrl(reader.result);
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
    onClose();
  }, [onClose]);

  const handleImageUrlInput = (url) => {
    setAvatarUrl(url);
    onClose();
  };

  const handleENSSelect = async (event) => {
    const selectedENS = event.target.value;
    setNickname(selectedENS);
    await fetchAndSetAvatar(selectedENS);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl" mb={6}>Welcome to Alix</Heading>
        
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab fontSize="lg">Wallets</Tab>
            <Tab fontSize="lg">Profile</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading as="h2" size="lg">Manage Wallets</Heading>
                <HStack spacing={4}>
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter wallet address or ENS name"
                    size="lg"
                    flex={1}
                  />
                  <Select
                    value={selectedNetwork}
                    onChange={(e) => setSelectedNetwork(e.target.value)}
                    size="lg"
                    width="200px"
                  >
                    {networks.map((network) => (
                      <option key={network.value} value={network.value}>
                        {network.label}
                      </option>
                    ))}
                  </Select>
                  <Button onClick={handleAddWallet} size="lg" colorScheme="blue">
                    Add Wallet
                  </Button>
                </HStack>
                
                {error && <Text color="red.500" fontSize="lg">{error}</Text>}
                
                <Table variant="simple" size="lg">
                  <Thead>
                    <Tr>
                      <Th fontSize="md">Nickname / Address</Th>
                      <Th fontSize="md">Networks</Th>
                      <Th fontSize="md">Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td colSpan={3}>
                        <Text fontSize="sm" fontStyle="italic" color="gray.500">
                          Example: Main Wallet (0x1234...5678) | Ethereum, Polygon | Delete
                        </Text>
                      </Td>
                    </Tr>
                    {wallets.map((wallet) => (
                      <Tr key={wallet.address}>
                        <Td>
                          <VStack align="start" spacing={2}>
                            <Input
                              value={wallet.nickname || ''}
                              onChange={(e) => {
                                setWallets(prevWallets => 
                                  prevWallets.map(w => 
                                    w.address === wallet.address ? { ...w, nickname: e.target.value } : w
                                  )
                                );
                              }}
                              placeholder="Add nickname"
                              size="md"
                            />
                            <Text fontSize="sm" color="gray.500">{wallet.address}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <MultiSelect
                            isMulti
                            options={networks}
                            value={networks.filter(network => wallet.networks.includes(network.value))}
                            onChange={(selectedOptions) => handleNetworkChange(wallet.address, selectedOptions)}
                            placeholder="Select networks"
                            chakraStyles={{
                              container: (provided) => ({
                                ...provided,
                                fontSize: '16px',
                              }),
                              option: (provided) => ({
                                ...provided,
                                fontSize: '16px',
                              }),
                            }}
                          />
                        </Td>
                        <Td>
                          <Button onClick={() => handleDeleteWallet(wallet.address)} colorScheme="red" size="md">
                            Delete
                          </Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </VStack>
            </TabPanel>
            <TabPanel>
              <VStack spacing={6} align="start">
                <Heading as="h2" size="lg">User Profile</Heading>
                <Flex direction={{ base: "column", md: "row" }} align="center" w="100%">
                  <Image
                    src={avatarUrl || 'https://via.placeholder.com/150'}
                    alt="User Avatar"
                    borderRadius="full"
                    boxSize="150px"
                    mr={{ base: 0, md: 8 }}
                    mb={{ base: 4, md: 0 }}
                  />
                  <VStack align="start" spacing={4} w="100%">
                    <Menu>
                      <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                        Add Profile Picture
                      </MenuButton>
                      <MenuList>
                        <MenuItem onClick={() => { setImageUploadMethod('file'); onOpen(); }}>Upload File</MenuItem>
                        <MenuItem onClick={() => { setImageUploadMethod('paste'); onOpen(); }}>Paste from Clipboard</MenuItem>
                        <MenuItem onClick={() => { setImageUploadMethod('url'); onOpen(); }}>Provide Image URL</MenuItem>
                      </MenuList>
                    </Menu>
                    <Select onChange={handleENSSelect} placeholder="Select ENS domain" size="lg">
                      {availableENS.map(ens => (
                        <option key={ens} value={ens}>{ens}</option>
                      ))}
                    </Select>
                    <Input 
                      value={nickname} 
                      onChange={(e) => setNickname(e.target.value)} 
                      placeholder="Enter nickname" 
                      size="lg"
                    />
                  </VStack>
                </Flex>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        <HStack justify="space-between" mt={6}>
          <Button 
            onClick={handleSaveProfile} 
            colorScheme="blue" 
            size="lg" 
            isLoading={isSaving}
            loadingText="Saving"
          >
            Save Profile
          </Button>
          <Button onClick={onOrganizeNFTs} colorScheme="green" size="lg">
            Organize NFTs
          </Button>
        </HStack>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Profile Picture</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {imageUploadMethod === 'file' && (
              <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
            )}
            {imageUploadMethod === 'paste' && (
              <Button onClick={handlePasteImage}>Paste Image from Clipboard</Button>
            )}
            {imageUploadMethod === 'url' && (
              <Input 
                placeholder="Enter image URL" 
                onChange={(e) => handleImageUrlInput(e.target.value)}
              />
            )}
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default WalletManager;