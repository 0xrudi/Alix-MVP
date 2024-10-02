import React, { useState } from 'react';
import { 
  VStack, 
  Input, 
  Select, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Text,
  Box,
} from "@chakra-ui/react";
import { Select as MultiSelect } from "chakra-react-select";
import { resolveENS, isValidAddress, networks } from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { useAppContext } from '../context/AppContext';
import { StyledButton, StyledCard } from '../styles/commonStyles';

const WalletManager = () => {
  const { wallets, updateWallets } = useAppContext();
  const [input, setInput] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('eth');
  const [error, setError] = useState('');
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { handleError } = useErrorHandler();

  const handleAddWallet = async () => {
    setError('');
    let address = input;
    let walletNickname = '';

    try {
      if (input.endsWith('.eth')) {
        logger.log('Resolving ENS name:', input);
        const result = await resolveENS(input);
        logger.log('ENS resolution result:', result);
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

      logger.log('New wallet object:', newWallet);

      const updatedWallets = [...wallets, newWallet];
      logger.log('Updated wallets array:', updatedWallets);

      updateWallets(updatedWallets);
      setInput('');
      showSuccessToast("Wallet Added", "The wallet has been successfully added to your list.");
    } catch (error) {
      handleError(error, 'adding wallet');
      setError(`Error adding wallet: ${error.message}`);
    }
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
    showSuccessToast("Wallet Removed", "The wallet has been successfully removed from your list.");
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
      <StyledCard title="Add New Wallet">
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
          <StyledButton onClick={handleAddWallet}>
            Add Wallet
          </StyledButton>
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </StyledCard>
      
      {wallets.length > 0 ? (
        <StyledCard title="Your Wallets">
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
                    <Text>{wallet.address}</Text>
                  </Td>
                  <Td>
                    <MultiSelect
                      isMulti
                      options={networks}
                      value={wallet.networks.map(networkValue => ({
                        value: networkValue,
                        label: networks.find(n => n.value === networkValue)?.label || networkValue
                      }))}
                      onChange={(selectedOptions) => handleNetworkChange(wallet.address, selectedOptions)}
                      placeholder="Select networks"
                    />
                  </Td>
                  <Td>
                    <StyledButton onClick={() => handleDeleteWallet(wallet.address)} colorScheme="red">
                      Delete
                    </StyledButton>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </StyledCard>
      ) : (
        <Box>
          <Text>No wallets added yet. Add a wallet to get started.</Text>
        </Box>
      )}
    </VStack>
  );
};

export default WalletManager;