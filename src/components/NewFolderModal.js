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
  Textarea,
  VStack,
  Checkbox,
  Button,
  Box,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { addFolder } from '../redux/slices/folderSlice';
import { selectAllCatalogs } from '../redux/slices/catalogSlice';

const NewFolderModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(selectAllCatalogs);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Folder name is required');
      return;
    }

    dispatch(addFolder({
      name: name.trim(),
      description: description.trim(),
      catalogIds: selectedCatalogs
    }));

    // Reset form
    setName('');
    setDescription('');
    setSelectedCatalogs([]);
    setError('');
    onClose();
  };

  const handleCatalogToggle = (catalogId) => {
    setSelectedCatalogs(prev =>
      prev.includes(catalogId)
        ? prev.filter(id => id !== catalogId)
        : [...prev, catalogId]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired isInvalid={!!error}>
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
              <FormLabel>Add Catalogs</FormLabel>
              <Box maxH="200px" overflowY="auto">
                {catalogs.map(catalog => (
                  <Checkbox
                    key={catalog.id}
                    isChecked={selectedCatalogs.includes(catalog.id)}
                    onChange={() => handleCatalogToggle(catalog.id)}
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
          <Button colorScheme="blue" onClick={handleSubmit}>
            Create Folder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewFolderModal;