import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Button,
  Flex,
  HStack,
  useDisclosure,
  Alert,
  AlertIcon,
  Spinner,
  Progress,
  Divider,
  Icon,
  List,
  ListItem,
  IconButton,
  InputGroup,
  InputLeftElement,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
  Badge,
  Tooltip
} from "@chakra-ui/react";
import { 
  FaLayerGroup, 
  FaSync, 
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaChevronDown,
  FaListUl,
  FaTh,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logger } from '../../utils/logger';
import { 
  selectAllCatalogs, 
  setCatalogs,
  removeCatalog
} from '../redux/slices/catalogSlice';
import { supabase } from '../../utils/supabase';

// Components
import NewCatalogModal from './NewCatalogModal';
import EditCatalogModal from './EditCatalogModal';

// Hooks
import { useCustomToast } from '../../utils/toastUtils';
import { useErrorHandler } from '../../utils/errorUtils';
import { useServices } from '../../services/service-provider';

// Constants
const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

const SORT_OPTIONS = {
  NAME_ASC: { field: 'name', ascending: true, label: 'Name (A-Z)', icon: FaSortAlphaDown },
  NAME_DESC: { field: 'name', ascending: false, label: 'Name (Z-A)', icon: FaSortAlphaUp },
  UPDATED_ASC: { field: 'updatedAt', ascending: true, label: 'Last Updated (Oldest)', icon: FaClock },
  UPDATED_DESC: { field: 'updatedAt', ascending: false, label: 'Last Updated (Newest)', icon: FaClock },
  CREATED_ASC: { field: 'createdAt', ascending: true, label: 'Date Created (Oldest)', icon: FaCalendarAlt },
  CREATED_DESC: { field: 'createdAt', ascending: false, label: 'Date Created (Newest)', icon: FaCalendarAlt }
};

// Catalog Card Component (Grid View)
const CatalogCard = ({ catalog, onView, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleEdit = (e) => {
    e.stopPropagation();
    if (!catalog.isSystem && onEdit) {
      onEdit(catalog);
    }
  };
  
  const handleDelete = (e) => {
    e.stopPropagation();
    if (!catalog.isSystem && onDelete) {
      onDelete(catalog.id);
    }
  };
  
  return (
    <Box
      onClick={() => onView(catalog)}
      role="button"
      cursor="pointer"
      borderWidth="1px"
      borderRadius="lg"
      borderColor="var(--shadow)"
      bg="white"
      boxShadow="sm"
      p={4}
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-4px)',
        boxShadow: 'md',
        borderColor: 'var(--warm-brown)',
        bg: "var(--highlight)"
      }}
      position="relative"
      height="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* System Badge */}
      {catalog.isSystem && (
        <Badge
          position="absolute"
          top={2}
          right={2}
          bg="var(--warm-brown)"
          color="white"
          fontSize="xs"
          px={2}
          py={0.5}
          borderRadius="full"
          fontFamily="Inter"
        >
          System
        </Badge>
      )}
      
      {/* Action buttons - only show when hovered */}
      {isHovered && !catalog.isSystem && (
        <Flex
          position="absolute"
          top={2}
          right={2}
          zIndex={2}
        >
          <Tooltip label="Edit catalog" placement="top">
            <IconButton
              icon={<FaEdit />}
              aria-label="Edit catalog"
              size="sm"
              variant="ghost"
              color="var(--ink-grey)"
              mr={1}
              onClick={handleEdit}
              opacity={0.8}
              _hover={{ 
                opacity: 1,
                color: "var(--warm-brown)"
              }}
            />
          </Tooltip>
          <Tooltip label="Delete catalog" placement="top">
            <IconButton
              icon={<FaTrash />}
              aria-label="Delete catalog"
              size="sm"
              variant="ghost"
              color="var(--ink-grey)"
              onClick={handleDelete}
              opacity={0.8}
              _hover={{ 
                opacity: 1,
                color: "red.500"
              }}
            />
          </Tooltip>
        </Flex>
      )}
      
      <VStack spacing={4} py={4}>
        <Icon 
          as={FaLayerGroup} 
          boxSize={8}
          color="var(--warm-brown)"
        />
        
        <Text 
          fontSize="lg"
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
          textAlign="center"
          fontWeight="medium"
          noOfLines={2}
        >
          {catalog.name}
        </Text>
      </VStack>
    </Box>
  );
};

// Catalog List Item (List View)
const CatalogListItem = ({ catalog, onView, onEdit, onDelete, isLast }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <>
      <ListItem
        py={3}
        px={4}
        borderRadius="md"
        transition="all 0.2s"
        bg={isHovered ? "var(--highlight)" : 'transparent'}
        _hover={{ bg: "var(--highlight)" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        cursor="pointer"
        onClick={() => onView(catalog)}
      >
        <Flex align="center" justify="space-between">
          <HStack spacing={4}>
            <Icon 
              as={FaLayerGroup} 
              boxSize={5}
              color="var(--warm-brown)"
            />
            <Text
              fontSize="md"
              fontFamily="Space Grotesk"
              fontWeight="normal"
              color="var(--rich-black)"
            >
              {catalog.name}
            </Text>
          </HStack>
          
          <HStack>
            {catalog.isSystem ? (
              <Badge
                bg="var(--warm-brown)"
                color="white"
                fontSize="xs"
                px={2}
                py={0.5}
                borderRadius="full"
                fontFamily="Inter"
              >
                System
              </Badge>
            ) : (
              <HStack spacing={1} opacity={isHovered ? 1 : 0.5} transition="opacity 0.2s">
                <Tooltip label="Edit catalog" placement="top">
                  <IconButton
                    icon={<FaEdit />}
                    aria-label="Edit catalog"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(catalog);
                    }}
                    color="var(--ink-grey)"
                    _hover={{ color: "var(--warm-brown)" }}
                  />
                </Tooltip>
                <Tooltip label="Delete catalog" placement="top">
                  <IconButton
                    icon={<FaTrash />}
                    aria-label="Delete catalog"
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(catalog.id);
                    }}
                    color="var(--ink-grey)"
                    _hover={{ color: "red.500" }}
                  />
                </Tooltip>
              </HStack>
            )}
          </HStack>
        </Flex>
      </ListItem>
      {!isLast && <Divider ml="45px" opacity={0.3} borderColor="var(--shadow)" />}
    </>
  );
};

// Main Catalogs Page Component
const CatalogsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Hooks
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { user, catalogService } = useServices();
  
  // Responsive breakpoints
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const showButtonText = useBreakpointValue({ base: false, md: true });
  const gridColumns = useBreakpointValue({ 
    base: 1, 
    sm: 2, 
    md: 3, 
    lg: 4, 
    xl: 5 
  });
  
  // Redux selectors
  const catalogs = useSelector(selectAllCatalogs);
  const isLoadingRedux = useSelector(state => state.catalogs.isLoading);
  
  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.NAME_ASC);
  const [error, setError] = useState(null);
  const [selectedCatalog, setSelectedCatalog] = useState(null);
  
  // Refs to prevent infinite loops
  const initialLoadComplete = useRef(false);
  const initializationInProgress = useRef(false);
  
  // Modal state
  const { 
    isOpen: isNewCatalogModalOpen, 
    onOpen: openNewCatalogModal, 
    onClose: closeNewCatalogModal 
  } = useDisclosure();
  
  const {
    isOpen: isEditCatalogModalOpen,
    onOpen: openEditCatalogModal,
    onClose: closeEditCatalogModal
  } = useDisclosure();

  // Filter out duplicate system catalogs
  const deduplicatedCatalogs = useMemo(() => {
    if (!catalogs || catalogs.length === 0) return [];
    
    // Create a map to track seen system catalog IDs
    const seenSystemCatalogs = new Map();
    
    return catalogs.filter(catalog => {
      if (!catalog.isSystem) {
        // Always keep user catalogs
        return true;
      }
      
      // For system catalogs, only keep the first instance
      if (!seenSystemCatalogs.has(catalog.id)) {
        seenSystemCatalogs.set(catalog.id, true);
        return true;
      }
      
      return false;
    });
  }, [catalogs]);

  // Load catalogs from Supabase
  const loadAllCatalogs = useCallback(async (showToast = false) => {
    // Guard against concurrent calls
    if (initializationInProgress.current) {
      return;
    }
    
    initializationInProgress.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      if (!user) {
        setError("Please log in to view your catalogs");
        setIsLoading(false);
        initializationInProgress.current = false;
        return;
      }
      
      logger.log('Loading all catalogs from Supabase...');
      
      // Step 1: Check if system catalogs already exist in Redux
      const systemCatalogIds = ['spam', 'unorganized'];
      const systemCatalogsExist = catalogs && catalogs.some(cat => 
        systemCatalogIds.includes(cat.id) && cat.isSystem
      );
      
      // Step 2: Load user-created catalogs
      if (catalogService) {
        const userCatalogs = await catalogService.getUserCatalogs(user.id);
        
        // Clear existing catalogs to avoid duplicates
        dispatch({
          type: 'catalogs/clearCatalogs'
        });
        
        // Then dispatch to Redux
        dispatch(setCatalogs(userCatalogs));
        
        logger.log('Loaded user catalogs:', { count: userCatalogs.length });
      } else {
        logger.warn('Catalog service not available');
      }
      
      // Step 3: Set up system catalogs (only if they don't exist already)
      if (!systemCatalogsExist) {
        const systemCatalogs = [
          {
            id: 'spam',
            name: 'Spam',
            isSystem: true,
            type: 'system'
          },
          {
            id: 'unorganized',
            name: 'Unorganized Artifacts',
            isSystem: true,
            type: 'system'
          }
        ];
        
        // Update system catalogs in Redux
        systemCatalogs.forEach(catalog => {
          dispatch({
            type: 'catalogs/addCatalog',
            payload: catalog
          });
        });
      }
      
      if (showToast) {
        showSuccessToast("Catalogs Loaded", "Your catalogs have been refreshed successfully");
      }
      
      // Mark initial load as complete
      initialLoadComplete.current = true;
    } catch (error) {
      logger.error('Error loading catalogs:', error);
      setError("Failed to load catalogs. Please try again.");
      
      if (showToast) {
        showErrorToast("Load Failed", "There was an error loading your catalogs");
      }
    } finally {
      setIsLoading(false);
      initializationInProgress.current = false;
    }
  }, [user, catalogService, dispatch, showSuccessToast, showErrorToast, catalogs]);

  // Initial load when component mounts
  useEffect(() => {
    // Only load if not already loaded and user is available
    if (!initialLoadComplete.current && user && !initializationInProgress.current) {
      loadAllCatalogs();
    }
  }, [user, loadAllCatalogs]);

  // Function to refresh catalogs
  const handleRefresh = useCallback(async () => {
    if (isRefreshing || initializationInProgress.current) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await loadAllCatalogs(true); // true = show toast notifications
    } catch (error) {
      handleError(error, 'refreshing catalogs');
      setError("Failed to refresh catalogs. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, loadAllCatalogs, handleError]);

  // Function to handle viewing a catalog
  const handleViewCatalog = useCallback((catalog) => {
    logger.log('Navigating to catalog view:', { catalogId: catalog.id, name: catalog.name });
    navigate(`/app/catalogs/${catalog.id}`);
  }, [navigate]);

  // Function to handle editing a catalog
  const handleEditCatalog = useCallback((catalog) => {
    setSelectedCatalog(catalog);
    openEditCatalogModal();
  }, [openEditCatalogModal]);

  // Function to handle deleting a catalog
  const handleDeleteCatalog = useCallback(async (catalogId) => {
    try {
      if (!catalogService) {
        throw new Error("Catalog service not available");
      }
      
      // Confirm before deleting
      if (!window.confirm("Are you sure you want to delete this catalog?")) {
        return;
      }
      
      // Delete from Supabase
      await catalogService.deleteCatalog(catalogId);
      
      // Dispatch delete action
      dispatch(removeCatalog(catalogId));
      
      showSuccessToast("Catalog Deleted", "The catalog has been successfully removed.");
      
    } catch (error) {
      handleError(error, 'deleting catalog');
      showErrorToast(
        "Deletion Failed",
        "Failed to delete catalog. Please try again."
      );
    }
  }, [dispatch, catalogService, showSuccessToast, showErrorToast, handleError]);

  // Filter and sort catalogs
  const filteredAndSortedCatalogs = useMemo(() => {
    if (!deduplicatedCatalogs || deduplicatedCatalogs.length === 0) return [];
    
    // First filter by search term
    let result = [...deduplicatedCatalogs];
    
    if (searchTerm) {
      result = result.filter(catalog => 
        catalog.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Then sort based on the selected sort option
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'updatedAt':
          // Default dates if missing
          const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
          const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
          comparison = dateA - dateB;
          break;
        case 'createdAt':
          // Default dates if missing
          const createDateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
          const createDateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
          comparison = createDateA - createDateB;
          break;
        default:
          comparison = 0;
      }
      
      // Reverse for descending order
      return sortOption.ascending ? comparison : -comparison;
    });
    
    return result;
  }, [deduplicatedCatalogs, searchTerm, sortOption]);
  
  // Toggle between sort options
  const handleSortChange = useCallback((option) => {
    setSortOption(option);
  }, []);

  // Toggle between view modes
  const handleViewModeToggle = useCallback(() => {
    setViewMode(prev => prev === VIEW_MODES.GRID ? VIEW_MODES.LIST : VIEW_MODES.GRID);
  }, []);

  // Set search term
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  return (
    <Box maxW="container.xl" mx="auto" px={{ base: 4, md: 6 }} py={6}>
      <VStack spacing="1.5rem" align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={4}>
          <Text
            as="h1"
            fontSize={{ base: "2xl", md: "3xl" }}
            fontFamily="Space Grotesk"
            letterSpacing="-0.02em"
            color="var(--rich-black)"
          >
            Catalogs
          </Text>
          <HStack spacing={2}>
            {/* New Catalog Button */}
            <Button
              leftIcon={<FaPlus />}
              onClick={openNewCatalogModal}
              size={buttonSize}
              bg="var(--warm-brown)"
              color="white"
              _hover={{ bg: "var(--deep-brown)" }}
            >
              {showButtonText ? "New Catalog" : null}
            </Button>
            
            {/* Refresh Button */}
            <Button
              leftIcon={<FaSync />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingText={showButtonText ? "Refreshing..." : ""}
              size={buttonSize}
              variant="outline"
              color="var(--ink-grey)"
              borderColor="var(--shadow)"
              _hover={{ 
                bg: "var(--highlight)",
                color: "var(--rich-black)"
              }}
            >
              {showButtonText ? "Refresh" : null}
            </Button>
          </HStack>
        </Flex>

        {/* Custom Controls */}
        <Box 
          bg="var(--paper-white)"
          border="1px solid"
          borderColor="var(--shadow)"
          borderRadius="md"
          p={4}
          mb={4}
        >
          <Flex 
            direction={{ base: "row" }} 
            justify="space-between"
            align="center"
            flexWrap="wrap"
            gap={3}
          >
            {/* Search Input */}
            <InputGroup maxW={{ base: "100%", md: "50%" }} flex={{ base: 1, md: "1 0 auto" }}>
              <InputLeftElement pointerEvents="none">
                <Icon as={FaSearch} color="var(--ink-grey)" />
              </InputLeftElement>
              <Input
                placeholder="Search catalogs..."
                value={searchTerm}
                onChange={handleSearchChange}
                bg="white"
                borderColor="var(--shadow)"
                _placeholder={{ color: 'var(--ink-grey)' }}
              />
            </InputGroup>
            
            {/* Controls */}
            <HStack spacing={2} flexShrink={0}>
              {/* Sort Menu */}
              <Menu closeOnSelect>
                <MenuButton
                  as={Button}
                  rightIcon={<FaChevronDown />}
                  size={buttonSize}
                  variant="outline"
                  borderColor="var(--shadow)"
                  color="var(--ink-grey)"
                  _hover={{ 
                    bg: "var(--highlight)",
                    color: "var(--rich-black)"
                  }}
                >
                  <HStack>
                    <Icon as={sortOption.icon} />
                    {showButtonText && <Text>{sortOption.label}</Text>}
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem icon={<FaSortAlphaDown />} onClick={() => handleSortChange(SORT_OPTIONS.NAME_ASC)}>
                    Name (A-Z)
                  </MenuItem>
                  <MenuItem icon={<FaSortAlphaUp />} onClick={() => handleSortChange(SORT_OPTIONS.NAME_DESC)}>
                    Name (Z-A)
                  </MenuItem>
                  <Divider my={2} />
                  <MenuItem icon={<FaClock />} onClick={() => handleSortChange(SORT_OPTIONS.UPDATED_DESC)}>
                    Last Updated (Newest)
                  </MenuItem>
                  <MenuItem icon={<FaClock />} onClick={() => handleSortChange(SORT_OPTIONS.UPDATED_ASC)}>
                    Last Updated (Oldest)
                  </MenuItem>
                  <Divider my={2} />
                  <MenuItem icon={<FaCalendarAlt />} onClick={() => handleSortChange(SORT_OPTIONS.CREATED_DESC)}>
                    Date Created (Newest)
                  </MenuItem>
                  <MenuItem icon={<FaCalendarAlt />} onClick={() => handleSortChange(SORT_OPTIONS.CREATED_ASC)}>
                    Date Created (Oldest)
                  </MenuItem>
                </MenuList>
              </Menu>
              
              {/* View Toggle */}
              <Button
                aria-label={viewMode === VIEW_MODES.GRID ? "Switch to list view" : "Switch to grid view"}
                variant="outline"
                borderColor="var(--shadow)"
                color="var(--ink-grey)"
                onClick={handleViewModeToggle}
                size={buttonSize}
                _hover={{ 
                  bg: "var(--highlight)",
                  color: "var(--rich-black)"
                }}
              >
                <Icon 
                  as={viewMode === VIEW_MODES.GRID ? FaListUl : FaTh} 
                  boxSize={4} 
                />
              </Button>
            </HStack>
          </Flex>
        </Box>
        
        {/* Error Alert */}
        {error && (
          <Alert status="error" borderRadius="md" mb={4}>
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}
        
        {/* Loading States */}
        {(isLoading || isLoadingRedux) ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" color="var(--warm-brown)" />
            <Text mt={4} color="var(--ink-grey)" fontFamily="Inter">
              Loading your catalogs...
            </Text>
          </Box>
        ) : isRefreshing ? (
          <Progress size="xs" isIndeterminate colorScheme="brown" mb={4} />
        ) : (
          // Catalog Display - Grid or List View
          filteredAndSortedCatalogs.length > 0 ? (
            viewMode === VIEW_MODES.GRID ? (
              // Grid View
              <SimpleGrid 
                columns={gridColumns}
                spacing={4}
                width="100%"
              >
                {filteredAndSortedCatalogs.map((catalog) => (
                  <CatalogCard
                    key={`${catalog.id}-${catalog.isSystem ? 'system' : 'user'}`}
                    catalog={catalog}
                    onView={handleViewCatalog}
                    onEdit={handleEditCatalog}
                    onDelete={handleDeleteCatalog}
                  />
                ))}
              </SimpleGrid>
            ) : (
              // List View
              <List spacing={0} bg="white" borderRadius="md" borderWidth="1px" borderColor="var(--shadow)">
                {filteredAndSortedCatalogs.map((catalog, index) => (
                  <CatalogListItem
                    key={`${catalog.id}-${catalog.isSystem ? 'system' : 'user'}`}
                    catalog={catalog}
                    onView={handleViewCatalog}
                    onEdit={handleEditCatalog}
                    onDelete={handleDeleteCatalog}
                    isLast={index === filteredAndSortedCatalogs.length - 1}
                  />
                ))}
              </List>
            )
          ) : (
            // Empty state
            <Box textAlign="center" py={12} borderWidth="1px" borderRadius="md" borderColor="var(--shadow)" bg="white">
              <Icon as={FaLayerGroup} boxSize="40px" color="var(--ink-grey)" mb={4} />
              <Text color="var(--ink-grey)" mb={4} fontFamily="Space Grotesk">
                {searchTerm 
                  ? `No catalogs found matching "${searchTerm}"`
                  : "You don't have any catalogs yet"
                }
              </Text>
              {!searchTerm && (
                <Button
                  onClick={openNewCatalogModal}
                  leftIcon={<FaPlus />}
                  bg="var(--warm-brown)"
                  color="white"
                  _hover={{ bg: "var(--deep-brown)" }}
                >
                  Create Your First Catalog
                </Button>
              )}
            </Box>
          )
        )}
      </VStack>

      {/* New Catalog Modal */}
      <NewCatalogModal 
        isOpen={isNewCatalogModalOpen}
        onClose={closeNewCatalogModal}
      />
      
      {/* Edit Catalog Modal */}
      {selectedCatalog && (
        <EditCatalogModal
          isOpen={isEditCatalogModalOpen}
          onClose={closeEditCatalogModal}
          catalog={selectedCatalog}
        />
      )}
    </Box>
  );
};

export default CatalogsPage;