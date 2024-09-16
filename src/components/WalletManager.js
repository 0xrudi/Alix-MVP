import React, { useState } from 'react';
import { 
  VStack, 
  Input, 
  Button, 
  Select, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  useToast,
  Text,
  Box,
} from "@chakra-ui/react";
import { Select as MultiSelect } from "chakra-react-select";
import { resolveENS, isValidAddress, networks } from '../utils/web3Utils';

const WalletManager = ({ wallets = [], updateWallets }) => {
  const [input, setInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [error, setError] = useState('');
  const toast = useToast();

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

    updateWallets([...wallets, newWallet]);
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
    const updatedWallets = wallets.map(wallet => 
      wallet.address === address 
        ? { ...wallet, networks: selectedOptions.map(option => option.value) }
        : wallet
    );
    updateWallets(updatedWallets);
  };

  const handleDeleteWallet = (addressToDelete) => {
    const updatedWallets = wallets.filter(wallet => wallet.address !== addressToDelete);
    updateWallets(updatedWallets);
  };

  const handleNicknameChange = (address, newNickname) => {
    const updatedWallets = wallets.map(wallet => 
      wallet.address === address 
        ? { ...wallet, nickname: newNickname }
        : wallet
    );
    updateWallets(updatedWallets);
  };

  return (
    <VStack spacing={6} align="stretch">
      <VStack spacing={4}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter wallet address or ENS name"
        />
        <Select
          value={selectedNetwork}
          onChange={(e) => setSelectedNetwork(e.target.value)}
        >
          {networks.map((network) => (
            <option key={network.value} value={network.value}>
              {network.label}
            </option>
          ))}
        </Select>
        <Button onClick={handleAddWallet} colorScheme="blue">
          Add Wallet
        </Button>
        {error && <Text color="red.500">{error}</Text>}
      </VStack>
      
      {wallets.length > 0 ? (
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
                  <Input
                    value={wallet.nickname || ''}
                    onChange={(e) => handleNicknameChange(wallet.address, e.target.value)}
                    placeholder="Add nickname"
                  />
                  {wallet.address}
                </Td>
                <Td>
                  <MultiSelect
                    isMulti
                    options={networks}
                    value={networks.filter(network => wallet.networks.includes(network.value))}
                    onChange={(selectedOptions) => handleNetworkChange(wallet.address, selectedOptions)}
                    placeholder="Select networks"
                  />
                </Td>
                <Td>
                  <Button onClick={() => handleDeleteWallet(wallet.address)} colorScheme="red">
                    Delete
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <Box>
          <Text>No wallets added yet. Add a wallet to get started.</Text>
        </Box>
      )}
    </VStack>
  );
};

export default WalletManager;