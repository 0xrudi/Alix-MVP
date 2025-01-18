import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Button,
  VStack,
  Box,
  Text,
  Image,
  Alert,
  AlertIcon,
  Flex,
  Heading,
  IconButton,
  FormControl,
  FormLabel,
  useColorModeValue,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
} from "@chakra-ui/react";
import { FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addCatalog } from '../redux/slices/catalogSlice';
import { addFolder, addCatalogToFolder, selectAllFolders } from '../redux/slices/folderSlice';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';
import { Select as ChakraReactSelect } from 'chakra-react-select';

// Constants
const FOLDER_COLORS = {
  existing: {
    light: 'blue.100',
    dark: 'blue.700'
  },
  new: {
    light: 'green.100',
    dark: 'green.700'
  }
};

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Artifact Selector Component
const ArtifactSelector = ({ selectedArtifacts, onSelectArtifact, searchTerm }) => {
  const wallets = useSelector(state => state.wallets.list);
  const nftsByWallet = useSelector(state => state.nfts.byWallet);
  
  const allNFTs = useMemo(() => {
    const nftMap = new Map();
    
    wallets.forEach(wallet => {
      const walletNFTs = nftsByWallet[wallet.id];
      if (walletNFTs) {
        Object.entries(walletNFTs).forEach(([network, networkNFTs]) => {
          [...(networkNFTs.ERC721 || []), ...(networkNFTs.ERC1155 || [])].forEach(nft => {
            if (!nft.isSpam && nft.title && nft.contract?.address && nft.id?.tokenId) {
              const key = `${nft.contract.address}-${nft.id.tokenId}`;
              if (!nftMap.has(key)) {
                nftMap.set(key, {
                  ...nft,
                  network,
                  walletId: wallet.id,
                  walletNickname: wallet.nickname || truncateAddress(wallet.address)
                });
              }
            }
          });
        });
      }
    });
    
    return Array.from(nftMap.values());
  }, [wallets, nftsByWallet]);

  const filteredNFTs = useMemo(() => {
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return allNFTs.filter(nft => {
      const titleMatch = (nft.title || '').toLowerCase().includes(searchLower);
      const tokenIdMatch = (nft.id?.tokenId || '').toString().toLowerCase().includes(searchLower);
      const contractMatch = (nft.contract?.name || '').toLowerCase().includes(searchLower);
      
      return titleMatch || tokenIdMatch || contractMatch;
    });
  }, [allNFTs, searchTerm]);

  if (!searchTerm.trim()) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        Begin typing to search your library
      </Box>
    );
  }

  return (
    <Box maxH="300px" overflowY="auto">
      {filteredNFTs.map(nft => (
        <Flex
          key={`${nft.contract?.address}-${nft.id?.tokenId}-${nft.network}`}
          p={2}
          borderRadius="md"
          alignItems="center"
          bg={selectedArtifacts.some(
            selected => 
              selected.id?.tokenId === nft.id?.tokenId &&
              selected.contract?.address === nft.contract?.address
          ) ? "blue.50" : "white"}
          _hover={{ bg: "gray.50" }}
          cursor="pointer"
          onClick={() => onSelectArtifact(nft)}
        >
          <Box flex={1}>
            <Text fontWeight="medium">{nft.title}</Text>
            <Text fontSize="xs" color="gray.600">{nft.walletNickname}</Text>
          </Box>
        </Flex>
      ))}
      {filteredNFTs.length === 0 && (
        <Text color="gray.500" p={4} textAlign="center">
          No artifacts found matching "{searchTerm}"
        </Text>
      )}
    </Box>
  );
};

// Selected Artifact Item Component
const SelectedArtifactItem = ({ artifact, onRemove }) => {
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (artifact.metadata?.image) {
          setImageUrl(artifact.metadata.image);
        } else if (artifact.media?.[0]?.gateway) {
          setImageUrl(artifact.media[0].gateway);
        }
      } catch (error) {
        logger.error('Error loading artifact image:', error);
        setImageUrl('https://via.placeholder.com/40?text=NFT');
      }
    };
    loadImage();
  }, [artifact]);

  return (
    <Flex
      width="100%"
      p={2}
      bg="blue.50"
      borderRadius="md"
      alignItems="center"
      gap={3}
    >
      <Box width="40px" height="40px" borderRadius="md" overflow="hidden" flexShrink={0}>
        <Image
          src={imageUrl}
          alt={artifact.title}
          width="100%"
          height="100%"
          objectFit="cover"
          fallbackSrc="https://via.placeholder.com/40?text=NFT"
        />
      </Box>
      <Box flex={1}>
        <Text fontWeight="medium" fontSize="sm">
          {artifact.title || `Token ID: ${artifact.id?.tokenId}`}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {truncateAddress(artifact.walletId)}
        </Text>
      </Box>
      <IconButton
        icon={<FaTimes />}
        size="sm"
        variant="ghost"
        onClick={() => onRemove(artifact)}
        aria-label="Remove artifact"
      />
    </Flex>
  );
};

// Initial form state constant
const INITIAL_FORM_STATE = {
  catalogName: '',
  selectedFolders: [],
  folderSearchTerm: '',
  showError: false,
  artifacts: [],
  searchTerm: '',
  isSubmitting: false
};

// Main Component
const NewCatalogModal = ({ isOpen, onClose, selectedArtifacts: initialArtifacts = [] }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Colors
  const existingFolderBg = useColorModeValue(FOLDER_COLORS.existing.light, FOLDER_COLORS.existing.dark);
  const newFolderBg = useColorModeValue(FOLDER_COLORS.new.light, FOLDER_COLORS.new.dark);

  // Form state
  const [formState, setFormState] = useState(INITIAL_FORM_STATE);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && initialArtifacts?.length > 0) {
      setFormState({
        ...INITIAL_FORM_STATE,
        artifacts: initialArtifacts
      });
    } else if (!isOpen) {
      setFormState(INITIAL_FORM_STATE);
    }
  }, [isOpen, initialArtifacts]);

  // Handlers
  const handleFormUpdate = useCallback((updates) => {
    setFormState(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const handleCatalogNameChange = useCallback((e) => {
    handleFormUpdate({
      catalogName: e.target.value,
      showError: false
    });
  }, [handleFormUpdate]);

  const handleSearchTermChange = useCallback((e) => {
    handleFormUpdate({
      searchTerm: e.target.value
    });
  }, [handleFormUpdate]);

  const handleFolderInputChange = useCallback((value) => {
    handleFormUpdate({
      folderSearchTerm: value
    });
  }, [handleFormUpdate]);

  const handleFolderSelect = useCallback((option) => {
    if (!option) return;
    
    setFormState(prev => {
      // Prevent duplicate folder selections
      if (prev.selectedFolders.some(f => f.id === option.value)) {
        return prev;
      }

      const newFolder = {
        id: option.value,
        name: option.isNew ? option.name : option.label,
        isNew: option.isNew
      };

      return {
        ...prev,
        selectedFolders: [...prev.selectedFolders, newFolder],
        folderSearchTerm: ''
      };
    });
  }, []);

  const handleRemoveFolder = useCallback((folderId) => {
    setFormState(prev => ({
      ...prev,
      selectedFolders: prev.selectedFolders.filter(f => f.id !== folderId)
    }));
  }, []);

  const handleAddArtifact = useCallback((nft) => {
    setFormState(prev => {
      // Prevent duplicate artifacts
      if (prev.artifacts.some(a => 
        a.id.tokenId === nft.id.tokenId && 
        a.contract.address === nft.contract.address
      )) {
        return prev;
      }

      return {
        ...prev,
        artifacts: [...prev.artifacts, nft]
      };
    });
  }, []);

  const handleRemoveArtifact = useCallback((artifact) => {
    setFormState(prev => ({
      ...prev,
      artifacts: prev.artifacts.filter(selected => 
        selected.id?.tokenId !== artifact.id?.tokenId ||
        selected.contract?.address !== artifact.contract?.address
      )
    }));
  }, []);

  // Folder options
  const folderOptions = useMemo(() => {
    const existingFolders = folders
      .filter(folder => !folder.isSystem)
      .map(folder => ({
        value: folder.id,
        label: folder.name,
        isNew: false
      }));

    const searchTerm = formState.folderSearchTerm?.trim();
    if (searchTerm && !folders.some(f => 
      f.name.toLowerCase() === searchTerm.toLowerCase()
    )) {
      return [
        {
          value: `new-${searchTerm}`,
          label: `Create "${searchTerm}" folder`,
          isNew: true,
          name: searchTerm
        },
        ...existingFolders
      ];
    }
    return existingFolders;
  }, [folders, formState.folderSearchTerm]);

  // Create catalog with proper error handling and state management
  const handleCreateCatalog = async () => {
    if (!formState.catalogName.trim()) {
      handleFormUpdate({ showError: true });
      return;
    }
  
    if (formState.isSubmitting) {
      return;
    }
  
    try {
      handleFormUpdate({ isSubmitting: true });
      const newCatalogId = `catalog-${Date.now()}`;
  
      // Create catalog first
      await dispatch(addCatalog({
        id: newCatalogId,
        name: formState.catalogName.trim(),
        nftIds: formState.artifacts.map(artifact => ({
          tokenId: artifact.id.tokenId,
          contractAddress: artifact.contract.address,
          network: artifact.network,
          walletId: artifact.walletId
        }))
      }));
  
      // Handle folder assignments sequentially to avoid race conditions
      if (formState.selectedFolders.length > 0) {
        for (const folderInfo of formState.selectedFolders) {
          if (folderInfo.isNew) {
            await dispatch(addFolder({ 
              name: folderInfo.name,
              // Initialize with empty relationships
              relationships: new Set()
            }));
          }
          // Add catalog to folder
          await dispatch(addCatalogToFolder({
            folderId: folderInfo.id,
            catalogId: newCatalogId,
            // Initialize as empty Set if needed
            relationships: new Set([newCatalogId])
          }));
        }
      }
  
      logger.log('Created catalog with folders:', {
        catalogId: newCatalogId,
        name: formState.catalogName,
        folders: formState.selectedFolders
      });
  
      showSuccessToast(
        "Success",
        `Created catalog "${formState.catalogName.trim()}" with ${formState.selectedFolders.length} folder(s)`
      );
      
      onClose();
    } catch (error) {
      logger.error('Error creating catalog:', error);
      showErrorToast(
        "Error",
        "Failed to create catalog"
      );
    } finally {
      handleFormUpdate({ isSubmitting: false });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Catalog</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Catalog Name Input */}
            <FormControl isRequired>
              <FormLabel>Catalog Name</FormLabel>
              <Input
                value={formState.catalogName}
                onChange={handleCatalogNameChange}
                placeholder="Enter catalog name"
              />
              {formState.showError && (
                <Alert status="error" mt={2} py={2} px={3} borderRadius="md">
                  <AlertIcon />
                  <Text fontSize="sm">Catalog name is required</Text>
                </Alert>
              )}
            </FormControl>

            {/* Folder Selection */}
            <FormControl>
              <FormLabel>Add to Folders (Optional)</FormLabel>
              <ChakraReactSelect
                options={folderOptions}
                value={null}
                inputValue={formState.folderSearchTerm}
                onInputChange={handleFolderInputChange}
                onChange={handleFolderSelect}
                placeholder="Select or create folder"
                isClearable
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                isDisabled={formState.isSubmitting}
              />
              
              {formState.selectedFolders.length > 0 && (
                <Box mt={2}>
                  <Wrap spacing={2}>
                    {formState.selectedFolders.map(folder => (
                      <WrapItem key={folder.id}>
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant="subtle"
                          bg={folder.isNew ? newFolderBg : existingFolderBg}
                        >
                          <TagLabel>{folder.name}</TagLabel>
                          <TagCloseButton 
                            onClick={() => handleRemoveFolder(folder.id)}
                            isDisabled={formState.isSubmitting}
                          />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}
            </FormControl>

            {/* Selected Artifacts Section */}
            {formState.artifacts.length > 0 && (
              <Box>
                <Heading size="sm" mb={2}>
                  Selected Artifacts ({formState.artifacts.length})
                </Heading>
                <Box maxHeight="300px" overflowY="auto">
                  <VStack spacing={2}>
                    {formState.artifacts.map(artifact => (
                      <SelectedArtifactItem
                        key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
                        artifact={artifact}
                        onRemove={handleRemoveArtifact}
                      />
                    ))}
                  </VStack>
                </Box>
              </Box>
            )}

            {/* Artifact Search Section */}
            {!initialArtifacts.length && (
              <>
                <FormControl>
                  <FormLabel>Search Artifacts</FormLabel>
                  <Input
                    placeholder="Search library artifacts"
                    value={formState.searchTerm}
                    onChange={handleSearchTermChange}
                    size="lg"
                    isDisabled={formState.isSubmitting}
                  />
                </FormControl>

                {formState.searchTerm && (
                  <Box mt={2}>
                    <ArtifactSelector
                      selectedArtifacts={formState.artifacts}
                      onSelectArtifact={handleAddArtifact}
                      searchTerm={formState.searchTerm}
                    />
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={onClose}
            isDisabled={formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleCreateCatalog}
            isLoading={formState.isSubmitting}
            loadingText="Creating..."
          >
            Create Catalog
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewCatalogModal;