import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  VStack,
  HStack,
  Input,
  Button,
  IconButton,
  Box,
  useToast,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FaPlus, FaTimes } from 'react-icons/fa';
import { addWallet, removeWallet, updateWallet } from '../redux/slices/walletSlice';
import { fetchWalletNFTs } from '../redux/thunks/walletThunks';
import { resolveENS, resolveUnstoppableDomain, isValidAddress, networks } from '../../utils/web3Utils';
import { logger } from '../../utils/logger';
import { useErrorHandler } from '../../utils/errorUtils';
import WalletList from './WalletList';
import { useServices } from '../../services/service-provider';

const WalletManager = () => {
  const dispatch = useDispatch();
  const wallets = useSelector(state => state.wallets.list);
  const { handleError } = useErrorHandler();
  const toast = useToast();
  const { user, walletService } = useServices();

  // State for managing multiple wallet inputs
  const [walletInputs, setWalletInputs] = useState([{ id: Date.now(), value: '', isLoading: false }]);
  
  // Keep track of wallets being processed
  const [processingWallets, setProcessingWallets] = useState(new Set());
  
  // Track if we're initially loading wallets from Supabase
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load wallets from Supabase on component mount
  useEffect(() => {
    if (user) {
      loadWalletsFromSupabase();
    } else {
      setIsInitialLoading(false);
    }
  }, [user]);

  // Load wallets from Supabase
  const loadWalletsFromSupabase = async () => {
    try {
      setIsInitialLoading(true);
      const userWallets = await walletService.getUserWallets(user.id);
      
      // Convert Supabase wallet format to Redux format
      userWallets.forEach(wallet => {
        dispatch(addWallet({
          id: wallet.id,
          address: wallet.address,
          nickname: wallet.nickname || '',
          type: wallet.type,
          networks: wallet.networks || [],
        }));
      });
      
      logger.log('Wallets loaded from Supabase:', { count: userWallets.length });
    } catch (err) {
      handleError(err, 'loading wallets from Supabase');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Handle input change for a specific field
  const handleInputChange = (id, value) => {
    setWalletInputs(prev => 
      prev.map(input => 
        input.id === id ? { ...input, value } : input
      )
    );
  };

  // Add a new input field
  const addInputField = () => {
    // Check if the last input is empty
    const lastInput = walletInputs[walletInputs.length - 1];
    if (!lastInput.value.trim()) {
      toast({
        title: "Empty Input",
        description: "Please fill in the current wallet address before adding another.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setWalletInputs(prev => [...prev, { id: Date.now(), value: '', isLoading: false }]);
  };

  // Remove an input field
  const removeInputField = (id) => {
    if (walletInputs.length === 1) return; // Keep at least one input
    setWalletInputs(prev => prev.filter(input => input.id !== id));
  };

  // Check if a wallet address already exists
  const isDuplicateAddress = (resolvedAddress) => {
    return wallets.some(wallet => 
      wallet.address.toLowerCase() === resolvedAddress.toLowerCase()
    );
  };

  // Process a single wallet
  const processWallet = async (input) => {
    let address = input.value;
    let walletType = '';
    let walletNickname = '';

    try {
      const addressCheck = isValidAddress(input.value);
      if (addressCheck.isValid) {
        address = input.value;
        walletType = addressCheck.type;
        
        // Check for duplicate address
        if (isDuplicateAddress(address)) {
          throw new Error(`Wallet address ${address} has already been added`);
        }
      } else if (input.value.toLowerCase().endsWith('.eth') || input.value.toLowerCase().includes('.')) {
        const ensResult = await resolveENS(input.value);
        if (ensResult.success) {
          // Check for duplicate resolved address
          if (isDuplicateAddress(ensResult.address)) {
            throw new Error(`This ENS name resolves to an address (${ensResult.address}) that has already been added`);
          }
          address = ensResult.address;
          walletType = ensResult.type;
          walletNickname = input.value;
        } else if (!input.value.toLowerCase().endsWith('.eth')) {
          const ensWithEth = await resolveENS(`${input.value}.eth`);
          if (ensWithEth.success) {
            // Check for duplicate resolved address
            if (isDuplicateAddress(ensWithEth.address)) {
              throw new Error(`This ENS name resolves to an address (${ensWithEth.address}) that has already been added`);
            }
            address = ensWithEth.address;
            walletType = ensWithEth.type;
            walletNickname = input.value;
          } else {
            throw new Error("ENS name not found or no address associated");
          }
        } else {
          throw new Error(ensResult.message);
        }
      } else {
        const udResult = await resolveUnstoppableDomain(input.value);
        if (udResult.success) {
          // Check for duplicate resolved address
          if (isDuplicateAddress(udResult.address)) {
            throw new Error(`This Unstoppable Domain resolves to an address (${udResult.address}) that has already been added`);
          }
          address = udResult.address;
          walletType = udResult.type;
          walletNickname = input.value;
        } else {
          throw new Error(udResult.message);
        }
      }

      // First add wallet to Supabase if we have a user
      let newWalletId;
      if (user) {
        const supabaseWallet = await walletService.addWallet(
          user.id,
          address,
          walletType,
          walletNickname || null
        );
        newWalletId = supabaseWallet.id;
        logger.log('Added wallet to Supabase:', { id: newWalletId, address });
      } else {
        // Generate a local ID if not connected to Supabase
        newWalletId = Date.now().toString();
      }

      // Then add to Redux
      const newWallet = {
        id: newWalletId,
        address,
        nickname: walletNickname,
        type: walletType,
        networks: [],
      };

      dispatch(addWallet(newWallet));

      // Start fetching NFTs for the new wallet
      const relevantNetworks = walletType === 'evm' 
        ? networks.filter(n => n.type === 'evm').map(n => n.value)
        : ['solana'];

      await dispatch(fetchWalletNFTs({ 
        walletId: newWallet.id, 
        address: newWallet.address, 
        networks: relevantNetworks 
      })).unwrap();

      toast({
        title: "Wallet Added",
        description: `Successfully added wallet ${walletNickname || address}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return { success: true };
    } catch (error) {
      handleError(error, 'adding wallet');
      throw error;
    }
  };

  // Handle adding wallets
  const handleAddWallets = async () => {
    // Filter out empty inputs
    const validInputs = walletInputs.filter(input => input.value.trim());
    
    if (validInputs.length === 0) {
      toast({
        title: "No Wallets",
        description: "Please enter at least one wallet address.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      // First check for duplicates before starting any processing
      for (const input of validInputs) {
        setWalletInputs(prev => 
          prev.map(inp => ({
            ...inp,
            isLoading: inp.id === input.id
          }))
        );

        try {
          await processWallet(input);
          
          // Clear this input since it was successful
          setWalletInputs(prev => 
            prev.filter(inp => inp.id !== input.id)
          );
        } catch (error) {
          // Clear loading state
          setWalletInputs(prev => 
            prev.map(inp => ({
              ...inp,
              isLoading: false
            }))
          );
          
          // Show error and stop processing
          toast({
            title: "Error Adding Wallet",
            description: error.message,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          
          // Exit early on any error
          return;
        }
      }

      // If all wallets were added successfully, ensure there's one empty input
      setWalletInputs([{ id: Date.now(), value: '', isLoading: false }]);

    } catch (error) {
      // Clear all loading states on unexpected error
      setWalletInputs(prev => 
        prev.map(input => ({
          ...input,
          isLoading: false
        }))
      );
      
      handleError(error, 'adding wallets');
    }
  };

  // Handle key press for enter/return
  const handleKeyPress = (e, input) => {
    if (e.key === 'Enter' && input.value.trim()) {
      handleAddWallets();
    }
  };

  if (isInitialLoading) {
    return (
      <Box textAlign="center" py={6}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4}>Loading wallets...</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch" maxW="600px">
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
          {walletInputs.map((input, index) => (
            <HStack key={input.id} width="100%" spacing={2}>
              <Input
                value={input.value}
                onChange={(e) => handleInputChange(input.id, e.target.value)}
                placeholder="Enter wallet address, ENS, or Unstoppable Domain"
                isDisabled={input.isLoading}
                onKeyPress={(e) => handleKeyPress(e, input)}
                bg={input.isLoading ? "gray.50" : "white"}
                _placeholder={{ color: 'var(--ink-grey)' }}
              />
              {input.isLoading && (
                <Box px={2}>
                  <Spinner size="sm" color="var(--warm-brown)" />
                </Box>
              )}
              {index === walletInputs.length - 1 ? (
                <IconButton
                  icon={<FaPlus />}
                  onClick={addInputField}
                  aria-label="Add another wallet"
                  isDisabled={!input.value.trim() || input.isLoading}
                  color="var(--ink-grey)"
                  _hover={{ color: "var(--warm-brown)" }}
                  variant="ghost"
                />
              ) : (
                <IconButton
                  icon={<FaTimes />}
                  onClick={() => removeInputField(input.id)}
                  aria-label="Remove wallet input"
                  isDisabled={input.isLoading}
                  color="var(--ink-grey)"
                  _hover={{ color: "red.500" }}
                  variant="ghost"
                />
              )}
            </HStack>
          ))}

          <Button
            onClick={handleAddWallets}
            width="full"
            bg="var(--warm-brown)"
            color="white"
            _hover={{
              bg: "var(--deep-brown)"
            }}
            isDisabled={walletInputs.every(input => !input.value.trim())}
          >
            Add Wallet{walletInputs.filter(i => i.value.trim()).length > 1 ? 's' : ''}
          </Button>
        </VStack>
      </Box>

      {/* Display existing wallets */}
      <WalletList wallets={wallets} supabaseEnabled={!!user} />
    </VStack>
  );
};

export default WalletManager;