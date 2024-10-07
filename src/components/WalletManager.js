import React, { useState } from 'react';
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
import { useAppContext } from '../context/AppContext';
import { StyledButton, StyledCard } from '../styles/commonStyles';

const WalletManager = () => {
  const { wallets, updateWallets } = useAppContext();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast } = useCustomToast();
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
      } else if (input.endsWith('.eth')) {
        // Try ENS resolution
        const ensResult = await resolveENS(input);
        if (ensResult.success) {
          address = ensResult.address;
          walletType = ensResult.type;
          walletNickname = input;
        } else {
          throw new Error(ensResult.message);
        }
      } else {
        // Try Unstoppable Domain resolution
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
        address,
        nickname: walletNickname,
        type: walletType,
        networks: [],
      };

      logger.log('Searching for NFTs for wallet:', address);

      if (walletType === 'evm') {
        for (const network of networks.filter(n => n.type === 'evm')) {
          try {
            const { nfts } = await fetchNFTs(address, network.value);
            if (nfts.length > 0) {
              newWallet.networks.push(network.value);
              logger.log(`Found ${nfts.length} NFTs on ${network.label}`);
            }
          } catch (error) {
            logger.error(`Error fetching NFTs for ${address} on ${network.label}:`, error);
          }
        }
      } else if (walletType === 'solana') {
        try {
          const { nfts } = await fetchNFTs(address, 'solana');
          if (nfts.length > 0) {
            newWallet.networks.push('solana');
            logger.log(`Found ${nfts.length} NFTs on Solana`);
          }
        } catch (error) {
          logger.error(`Error fetching NFTs for Solana address ${address}:`, error);
        }
      }

      logger.log('New wallet object:', newWallet);

      const updatedWallets = [...wallets, newWallet];
      updateWallets(updatedWallets);
      setInput('');
      showSuccessToast("Wallet Added", `The ${walletType.toUpperCase()} wallet has been successfully added with ${newWallet.networks.length} active networks.`);
    } catch (error) {
      handleError(error, 'adding wallet');
      setError(`Error adding wallet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
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