// src/app/components/ProfileManagement/RefreshMetadataButton.js
import React, { useState } from 'react';
import {
  Button,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Checkbox,
  Progress,
  Box,
  Heading,
  Alert,
  AlertIcon,
  useDisclosure
} from "@chakra-ui/react";
import { FaSync } from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { useCustomToast } from '../../../utils/toastUtils';
import { logger } from '../../../utils/logger';
import { refreshWalletMetadata } from '../../redux/thunks/walletThunks';

const RefreshMetadataButton = ({ buttonSize = "md", variant = "solid" }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const dispatch = useDispatch();
  const wallets = useSelector(state => state.wallets.list);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  // State
  const [selectedWallets, setSelectedWallets] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [results, setResults] = useState(null);
  
  // Toggle wallet selection
  const handleToggleWallet = (walletId) => {
    setSelectedWallets(prev => 
      prev.includes(walletId)
        ? prev.filter(id => id !== walletId)
        : [...prev, walletId]
    );
  };
  
  // Toggle all wallets
  const handleToggleAll = () => {
    if (selectedWallets.length === wallets.length) {
      setSelectedWallets([]);
    } else {
      setSelectedWallets(wallets.map(wallet => wallet.id));
    }
  };
  
  // Start the refresh process
  const handleRefresh = async () => {
    if (selectedWallets.length === 0) {
      showErrorToast("No Wallets Selected", "Please select at least one wallet to refresh metadata.");
      return;
    }
    
    setIsRefreshing(true);
    setRefreshProgress(0);
    setResults(null);
    
    const walletResults = [];
    let totalUpdated = 0;
    let totalProcessed = 0;
    
    try {
      for (let i = 0; i < selectedWallets.length; i++) {
        const walletId = selectedWallets[i];
        const wallet = wallets.find(w => w.id === walletId);
        
        setCurrentWallet(wallet);
        setRefreshProgress((i / selectedWallets.length) * 100);
        
        try {
          logger.log(`Refreshing metadata for wallet ${walletId}`);
          
          const result = await dispatch(refreshWalletMetadata({ walletId })).unwrap();
          
          walletResults.push({
            wallet,
            success: true,
            totalNFTs: result.totalNFTs,
            updatedCount: result.updatedCount
          });
          
          totalUpdated += result.updatedCount;
          totalProcessed += result.totalNFTs;
          
        } catch (error) {
          logger.error(`Error refreshing metadata for wallet ${walletId}:`, error);
          
          walletResults.push({
            wallet,
            success: false,
            error: error.message
          });
        }
      }
      
      setResults({
        walletResults,
        totalUpdated,
        totalProcessed
      });
      
      if (totalUpdated > 0) {
        showSuccessToast(
          "Metadata Refresh Complete",
          `Updated metadata for ${totalUpdated} artifacts across ${selectedWallets.length} wallets.`
        );
      } else {
        showSuccessToast(
          "Metadata Check Complete",
          `Checked ${totalProcessed} artifacts. No metadata needed updating.`
        );
      }
      
    } catch (error) {
      logger.error('Error in metadata refresh process:', error);
      showErrorToast(
        "Refresh Error",
        "An error occurred during the metadata refresh process."
      );
    } finally {
      setIsRefreshing(false);
      setRefreshProgress(100);
      setCurrentWallet(null);
    }
  };
  
  // Format wallet name/address for display
  const formatWalletName = (wallet) => {
    if (!wallet) return '';
    return wallet.nickname || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
  };
  
  return (
    <>
      <Button
        leftIcon={<Icon as={FaSync} />}
        onClick={onOpen}
        size={buttonSize}
        variant={variant}
        colorScheme="blue"
      >
        Refresh Artifact Metadata
      </Button>
      
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Refresh Artifact Metadata</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {!isRefreshing && !results ? (
              <VStack spacing={4} align="stretch">
                <Text>
                  This will check all artifacts in the selected wallets for missing metadata and attempt to retrieve it from IPFS/Arweave gateways. This process may take several minutes depending on the number of artifacts.
                </Text>
                
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  p={4} 
                  maxHeight="200px" 
                  overflowY="auto"
                >
                  <VStack spacing={2} align="stretch">
                    <Checkbox 
                      isChecked={selectedWallets.length === wallets.length}
                      onChange={handleToggleAll}
                      colorScheme="blue"
                      fontWeight="bold"
                    >
                      Select All Wallets
                    </Checkbox>
                    
                    {wallets.map(wallet => (
                      <Checkbox 
                        key={wallet.id}
                        isChecked={selectedWallets.includes(wallet.id)}
                        onChange={() => handleToggleWallet(wallet.id)}
                        colorScheme="blue"
                        ml={4}
                      >
                        {formatWalletName(wallet)}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            ) : isRefreshing ? (
              <VStack spacing={4} align="stretch">
                <Text>
                  Refreshing metadata for your artifacts. This process may take several minutes. Please do not close this window.
                </Text>
                
                <Progress value={refreshProgress} size="sm" colorScheme="blue" />
                
                {currentWallet && (
                  <Text fontSize="sm" color="gray.500">
                    Currently processing: {formatWalletName(currentWallet)}
                  </Text>
                )}
              </VStack>
            ) : (
              <VStack spacing={4} align="stretch">
                <Heading size="md">Refresh Complete</Heading>
                
                <Alert 
                  status={results.totalUpdated > 0 ? "success" : "info"} 
                  borderRadius="md"
                >
                  <AlertIcon />
                  {results.totalUpdated > 0 ? (
                    <Text>
                      Updated metadata for <strong>{results.totalUpdated}</strong> artifacts across <strong>{results.walletResults.length}</strong> wallets.
                    </Text>
                  ) : (
                    <Text>
                      Checked {results.totalProcessed} artifacts. All metadata is up to date.
                    </Text>
                  )}
                </Alert>
                
                <Box 
                  borderWidth="1px" 
                  borderRadius="md" 
                  p={4} 
                  maxHeight="200px" 
                  overflowY="auto"
                >
                  <VStack spacing={2} align="stretch">
                    {results.walletResults.map((result, index) => (
                      <Box key={index} p={2} borderRadius="md" bg={result.success ? "green.50" : "red.50"}>
                        <Text fontWeight="bold">
                          {formatWalletName(result.wallet)}
                        </Text>
                        {result.success ? (
                          <Text fontSize="sm">
                            Processed {result.totalNFTs} artifacts, updated {result.updatedCount} items
                          </Text>
                        ) : (
                          <Text fontSize="sm" color="red.500">
                            Error: {result.error}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          
          <ModalFooter>
            {!isRefreshing && !results ? (
              <>
                <Button 
                  variant="ghost" 
                  mr={3} 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  colorScheme="blue" 
                  onClick={handleRefresh}
                  isDisabled={selectedWallets.length === 0}
                >
                  Refresh Metadata
                </Button>
              </>
            ) : isRefreshing ? (
              <Button 
                isDisabled
                colorScheme="blue"
              >
                Refreshing...
              </Button>
            ) : (
              <Button 
                colorScheme="blue" 
                onClick={onClose}
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default RefreshMetadataButton;