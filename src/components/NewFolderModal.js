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
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  Box,
  Alert,
  AlertIcon,
  Text,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { addFolder } from '../redux/slices/folderSlice';
import { selectAllCatalogs } from '../redux/slices/catalogSlice';
import { Select as ChakraReactSelect } from 'chakra-react-select';

const NewFolderModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(selectAllCatalogs);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [showError, setShowError] = useState(false);

  // Format catalogs for the select component
  const catalogOptions = catalogs
    .filter(cat => !cat.isSystem && !selectedCatalogs.find(sc => sc.value === cat.id))
    .map(catalog => ({
      value: catalog.id,
      label: catalog.name
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const handleSubmit = () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }

    dispatch(addFolder({
      name: name.trim(),
      description: description.trim(),
      catalogIds: selectedCatalogs.map(cat => cat.value)
    }));

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedCatalogs([]);
    setShowError(false);
    onClose();
  };

  const handleCatalogSelect = (option) => {
    if (option) {
      setSelectedCatalogs(prev => [...prev, option]);
    }
  };

  const removeSelectedCatalog = (catalogToRemove) => {
    setSelectedCatalogs(prev => 
      prev.filter(cat => cat.value !== catalogToRemove.value)
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <Box width="100%">
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowError(false);
                }}
                placeholder="Enter folder name"
                _placeholder={{ color: 'gray.600' }}
              />
              {showError && (
                <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
                  <AlertIcon />
                  <Text fontSize="sm">Folder name is required</Text>
                </Alert>
              )}
            </Box>

            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter folder description (optional)"
              _placeholder={{ color: 'gray.600' }}
            />

            <Box width="100%">
              <ChakraReactSelect
                options={catalogOptions}
                onChange={handleCatalogSelect}
                value={null} // Always keep the select empty
                placeholder="Search catalogs"
                chakraStyles={{
                  placeholder: (provided) => ({
                    ...provided,
                    color: 'gray.600'
                  })
                }}
              />
              
              {selectedCatalogs.length > 0 && (
                <Box mt={2}>
                  <Wrap spacing={2}>
                    {selectedCatalogs.map(catalog => (
                      <Tag
                        key={catalog.value}
                        size="md"
                        borderRadius="full"
                        variant="subtle"
                        colorScheme="blue"
                      >
                        <TagLabel>{catalog.label}</TagLabel>
                        <TagCloseButton 
                          onClick={() => removeSelectedCatalog(catalog)}
                        />
                      </Tag>
                    ))}
                  </Wrap>
                </Box>
              )}
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
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