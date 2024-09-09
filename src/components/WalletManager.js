import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Button, 
  Input, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Switch, 
  Heading,
  Text,
  useToast,
  Select,
  HStack,
  Flex,
  VStack,
} from "@chakra-ui/react";
import { networks, resolveENS, fetchNFTs, isValidAddress, fetchENSAvatar } from '../utils/web3Utils';
import handleSaveProfile from'../components/UserProfile.js'

const WalletManager = ({ wallets, setWallets, setNfts, onOrganizeNFTs }) => {
  const [input, setInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('mainnet');
  const [error, setError] = useState('');
  const toast = useToast();

  

  const loadStoredWallets = useCallback(() => {
    const storedWallets = localStorage.getItem('wallets');
    if (storedWallets) {
      setWallets(JSON.parse(storedWallets));
    }
  }, [setWallets]);

  useEffect(() => {
    loadStoredWallets();
  }, [loadStoredWallets]);

  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  const handleAddWallet = async () => {
    setError('');
    let address = input;
    let nickname = '';
    let ensAvatar = '';

    if (input.endsWith('.eth')) {
      const result = await resolveENS(input, selectedNetwork);
      if (result.success) {
        address = result.address;
        nickname = input;
        ensAvatar = await fetchENSAvatar(input);
      } else {
        setError(result.message);
        toast({
          title: "ENS Resolution Failed",
          description: result.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    } else if (!isValidAddress(input)) {
      setError('Invalid address format');
      toast({
        title: "Invalid Address",
        description: "The entered address is not a valid Ethereum address.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    const fetchedNfts = await fetchNFTs(address);
    setNfts(prevNfts => ({
      ...prevNfts,
      [address]: fetchedNfts
    }));

    const newWallet = {
      address,
      nickname,
      ensAvatar,
      networks: networks.reduce((acc, network) => ({ ...acc, [network.id]: false }), {}),
    };

    setWallets(prevWallets => [...prevWallets, newWallet]);
    setInput('');
    toast({
      title: "Wallet Added",
      description: "The wallet has been successfully added to your list and its NFTs have been fetched.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };


  const handleNicknameChange = (address, nickname) => {
    setWallets(prevWallets => 
      prevWallets.map(wallet => 
        wallet.address === address ? { ...wallet, nickname } : wallet
      )
    );
  };

  const handleNetworkToggle = (address, networkId) => {
    setWallets(prevWallets => 
      prevWallets.map(wallet => 
        wallet.address === address 
          ? { ...wallet, networks: { ...wallet.networks, [networkId]: !wallet.networks[networkId] } }
          : wallet
      )
    );
  };

  const handleDeleteWallet = (addressToDelete) => {
    setWallets(prevWallets => prevWallets.filter(wallet => wallet.address !== addressToDelete));
    setNfts(prevNfts => {
      const newNfts = { ...prevNfts };
      delete newNfts[addressToDelete];
      return newNfts;
    });
  };

  const handleSaveWallet = (address) => {
    toast({
      title: "Wallet Saved",
      description: "The wallet settings have been saved.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Box>
      <Heading as="h2" size="lg" marginBottom={4}>Set up account</Heading>
      <Flex marginBottom={6}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter wallet address or ENS name"
          flex="1"
          mr={2}
        />
        <Select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
          width="200px"
          mr={2}
        >
          {networks.map((network) => (
            <option key={network.id} value={network.id}>
              {network.name}
            </option>
          ))}
        </Select>
        <Button onClick={handleAddWallet}>Add Wallet</Button>
      </Flex>
      {error && <Text color="red.500" marginBottom={4}>{error}</Text>}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Nickname / Address</Th>
            <Th>Networks</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {wallets.map((wallet) => (
            <Tr key={wallet.address}>
              <Td>
                <VStack align="start" spacing={1}>
                  <Input
                    value={wallet.nickname || ''}
                    onChange={(e) => handleNicknameChange(wallet.address, e.target.value)}
                    placeholder="Add nickname"
                  />
                  <Text fontSize="sm" color="gray.500">{truncateAddress(wallet.address)}</Text>
                </VStack>
              </Td>
              <Td>
                <HStack>
                  {networks.map((network) => (
                    <Flex key={network.id} alignItems="center">
                      <Switch
                        isChecked={wallet.networks[network.id]}
                        onChange={() => handleNetworkToggle(wallet.address, network.id)}
                        mr={2}
                      />
                      <Text fontSize="sm">{network.name}</Text>
                    </Flex>
                  ))}
                </HStack>
              </Td>
              <Td>
                <Button onClick={() => handleSaveWallet(wallet.address)} colorScheme="green" size="sm" mr={2}>
                  Save
                </Button>
                <Button onClick={() => handleDeleteWallet(wallet.address)} colorScheme="red" size="sm">
                  Delete
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      <Flex justify="space-between" align="center" mt={8}>
        <Button onClick={handleSaveProfile} colorScheme="green">
          Save Profile
        </Button>
        <Button onClick={onOrganizeNFTs} colorScheme="blue">
          Organize NFTs
        </Button>
      </Flex>
    </Box>
  );
};

export default WalletManager;