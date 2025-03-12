import React, { useState, useEffect } from 'react';
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
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
} from "@chakra-ui/react";
import { 
  FaEdit, 
  FaTrash, 
  FaEthereum, 
  FaCoins, 
  FaInfoCircle,
  FaChevronDown,
  FaChevronRight,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { removeWallet, updateWallet } from '../../redux/slices/walletSlice';
import { clearWalletNFTs } from '../../redux/slices/nftSlice';
import { useCustomToast } from '../../../utils/toastUtils';
import { useServices } from '../../../services/service-provider';
import { logger } from '../../../utils/logger';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Create a unique ID for wallets to prevent duplicates
const getWalletUniqueId = (wallet) => {
  return wallet.id || `${wallet.address.toLowerCase()}-${wallet.type}`;
};

const WalletCard = ({ wallet, supabaseEnabled }) => {
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const toast = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNickname, setEditedNickname] = useState(wallet.nickname || '');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { walletService } = useServices();
  const cancelRef = React.useRef();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const handleDeleteWallet = async () => {
    try {
      // Delete from Supabase if connected
      if (supabaseEnabled) {
        await walletService.deleteWallet(wallet.id);
        logger.log('Deleted wallet from Supabase:', { id: wallet.id });
      }
      
      // Clear NFTs for this wallet from Redux
      dispatch(clearWalletNFTs({ walletId: wallet.id }));
      
      // Delete from Redux
      dispatch(removeWallet(wallet.id));
      showSuccessToast("Wallet Removed", "The wallet has been successfully removed from your list.");
      
      // Close dialog
      setIsDeleteDialogOpen(false);
    } catch (error) {
      showErrorToast("Error", `Failed to remove wallet: ${error.message}`);
      logger.error('Error removing wallet:', error);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveNickname = async () => {
    try {
      // Update in Supabase if connected
      if (supabaseEnabled) {
        await walletService.updateWalletNickname(wallet.id, editedNickname || null);
        logger.log('Updated wallet nickname in Supabase:', { id: wallet.id, nickname: editedNickname });
      }
      
      // Update in Redux
      dispatch(updateWallet({ id: wallet.id, nickname: editedNickname }));
      setIsEditing(false);
      showSuccessToast("Nickname Updated", "Wallet nickname has been updated successfully.");
    } catch (error) {
      showErrorToast("Error", `Failed to update nickname: ${error.message}`);
      logger.error('Error updating nickname:', error);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedNickname(wallet.nickname || '');
    setIsEditing(false);
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
          {isEditing ? (
            <Input
              value={editedNickname}
              onChange={(e) => setEditedNickname(e.target.value)}
              size="sm"
              width="auto"
              autoFocus
            />
          ) : (
            <Text
              fontFamily="Space Grotesk"
              fontSize="16px"
              color="var(--rich-black)"
            >
              {wallet.nickname || truncateAddress(wallet.address)}
            </Text>
          )}
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
          {isEditing ? (
            <>
              <IconButton
                icon={<FaSave />}
                variant="ghost"
                size="sm"
                onClick={handleSaveNickname}
                color="green.500"
                _hover={{ color: "green.600" }}
              />
              <IconButton
                icon={<FaTimes />}
                variant="ghost"
                size="sm"
                onClick={handleCancelEdit}
                color="var(--ink-grey)"
                _hover={{ color: "red.500" }}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={<FaEdit />}
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                color="var(--ink-grey)"
                _hover={{ color: "var(--warm-brown)" }}
              />
              <IconButton
                icon={<FaTrash />}
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                color="var(--ink-grey)"
                _hover={{ color: "red.500" }}
              />
            </>
          )}
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
            {wallet.networks?.map((network) => (
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Wallet
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to remove this wallet? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteWallet} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

const WalletList = ({ wallets, supabaseEnabled = false }) => {
  // Deduplicate wallets by using address as a key
  const [uniqueWallets, setUniqueWallets] = useState([]);
  
  useEffect(() => {
    // Create a Map with wallet address as key to deduplicate
    const walletsMap = new Map();
    
    wallets.forEach(wallet => {
      const uniqueId = getWalletUniqueId(wallet);
      if (!walletsMap.has(uniqueId)) {
        walletsMap.set(uniqueId, wallet);
      }
    });
    
    // Convert map back to array
    setUniqueWallets(Array.from(walletsMap.values()));
  }, [wallets]);

  if (!uniqueWallets.length) {
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
        {uniqueWallets.map((wallet) => (
          <WalletCard 
            key={getWalletUniqueId(wallet)} 
            wallet={wallet} 
            supabaseEnabled={supabaseEnabled}
          />
        ))}
      </VStack>
    </Box>
  );
};

export default WalletList;