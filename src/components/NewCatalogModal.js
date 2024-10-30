import React, { useState, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Input,
  Button,
  VStack,
  Box,
  Alert,
  AlertIcon,
  Text,
  HStack,
  Divider,
  Select,
  Flex,
  Badge,
  Wrap,
  WrapItem,
  Icon,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { 
  FaChevronUp, 
  FaChevronDown, 
  FaTimes,
  FaSearch 
} from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addCatalog } from '../redux/slices/catalogSlice';
import { selectAllFolders } from '../redux/slices/folderSlice';
import ListViewItem from './ListViewItem';
import { useCustomToast } from '../utils/toastUtils';

const SelectedArtifactsSection = ({ selectedArtifacts, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasArtifacts = selectedArtifacts.length > 0;

  return (
    <Box 
      borderWidth="1px"
      borderRadius="md"
      borderColor="gray.200"
      bg="gray.50"
    >
      <Flex 
        p={3}
        alignItems="center"
        cursor={hasArtifacts ? "pointer" : "default"}
        onClick={() => hasArtifacts && setIsExpanded(!isExpanded)}
        _hover={hasArtifacts ? { bg: "gray.100" } : {}}
      >
        <Text fontWeight="medium">
          {selectedArtifacts.length} {selectedArtifacts.length === 1 ? 'artifact' : 'artifacts'} selected
        </Text>
        {hasArtifacts && (
          <Icon
            as={isExpanded ? FaChevronUp : FaChevronDown}
            ml="auto"
            fontSize="sm"
          />
        )}
      </Flex>

      <Collapse in={isExpanded && hasArtifacts}>
        <Box p={3} pt={0}>
          <Wrap spacing={2}>
            {selectedArtifacts.map(artifact => (
              <WrapItem 
                key={`${artifact.contract?.address}-${artifact.id?.tokenId}`}
              >
                <Badge
                  colorScheme="blue"
                  borderRadius="full"
                  px={2}
                  py={1}
                  display="flex"
                  alignItems="center"
                >
                  <Text>{artifact.title || `#${artifact.id?.tokenId}`}</Text>
                  <IconButton
                    icon={<FaTimes />}
                    size="xs"
                    variant="ghost"
                    ml={1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(artifact);
                    }}
                    aria-label="Remove artifact"
                  />
                </Badge>
              </WrapItem>
            ))}
          </Wrap>
        </Box>
      </Collapse>
    </Box>
  );
};

const ArtifactSelector = ({ selectedArtifacts, onSelectArtifact, searchTerm }) => {
  const wallets = useSelector(state => state.wallets.list);
  const nftsByWallet = useSelector(state => state.nfts.byWallet);
  
  // Improved NFT collection and deduplication
  const allNFTs = useMemo(() => {
    const nftMap = new Map(); // Use Map for deduplication
    
    wallets.forEach(wallet => {
      const walletNFTs = nftsByWallet[wallet.id];
      if (walletNFTs) {
        Object.entries(walletNFTs).forEach(([network, networkNFTs]) => {
          const tokens = [...(networkNFTs.ERC721 || []), ...(networkNFTs.ERC1155 || [])];
          
          tokens.forEach(nft => {
            if (!nft.isSpam && nft.title && nft.contract?.address && nft.id?.tokenId) {
              // Create unique key for deduplication
              const key = `${nft.contract.address}-${nft.id.tokenId}`;
              
              // Only add if we haven't seen this NFT before
              if (!nftMap.has(key)) {
                nftMap.set(key, {
                  ...nft,
                  network,
                  walletId: wallet.id
                });
              }
            }
          });
        });
      }
    });
    
    return Array.from(nftMap.values());
  }, [wallets, nftsByWallet]);

  // Improved filtering logic
  const filteredNFTs = useMemo(() => {
    // Only show results when there's a search term
    if (!searchTerm.trim()) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return allNFTs.filter(nft => {
      const titleMatch = (nft.title || '').toLowerCase().includes(searchLower);
      const tokenIdMatch = (nft.id?.tokenId || '').toString().toLowerCase().includes(searchLower);
      const contractNameMatch = (nft.contract?.name || '').toLowerCase().includes(searchLower);
      
      return titleMatch || tokenIdMatch || contractNameMatch;
    });
  }, [allNFTs, searchTerm]);

  const SimplifiedListItem = ({ nft, isSelected, onSelect }) => (
    <Flex
      p={2}
      borderRadius="md"
      alignItems="center"
      bg={isSelected ? "blue.50" : "white"}
      _hover={{ bg: isSelected ? "blue.100" : "gray.50" }}
      cursor="pointer"
      onClick={() => onSelect(nft)}
      mb={1}
    >
      <Box flex={1}>
        <Text fontWeight={isSelected ? "medium" : "normal"}>
          {nft.title}
        </Text>
      </Box>
    </Flex>
  );

  // Only render items if there's a search term
  if (!searchTerm.trim()) {
    return (
      <Box p={4} textAlign="center" color="gray.500">
        Start typing to search for artifacts in your library
      </Box>
    );
  }

  return (
    <Box maxH="400px" overflowY="auto">
      {filteredNFTs.length > 0 ? (
        filteredNFTs.map(nft => (
          <SimplifiedListItem
            key={`${nft.contract?.address}-${nft.id?.tokenId}`}
            nft={nft}
            isSelected={selectedArtifacts.some(selected => 
              selected.id?.tokenId === nft.id?.tokenId &&
              selected.contract?.address === nft.contract?.address
            )}
            onSelect={onSelectArtifact}
          />
        ))
      ) : (
        <Text color="gray.500" p={4} textAlign="center">
          No artifacts found matching "{searchTerm}"
        </Text>
      )}
    </Box>
  );
};

const NewCatalogModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const { showSuccessToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showError, setShowError] = useState(false);

  const handleCreateCatalog = () => {
    if (!catalogName.trim()) {
      setShowError(true);
      return;
    }

    const newCatalog = {
      id: `catalog-${Date.now()}`,
      name: catalogName.trim(),
      nftIds: selectedArtifacts.map(nft => ({
        tokenId: nft.id.tokenId,
        contractAddress: nft.contract.address,
        network: nft.network
      })),
      createdAt: new Date().toISOString(),
      isSystem: false,
      type: 'user',
      folderId: selectedFolder || undefined
    };

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
    setSelectedArtifacts([]);
    setSearchTerm('');
    setShowError(false);
    onClose();
  };

  const handleSelectArtifact = (nft) => {
    setSelectedArtifacts(prev => {
      const exists = prev.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );
      return exists 
        ? prev.filter(selected => 
            selected.id?.tokenId !== nft.id?.tokenId ||
            selected.contract?.address !== nft.contract?.address
          )
        : [...prev, nft];
    });
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
        <ModalHeader>Create New Catalog</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
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

            <Box>
              <Select
                placeholder="Select folder (optional)"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
              >
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </Select>
            </Box>

            <HStack spacing={4} justify="flex-end">
              <Button variant="ghost" onClick={handleClose}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleCreateCatalog}>
                Create Catalog
              </Button>
            </HStack>

            <Divider />

            <SelectedArtifactsSection 
              selectedArtifacts={selectedArtifacts}
              onRemove={handleRemoveArtifact}
            />

            <Input
              placeholder="Start typing to search for artifacts in your library"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="lg"
            />

            <Box mt={2}>
              <ArtifactSelector
                selectedArtifacts={selectedArtifacts}
                onSelectArtifact={handleSelectArtifact}
                searchTerm={searchTerm}
              />
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewCatalogModal;