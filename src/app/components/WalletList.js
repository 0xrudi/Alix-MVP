import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Text,
  VStack,
  IconButton,
  Flex,
  Tag,
  Wrap,
  WrapItem,
  HStack,
  Tooltip,
  Collapse,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  useBreakpointValue,
} from "@chakra-ui/react";
import { 
  FaEdit, 
  FaTrash, 
  FaEthereum, 
  FaCoins, 
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
} from 'react-icons/fa';
import { removeWallet, updateWallet } from '../redux/slices/walletSlice';
import { useCustomToast } from '../utils/toastUtils';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WalletCard = ({ wallet }) => {
  const dispatch = useDispatch();
  const { showSuccessToast } = useCustomToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleDeleteWallet = () => {
    dispatch(removeWallet(wallet.id));
    showSuccessToast("Wallet Removed", "The wallet has been successfully removed from your list.");
  };

  const handleNicknameChange = (newNickname) => {
    dispatch(updateWallet({ id: wallet.id, nickname: newNickname }));
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="var(--shadow)"
      borderRadius="md"
      p={4}
      transition="all 0.2s"
      _hover={{
        borderColor: "var(--warm-brown)",
        bg: "white",
        transform: "translateY(-2px)",
        boxShadow: "sm"
      }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <HStack spacing={2}>
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
          />
          <Text
            fontFamily="Space Grotesk"
            fontSize="16px"
            color="var(--rich-black)"
          >
            {wallet.nickname || truncateAddress(wallet.address)}
          </Text>
          <Popover trigger="hover" placement="top">
            <PopoverTrigger>
              <IconButton
                icon={<FaInfoCircle />}
                variant="ghost"
                size="sm"
                color="var(--ink-grey)"
                _hover={{ color: "var(--warm-brown)" }}
              />
            </PopoverTrigger>
            <PopoverContent 
              bg="var(--paper-white)" 
              borderColor="var(--shadow)"
              width="auto"
              p={2}
            >
              <PopoverBody>
                <Text fontFamily="Fraunces" fontSize="sm">
                  {wallet.address}
                </Text>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </HStack>

        <HStack spacing={2}>
          <IconButton
            icon={<FaEdit />}
            variant="ghost"
            size="sm"
            onClick={() => handleNicknameChange(wallet.id)}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
          />
          <IconButton
            icon={<FaTrash />}
            variant="ghost"
            size="sm"
            onClick={handleDeleteWallet}
            color="var(--ink-grey)"
            _hover={{ color: "red.500" }}
          />
        </HStack>
      </Flex>

      <Collapse in={isExpanded}>
        <Box pt={4}>
          <HStack spacing={4} mb={isMobile ? 4 : 2}>
            <Tag
              size="sm"
              bg={wallet.type === 'evm' ? 'var(--warm-brown)' : 'var(--deep-brown)'}
              color="white"
              fontFamily="Inter"
            >
              {wallet.type === 'evm' ? <FaEthereum /> : <FaCoins />}
              <Text ml={2}>{wallet.type.toUpperCase()}</Text>
            </Tag>
          </HStack>

          <Wrap spacing={2}>
            {wallet.networks.map((network) => (
              <WrapItem key={network}>
                <Tag
                  size="sm"
                  bg="var(--paper-white)"
                  color="var(--ink-grey)"
                  fontFamily="Inter"
                >
                  {network}
                </Tag>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      </Collapse>
    </Box>
  );
};

const WalletList = ({ wallets }) => {
  if (!wallets.length) {
    return (
      <Text
        fontFamily="Fraunces"
        color="var(--ink-grey)"
        textAlign="center"
        py={8}
      >
        No wallets added yet. Add a wallet to get started.
      </Text>
    );
  }

  return (
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
          <WalletCard key={wallet.id} wallet={wallet} />
        ))}
      </VStack>
    </Box>
  );
};

export default WalletList;