import React, { useState, useMemo } from 'react';
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
import { addFolder, addCatalogToFolder } from '../redux/slices/folderSlice';
import { Select as ChakraReactSelect } from 'chakra-react-select';
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { supabase } from '../../utils/supabase';

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

  const handleCatalogSelect = (options) => {
    if (options && options.length > 0) {
      const newCatalogs = options.map(option => ({
        value: option.value,
        label: option.label
      }));
      
      setSelectedCatalogs(newCatalogs);
      
      logger.log('Selected catalogs updated:', {
        catalogCount: newCatalogs.length,
        catalogs: newCatalogs.map(c => c.value)
      });
    } else {
      setSelectedCatalogs([]);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setShowError(true);
      return;
    }
  
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      // Generate a unique folder ID
      const newFolderId = `folder-${Date.now()}`;
      
      // Create folder in Redux first
      await dispatch(addFolder({
        id: newFolderId,
        name: name.trim(),
        description: description.trim()
      }));
  
      // Create folder in Supabase
      const { error: folderError } = await supabase
        .from('folders')
        .insert([{
          id: newFolderId,
          user_id: user.id,
          name: name.trim(),
          description: description.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);
        
      if (folderError) throw folderError;
  
      logger.log('Created folder:', {
        folderId: newFolderId,
        name: name.trim()
      });
  
      // Handle catalog assignments
      if (selectedCatalogs.length > 0) {
        const folderRelationships = selectedCatalogs.map(catalog => ({
          folder_id: newFolderId,
          catalog_id: catalog.value
        }));
        
        // Add each selected catalog to the folder in Redux
        for (const catalog of selectedCatalogs) {
          await dispatch(addCatalogToFolder({
            folderId: newFolderId,
            catalogId: catalog.value
          }));
        }
        
        // Add relationships to Supabase
        const { error: relationError } = await supabase
          .from('catalog_folders')
          .insert(folderRelationships);
          
        if (relationError) {
          logger.error('Error creating folder-catalog relationships:', relationError);
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
  
      handleClose();
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
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
          Create New Folder
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
              <FloatingLabelInput
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
                Add Catalogs (Optional)
              </Text>
              <Box position="relative">
                <ChakraReactSelect
                  options={catalogOptions}
                  value={selectedCatalogs}
                  onChange={handleCatalogSelect}
                  isMulti
                  closeMenuOnSelect={false}
                  placeholder="Search catalogs"
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
              {/* Multi-select component now handles the tags internally */}
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
            onClick={handleSubmit}
            bg="var(--warm-brown)"
            color="white"
            fontFamily="Inter"
            _hover={{ bg: "var(--deep-brown)" }}
          >
            Create Folder
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewFolderModal;