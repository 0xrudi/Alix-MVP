import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Box,
  Alert,
  AlertIcon,
  Text,
  FormControl,
  Input,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from 'react-redux';
import { updateFolder } from '../redux/slices/folderSlice';
import { selectAllCatalogs } from '../redux/slices/catalogSlice';
import { useCustomToast } from '../utils/toastUtils';
import { logger } from '../utils/logger';
import { Select as ChakraReactSelect } from 'chakra-react-select';

// Custom Floating Label Input Component
const FloatingLabelInput = ({ value, onChange, placeholder, isRequired, showError, ...props }) => {
  return (
    <Box position="relative" width="100%">
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        borderColor={showError ? "red.500" : "var(--shadow)"}
        _hover={{ borderColor: "var(--warm-brown)" }}
        _focus={{ 
          borderColor: "var(--warm-brown)",
          boxShadow: "0 0 0 1px var(--warm-brown)"
        }}
        pt={value ? "16px" : "8px"}
        pb={value ? "8px" : "8px"}
        fontFamily="Space Grotesk"
        {...props}
      />
      {value && (
        <Text
          position="absolute"
          top="2px"
          left="16px"
          fontSize="xs"
          color={showError ? "red.500" : "var(--ink-grey)"}
          fontFamily="Inter"
          pointerEvents="none"
          transition="all 0.2s"
        >
          {placeholder} {isRequired && "*"}
        </Text>
      )}
      {showError && (
        <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
          <AlertIcon />
          <Text fontSize="sm" fontFamily="Inter">This field is required</Text>
        </Alert>
      )}
    </Box>
  );
};

// Custom Floating Label TextArea Component
const FloatingLabelTextarea = ({ value, onChange, placeholder, isRequired, showError, ...props }) => {
  return (
    <Box position="relative" width="100%">
      <Input
        as="textarea"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        borderColor={showError ? "red.500" : "var(--shadow)"}
        _hover={{ borderColor: "var(--warm-brown)" }}
        _focus={{ 
          borderColor: "var(--warm-brown)",
          boxShadow: "0 0 0 1px var(--warm-brown)"
        }}
        pt={value ? "16px" : "8px"}
        pb="40px"
        height="100px"
        fontFamily="Space Grotesk"
        resize="vertical"
        {...props}
      />
      {value && (
        <Text
          position="absolute"
          top="2px"
          left="16px"
          fontSize="xs"
          color={showError ? "red.500" : "var(--ink-grey)"}
          fontFamily="Inter"
          pointerEvents="none"
          transition="all 0.2s"
        >
          {placeholder} {isRequired && "*"}
        </Text>
      )}
      {showError && (
        <Alert status="error" mt={2} py={2} px={3} borderRadius="md" opacity={0.8}>
          <AlertIcon />
          <Text fontSize="sm" fontFamily="Inter">This field is required</Text>
        </Alert>
      )}
    </Box>
  );
};

const EditFolderModal = ({ isOpen, onClose, folder }) => {
  const dispatch = useDispatch();
  const catalogs = useSelector(selectAllCatalogs);
  const { showSuccessToast, showErrorToast } = useCustomToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCatalogs, setSelectedCatalogs] = useState([]);
  const [showError, setShowError] = useState(false);

  // Create catalog options for the select dropdown
  const catalogOptions = useMemo(() => {
    return catalogs
      .filter(catalog => !catalog.isSystem)
      .map(catalog => ({
        value: catalog.id,
        label: catalog.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [catalogs]);

  // Get the relationships between folders and catalogs
  const folderRelationships = useSelector(state => state.folders.relationships);

  // Reset state when modal opens with a folder
  useEffect(() => {
    if (folder && isOpen) {
      setName(folder.name || '');
      setDescription(folder.description || '');
      
      // Get catalog IDs assigned to this folder from the relationships
      const assignedCatalogIds = folderRelationships[folder.id] || [];
      
      // Transform catalogIds to the format expected by the multi-select
      const catalogSelections = assignedCatalogIds
        .map(id => {
          const catalog = catalogs.find(c => c.id === id);
          return catalog ? { value: catalog.id, label: catalog.name } : null;
        })
        .filter(Boolean);
      
      setSelectedCatalogs(catalogSelections);
      setShowError(false);
      
      logger.log('Loaded folder for editing:', {
        folderId: folder.id,
        name: folder.name,
        assignedCatalogs: catalogSelections.length
      });
    }
  }, [folder, catalogs, isOpen, folderRelationships]);

  const handleCatalogSelect = (options) => {
    if (options && options.length > 0) {
      setSelectedCatalogs(options);
    } else {
      setSelectedCatalogs([]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }

    try {
      // Extract just the catalog IDs from the selected options
      const catalogIds = selectedCatalogs.map(option => option.value);
      
      dispatch(updateFolder({
        id: folder.id,
        name: name.trim(),
        description: description.trim(),
        catalogIds: catalogIds
      }));

      logger.log('Folder updated:', {
        folderId: folder.id,
        name: name.trim(),
        catalogCount: catalogIds.length
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
    onClose();
  };

  if (!folder) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="rgba(0, 0, 0, 0.4)" backdropFilter="blur(8px)" />
      <ModalContent 
        borderRadius="lg" 
        bg="white" 
        boxShadow="0 4px 20px rgba(0, 0, 0, 0.1)"
      >
        <ModalHeader 
          fontFamily="Space Grotesk" 
          fontSize="xl" 
          color="var(--rich-black)"
        >
          Edit Folder
        </ModalHeader>
        <ModalCloseButton 
          color="var(--ink-grey)" 
          _hover={{ color: "var(--warm-brown)" }} 
        />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FloatingLabelInput
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setShowError(false);
                }}
                placeholder="Folder Name"
                isRequired={true}
                showError={showError}
              />
            </FormControl>

            <FormControl>
              <FloatingLabelTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                isRequired={false}
              />
            </FormControl>

            <FormControl>
              <Text 
                fontSize="sm" 
                mb={2} 
                fontFamily="Inter" 
                color="var(--ink-grey)"
              >
                Catalogs in Folder
              </Text>
              <Box position="relative">
                <ChakraReactSelect
                  options={catalogOptions}
                  value={selectedCatalogs}
                  onChange={handleCatalogSelect}
                  isMulti
                  closeMenuOnSelect={false}
                  placeholder="Select catalogs"
                  isClearable
                  menuPortalTarget={document.body}
                  styles={{ 
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                    control: (base, state) => ({
                      ...base,
                      borderColor: state.isFocused ? 'var(--warm-brown)' : 'var(--shadow)',
                      boxShadow: state.isFocused ? '0 0 0 1px var(--warm-brown)' : 'none',
                      outline: 'none',
                      '&:hover': {
                        borderColor: 'var(--warm-brown)',
                      },
                      fontFamily: 'Space Grotesk'
                    }),
                    menu: (base) => ({
                      ...base,
                      fontFamily: 'Space Grotesk',
                      zIndex: 9999,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                      border: '1px solid var(--shadow)'
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected 
                        ? 'var(--warm-brown)' 
                        : state.isFocused 
                          ? 'var(--highlight)' 
                          : base.backgroundColor,
                      color: state.isSelected ? 'white' : 'var(--rich-black)',
                      '&:active': {
                        backgroundColor: 'var(--warm-brown)'
                      }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: 'var(--highlight)',
                      border: '1px solid var(--shadow)',
                      borderRadius: '16px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: 'var(--rich-black)',
                      fontFamily: 'Inter',
                      fontSize: '14px'
                    }),
                    multiValueRemove: (base) => ({
                      ...base,
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: 'var(--warm-brown)'
                      }
                    }),
                    placeholder: (base) => ({
                      ...base,
                      color: 'var(--ink-grey)'
                    }),
                    dropdownIndicator: (base) => ({
                      ...base,
                      color: 'var(--ink-grey)',
                      '&:hover': {
                        color: 'var(--warm-brown)'
                      }
                    })
                  }}
                  noOptionsMessage={() => "No catalogs available"}
                />
              </Box>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="ghost" 
            mr={3} 
            onClick={handleClose}
            color="var(--ink-grey)"
            fontFamily="Inter"
            _hover={{ color: "var(--warm-brown)", bg: "var(--highlight)" }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            bg="var(--warm-brown)"
            color="white"
            fontFamily="Inter"
            _hover={{ bg: "var(--deep-brown)" }}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EditFolderModal;