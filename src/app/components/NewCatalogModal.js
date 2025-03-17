import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
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
  Input,
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
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { Select as ChakraReactSelect } from 'chakra-react-select';
import { supabase } from '../../utils/supabase';

// Helper function to truncate addresses
const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Custom Floating Label Input Component
const FloatingLabelInput = ({ value, onChange, placeholder, isRequired, showError, ...props }) => {
  return (
    <Box position="relative" width="100%">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        borderColor={showError ? "red.500" : "var(--shadow)"}
        _hover={{ borderColor: "var(--warm-brown)" }}
        _focus={{ 
          borderColor: "var(--warm-brown)",
          boxShadow: "0 0 0 1px var(--warm-brown)"
        }}
        pt={value ? "16px" : "8px"}
        pb={value ? "8px" : "8px"}
        fontFamily="Space Grotesk"
        {...props}
      />
      {value && (
        <Text
          position="absolute"
          top="2px"
          left="16px"
          fontSize="xs"
          color={showError ? "red.500" : "var(--ink-grey)"}
          fontFamily="Inter"
          pointerEvents="none"
          transition="all 0.2s"
        >
          {placeholder} {isRequired && "*"}
        </Text>
      )}
      {showError && (
        <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
          <AlertIcon />
          <Text fontSize="sm" fontFamily="Inter">This field is required</Text>
        </Alert>
      )}
    </Box>
  );
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
      <Box p={4} textAlign="center" color="var(--ink-grey)" fontFamily="Fraunces">
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
          ) ? "var(--highlight)" : "white"}
          _hover={{ bg: "var(--highlight)" }}
          cursor="pointer"
          onClick={() => onSelectArtifact(nft)}
          borderWidth="1px"
          borderColor="var(--shadow)"
          mb={1}
        >
          <Box flex={1}>
            <Text fontWeight="medium" fontFamily="Space Grotesk" color="var(--rich-black)">
              {nft.title}
            </Text>
            <Text fontSize="xs" color="var(--ink-grey)" fontFamily="Inter">
              {nft.walletNickname}
            </Text>
          </Box>
        </Flex>
      ))}
      {filteredNFTs.length === 0 && (
        <Text color="var(--ink-grey)" p={4} textAlign="center" fontFamily="Fraunces">
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
      bg="var(--highlight)"
      borderRadius="md"
      alignItems="center"
      gap={3}
      borderWidth="1px"
      borderColor="var(--shadow)"
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
        <Text fontWeight="medium" fontSize="sm" fontFamily="Space Grotesk" color="var(--rich-black)">
          {artifact.title || `Token ID: ${artifact.id?.tokenId}`}
        </Text>
        <Text fontSize="xs" color="var(--ink-grey)" fontFamily="Inter">
          {truncateAddress(artifact.walletId)}
        </Text>
      </Box>
      <IconButton
        icon={<FaTimes />}
        size="sm"
        variant="ghost"
        onClick={() => onRemove(artifact)}
        aria-label="Remove artifact"
        color="var(--ink-grey)"
        _hover={{ color: "var(--warm-brown)" }}
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

  // Handle folder select with multi-select
  const handleFolderSelect = useCallback((options) => {
    if (options && options.length > 0) {
      const selectedFolders = options.map(option => ({
        id: option.value,
        name: option.label,
        isNew: false
      }));
      
      handleFormUpdate({
        selectedFolders: selectedFolders
      });
      
    } else {
      handleFormUpdate({
        selectedFolders: []
      });
    }
  }, [handleFormUpdate]);

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
    return folders
      .filter(folder => !folder.isSystem)
      .map(folder => ({
        value: folder.id,
        label: folder.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [folders]);

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
  
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      logger.log('Starting catalog creation process:', {
        catalogName: formState.catalogName,
        selectedFolders: formState.selectedFolders,
        newCatalogId
      });
  
      // Prepare NFT IDs for the catalog
      const nftIds = formState.artifacts.map(artifact => ({
        tokenId: artifact.id.tokenId,
        contractAddress: artifact.contract.address,
        network: artifact.network,
        walletId: artifact.walletId
      }));
  
      // Create catalog in Redux first
      await dispatch(addCatalog({
        id: newCatalogId,
        name: formState.catalogName.trim(),
        nftIds: nftIds
      }));
  
      // Create catalog in Supabase
      const { error: catalogError } = await supabase
        .from('catalogs')
        .insert([{
          id: newCatalogId,
          user_id: user.id,
          name: formState.catalogName.trim(),
          description: "",
          is_system: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (catalogError) throw catalogError;
  
      logger.log('Catalog created successfully:', {
        catalogId: newCatalogId,
        name: formState.catalogName.trim()
      });
  
      // Add artifacts to catalog
      for (const artifact of formState.artifacts) {
        // Check if artifact exists in Supabase
        const { data: existingArtifact, error: findError } = await supabase
          .from('artifacts')
          .select('id')
          .eq('token_id', artifact.id.tokenId)
          .eq('contract_address', artifact.contract.address)
          .eq('wallet_id', artifact.walletId)
          .maybeSingle();
          
        if (findError) {
          logger.error('Error finding artifact:', findError);
          continue;
        }
        
        let artifactId;
        
        if (existingArtifact) {
          artifactId = existingArtifact.id;
        } else {
          // Create new artifact record
          const { data: newArtifact, error: insertError } = await supabase
            .from('artifacts')
            .insert([{
              token_id: artifact.id.tokenId,
              contract_address: artifact.contract.address,
              wallet_id: artifact.walletId,
              network: artifact.network,
              is_spam: artifact.isSpam || false,
              title: artifact.title || '',
              description: artifact.description || '',
              metadata: artifact.metadata || {}
            }])
            .select('id')
            .single();
            
          if (insertError) {
            logger.error('Error creating artifact:', insertError);
            continue;
          }
          
          artifactId = newArtifact.id;
        }
        
        // Create catalog-artifact relationship
        const { error: relError } = await supabase
          .from('catalog_artifacts')
          .insert([{
            catalog_id: newCatalogId,
            artifact_id: artifactId
          }]);
          
        if (relError) {
          logger.error('Error creating catalog-artifact relationship:', relError);
        }
      }
  
      // Handle folder assignments
      logger.log('Starting folder assignments:', {
        folderCount: formState.selectedFolders.length,
        folders: formState.selectedFolders
      });
  
      for (const folderInfo of formState.selectedFolders) {
        // Add to Redux
        await dispatch(addCatalogToFolder({
          folderId: folderInfo.id,
          catalogId: newCatalogId
        }));
        
        // Add to Supabase
        const { error: folderError } = await supabase
          .from('catalog_folders')
          .insert([{
            folder_id: folderInfo.id,
            catalog_id: newCatalogId
          }]);
          
        if (folderError) {
          logger.error('Error assigning catalog to folder:', folderError);
        }
      }
  
      logger.log('Catalog creation completed:', {
        catalogId: newCatalogId,
        name: formState.catalogName,
        assignedFolders: formState.selectedFolders.map(f => ({
          id: f.id,
          name: f.name
        }))
      });
  
      showSuccessToast(
        "Catalog Created",
        `Created catalog "${formState.catalogName.trim()}" with ${formState.artifacts.length} artifacts`
      );
      
      onClose();
    } catch (error) {
      logger.error('Error in catalog creation:', {
        error: error.message,
        catalogName: formState.catalogName,
        selectedFolders: formState.selectedFolders
      });
      showErrorToast(
        "Error",
        "Failed to create catalog"
      );
    } finally {
      handleFormUpdate({ isSubmitting: false });
    }
  };

  const handleClose = () => {
    setFormState(INITIAL_FORM_STATE);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(8px)" />
      <ModalContent 
        borderRadius="lg" 
        bg="white" 
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
      >
        <ModalHeader 
          fontFamily="Space Grotesk" 
          fontSize="xl" 
          color="var(--rich-black)"
        >
          Create New Catalog
        </ModalHeader>
        <ModalCloseButton 
          color="var(--ink-grey)" 
          _hover={{ color: "var(--warm-brown)" }} 
        />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Catalog Name Input */}
            <FormControl isRequired>
              <FloatingLabelInput
                value={formState.catalogName}
                onChange={handleCatalogNameChange}
                placeholder="Catalog Name"
                isRequired={true}
                showError={formState.showError}
              />
            </FormControl>

            {/* Folder Selection */}
            <FormControl>
              <Text 
                fontSize="sm" 
                mb={2} 
                fontFamily="Inter" 
                color="var(--ink-grey)"
              >
                Add to Folders (Optional)
              </Text>
              <Box position="relative">
                <ChakraReactSelect
                  options={folderOptions}
                  value={formState.selectedFolders.map(f => ({ value: f.id, label: f.name }))}
                  onChange={handleFolderSelect}
                  isMulti
                  closeMenuOnSelect={false}
                  placeholder="Select folders"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{ 
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? 'var(--warm-brown)' : 'var(--shadow)',
                      boxShadow: state.isFocused ? '0 0 0 1px var(--warm-brown)' : 'none',
                      outline: 'none',
                      '&:hover': {
                        borderColor: 'var(--warm-brown)',
                      },
                      fontFamily: 'Space Grotesk'
                    }),
                    menu: (base) => ({
                      ...base,
                      fontFamily: 'Space Grotesk',
                      zIndex: 9999,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid var(--shadow)'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected 
                        ? 'var(--warm-brown)' 
                        : state.isFocused 
                          ? 'var(--highlight)' 
                          : base.backgroundColor,
                      color: state.isSelected ? 'white' : 'var(--rich-black)',
                      '&:active': {
                        backgroundColor: 'var(--warm-brown)'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: 'var(--highlight)',
                      border: '1px solid var(--shadow)',
                      borderRadius: '16px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: 'var(--rich-black)',
                      fontFamily: 'Inter',
                      fontSize: '14px'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'var(--warm-brown)'
                      }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: 'var(--ink-grey)'
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: 'var(--ink-grey)',
                      '&:hover': {
                        color: 'var(--warm-brown)'
                      }
                    })
                  }}
                  noOptionsMessage={() => "No folders available"}
                  isDisabled={formState.isSubmitting}
                />
              </Box>
            </FormControl>

            {/* Selected Artifacts Section */}
            {formState.artifacts.length > 0 && (
              <Box>
                <Text 
                  fontSize="sm" 
                  mb={2} 
                  fontFamily="Inter" 
                  color="var(--ink-grey)"
                >
                  Selected Artifacts ({formState.artifacts.length})
                </Text>
                <Box 
                  maxHeight="200px" 
                  overflowY="auto"
                  borderWidth="1px"
                  borderColor="var(--shadow)"
                  borderRadius="md"
                  p={2}
                >
                  <VStack spacing={2} align="stretch">
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
                  <Text 
                    fontSize="sm" 
                    mb={2} 
                    fontFamily="Inter" 
                    color="var(--ink-grey)"
                  >
                    Search Artifacts
                  </Text>
                  <FloatingLabelInput
                    value={formState.searchTerm}
                    onChange={handleSearchTermChange}
                    placeholder="Search library artifacts"
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
            onClick={handleClose}
            color="var(--ink-grey)"
            fontFamily="Inter"
            _hover={{ color: "var(--warm-brown)", bg: "var(--highlight)" }}
            isDisabled={formState.isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateCatalog}
            bg="var(--warm-brown)"
            color="white"
            fontFamily="Inter"
            _hover={{ bg: "var(--deep-brown)" }}
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