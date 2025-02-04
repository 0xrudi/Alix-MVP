import React, { useState } from 'react';
import { useCustomColorMode } from '../hooks/useColorMode';
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
  useBreakpointValue,
  FormControl
} from "@chakra-ui/react";
import { 
  FaChevronRight, 
  FaChevronDown, 
  FaPencilAlt, 
  FaTrash, 
  FaEthereum,
  FaCoins,
  FaEdit
} from 'react-icons/fa';
import { 
  resolveENS, 
  resolveUnstoppableDomain, 
  isValidAddress, 
  networks 
} from '../utils/web3Utils';
import { logger } from '../utils/logger';
import { useCustomToast } from '../utils/toastUtils';
import { useErrorHandler } from '../utils/errorUtils';
import { addWallet, removeWallet, updateWallet } from '../redux/slices/walletSlice';
import { 
  StyledCard, 
  StyledButton, 
  StyledInput 
} from '../styles/commonStyles';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WalletCard = ({ wallet, onDelete, onUpdateNickname }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(wallet.nickname || '');
  
  const buttonSize = useBreakpointValue({ base: "xs", md: "sm" });
  const tagSize = useBreakpointValue({ base: "sm", md: "md" });
  const { cardBg, borderColor, textColor } = useCustomColorMode();

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
    <StyledCard interactive p={4} mb={3}>
      <Flex align="center" justify="space-between">
        <HStack spacing={4} flex={1}>
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            variant="ghost"
            size={buttonSize}
            onClick={() => setIsExpanded(!isExpanded)}
            color={textColor}
            _hover={{ color: "var(--warm-brown)" }}
          />
          <Box flex={1}>
            {isEditing ? (
              <StyledInput
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={handleNicknameSubmit}
                onKeyPress={handleKeyPress}
                size={buttonSize}
                placeholder="Enter nickname"
                autoFocus
              />
            ) : (
              <Text
                fontFamily="Fraunces"
                fontSize="16px"
                color={textColor}
              >
                {wallet.nickname || truncateAddress(wallet.address)}
                {wallet.nickname && (
                  <Text
                    as="span"
                    fontFamily="Inter"
                    fontSize="14px"
                    color="gray.500"
                    ml={2}
                  >
                    ({truncateAddress(wallet.address)})
                  </Text>
                )}
              </Text>
            )}
          </Box>
        </HStack>
        
        <HStack spacing={2}>
          <IconButton
            icon={<FaEdit />}
            variant="ghost"
            size={buttonSize}
            onClick={() => setIsEditing(true)}
            color={textColor}
            _hover={{ color: "var(--warm-brown)" }}
          />
          <IconButton
            icon={<FaTrash />}
            variant="ghost"
            size={buttonSize}
            onClick={() => onDelete(wallet.id)}
            color={textColor}
            _hover={{ color: "red.500" }}
          />
        </HStack>
      </Flex>

      <Collapse in={isExpanded}>
        <Box
          mt={4}
          pt={4}
          borderTop="1px solid"
          borderColor={borderColor}
        >
          <VStack align="stretch" spacing={3}>
            <HStack>
              <Tag
                size={tagSize}
                bg={wallet.type === 'evm' ? 'var(--warm-brown)' : 'var(--deep-brown)'}
                color="white"
                fontFamily="Inter"
              >
                {wallet.type === 'evm' ? <FaEthereum /> : <FaCoins />}
                <Text ml={2}>{wallet.type.toUpperCase()}</Text>
              </Tag>
            </HStack>
            
            <Box>
              <Text
                fontSize="14px"
                fontFamily="Inter"
                color="gray.500"
                mb={2}
              >
                Active Networks:
              </Text>
              <Wrap spacing={2}>
                {wallet.networks.map((network) => (
                  <Tag
                    key={network}
                    size={tagSize}
                    bg={cardBg}
                    color={textColor}
                    fontFamily="Inter"
                    border="1px solid"
                    borderColor={borderColor}
                  >
                    {network}
                  </Tag>
                ))}
              </Wrap>
            </Box>
          </VStack>
        </Box>
      </Collapse>
    </StyledCard>
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

  // Responsive styles
  const spacing = useBreakpointValue({ base: 4, md: 6 });
  const inputSize = useBreakpointValue({ base: "sm", md: "md" });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });

  const handleAddWallet = async () => {
    setError('');
    setIsLoading(true);
    let address = input;
    let walletType = '';
    let walletNickname = '';
  
    try {
      const addressCheck = isValidAddress(input);
      if (addressCheck.isValid) {
        address = input;
        walletType = addressCheck.type;
      } else if (input.toLowerCase().endsWith('.eth') || input.toLowerCase().includes('.')) {
        showInfoToast("Resolving Address", "Attempting to resolve ENS name...");
        
        const ensResult = await resolveENS(input);
        if (ensResult.success) {
          address = ensResult.address;
          walletType = ensResult.type;
          walletNickname = input;
        } else {
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
  
      dispatch(addWallet(newWallet));
  
      const relevantNetworks = walletType === 'evm' 
        ? networks.filter(n => n.type === 'evm').map(n => n.value)
        : ['solana'];
  
      showInfoToast(
        "Scanning Networks", 
        `Checking ${relevantNetworks.length} networks for NFTs...`
      );
  
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
    <VStack spacing={spacing} align="stretch" maxW="600px">
      <Box
        bg="white"
        borderWidth="1px"
        borderColor="var(--shadow)"
        borderRadius="12px"
        p={6}
      >
        <Text
          fontSize="18px"
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
          mb={4}
        >
          Add New Wallet
        </Text>
        <VStack spacing={4}>
          <FormControl isInvalid={!!error}>
            <StyledInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter wallet address, ENS, or Unstoppable Domain"
              size={inputSize}
              color="var(--rich-black)"
              _placeholder={{ color: 'var(--ink-grey)' }}
            />
            {error && (
              <Text 
                color="red.500" 
                fontSize="sm" 
                fontFamily="Inter"
                mt={1}
              >
                {error}
              </Text>
            )}
          </FormControl>
          <StyledButton 
            onClick={handleAddWallet} 
            isLoading={isLoading} 
            loadingText="Adding wallet..."
            width="full"
            size={buttonSize}
            bg="var(--warm-brown)"
            color="white"
            _hover={{
              bg: "var(--deep-brown)"
            }}
          >
            Add Wallet
          </StyledButton>
        </VStack>
      </Box>
      
      {wallets.length > 0 ? (
        <Box
          bg="white"
          borderWidth="1px"
          borderColor="var(--shadow)"
          borderRadius="12px"
          p={6}
        >
          <Text
            fontSize="18px"
            fontFamily="Space Grotesk"
            color="var(--rich-black)"
            mb={4}
          >
            Your Wallets
          </Text>
          <VStack spacing={3} align="stretch">
            {wallets.map((wallet) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                onDelete={handleDeleteWallet}
                onUpdateNickname={handleNicknameChange}
              />
            ))}
          </VStack>
        </Box>
      ) : (
        <Text
          fontFamily="Fraunces"
          color="var(--ink-grey)"
          textAlign="center"
          py={8}
        >
          No wallets added yet. Add a wallet to get started.
        </Text>
      )}
    </VStack>
  );
};

export default WalletManager;