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
import { updateCatalog } from '../redux/slices/catalogSlice';
import { selectAllFolders, addCatalogToFolder, removeCatalogFromFolder } from '../redux/slices/folderSlice';
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { Select as ChakraReactSelect } from 'chakra-react-select';
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

const EditCatalogModal = ({ isOpen, onClose, catalog }) => {
  const dispatch = useDispatch();
  const folders = useSelector(selectAllFolders);
  const folderRelationships = useSelector(state => state.folders.relationships);
  const { showSuccessToast, showErrorToast } = useCustomToast();
  
  const [catalogName, setCatalogName] = useState('');
  const [selectedFolders, setSelectedFolders] = useState([]);
  const [showError, setShowError] = useState(false);

  // Create folder options for the select dropdown
  const folderOptions = useMemo(() => {
    return folders
      .filter(folder => !folder.isSystem)
      .map(folder => ({
        value: folder.id,
        label: folder.name
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [folders]);

  // Reset state when modal opens with a catalog
  useEffect(() => {
    if (catalog && isOpen) {
      setCatalogName(catalog.name || '');
      setShowError(false);
      
      // Find all folders containing this catalog
      const containingFolderIds = Object.entries(folderRelationships)
        .filter(([_, catalogs]) => Array.isArray(catalogs) && catalogs.includes(catalog.id))
        .map(([folderId]) => folderId);
      
      // Transform folder IDs to the format expected by the multi-select
      const folderSelections = containingFolderIds
        .map(id => {
          const folder = folders.find(f => f.id === id);
          return folder ? { value: folder.id, label: folder.name } : null;
        })
        .filter(Boolean);
      
      setSelectedFolders(folderSelections);
      
      logger.log('Loaded catalog for editing:', {
        catalogId: catalog.id,
        name: catalog.name,
        assignedFolders: folderSelections.length
      });
    }
  }, [catalog, folders, isOpen, folderRelationships]);

  const handleFolderSelect = (options) => {
    if (options && options.length > 0) {
      setSelectedFolders(options);
    } else {
      setSelectedFolders([]);
    }
  };

  const handleSave = async () => {
    if (!catalogName.trim()) {
      setShowError(true);
      return;
    }
  
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
  
      // Update Redux store first (optimistic update)
      dispatch(updateCatalog({
        id: catalog.id,
        name: catalogName.trim()
      }));
  
      // Update catalog in Supabase
      const { error: catalogError } = await supabase
        .from('catalogs')
        .update({ 
          name: catalogName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', catalog.id);
        
      if (catalogError) throw catalogError;
  
      // Get the selected folder IDs
      const newFolderIds = selectedFolders.map(folder => folder.value);
      
      // Find current folder relationships for this catalog
      const currentFolderIds = Object.entries(folderRelationships)
        .filter(([_, catalogs]) => Array.isArray(catalogs) && catalogs.includes(catalog.id))
        .map(([folderId]) => folderId);
      
      // Remove catalog from folders that are no longer selected
      const foldersToRemoveFrom = currentFolderIds.filter(id => !newFolderIds.includes(id));
      for (const folderId of foldersToRemoveFrom) {
        // Update Redux
        dispatch(removeCatalogFromFolder({
          folderId,
          catalogId: catalog.id
        }));
        
        // Update Supabase - delete the relationship
        const { error: removeError } = await supabase
          .from('catalog_folders')
          .delete()
          .eq('folder_id', folderId)
          .eq('catalog_id', catalog.id);
          
        if (removeError) {
          logger.error('Error removing catalog from folder in Supabase:', removeError);
        }
      }
      
      // Add catalog to newly selected folders
      const foldersToAddTo = newFolderIds.filter(id => !currentFolderIds.includes(id));
      for (const folderId of foldersToAddTo) {
        // Update Redux
        dispatch(addCatalogToFolder({
          folderId,
          catalogId: catalog.id
        }));
        
        // Update Supabase - create the relationship
        const { error: addError } = await supabase
          .from('catalog_folders')
          .insert([{
            folder_id: folderId,
            catalog_id: catalog.id
          }]);
          
        if (addError) {
          logger.error('Error adding catalog to folder in Supabase:', addError);
        }
      }
  
      logger.log('Catalog updated:', {
        catalogId: catalog.id,
        newName: catalogName,
        removedFolders: foldersToRemoveFrom,
        addedFolders: foldersToAddTo
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
    onClose();
  };

  if (!catalog) return null;

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
          Edit Catalog
        </ModalHeader>
        <ModalCloseButton 
          color="var(--ink-grey)" 
          _hover={{ color: "var(--warm-brown)" }} 
        />
        <ModalBody>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FloatingLabelInput
                value={catalogName}
                onChange={(e) => {
                  setCatalogName(e.target.value);
                  setShowError(false);
                }}
                placeholder="Catalog Name"
                isRequired={true}
                showError={showError}
              />
            </FormControl>

            {folders.length > 0 && (
              <FormControl>
                <Text 
                  fontSize="sm" 
                  mb={2} 
                  fontFamily="Inter" 
                  color="var(--ink-grey)"
                >
                  Assign to Folders (Optional)
                </Text>
                <Box position="relative">
                  <ChakraReactSelect
                    options={folderOptions}
                    value={selectedFolders}
                    onChange={handleFolderSelect}
                    isMulti
                    closeMenuOnSelect={false}
                    placeholder="Select folders"
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
                    noOptionsMessage={() => "No folders available"}
                  />
                </Box>
              </FormControl>
            )}
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

export default EditCatalogModal;