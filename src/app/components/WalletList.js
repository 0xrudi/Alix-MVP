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
  Input,
  ButtonGroup,
  Button,
  Divider,
} from "@chakra-ui/react";
import { 
  FaEdit, 
  FaTrash, 
  FaEthereum, 
  FaCoins, 
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaCheck,
  FaTimes
} from 'react-icons/fa';
import { removeWallet, updateWallet } from '../redux/slices/walletSlice';
import { useCustomToast } from '../../utils/toastUtils';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const WalletCard = ({ wallet }) => {
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newNickname, setNewNickname] = useState(wallet.nickname || '');

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleDeleteWallet = () => {
    dispatch(removeWallet(wallet.id));
    showSuccessToast("Wallet Removed", "The wallet has been successfully removed from your list.");
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setNewNickname(wallet.nickname || '');
  };

  const handleSaveNickname = () => {
    try {
      dispatch(updateWallet({ 
        id: wallet.id, 
        nickname: newNickname.trim() || null 
      }));
      showSuccessToast("Wallet Updated", "The wallet nickname has been updated.");
      setIsEditing(false);
    } catch (error) {
      showErrorToast("Update Failed", "Failed to update wallet nickname.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewNickname(wallet.nickname || '');
  };

  return (
    <Box>
      <Flex 
        justify="space-between" 
        align="center" 
        py={3}
        borderBottom="1px solid"
        borderColor="var(--shadow)"
        transition="background-color 0.2s"
        _hover={{ bg: "var(--highlight)" }}
      >
        <HStack spacing={3} flex={1}>
          <IconButton
            icon={isExpanded ? <FaChevronDown /> : <FaChevronRight />}
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            color="var(--ink-grey)"
            _hover={{ color: "var(--warm-brown)" }}
            ml={1}
          />
          
          {isEditing ? (
            <Flex flex={1} align="center">
              <Input
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter wallet nickname"
                size="sm"
                mr={2}
                autoFocus
                fontFamily="Space Grotesk"
              />
              <ButtonGroup size="sm" isAttached variant="outline">
                <IconButton
                  icon={<FaCheck />}
                  aria-label="Save"
                  onClick={handleSaveNickname}
                  colorScheme="green"
                />
                <IconButton
                  icon={<FaTimes />}
                  aria-label="Cancel"
                  onClick={handleCancelEdit}
                  colorScheme="red"
                />
              </ButtonGroup>
            </Flex>
          ) : (
            <Text
              fontFamily="Space Grotesk"
              fontSize="md"
              color="var(--rich-black)"
            >
              {wallet.nickname || truncateAddress(wallet.address)}
            </Text>
          )}
        </HStack>

        {!isEditing && (
          <HStack spacing={2}>
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
            
            <IconButton
              icon={<FaEdit />}
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
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
        )}
      </Flex>

      <Collapse in={isExpanded}>
        <Box pt={4} pb={3} px={4} bg="var(--paper-white)">
          <HStack spacing={4} mb={isMobile ? 4 : 2}>
            <Tag
              size="sm"
              bg={wallet.type === 'evm' ? 'var(--warm-brown)' : 'var(--deep-brown)'}
              color="white"
              fontFamily="Inter"
            >
              {wallet.type === 'evm' ? <FaEthereum style={{marginRight: '4px'}} /> : <FaCoins style={{marginRight: '4px'}} />}
              {wallet.type.toUpperCase()}
            </Tag>
          </HStack>

          <Wrap spacing={2}>
            {wallet.networks && wallet.networks.map((network) => (
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
    <VStack spacing={0} align="stretch">
      {wallets.map((wallet) => (
        <WalletCard key={wallet.id} wallet={wallet} />
      ))}
    </VStack>
  );
};

export default WalletList;