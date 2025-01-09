import React, { useState, useMemo } from 'react';
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
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { addFolder, addCatalogToFolder } from '../redux/slices/folderSlice';
import { selectAllCatalogs } from '../redux/slices/catalogSlice';
import { Select as ChakraReactSelect } from 'chakra-react-select';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';

const NewFolderModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(selectAllCatalogs);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [showError, setShowError] = useState(false);

  const catalogOptions = useMemo(() => {
    const allCatalogs = [
      ...Object.values(catalogs.items || {}),
      ...Object.values(catalogs.systemCatalogs || {})
    ];
    
    return allCatalogs
      .filter(cat => !cat.isSystem && !selectedCatalogs.find(sc => sc.value === cat.id))
      .map(catalog => ({
        value: catalog.id,
        label: catalog.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogs, selectedCatalogs]);

  const handleSubmit = () => {
    console.log("Folder submit triggered"); // Debug log
    if (!name.trim()) {
      setShowError(true);
      return;
    }
  
    // Create new folder with initialized relationships
    const newFolder = {
      name: name.trim(),
      description: description.trim(),
      relationships: new Set() // Initialize relationships
    };
  
    // Log before dispatch
    console.log("About to dispatch folder creation:", newFolder);
    dispatch(addFolder(newFolder));
    // Log after dispatch
    console.log("Folder creation dispatched");
  
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
      logger.log('Catalog selected for new folder:', {
        catalogId: option.value,
        catalogName: option.label
      });
    }
  };

  const removeSelectedCatalog = (catalogToRemove) => {
    setSelectedCatalogs(prev => 
      prev.filter(cat => cat.value !== catalogToRemove.value)
    );
    logger.log('Catalog removed from selection:', {
      catalogId: catalogToRemove.value,
      catalogName: catalogToRemove.label
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create New Folder</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Folder Name</FormLabel>
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
            </FormControl>

            <FormControl>
              <FormLabel>Description (Optional)</FormLabel>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter folder description"
                _placeholder={{ color: 'gray.600' }}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Add Catalogs (Optional)</FormLabel>
              <ChakraReactSelect
                options={catalogOptions}
                onChange={handleCatalogSelect}
                value={null}
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
            </FormControl>
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