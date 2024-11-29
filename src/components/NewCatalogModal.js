import React, { useState, useEffect, useMemo, useRef } from 'react';
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
} from "@chakra-ui/react";
import { FaTimes } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addCatalog } from '../redux/slices/catalogSlice';
import { addFolder, selectAllFolders } from '../redux/slices/folderSlice';
import { useCustomToast } from '../utils/toastUtils';

const truncateAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

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


// Component to display individual selected artifacts with improved design
const SelectedArtifactItem = ({ artifact, onRemove }) => {
  // Add state for image loading
  const [imageUrl, setImageUrl] = useState('');

  // Load the image URL when component mounts
  useEffect(() => {
    const loadImage = async () => {
      try {
        // First try metadata.image
        if (artifact.metadata?.image) {
          setImageUrl(artifact.metadata.image);
          return;
        }
        // Then try media gateway
        if (artifact.media?.[0]?.gateway) {
          setImageUrl(artifact.media[0].gateway);
          return;
        }
        // Finally fall back to placeholder
        setImageUrl('https://via.placeholder.com/40?text=NFT');
      } catch (error) {
        console.error('Error loading image:', error);
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
      <Box
        width="40px"
        height="40px"
        borderRadius="md"
        overflow="hidden"
        flexShrink={0}
        bg="gray.100"
      >
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

// Searchable folder select component with creation capability
const FolderSelect = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const folders = useSelector(selectAllFolders);
  const inputRef = useRef(null);

  // Handle selecting an existing folder
  const handleSelectFolder = (folder) => {
    // Just pass up the folder ID - no immediate visual feedback
    onChange({ type: 'select', id: folder.id });
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Handle creating a new folder
  const handleCreateFolder = () => {
    // Pass up the pending folder info without creating it
    onChange({
      type: 'create',
      name: searchTerm
    });
    setSearchTerm('');
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Box position="relative">
      <Input
        ref={inputRef}
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
        }}
        placeholder="Search or create folder"
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && searchTerm && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          bg="white"
          boxShadow="lg"
          borderRadius="md"
          mt={2}
          maxH="200px"
          overflowY="auto"
          zIndex={1000}
          borderWidth={1}
        >
          {/* Show existing folders that match search */}
          {folders
            .filter(folder => 
              folder.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(folder => (
              <Box
                key={folder.id}
                p={2}
                cursor="pointer"
                _hover={{ bg: "gray.50" }}
                onClick={() => handleSelectFolder(folder)}
              >
                {folder.name}
              </Box>
            ))}
          
          {/* Always show create option if there's a search term */}
          <Box
            p={2}
            cursor="pointer"
            _hover={{ bg: "blue.50" }}
            onClick={handleCreateFolder}
            color="blue.500"
          >
            Create folder "{searchTerm}"
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Main catalog modal component
const NewCatalogModal = ({ 
  isOpen, 
  onClose, 
  folders = [],
  selectedArtifacts: initialArtifacts = []
}) => {
  const dispatch = useDispatch();
  const { showSuccessToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showError, setShowError] = useState(false);
  const [folderToCreate, setFolderToCreate] = useState(null);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [pendingFolder, setPendingFolder] = useState(null);

  // Initialize selected artifacts when modal opens
  useEffect(() => {
    if (isOpen && initialArtifacts.length > 0) {
      setSelectedArtifacts(initialArtifacts);
    }
  }, [isOpen, initialArtifacts]);

  const handleFolderChange = (folderAction) => {
    if (folderAction.type === 'select') {
      setSelectedFolder(folderAction.id);
      setPendingFolder(null);
    } else if (folderAction.type === 'create') {
      setSelectedFolder(null);
      setPendingFolder({
        name: folderAction.name,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleCreateCatalog = () => {
    // Input validation
    if (!catalogName.trim()) {
      setShowError(true);
      return;
    }
  
    let folderId = selectedFolder;
  
    // Create folder if there's a pending one
    if (pendingFolder) {
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: pendingFolder.name,
        createdAt: new Date().toISOString()
      };
      
      // Dispatch folder creation and capture the ID
      dispatch(addFolder(newFolder));
      // Important: Use this new folder's ID
      folderId = newFolder.id;
    }
  
    // Create catalog with proper NFT IDs mapping
    const newCatalog = {
      id: `catalog-${Date.now()}`,
      name: catalogName.trim(),
      nftIds: selectedArtifacts.map(nft => ({
        tokenId: nft.id?.tokenId,
        contractAddress: nft.contract?.address,
        network: nft.network,
        walletId: nft.walletId
      })),
      createdAt: new Date().toISOString(),
      isSystem: false,
      type: 'user',
      // IMPORTANT: This links the catalog to the folder
      folderId: folderId
    };
  
    // Create the catalog with the proper folder reference
    dispatch(addCatalog(newCatalog));
    
    showSuccessToast(
      "Catalog Created",
      `Your catalog "${catalogName}" has been created successfully.`
    );
    
    handleClose();
  };

  const handleClose = () => {
    setCatalogName('');
    setSelectedFolder('');
    setSelectedArtifacts([]); // Clear selected artifacts
    setSearchTerm('');
    setShowError(false);
    setPendingFolder(null);
    setIsNewFolderOpen(false);
    
    // Important: Call the parent onClose to properly update the parent component's state
    onClose();
  };

  const handleRemoveArtifact = (artifact) => {
    setSelectedArtifacts(prev => 
      prev.filter(selected => 
        selected.id?.tokenId !== artifact.id?.tokenId ||
        selected.contract?.address !== artifact.contract?.address
      )
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>New Catalog</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Catalog Name Input */}
            <Box>
              <Input
                value={catalogName}
                onChange={(e) => {
                  setCatalogName(e.target.value);
                  setShowError(false);
                }}
                placeholder="Enter catalog name"
              />
              {showError && (
                <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
                  <AlertIcon />
                  <Text fontSize="sm">Catalog name is required</Text>
                </Alert>
              )}
            </Box>

            {/* Folder Selection */}
            <FolderSelect
              onChange={handleFolderChange}
            />

            {/* Selected Artifacts Section */}
            {selectedArtifacts.length > 0 && (
              <Box>
                <Heading size="sm" mb={2}>
                  Selected Artifacts ({selectedArtifacts.length})
                </Heading>
                <Box maxHeight="300px" overflowY="auto">
                  <VStack spacing={2}>
                    {selectedArtifacts.map(artifact => (
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

            {/* Artifact Search Section - Only show if no initial artifacts */}
            {!initialArtifacts.length && (
              <>
                <Input
                  placeholder="Search library artifacts"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="lg"
                />
                {searchTerm && (
                  <Box mt={2}>
                    <ArtifactSelector
                      selectedArtifacts={selectedArtifacts}
                      onSelectArtifact={(nft) => setSelectedArtifacts(prev => [...prev, nft])}
                      searchTerm={searchTerm}
                    />
                  </Box>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
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