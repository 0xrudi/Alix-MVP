import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  Button,
  VStack,
  Box,
  HStack,
  InputGroup,
  InputLeftElement,
  Collapse,
  Text,
  Alert,
  AlertIcon,
  Flex,
} from "@chakra-ui/react";
import { FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addCatalog } from '../redux/slices/catalogSlice';
import { selectFlattenedWalletNFTs } from '../redux/slices/nftSlice';
import ListViewItem from './ListViewItem';
import { useCustomToast } from '../utils/toastUtils';

const ArtifactSelector = ({ selectedArtifacts, onSelectArtifact, searchTerm, onSearchChange }) => {
  const allNFTs = useSelector(selectFlattenedWalletNFTs);
  
  const filteredNFTs = allNFTs.filter(nft => 
    !nft.isSpam && (
      nft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      nft.id?.tokenId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <Box mt={4} maxH="400px" overflowY="auto">
      <InputGroup mb={4}>
        <InputLeftElement>
          <FaSearch color="gray.300" />
        </InputLeftElement>
        <Input
          placeholder="Search artifacts..."
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
        />
      </InputGroup>

      <VStack spacing={2} align="stretch">
        {filteredNFTs.map(nft => (
          <ListViewItem
            key={`${nft.contract?.address}-${nft.id?.tokenId}`}
            nft={nft}
            isSelected={selectedArtifacts.some(selected => 
              selected.id?.tokenId === nft.id?.tokenId &&
              selected.contract?.address === nft.contract?.address
            )}
            onSelect={() => onSelectArtifact(nft)}
            onRemove={null} // Disable remove functionality in this context
            isCompact={true} // Add a compact prop for this use case
          />
        ))}
      </VStack>
    </Box>
  );
};

const NewCatalogModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [showArtifacts, setShowArtifacts] = useState(false);
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
      type: 'user'
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
    setSelectedArtifacts([]);
    setSearchTerm('');
    setShowArtifacts(false);
    setShowError(false);
    onClose();
  };

  const toggleArtifacts = () => {
    setShowArtifacts(!showArtifacts);
  };

  const handleSelectArtifact = (nft) => {
    setSelectedArtifacts(prev => {
      const exists = prev.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );

      if (exists) {
        return prev.filter(selected => 
          selected.id?.tokenId !== nft.id?.tokenId ||
          selected.contract?.address !== nft.contract?.address
        );
      } else {
        return [...prev, nft];
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Catalog</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <Box width="100%">
              <Input
                value={catalogName}
                onChange={(e) => {
                  setCatalogName(e.target.value);
                  setShowError(false);
                }}
                placeholder="Enter catalog name"
                _placeholder={{ color: 'gray.600' }}
              />
              {showError && (
                <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
                  <AlertIcon />
                  <Text fontSize="sm">Catalog name is required</Text>
                </Alert>
              )}
            </Box>
          </VStack>

          <Box mt={4}>
            <Flex justifyContent="flex-end" mb={4}>
              <Button variant="ghost" mr={2} onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                variant="ghost" 
                leftIcon={showArtifacts ? <FaChevronUp /> : <FaChevronDown />}
                onClick={toggleArtifacts}
                mr={2}
              >
                {showArtifacts ? "Close Artifacts" : "Select Artifacts"}
              </Button>
              <Button colorScheme="blue" onClick={handleCreateCatalog}>
                Create Catalog
              </Button>
            </Flex>

            <Collapse in={showArtifacts} animateOpacity>
              <ArtifactSelector
                selectedArtifacts={selectedArtifacts}
                onSelectArtifact={handleSelectArtifact}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </Collapse>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default NewCatalogModal;