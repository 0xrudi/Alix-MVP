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
          const tokens = [...(networkNFTs.ERC721 || []), ...(networkNFTs.ERC1155 || [])];
          
          tokens.forEach(nft => {
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
      const contractNameMatch = (nft.contract?.name || '').toLowerCase().includes(searchLower);
      
      return titleMatch || tokenIdMatch || contractNameMatch;
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
          key={`${nft.contract?.address}-${nft.id?.tokenId}`}
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
        } else {
          setImageUrl('https://via.placeholder.com/40?text=NFT');
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
      <Box width="40px" height="40px" borderRadius="md" overflow="hidden" flexShrink={0} bg="gray.100">
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

const initialFormState = {
  catalogName: '',
  selectedFolders: [],
  folderSearchTerm: '',
  showError: false,
  artifacts: [],
  searchTerm: ''
};

// Main Component
const NewCatalogModal = ({ isOpen, onClose, selectedArtifacts: initialArtifacts = [] }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  // Colors
  const existingFolderBg = useColorModeValue(FOLDER_COLORS.existing.light, FOLDER_COLORS.existing.dark);
  const newFolderBg = useColorModeValue(FOLDER_COLORS.new.light, FOLDER_COLORS.new.dark);

  // State
  const [formState, setFormState] = useState(initialFormState);

  // Update handlers
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
      if (prev.selectedFolders.some(f => f.id === option.value)) {
        return prev;
      }

      return {
        ...prev,
        selectedFolders: [
          ...prev.selectedFolders,
          {
            id: option.value,
            name: option.isNew ? option.name : option.label,
            isNew: option.isNew
          }
        ],
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
    setFormState(prev => ({
      ...prev,
      artifacts: [...prev.artifacts, nft]
    }));
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

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && initialArtifacts?.length > 0) {
      setFormState({
        ...initialFormState,  // Reset to initial state first
        artifacts: initialArtifacts // Then just set artifacts
      });
    } else if (!isOpen) {
      setFormState(initialFormState); // Use initialFormState directly
    }
  }, [isOpen]); // Remove initialArtifacts from deps - handle it in the effect

  // Folder options memoization
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

    // Memoize ArtifactSelector's props to prevent unnecessary re-renders
  const artifactSelectorProps = useMemo(() => ({
    selectedArtifacts: formState.artifacts,
    onSelectArtifact: handleAddArtifact,
    searchTerm: formState.searchTerm
  }), [formState.artifacts, formState.searchTerm, handleAddArtifact]);

  // Handle catalog creation
  const handleCreateCatalog = async () => {
    if (!formState.catalogName.trim()) {
      handleFormUpdate({ showError: true });
      return;
    }
  
    try {
      // Create new folders first if needed
      const folderPromises = formState.selectedFolders
        .filter(f => f.isNew)
        .map(folder => dispatch(addFolder({ name: folder.name.trim() })));
      
      await Promise.all(folderPromises);
  
      // Create the catalog without trying to unwrap the result
      const catalogAction = await dispatch(addCatalog({
        name: formState.catalogName.trim(),
        nftIds: formState.artifacts.map(nft => ({
          tokenId: nft.id.tokenId,
          contractAddress: nft.contract.address,
          network: nft.network,
          walletId: nft.walletId
        }))
      }));
  
      // Get the ID from the action payload
      const catalogId = `catalog-${Date.now()}`; // Generate ID the same way as the reducer
  
      // Get all folder IDs (both existing and newly created)
      const folderIds = formState.selectedFolders.map(folder => {
        if (folder.isNew) {
          // Find the newly created folder
          const newFolder = folders.find(f => f.name === folder.name.trim());
          return newFolder?.id;
        }
        return folder.id;
      }).filter(Boolean);
  
      // Add catalog to selected folders
      if (folderIds.length > 0) {
        await Promise.all(
          folderIds.map(folderId =>
            dispatch(addCatalogToFolder({
              folderId,
              catalogId
            }))
          )
        );
      }
  
      showSuccessToast(
        "Success",
        `Created catalog "${formState.catalogName}" and added to ${folderIds.length} folder(s)`
      );
      
      onClose();
    } catch (error) {
      logger.error('Error in catalog creation:', error);
      showErrorToast("Error", "Failed to create catalog");
    }
  };

  // Render JSX
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
                  />
                </FormControl>

                {formState.searchTerm && (
                  <Box mt={2}>
                    <ArtifactSelector {...artifactSelectorProps} />
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleCreateCatalog}>
            Create Catalog
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewCatalogModal;