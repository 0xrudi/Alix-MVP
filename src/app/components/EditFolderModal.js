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
  Textarea,
  VStack,
  Checkbox,
  Button,
  Box,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { updateFolder } from '../redux/slices/folderSlice';
import { selectAllCatalogs } from '../redux/slices/catalogSlice';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';

const EditFolderModal = ({ isOpen, onClose, folder }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(selectAllCatalogs);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);

  useEffect(() => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setSelectedCatalogs(folder.catalogIds || []);
    }
  }, [folder]);

  const handleSave = () => {
    if (!name.trim()) {
      showErrorToast("Folder Name Required", "Please enter a name for your folder.");
      return;
    }

    try {
      dispatch(updateFolder({
        id: folder.id,
        name: name.trim(),
        description: description.trim(),
        catalogIds: selectedCatalogs
      }));

      logger.log('Folder updated:', {
        folderId: folder.id,
        name: name.trim(),
        catalogCount: selectedCatalogs.length
      });

      showSuccessToast(
        "Folder Updated",
        "The folder has been updated successfully."
      );
      onClose();
    } catch (error) {
      logger.error('Error updating folder:', error);
      showErrorToast(
        "Update Failed",
        "Failed to update the folder. Please try again."
      );
    }
  };

  const handleClose = () => {
    if (folder) {
      setName(folder.name);
      setDescription(folder.description || '');
      setSelectedCatalogs(folder.catalogIds || []);
    }
    onClose();
  };

  if (!folder) return null;

  const userCatalogs = catalogs.filter(catalog => !catalog.isSystem);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Folder Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter folder description (optional)"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Catalogs in Folder</FormLabel>
              <Box maxH="200px" overflowY="auto">
                {userCatalogs.map(catalog => (
                  <Checkbox
                    key={catalog.id}
                    isChecked={selectedCatalogs.includes(catalog.id)}
                    onChange={() => {
                      setSelectedCatalogs(prev =>
                        prev.includes(catalog.id)
                          ? prev.filter(id => id !== catalog.id)
                          : [...prev, catalog.id]
                      );
                    }}
                    mb={2}
                  >
                    {catalog.name}
                  </Checkbox>
                ))}
              </Box>
            </FormControl>
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

export default EditFolderModal;