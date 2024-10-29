import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  Select,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { addCatalog } from '../redux/slices/catalogSlice';
import { selectAllFolders, addCatalogToFolder } from '../redux/slices/folderSlice';
import { useCustomToast } from '../utils/toastUtils';

const NewCatalogModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');

  const handleCreateCatalog = () => {
    if (!catalogName.trim()) {
      showErrorToast("Catalog Name Required", "Please enter a name for your catalog.");
      return;
    }

    // Create catalog with a unique ID
    const newCatalog = {
      id: `catalog-${Date.now()}`,
      name: catalogName.trim(),
      nftIds: [],
      createdAt: new Date().toISOString(),
      isSystem: false,
      type: 'user', // Add type to distinguish from automated catalogs
    };

    // Dispatch catalog creation
    dispatch(addCatalog(newCatalog));

    // If a folder was selected, add the catalog to the folder
    if (selectedFolder) {
      dispatch(addCatalogToFolder({
        folderId: selectedFolder,
        catalogId: newCatalog.id
      }));
    }

    showSuccessToast(
      "Catalog Created",
      `Your catalog "${catalogName}" has been created successfully.`
    );
    
    // Reset form and close modal
    setCatalogName('');
    setSelectedFolder('');
    onClose();
  };

  const handleClose = () => {
    setCatalogName('');
    setSelectedFolder('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Catalog</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Catalog Name</FormLabel>
              <Input
                value={catalogName}
                onChange={(e) => setCatalogName(e.target.value)}
                placeholder="Enter catalog name"
                autoFocus
              />
            </FormControl>

            {folders.length > 0 && (
              <FormControl>
                <FormLabel>Assign to Folder (Optional)</FormLabel>
                <Select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  placeholder="Select a folder"
                >
                  {folders.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
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