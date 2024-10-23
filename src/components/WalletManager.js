// src/components/WalletManager.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  VStack, 
  Input, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td,
  Text,
  Box,
  Tag,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { 
  resolveENS, 
  resolveUnstoppableDomain, 
  isValidAddress, 
  fetchNFTs, 
  networks 
} from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { addWallet, removeWallet, updateWallet } from '../redux/slices/walletSlice';
import { addNFTs } from '../redux/slices/nftSlice';
import { StyledButton, StyledCard } from '../styles/commonStyles';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';

const WalletManager = () => {
  const dispatch = useDispatch();
  const wallets = useSelector(state => state.wallets.list);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();

  const handleAddWallet = async () => {
    setError('');
    setIsLoading(true);
    let address = input;
    let walletType = '';
    let walletNickname = '';
  
    try {
      // Check if it's a valid address first
      const addressCheck = isValidAddress(input);
      if (addressCheck.isValid) {
        address = input;
        walletType = addressCheck.type;
      } else if (input.toLowerCase().endsWith('.eth') || input.toLowerCase().includes('.')) {
        // Try ENS resolution - including base domains
        showInfoToast("Resolving Address", "Attempting to resolve ENS name...");
        
        // First try direct ENS resolution
        const ensResult = await resolveENS(input);
        if (ensResult.success) {
          address = ensResult.address;
          walletType = ensResult.type;
          walletNickname = input;
        } else {
          // If direct resolution fails, try with .eth suffix if not present
          if (!input.toLowerCase().endsWith('.eth')) {
            const ensWithEth = await resolveENS(`${input}.eth`);
            if (ensWithEth.success) {
              address = ensWithEth.address;
              walletType = ensWithEth.type;
              walletNickname = input;
            } else {
              throw new Error("ENS name not found or no address associated");
            }
          } else {
            throw new Error(ensResult.message);
          }
        }
      } else {
        // Try Unstoppable Domain resolution
        showInfoToast("Resolving Address", "Attempting to resolve Unstoppable Domain...");
        const udResult = await resolveUnstoppableDomain(input);
        if (udResult.success) {
          address = udResult.address;
          walletType = udResult.type;
          walletNickname = input;
        } else {
          throw new Error(udResult.message);
        }
      }
  
      const newWallet = {
        id: Date.now().toString(),
        address,
        nickname: walletNickname,
        type: walletType,
        networks: [],
      };
  
      // Add the wallet first
      dispatch(addWallet(newWallet));
  
      // Determine relevant networks
      const relevantNetworks = walletType === 'evm' 
        ? networks.filter(n => n.type === 'evm').map(n => n.value)
        : ['solana'];
  
      showInfoToast(
        "Scanning Networks", 
        `Checking ${relevantNetworks.length} networks for NFTs...`
      );
  
      // Fetch NFTs and update networks
      const activeNetworks = await dispatch(fetchWalletNFTs({ 
        walletId: newWallet.id, 
        address: newWallet.address, 
        networks: relevantNetworks 
      })).unwrap();
  
      setInput('');
      showSuccessToast(
        "Wallet Added", 
        `Found NFTs on ${activeNetworks.length} networks. Wallet added successfully.`
      );
    } catch (error) {
      handleError(error, 'adding wallet');
      setError(`Error adding wallet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteWallet = (walletId) => {
    dispatch(removeWallet(walletId));
    showSuccessToast("Wallet Removed", "The wallet has been successfully removed from your list.");
  };

  const handleNicknameChange = (walletId, newNickname) => {
    dispatch(updateWallet({ id: walletId, nickname: newNickname }));
  };

  return (
    <VStack spacing={6} align="stretch">
      <StyledCard title="Add New Wallet">
        <VStack spacing={4}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter wallet address, ENS, or Unstoppable Domain"
          />
          <StyledButton onClick={handleAddWallet} isLoading={isLoading} loadingText="Adding wallet...">
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
                <Th>Type</Th>
                <Th>Active Networks</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {wallets.map((wallet) => (
                <Tr key={wallet.id}>
                  <Td>
                    <Input
                      value={wallet.nickname || ''}
                      onChange={(e) => handleNicknameChange(wallet.id, e.target.value)}
                      placeholder="Add nickname"
                    />
                    <Text>{wallet.address}</Text>
                  </Td>
                  <Td>
                    <Tag colorScheme={wallet.type === 'evm' ? 'green' : 'purple'}>
                      {wallet.type.toUpperCase()}
                    </Tag>
                  </Td>
                  <Td>
                    <Wrap>
                      {wallet.networks.map((networkValue) => (
                        <WrapItem key={networkValue}>
                          <Tag colorScheme="blue" variant="solid">
                            {networkValue}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Td>
                  <Td>
                    <StyledButton onClick={() => handleDeleteWallet(wallet.id)} colorScheme="red">
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