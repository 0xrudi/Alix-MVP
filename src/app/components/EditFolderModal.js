// src/components/EditFolderModal.js

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

const EditFolderModal = ({ isOpen, onClose, folder }) => {
  const dispatch = useDispatch();
  const allCatalogs = useSelector(selectAllCatalogs);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const [name, setName] = useState(folder?.name || '');
  const [description, setDescription] = useState(folder?.description || '');
  const [selectedCatalogs, setSelectedCatalogs] = useState(folder?.catalogIds || []);

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

    dispatch(updateFolder({
      id: folder.id,
      name: name.trim(),
      description: description.trim(),
      catalogIds: selectedCatalogs
    }));

    showSuccessToast("Folder Updated", "The folder has been updated successfully.");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
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
                {allCatalogs.map(catalog => (
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
          <Button variant="ghost" mr={3} onClick={onClose}>
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