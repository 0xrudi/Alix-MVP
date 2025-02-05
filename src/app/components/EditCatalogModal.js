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
import { logger } from '../utils/logger';

const EditCatalogModal = ({ isOpen, onClose, catalog }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const folderRelationships = useSelector(state => state.folders.relationships);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('');

  useEffect(() => {
    if (catalog) {
      setCatalogName(catalog.name);
      // Find folder containing this catalog
      const containingFolderId = Object.entries(folderRelationships)
        .find(([_, catalogs]) => Array.isArray(catalogs) && catalogs.includes(catalog.id))?.[0];
      setSelectedFolder(containingFolderId || '');
    }
  }, [catalog, folderRelationships]);

  const handleSave = () => {
    if (!catalogName.trim()) {
      showErrorToast("Catalog Name Required", "Please enter a name for your catalog.");
      return;
    }

    try {
      // Update catalog name
      dispatch(updateCatalog({
        id: catalog.id,
        name: catalogName.trim()
      }));

      // Handle folder relationship changes
      const currentFolderId = Object.entries(folderRelationships)
        .find(([_, catalogs]) => Array.isArray(catalogs) && catalogs.includes(catalog.id))?.[0];

      if (currentFolderId !== selectedFolder) {
        // Remove from current folder if exists
        if (currentFolderId) {
          dispatch(removeCatalogFromFolder({
            folderId: currentFolderId,
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

      logger.log('Catalog updated:', {
        catalogId: catalog.id,
        newName: catalogName,
        oldFolderId: currentFolderId,
        newFolderId: selectedFolder
      });

      showSuccessToast(
        "Catalog Updated",
        "The catalog has been updated successfully."
      );
      onClose();
    } catch (error) {
      logger.error('Error updating catalog:', error);
      showErrorToast(
        "Update Failed",
        "Failed to update the catalog. Please try again."
      );
    }
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