import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Button,
  Flex,
  Progress,
  Spinner,
  HStack,
  useDisclosure,
  Alert,
  AlertIcon,
  useColorModeValue,
  IconButton,
  Tooltip,
  Badge,
  List,
  ListItem,
  Divider,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { 
  FaLayerGroup, 
  FaSync, 
  FaPlus,
  FaPencilAlt,
  FaTrash,
  FaEllipsisV,
  FaBook,
  FaEdit,
  FaEye
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectAllCatalogs, 
  fetchCatalogs,
  removeCatalog
} from '../redux/slices/catalogSlice';
import { logger } from '../../utils/logger';

// Components
import LibraryControls from './LibraryControls';
import NewCatalogModal from './NewCatalogModal';
import { StyledButton, StyledContainer } from '../styles/commonStyles';

// Hooks
import { useCustomToast } from '../../utils/toastUtils';
import { useErrorHandler } from '../../utils/errorUtils';
import { useResponsive } from '../hooks/useResponsive';
import { useServices } from '../../services/service-provider';

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

// Enhanced Catalog Card Component for Grid View
const CatalogCardItem = ({ 
  catalog,
  onView,
  onEdit,
  onDelete
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('var(--shadow)', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const badgeBg = catalog.isSystem ? 'var(--warm-brown)' : 'blue.500';
  
  const nftCount = catalog.nftIds?.length || 0;
  
  // Handle actions
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
      as="article"
      onClick={() => onView(catalog)}
      role="button"
      cursor="pointer"
      borderWidth="1px"
      borderRadius="lg"
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="sm"
      p={4}
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-4px)',
        boxShadow: 'md',
        borderColor: 'var(--warm-brown)',
        bg: hoverBg
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
          bg={badgeBg}
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
              icon={<FaPencilAlt />}
              aria-label="Edit catalog"
              size="sm"
              variant="ghost"
              colorScheme="blue"
              mr={1}
              onClick={handleEdit}
              opacity={0.8}
              _hover={{ opacity: 1 }}
            />
          </Tooltip>
          <Tooltip label="Delete catalog" placement="top">
            <IconButton
              icon={<FaTrash />}
              aria-label="Delete catalog"
              size="sm"
              variant="ghost"
              colorScheme="red"
              onClick={handleDelete}
              opacity={0.8}
              _hover={{ opacity: 1 }}
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
        
        <Text 
          fontSize="sm"
          fontFamily="Inter"
          color="var(--ink-grey)"
        >
          {nftCount} {nftCount === 1 ? 'Item' : 'Items'}
        </Text>
      </VStack>
    </Box>
  );
};

// Enhanced Catalog List Item for List View
const CatalogListItem = ({ 
  catalog,
  onView,
  onEdit,
  onDelete,
  isLast
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const badgeBg = catalog.isSystem ? 'var(--warm-brown)' : 'blue.500';
  
  const nftCount = catalog.nftIds?.length || 0;
  
  return (
    <>
      <ListItem
        py={3}
        px={4}
        borderRadius="md"
        transition="all 0.2s"
        bg={isHovered ? hoverBg : 'transparent'}
        _hover={{ bg: hoverBg }}
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
            <Box>
              <Text
                fontSize="md"
                fontFamily="Space Grotesk"
                fontWeight="normal"
                color="var(--rich-black)"
              >
                {catalog.name}
              </Text>
              <Text
                fontSize="sm"
                color="var(--ink-grey)"
              >
                {nftCount} {nftCount === 1 ? 'Item' : 'Items'}
              </Text>
            </Box>
          </HStack>
          
          <HStack>
            {catalog.isSystem ? (
              <Badge
                bg={badgeBg}
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

const CatalogsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Hooks
  const { showSuccessToast, showErrorToast } = useCustomToast();
  const { handleError } = useErrorHandler();
  const { buttonSize, showFullText, gridColumns } = useResponsive();
  const { user, catalogService } = useServices();
  
  // Redux selectors
  const catalogs = useSelector(selectAllCatalogs);
  const isLoadingCatalogs = useSelector(state => state.catalogs.isLoading);
  
  // Local state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [error, setError] = useState(null);
  const { isOpen: isNewCatalogModalOpen, onOpen: openNewCatalogModal, onClose: closeNewCatalogModal } = useDisclosure();
  
  // Controlled filter and sort state
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });

  // Load catalogs when component mounts
  useEffect(() => {
    loadCatalogs();
  }, []);

  // Function to load catalogs using the services hook
  const loadCatalogs = async () => {
    setError(null);
    
    try {
      if (!user) {
        setError("Please log in to view your catalogs");
        return;
      }
      
      await dispatch(fetchCatalogs()).unwrap();
    } catch (error) {
      handleError(error, 'fetching catalogs');
      setError("Failed to load catalogs. Please try again.");
    }
  };

  // Function to refresh catalogs
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setError(null);
    
    try {
      await dispatch(fetchCatalogs()).unwrap();
      showSuccessToast(
        "Catalogs Refreshed",
        "Your catalogs have been refreshed"
      );
    } catch (error) {
      handleError(error, 'refreshing catalogs');
      setError("Failed to refresh catalogs. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, isRefreshing, showSuccessToast, handleError]);

  // Function to handle viewing a catalog
  const handleViewCatalog = useCallback((catalog) => {
    navigate('/app/library', { state: { viewingCatalog: catalog } });
  }, [navigate]);

  // Function to handle editing a catalog
  const handleEditCatalog = useCallback((catalog) => {
    navigate('/app/library', { state: { editingCatalog: catalog } });
  }, [navigate]);

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
      
      // Dispatch delete action
      await dispatch(removeCatalog(catalogId)).unwrap();
      
      // Delete from Supabase
      await catalogService.deleteCatalog(catalogId);
      
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
  const filteredCatalogs = useMemo(() => {
    if (!catalogs) return [];
    
    let result = [...catalogs];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(catalog => 
        (catalog.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      if (activeFilters.type?.length) {
        result = result.filter(catalog => {
          // Filter by system vs user catalogs
          if (activeFilters.type.includes('system') && catalog.isSystem) return true;
          if (activeFilters.type.includes('user') && !catalog.isSystem) return true;
          return false;
        });
      }
    }
  
    // Apply sorting
    if (activeSort) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (activeSort.field) {
          case 'name':
            comparison = (a.name || '').localeCompare(b.name || '');
            break;
          case 'items':
            comparison = (a.nftIds?.length || 0) - (b.nftIds?.length || 0);
            break;
          case 'type':
            comparison = (a.isSystem ? 'system' : 'user').localeCompare(b.isSystem ? 'system' : 'user');
            break;
          default:
            comparison = 0;
        }
        return activeSort.ascending ? comparison : -comparison;
      });
    }
  
    return result;
  }, [catalogs, searchTerm, activeFilters, activeSort]);

  // Handler for filtering
  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);
  
  // Handler for sorting
  const handleSortChange = useCallback((sort) => {
    setActiveSort(sort);
  }, []);

  // Handler for view mode change
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  return (
    <StyledContainer>
      <VStack spacing="1.5rem" align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Text
            as="h1"
            fontSize={{ base: "24px", md: "32px" }}
            fontFamily="Space Grotesk"
            letterSpacing="-0.02em"
            color="var(--rich-black)"
          >
            Catalogs
          </Text>
          <HStack spacing={2}>
            <StyledButton
              leftIcon={<Icon as={FaPlus} />}
              onClick={openNewCatalogModal}
              size={buttonSize}
            >
              {showFullText ? "New Catalog" : "New"}
            </StyledButton>
            <StyledButton
              leftIcon={<Icon as={FaSync} />}
              onClick={handleRefresh}
              isLoading={isRefreshing}
              loadingText="Refreshing..."
              size={buttonSize}
              variant="outline"
            >
              {showFullText ? "Refresh" : null}
            </StyledButton>
          </HStack>
        </Flex>

        {/* Library Controls */}
        <LibraryControls
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {/* Error Alert */}
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}
        
        {/* Loading States */}
        {isLoadingCatalogs ? (
          <Box textAlign="center" py={8}>
            <Spinner size="xl" color="blue.500" />
            <Text mt={4} color="var(--ink-grey)">Loading your catalogs...</Text>
          </Box>
        ) : isRefreshing ? (
          <Progress size="xs" isIndeterminate colorScheme="blue" />
        ) : (
          <VStack spacing={6} align="stretch">
            {/* Unified Catalog Display - Grid or List View */}
            {filteredCatalogs.length > 0 ? (
              viewMode === VIEW_MODES.GRID ? (
                // Grid View
                <SimpleGrid 
                  columns={gridColumns}
                  spacing={4}
                  width="100%"
                >
                  {filteredCatalogs.map((catalog) => (
                    <CatalogCardItem
                      key={catalog.id}
                      catalog={catalog}
                      onView={handleViewCatalog}
                      onEdit={handleEditCatalog}
                      onDelete={handleDeleteCatalog}
                    />
                  ))}
                </SimpleGrid>
              ) : (
                // List View
                <List spacing={0}>
                  {filteredCatalogs.map((catalog, index) => (
                    <CatalogListItem
                      key={catalog.id}
                      catalog={catalog}
                      onView={handleViewCatalog}
                      onEdit={handleEditCatalog}
                      onDelete={handleDeleteCatalog}
                      isLast={index === filteredCatalogs.length - 1}
                    />
                  ))}
                </List>
              )
            ) : (
              // Empty state
              <Box textAlign="center" py={12} borderWidth="1px" borderRadius="md" borderColor="var(--shadow)">
                <Icon as={FaLayerGroup} boxSize="40px" color="var(--ink-grey)" mb={4} />
                <Text color="var(--ink-grey)" mb={4}>
                  {searchTerm 
                    ? `No catalogs found matching "${searchTerm}"`
                    : "You don't have any catalogs yet"
                  }
                </Text>
                {!searchTerm && (
                  <Button
                    colorScheme="blue"
                    onClick={openNewCatalogModal}
                    leftIcon={<FaPlus />}
                  >
                    Create Your First Catalog
                  </Button>
                )}
              </Box>
            )}
          </VStack>
        )}
      </VStack>

      {/* Modals */}
      <NewCatalogModal 
        isOpen={isNewCatalogModalOpen}
        onClose={closeNewCatalogModal}
      />
    </StyledContainer>
  );
};

export default CatalogsPage;