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
import { Select as ChakraReactSelect } from 'chakra-react-select';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';

const NewFolderModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(state => state.catalogs.items);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [showError, setShowError] = useState(false);

  // Create catalog options from available catalogs
  const catalogOptions = useMemo(() => {
    return Object.values(catalogs)
      .filter(catalog => !catalog.isSystem)
      .map(catalog => ({
        value: catalog.id,
        label: catalog.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogs]);

  const handleCatalogSelect = (option) => {
    if (option) {
      setSelectedCatalogs(prev => {
        // Prevent duplicates
        if (prev.some(cat => cat.value === option.value)) {
          return prev;
        }
        return [...prev, option];
      });
      
      logger.log('Selected catalog for new folder:', {
        catalogId: option.value,
        catalogName: option.label
      });
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }

    try {
      // First create the folder
      const newFolderId = `folder-${Date.now()}`;
      await dispatch(addFolder({
        id: newFolderId,
        name: name.trim(),
        description: description.trim()
      }));

      // Then handle catalog assignments
      if (selectedCatalogs.length > 0) {
        // Add each selected catalog to the folder
        for (const catalog of selectedCatalogs) {
          await dispatch(addCatalogToFolder({
            folderId: newFolderId,
            catalogId: catalog.value
          }));
        }
      }

      logger.log('Created folder with catalogs:', {
        folderId: newFolderId,
        name: name.trim(),
        catalogCount: selectedCatalogs.length,
        catalogs: selectedCatalogs.map(c => c.value)
      });

      showSuccessToast(
        "Folder Created",
        `Created folder "${name.trim()}" with ${selectedCatalogs.length} catalogs`
      );

      onClose();
    } catch (error) {
      logger.error('Error creating folder:', error);
      showErrorToast(
        "Error",
        "Failed to create folder. Please try again."
      );
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedCatalogs([]);
    setShowError(false);
    onClose();
  };

  const removeSelectedCatalog = (catalogToRemove) => {
    setSelectedCatalogs(prev => 
      prev.filter(cat => cat.value !== catalogToRemove.value)
    );
    
    logger.log('Removed catalog from selection:', {
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
                value={null}
                onChange={handleCatalogSelect}
                placeholder="Search catalogs"
                isClearable
                menuPortalTarget={document.body}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                noOptionsMessage={() => "No catalogs available"}
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