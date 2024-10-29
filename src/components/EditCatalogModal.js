// src/components/EditCatalogModal.js
import React, { useState, useEffect } from 'react';
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
import { updateCatalog } from '../redux/slices/catalogSlice';
import { selectAllFolders, addCatalogToFolder, removeCatalogFromFolder } from '../redux/slices/folderSlice';
import { useCustomToast } from '../utils/toastUtils';

const EditCatalogModal = ({ isOpen, onClose, catalog }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState(catalog?.name || '');
  const [selectedFolder, setSelectedFolder] = useState('');

  // Update local state when catalog prop changes
  useEffect(() => {
    if (catalog) {
      setCatalogName(catalog.name);
      // Find the folder that contains this catalog
      const currentFolder = folders.find(folder => 
        folder.catalogIds?.includes(catalog.id)
      );
      setSelectedFolder(currentFolder?.id || '');
    }
  }, [catalog, folders]);

  const handleSave = () => {
    if (!catalogName.trim()) {
      showErrorToast("Catalog Name Required", "Please enter a name for your catalog.");
      return;
    }

    // Update catalog name
    dispatch(updateCatalog({
      id: catalog.id,
      name: catalogName.trim()
    }));

    // Handle folder assignment
    const currentFolder = folders.find(folder => 
      folder.catalogIds?.includes(catalog.id)
    );

    if (currentFolder?.id !== selectedFolder) {
      // Remove from current folder if exists
      if (currentFolder) {
        dispatch(removeCatalogFromFolder({
          folderId: currentFolder.id,
          catalogId: catalog.id
        }));
      }

      // Add to new folder if selected
      if (selectedFolder) {
        dispatch(addCatalogToFolder({
          folderId: selectedFolder,
          catalogId: catalog.id
        }));
      }
    }

    showSuccessToast(
      "Catalog Updated",
      "The catalog has been updated successfully."
    );
    onClose();
  };

  const handleClose = () => {
    setCatalogName(catalog?.name || '');
    setSelectedFolder('');
    onClose();
  };

  if (!catalog) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Catalog</ModalHeader>
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
          <Button colorScheme="blue" onClick={handleSave}>
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditCatalogModal;