// src/components/WalletManager.js
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  VStack,
  Input,
  Text,
  Box,
  Tag,
  Wrap,
  WrapItem,
  IconButton,
  Flex,
  Collapse,
  useColorModeValue,
  Tooltip,
  HStack,
} from "@chakra-ui/react";
import { 
  FaChevronRight, 
  FaChevronDown, 
  FaPencilAlt, 
  FaTrash, 
  FaEthereum,
  FaCoins,
} from 'react-icons/fa';
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

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Wallet Card Component
const WalletCard = ({ wallet, onDelete, onUpdateNickname }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(wallet.nickname || '');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');

  const handleNicknameSubmit = () => {
    onUpdateNickname(wallet.id, nickname);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleNicknameSubmit();
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      p={4}
      mb={2}
      transition="all 0.2s"
      _hover={{ bg: hoverBg }}
      width="100%"
    >
      {/* Header Section - Always Visible */}
      <Flex align="center" justify="space-between">
        <Flex align="center" flex={1}>
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          />
          <Box ml={2} flex={1}>
            {isEditing ? (
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={handleNicknameSubmit}
                onKeyPress={handleKeyPress}
                size="sm"
                width="auto"
                placeholder="Enter nickname"
                autoFocus
              />
            ) : (
              <HStack spacing={2}>
                <Text fontWeight="medium">
                  {wallet.nickname || truncateAddress(wallet.address)}
                </Text>
                {wallet.nickname && (
                  <Text fontSize="sm" color="gray.500">
                    ({truncateAddress(wallet.address)})
                  </Text>
                )}
              </HStack>
            )}
          </Box>
        </Flex>
        
        <HStack spacing={2}>
          <Tooltip label="Edit Nickname">
            <IconButton
              icon={<FaPencilAlt />}
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              aria-label="Edit nickname"
            />
          </Tooltip>
          <Tooltip label="Delete Wallet">
            <IconButton
              icon={<FaTrash />}
              variant="ghost"
              size="sm"
              colorScheme="red"
              onClick={() => onDelete(wallet.id)}
              aria-label="Delete wallet"
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Expanded Content */}
      <Collapse in={isExpanded}>
        <VStack align="stretch" mt={4} pl={10} spacing={3}>
          <HStack>
            <Tag size="md" colorScheme={wallet.type === 'evm' ? 'green' : 'purple'}>
              {wallet.type === 'evm' ? <FaEthereum /> : <FaCoins />}
              <Text ml={2}>{wallet.type.toUpperCase()}</Text>
            </Tag>
          </HStack>
          
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1}>Active Networks:</Text>
            <Wrap spacing={2}>
              {wallet.networks.map((network) => (
                <WrapItem key={network}>
                  <Tag size="sm" colorScheme="blue" borderRadius="full">
                    {network}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        </VStack>
      </Collapse>
    </Box>
  );
};

const WalletManager = () => {
  const dispatch = useDispatch();
  const wallets = useSelector(state => state.wallets.list);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();
  const { handleError } = useErrorHandler();

  // Keep the existing handleAddWallet implementation
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
    <VStack spacing={6} align="stretch" maxW="600px">
      {/* Keep existing Add New Wallet section */}
      <StyledCard>
        <Text fontSize="lg" fontWeight="bold" mb={4}>Add New Wallet</Text>
        <VStack spacing={4}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter wallet address, ENS, or Unstoppable Domain"
          />
          <StyledButton 
            onClick={handleAddWallet} 
            isLoading={isLoading} 
            loadingText="Adding wallet..."
            width="full"
          >
            Add Wallet
          </StyledButton>
          {error && <Text color="red.500">{error}</Text>}
        </VStack>
      </StyledCard>
      
      {/* Updated Your Wallets section with new card design */}
      {wallets.length > 0 ? (
        <StyledCard>
          <Text fontSize="lg" fontWeight="bold" mb={4}>Your Wallets</Text>
          <VStack spacing={2} align="stretch">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onDelete={handleDeleteWallet}
                onUpdateNickname={handleNicknameChange}
              />
            ))}
          </VStack>
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