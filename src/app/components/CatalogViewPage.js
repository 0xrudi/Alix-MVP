import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  VStack,
  Box,
  Text,
  Heading,
  Button,
  SimpleGrid,
  HStack,
  Progress,
  Skeleton,
  Alert,
  AlertIcon,
  Tooltip,
  Icon,
  Flex,
  Input,
  InputGroup,
  IconButton,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Editable,
  EditableInput,
  EditablePreview,
  ButtonGroup,
  useEditableControls,
  useDisclosure,
} from "@chakra-ui/react";
import { 
  FaChevronLeft, 
  FaSync, 
  FaInfoCircle, 
  FaEdit, 
  FaPencilAlt, 
  FaCheck, 
  FaTimes 
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { supabase } from '../../utils/supabase';
import { selectCatalogById, updateCatalog } from '../redux/slices/catalogSlice';
import { updateSpamCatalog } from '../redux/slices/catalogSlice';

import NFTCard from './NFTCard';
import ListViewItem from './ListViewItem';
import LibraryControls from './LibraryControls';
import { useCustomToast } from '../../utils/toastUtils';
import { logger } from '../../utils/logger';
import { extractNFTAttributes } from '../../utils/nftUtils';

const MotionBox = motion(Box);

const VIEW_MODES = {
  LIST: 'list',
  GRID: 'grid'
};

// Simple IPFS URL transformer
const transformIpfsUrl = (url) => {
  if (!url) return '';
  
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `https://ipfs.io/ipfs/${cid}`;
  }
  
  return url;
};

// Custom editable controls component
function EditableControls({ onCancel }) {
  const { isEditing, getSubmitButtonProps, getCancelButtonProps, getEditButtonProps } = useEditableControls();

  return isEditing ? (
    <ButtonGroup size="sm" spacing={2} ml={2}>
      <IconButton icon={<FaCheck />} {...getSubmitButtonProps()} aria-label="Save" 
        color="green.500" variant="ghost" size="xs" />
      <IconButton icon={<FaTimes />} onClick={onCancel} aria-label="Cancel" 
        color="red.500" variant="ghost" size="xs" {...getCancelButtonProps()} />
    </ButtonGroup>
  ) : null;
}

const CatalogViewPage = () => {
  // Get catalogId from URL parameters
  const { catalogId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get catalog from Redux store
  const catalog = useSelector(state => selectCatalogById(state, catalogId));
  const nfts = useSelector(state => state.nfts.byWallet);
  const wallets = useSelector(state => state.wallets.list);
  
  // Component state
  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [catalogNFTs, setCatalogNFTs] = useState([]);
  const [error, setError] = useState(null);
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast();

  // Catalog name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(catalog?.name || '');
  const [originalName, setOriginalName] = useState(catalog?.name || '');
  
  // Description state
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(catalog?.description || '');
  const [originalDescription, setOriginalDescription] = useState(catalog?.description || '');

  // Refs for preventing excessive fetches
  const processingBatch = useRef(false);
  const lastFetchTime = useRef(0);
  const isMounted = useRef(true);
  const initialLoadComplete = useRef(false);
  const MIN_FETCH_INTERVAL = 3000; // 3 seconds
  
  // State for filtering and sorting
  const [activeFilters, setActiveFilters] = useState({});
  const [activeSort, setActiveSort] = useState({ field: 'name', ascending: true });

  // Grid columns configuration
  const gridColumns = {
    base: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5
  };

  // Helper function to truncate addresses
  const truncateAddress = useCallback((address) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  }, []);

  // Get wallet nickname for filtering
  const getWalletNickname = useCallback((walletId) => {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? (wallet.nickname || truncateAddress(wallet.address)) : 'Unknown Wallet';
  }, [wallets, truncateAddress]);

  // Normalize NFT data for system catalogs
  const normalizeNFTData = useCallback((nft) => {
    if (!nft) return null;
    
    // If it's already in the correct format, return as is
    if (nft.contract && nft.id) {
      return nft;
    }

    // Transform the system catalog NFT format to match user catalog format
    return {
      id: { tokenId: nft.tokenId },
      contract: {
        address: nft.contractAddress,
        name: nft.contract?.name || 'Unknown Collection'
      },
      title: nft.title || `Token ID: ${nft.tokenId}`,
      description: nft.description || '',
      metadata: nft.metadata || {},
      walletId: nft.walletId,
      network: nft.network,
      isSpam: nft.isSpam || false,
      media: [{
        gateway: nft.media_url || nft.cover_image_url || nft.metadata?.image || 'https://via.placeholder.com/400?text=No+Image'
      }]
    };
  }, []);

  // Effect for cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      processingBatch.current = false;
    };
  }, []);

  // Effect to update name value when catalog changes
  useEffect(() => {
    if (catalog) {
      setNameValue(catalog.name || '');
      setOriginalName(catalog.name || '');
    }
  }, [catalog]);
  
  // Effect to update description value when catalog changes
  useEffect(() => {
    if (catalog) {
      setDescriptionValue(catalog.description || '');
      setOriginalDescription(catalog.description || '');
    }
  }, [catalog]);
  
  // Function to find NFT in Redux store
  const findNFTInReduxStore = useCallback((nftId) => {
    if (!nftId || !nftId.walletId || !nfts[nftId.walletId]) return null;

    for (const network in nfts[nftId.walletId]) {
      // Check in ERC721 collection
      const erc721Match = nfts[nftId.walletId][network]?.ERC721?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      );
      
      if (erc721Match) {
        return {
          ...erc721Match,
          walletId: nftId.walletId,
          network,
          walletNickname: getWalletNickname(nftId.walletId)
        };
      }
      
      // Check in ERC1155 collection
      const erc1155Match = nfts[nftId.walletId][network]?.ERC1155?.find(nft => 
        nft.id?.tokenId === nftId.tokenId && 
        nft.contract?.address?.toLowerCase() === nftId.contractAddress?.toLowerCase()
      );
      
      if (erc1155Match) {
        return {
          ...erc1155Match,
          walletId: nftId.walletId,
          network,
          walletNickname: getWalletNickname(nftId.walletId)
        };
      }
    }
    
    return null;
  }, [nfts, getWalletNickname]);

  // Create a placeholder NFT when not found
  const createPlaceholderNFT = useCallback((nftId) => {
    return {
      id: { tokenId: nftId.tokenId },
      contract: { 
        address: nftId.contractAddress,
        name: 'Unknown Collection'
      },
      title: `Token ID: ${nftId.tokenId}`,
      description: 'NFT details unavailable',
      walletId: nftId.walletId,
      network: nftId.network || 'unknown',
      isPlaceholder: true,
      media: [{
        gateway: 'https://via.placeholder.com/400?text=No+Image'
      }]
    };
  }, []);

  // Convert a Supabase artifact to NFT format
  const convertArtifactToNFT = useCallback((artifact, walletId) => {
    try {
      // Parse metadata if it's a string
      let metadata = artifact.metadata;
      if (typeof metadata === 'string') {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          logger.warn('Failed to parse metadata as JSON:', e);
          metadata = {};
        }
      }

      // Find wallet info to add nickname
      const wallet = wallets.find(w => w.id === walletId);
      const walletNickname = wallet?.nickname || truncateAddress(wallet?.address);
      
      // Process image URL for IPFS compatibility
      let imageUrl = artifact.media_url || metadata?.image || '';
      imageUrl = transformIpfsUrl(imageUrl);

      return {
        id: { 
          tokenId: artifact.token_id 
        },
        contract: {
          address: artifact.contract_address,
          name: metadata?.collection?.name || metadata?.contract_name || 'Unknown Collection'
        },
        title: artifact.title || metadata?.name || `Token ID: ${artifact.token_id}`,
        description: artifact.description || metadata?.description || '',
        metadata: metadata || {},
        isSpam: artifact.is_spam || false,
        media: [{
          gateway: imageUrl || artifact.cover_image_url || 'https://via.placeholder.com/400?text=No+Image'
        }],
        walletId: walletId,
        network: artifact.network,
        walletNickname: walletNickname
      };
    } catch (error) {
      logger.error('Error converting artifact:', {
        error: error.message,
        artifact
      });
      
      // Return a simplified version if conversion fails
      return {
        id: { tokenId: artifact.token_id || 'unknown' },
        contract: { address: artifact.contract_address || 'unknown', name: 'Unknown' },
        title: artifact.title || `Token ID: ${artifact.token_id || 'unknown'}`,
        isSpam: artifact.is_spam || false,
        walletId: walletId,
        network: artifact.network || 'unknown',
        media: [{ gateway: 'https://via.placeholder.com/400?text=Error+Loading+Image' }]
      };
    }
  }, [wallets, truncateAddress]);

  const fetchNFTsFromSupabase = useCallback(async (forceRefresh = false) => {
    // Early exit conditions
    if (!isMounted.current) return;
    if (!forceRefresh && processingBatch.current) return;
    
    // Rate limiting check
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime.current < MIN_FETCH_INTERVAL) {
      logger.debug('Throttling fetch, too soon since last fetch');
      return;
    }
    
    // If catalog is not found, exit early with error
    if (!catalog) {
      setError("Catalog not found. It may have been deleted or you don't have access.");
      setIsLoading(false);
      return;
    }
    
    // Update tracking state
    processingBatch.current = true;
    lastFetchTime.current = now;
    setIsLoading(true);
    setLoadingProgress(0);
    setError(null);
    
    try {
      logger.log('Fetching NFTs for catalog:', {
        catalogId: catalog.id,
        isSystem: catalog.isSystem,
        name: catalog.name,
        nftCount: catalog.nftIds?.length
      });
      
      // Special handling for system catalogs
      if (catalog.isSystem) {
        // Get user's wallet IDs first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');
        
        const { data: wallets, error: walletError } = await supabase
          .from('wallets')
          .select('id')
          .eq('user_id', user.id);
          
        if (walletError) throw walletError;
        
        if (!wallets || wallets.length === 0) {
          setCatalogNFTs([]);
          setIsLoading(false);
          processingBatch.current = false;
          return;
        }
        
        const walletIds = wallets.map(w => w.id);
        setLoadingProgress(20);
        
        let artifacts = [];
        
        // Different queries for different system catalogs
        if (catalog.id === 'spam') {
          // Fetch spam artifacts
          const { data, error } = await supabase
            .from('artifacts')
            .select('*')
            .in('wallet_id', walletIds)
            .eq('is_spam', true);
            
          if (error) throw error;
          artifacts = data || [];
        } 
        else if (catalog.id === 'unorganized') {
          // Fetch unorganized artifacts (not in any catalog and not spam)
          const { data, error } = await supabase
            .from('artifacts')
            .select('*')
            .in('wallet_id', walletIds)
            .eq('is_in_catalog', false)
            .eq('is_spam', false);
            
          if (error) throw error;
          artifacts = data || [];
        }
        
        setLoadingProgress(60);
        
        // Convert artifacts to NFT format
        const nfts = artifacts.map(artifact => convertArtifactToNFT(artifact, artifact.wallet_id));
        
        logger.log(`Found ${nfts.length} artifacts for ${catalog.name} catalog`);
        setCatalogNFTs(nfts);
        setIsLoading(false);
        processingBatch.current = false;
        return;
      }
      
      // User-generated catalogs - new direct approach using catalog_artifacts junction table
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        setLoadingProgress(20);
        
        // First, query the catalog_artifacts junction table to get all artifact IDs for this catalog
        const { data: catalogArtifacts, error: junctionError } = await supabase
          .from('catalog_artifacts')
          .select('artifact_id')
          .eq('catalog_id', catalog.id);
          
        if (junctionError) throw junctionError;
        
        if (!catalogArtifacts || catalogArtifacts.length === 0) {
          // No artifacts in this catalog
          setCatalogNFTs([]);
          setIsLoading(false);
          processingBatch.current = false;
          logger.log(`No artifacts found for catalog ${catalog.name} in junction table`);
          return;
        }
        
        // Extract artifact IDs
        const artifactIds = catalogArtifacts.map(item => item.artifact_id);
        setLoadingProgress(40);
        
        // Fetch all artifacts by their IDs
        const { data: artifacts, error: artifactsError } = await supabase
          .from('artifacts')
          .select('*')
          .in('id', artifactIds);
          
        if (artifactsError) throw artifactsError;
        
        if (!artifacts || artifacts.length === 0) {
          setCatalogNFTs([]);
          setIsLoading(false);
          processingBatch.current = false;
          logger.log(`No artifacts found for catalog ${catalog.name} by IDs`);
          return;
        }
        
        setLoadingProgress(80);
        
        // Convert artifacts to NFT format
        const nfts = artifacts.map(artifact => convertArtifactToNFT(artifact, artifact.wallet_id));
        
        logger.log(`Found ${nfts.length} artifacts for user catalog ${catalog.name}`);
        setCatalogNFTs(nfts);
      } catch (userCatalogError) {
        logger.error('Error fetching user catalog artifacts:', userCatalogError);
        
        // Fallback to old method if the junction table approach fails
        logger.log('Falling back to nftIds approach for backward compatibility');
        
        // For regular catalogs, try to find NFTs in Redux first
        if (!catalog.nftIds || catalog.nftIds.length === 0) {
          setCatalogNFTs([]);
          setIsLoading(false);
          processingBatch.current = false;
          return;
        }
        
        // Get unique nftIds to avoid duplicates
        const uniqueNftIds = Array.from(
          new Map(
            catalog.nftIds.map(nft => [
              `${nft.tokenId}-${nft.contractAddress}-${nft.walletId}`, 
              nft
            ])
          ).values()
        );
        
        // Set loading progress
        setLoadingProgress(20);
        
        // First fill with data from Redux store - this is fast
        const initialNFTs = uniqueNftIds.map(nftId => {
          // Try to find in Redux store
          const reduxNFT = findNFTInReduxStore(nftId);
          return reduxNFT || createPlaceholderNFT(nftId);
        });
        
        // Update state with initial data
        setCatalogNFTs(initialNFTs);
        setLoadingProgress(40);
        
        // If we have placeholders, try to fetch them from Supabase
        const missingNFTs = initialNFTs.filter(nft => nft.isPlaceholder);
        
        if (missingNFTs.length > 0) {
          // Fetch in smaller batches to avoid overwhelming the API
          const batchSize = 10;
          const totalBatches = Math.ceil(missingNFTs.length / batchSize);
          
          // Create a map to store fetched NFTs by their unique identifier
          const fetchedNFTsMap = new Map();
          
          for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
            // If component unmounted, exit early
            if (!isMounted.current) break;
            
            const batchStart = batchIndex * batchSize;
            const batchEnd = Math.min((batchIndex + 1) * batchSize, missingNFTs.length);
            const batch = missingNFTs.slice(batchStart, batchEnd);
            
            // Update progress
            setLoadingProgress(40 + Math.floor((batchIndex / totalBatches) * 50));
            
            // Process batch
            const batchPromises = batch.map(async (nft) => {
              try {
                const { data: artifacts, error } = await supabase
                  .from('artifacts')
                  .select('*')
                  .eq('wallet_id', nft.walletId)
                  .eq('token_id', nft.id.tokenId)
                  .eq('contract_address', nft.contract.address)
                  .limit(1);
                  
                if (error) throw error;
                
                if (artifacts && artifacts.length > 0) {
                  const convertedNft = convertArtifactToNFT(artifacts[0], nft.walletId);
                  const key = `${convertedNft.id.tokenId}-${convertedNft.contract.address}-${convertedNft.walletId}`;
                  fetchedNFTsMap.set(key, convertedNft);
                  return convertedNft;
                }
                
                return nft; // Keep placeholder if not found
              } catch (error) {
                logger.error('Error fetching NFT details:', error);
                return nft; // Keep placeholder if error
              }
            });
            
            // Wait for all promises in this batch
            await Promise.all(batchPromises);
            
            // Small delay between batches to avoid rate limiting
            if (batchIndex < totalBatches - 1) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
          
          // Only update state if component is still mounted
          if (isMounted.current) {
            // Replace placeholders with actual data
            setCatalogNFTs(prevNFTs => {
              return prevNFTs.map(prevNFT => {
                const key = `${prevNFT.id.tokenId}-${prevNFT.contract.address}-${prevNFT.walletId}`;
                return fetchedNFTsMap.get(key) || prevNFT;
              });
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error fetching NFTs for catalog:', {
        error: error.message,
        catalogId: catalog.id
      });
      setError("Failed to load catalog artifacts. Please try again.");
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setLoadingProgress(100);
      }
      processingBatch.current = false;
    }
  }, [catalog, findNFTInReduxStore, convertArtifactToNFT, createPlaceholderNFT, normalizeNFTData, catalogNFTs.length]);

  // Get media type for filtering
  const getMediaType = useCallback((nft) => {
    if (nft.metadata?.mimeType?.startsWith('video/')) return 'Video';
    if (nft.metadata?.mimeType?.startsWith('audio/')) return 'Audio';
    if (nft.metadata?.mimeType?.startsWith('model/')) return '3D';
    return 'Image';
  }, []);

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    if (!catalogNFTs.length) return [];
    
    // Apply search filter
    let result = [...catalogNFTs];
    
    if (searchTerm) {
      result = result.filter(nft => 
        (nft.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.id?.tokenId || '').toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nft.contract?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Apply active filters
    if (Object.keys(activeFilters).length > 0) {
      result = result.filter(nft => {
        return Object.entries(activeFilters).every(([category, values]) => {
          if (!values.length) return true; // Skip empty filter categories
          
          switch (category) {
            case 'wallet':
              return values.some(value => 
                nft.walletId === value || 
                nft.walletNickname === value
              );
            case 'contract':
              return values.includes(nft.contract?.name);
            case 'network':
              return values.includes(nft.network);
            case 'mediaType':
              const mediaType = getMediaType(nft);
              return values.includes(mediaType);
            default:
              return true;
          }
        });
      });
    }
  
    // Apply sorting
    if (activeSort) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (activeSort.field) {
          case 'name':
            comparison = (a.title || '').localeCompare(b.title || '');
            break;
          case 'wallet':
            comparison = (a.walletNickname || '').localeCompare(b.walletNickname || '');
            break;
          case 'contract':
            comparison = (a.contract?.name || '').localeCompare(b.contract?.name || '');
            break;
          case 'network':
            comparison = (a.network || '').localeCompare(b.network || '');
            break;
          default:
            comparison = 0;
        }
        return activeSort.ascending ? comparison : -comparison;
      });
    }
  
    return result;
  }, [catalogNFTs, searchTerm, activeFilters, activeSort, getMediaType]);
  
  // Handle NFT click to navigate to artifact page
  const handleNFTClick = useCallback((nft) => {
    navigate('/app/artifact', { state: { nft } });
  }, [navigate]);

  // Handle NFT selection
  const handleNFTSelect = useCallback((nft) => {
    setSelectedNFTs(prev => {
      const isSelected = prev.some(selected => 
        selected.id?.tokenId === nft.id?.tokenId &&
        selected.contract?.address === nft.contract?.address
      );
      
      return isSelected
        ? prev.filter(selected => 
            selected.id?.tokenId !== nft.id?.tokenId ||
            selected.contract?.address !== nft.contract?.address
          )
        : [...prev, nft];
    });
  }, []);

  // Handle clear selections
  const handleClearSelections = useCallback(() => {
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort) => {
    setActiveSort(sort);
  }, []);

  // Handle removing selected NFTs
  const handleRemoveSelectedNFTs = useCallback(() => {
    if (selectedNFTs.length === 0) return;
    
    // This would be implemented based on your catalog removal logic
    // For now, just show a success toast
    showSuccessToast(
      "NFTs Removed",
      `${selectedNFTs.length} artifacts removed from catalog.`
    );
    setSelectedNFTs([]);
    setIsSelectMode(false);
  }, [selectedNFTs, showSuccessToast]);

  // Handle refresh button click
  const handleRefresh = useCallback(() => {
    if (isRefreshing || isLoading) return;
    
    setIsRefreshing(true);
    fetchNFTsFromSupabase(true) // Pass true to force refresh
      .then(() => {
        showSuccessToast(
          "Refresh Complete",
          "Catalog artifacts have been refreshed."
        );
      })
      .catch((error) => {
        logger.error('Error refreshing catalog:', error);
      })
      .finally(() => {
        setIsRefreshing(false);
      });
  }, [isRefreshing, isLoading, fetchNFTsFromSupabase, showSuccessToast]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate('/app/catalogs');
  }, [navigate]);

  // Handle name update
  const handleUpdateName = useCallback(async (newName) => {
    if (!catalog || catalog.isSystem || !newName.trim()) return;
    
    try {
      // Update name in Supabase
      const { error } = await supabase
        .from('catalogs')
        .update({ name: newName })
        .eq('id', catalog.id);
        
      if (error) throw error;
      
      // Update name in Redux
      dispatch(updateCatalog({
        id: catalog.id,
        name: newName
      }));
      
      setNameValue(newName);
      setOriginalName(newName);
      showSuccessToast('Name Updated', 'Catalog name has been updated');
    } catch (error) {
      logger.error('Error updating catalog name:', error);
      showErrorToast('Update Failed', 'Failed to update catalog name');
      
      // Reset to original value
      setNameValue(originalName);
    }
    
    setIsEditingName(false);
  }, [catalog, originalName, dispatch, showSuccessToast, showErrorToast]);

// Handle name edit cancel
const handleCancelNameEdit = useCallback(() => {
  setNameValue(originalName);
  setIsEditingName(false);
}, [originalName]);

  // Handle description update
  const handleUpdateDescription = useCallback(async (newDescription) => {
    if (!catalog || catalog.isSystem) return;
    
    try {
      // Update description in Supabase
      const { error } = await supabase
        .from('catalogs')
        .update({ description: newDescription })
        .eq('id', catalog.id);
        
      if (error) throw error;
      
      // Update description in Redux
      dispatch(updateCatalog({
        id: catalog.id,
        description: newDescription
      }));
      
      setDescriptionValue(newDescription);
      setOriginalDescription(newDescription);
      showSuccessToast('Description Updated', 'Catalog description has been updated');
    } catch (error) {
      logger.error('Error updating catalog description:', error);
      showErrorToast('Update Failed', 'Failed to update catalog description');
      
      // Reset to original value
      setDescriptionValue(originalDescription);
    }
    
    setIsEditingDescription(false);
  }, [catalog, originalDescription, dispatch, showSuccessToast, showErrorToast]);

  // Handle description edit cancel
  const handleCancelDescriptionEdit = useCallback(() => {
    setDescriptionValue(originalDescription);
    setIsEditingDescription(false);
  }, [originalDescription]);

  // Get list of wallets and networks for filters
  const availableWallets = useMemo(() => {
    const walletSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.walletNickname) walletSet.add(nft.walletNickname);
      else if (nft.walletId) walletSet.add(getWalletNickname(nft.walletId));
    });
    return Array.from(walletSet);
  }, [catalogNFTs, getWalletNickname]);

  const availableNetworks = useMemo(() => {
    const networkSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.network) networkSet.add(nft.network);
    });
    return Array.from(networkSet);
  }, [catalogNFTs]);

  const availableContracts = useMemo(() => {
    const contractSet = new Set();
    catalogNFTs.forEach(nft => {
      if (nft.contract?.name) contractSet.add(nft.contract.name);
    });
    return Array.from(contractSet);
  }, [catalogNFTs]);

  /**
   * Add an NFT to a catalog - ensures proper database relationships
   * @param {string} catalogId - The ID of the catalog
   * @param {Object} nft - The NFT object to add
   * @returns {Promise<boolean>} - Success status
   */
  const addNFTToCatalog = async (catalogId, nft) => {
    try {
      // Step 1: Find or create the artifact in the artifacts table
      let artifactId;

      // First check if artifact already exists
      const { data: existingArtifact, error: findError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('wallet_id', nft.walletId)
        .eq('token_id', nft.id.tokenId)
        .eq('contract_address', nft.contract.address)
        .eq('network', nft.network || 'unknown')
        .maybeSingle();
      
      if (findError) {
        logger.error('Error finding artifact:', findError);
        throw findError;
      }
      
      if (existingArtifact) {
        // Use existing artifact
        artifactId = existingArtifact.id;
        
        // Update is_in_catalog flag to true
        const { error: updateError } = await supabase
          .from('artifacts')
          .update({ is_in_catalog: true })
          .eq('id', artifactId);
          
        if (updateError) {
          logger.error('Error updating artifact catalog status:', updateError);
          throw updateError;
        }
      } else {
        // Create new artifact
        let mediaUrl = null;
        try {
          // Attempt to get image URL
          if (nft.media && nft.media.length > 0) {
            mediaUrl = nft.media[0].gateway;
          } else if (nft.metadata?.image) {
            mediaUrl = nft.metadata.image;
          }
        } catch (imgError) {
          logger.warn('Error processing image URL:', imgError);
        }
        
        const { data: newArtifact, error: createError } = await supabase
          .from('artifacts')
          .insert([{
            wallet_id: nft.walletId,
            token_id: nft.id.tokenId,
            contract_address: nft.contract.address,
            network: nft.network || 'unknown',
            title: nft.title || `Token ID: ${nft.id.tokenId}`,
            description: nft.description || '',
            metadata: nft.metadata || {},
            media_url: mediaUrl,
            is_spam: nft.isSpam || false,
            is_in_catalog: true // Mark as in catalog
          }])
          .select('id')
          .single();
        
        if (createError) {
          logger.error('Error creating artifact:', createError);
          throw createError;
        }
        
        artifactId = newArtifact.id;
      }
      
      // Step 2: Add relationship to catalog_artifacts junction table
      // First check if relationship already exists
      const { data: existingRelationship, error: relCheckError } = await supabase
        .from('catalog_artifacts')
        .select('*')
        .eq('catalog_id', catalogId)
        .eq('artifact_id', artifactId)
        .maybeSingle();
        
      if (relCheckError) {
        logger.error('Error checking catalog-artifact relationship:', relCheckError);
        throw relCheckError;
      }
      
      // Only add if relationship doesn't exist
      if (!existingRelationship) {
        const { error: relError } = await supabase
          .from('catalog_artifacts')
          .insert([{
            catalog_id: catalogId,
            artifact_id: artifactId,
            created_at: new Date().toISOString()
          }]);
          
        if (relError) {
          logger.error('Error creating catalog-artifact relationship:', relError);
          throw relError;
        }
      }
      
      // Step 3: Update local state (Redux)
      // This part depends on your state management approach
      dispatch({
        type: 'catalogs/addNFTToCatalog',
        payload: { catalogId, nft }
      });
      
      // Also update NFT catalog status
      dispatch({
        type: 'nfts/updateNFTCatalogStatus',
        payload: {
          walletId: nft.walletId,
          contractAddress: nft.contract.address,
          tokenId: nft.id.tokenId,
          network: nft.network,
          isInCatalog: true
        }
      });
      
      logger.log('NFT added to catalog successfully:', { 
        catalogId, 
        artifactId,
        tokenId: nft.id.tokenId
      });
      
      return true;
    } catch (error) {
      logger.error('Error adding NFT to catalog:', error);
      showErrorToast('Error', 'Failed to add NFT to catalog');
      return false;
    }
  };

  // Handle spam toggle
  const handleSpamToggle = useCallback(async (nft) => {
    try {
      // Find the artifact in Supabase
      const { data: existingArtifact, error: findError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('token_id', nft.id.tokenId)
        .eq('contract_address', nft.contract.address)
        .eq('wallet_id', nft.walletId)
        .maybeSingle();
      
      if (findError) {
        logger.error('Error finding artifact:', findError);
        return;
      }
      
      if (existingArtifact) {
        // Update existing artifact
        const { error: updateError } = await supabase
          .from('artifacts')
          .update({ is_spam: !nft.isSpam })
          .eq('id', existingArtifact.id);
          
        if (updateError) {
          logger.error('Error updating spam status:', updateError);
          throw updateError;
        }
      } else {
        // Insert new artifact with spam status
        const { error: insertError } = await supabase
          .from('artifacts')
          .insert([{
            token_id: nft.id.tokenId,
            contract_address: nft.contract.address,
            wallet_id: nft.walletId,
            network: nft.network || 'unknown',
            is_spam: !nft.isSpam,
            title: nft.title || '',
            description: nft.description || '',
            metadata: nft.metadata || {}
          }]);
          
        if (insertError) {
          logger.error('Error creating artifact with spam status:', insertError);
          throw insertError;
        }
      }
      
      // Update local state to reflect the change
      setCatalogNFTs(prev => 
        prev.map(item => 
          item.id?.tokenId === nft.id?.tokenId && 
          item.contract?.address === nft.contract?.address && 
          item.walletId === nft.walletId
            ? { ...item, isSpam: !nft.isSpam }
            : item
        )
      );
      
      // Update Redux state for spam catalog
      // Fetch all spam NFTs and update the spam catalog
      const { data: spamArtifacts } = await supabase
        .from('artifacts')
        .select('*')
        .eq('is_spam', true);
      
      if (spamArtifacts) {
        const spamNFTs = spamArtifacts.map(artifact => ({
          id: { tokenId: artifact.token_id },
          contract: { address: artifact.contract_address },
          title: artifact.title || `Token ID: ${artifact.token_id}`,
          description: artifact.description || '',
          metadata: artifact.metadata || {},
          walletId: artifact.wallet_id,
          network: artifact.network,
          isSpam: true
        }));
        
        dispatch(updateSpamCatalog(spamNFTs));
      }
      
      showInfoToast(
        nft.isSpam ? "Removed from Spam" : "Marked as Spam",
        nft.isSpam 
          ? "The artifact has been removed from your spam folder"
          : "The artifact has been marked as spam"
      );
      
    } catch (error) {
      logger.error('Error in Supabase spam update:', error);
      showErrorToast(
        "Update Error",
        "Failed to update artifact status in database"
      );
    }
  }, [dispatch, showInfoToast, showErrorToast]);

  // Use effect to fetch NFTs when component mounts or catalog changes
  useEffect(() => {
    if (!catalog || initialLoadComplete.current) return;
    
    logger.log('Initial catalog fetch - catalog loaded or changed');
    fetchNFTsFromSupabase();
  }, [catalog, fetchNFTsFromSupabase]);

  // If catalog not found, show error message and back button
  if (!catalog) {
    return (
      <Box p={8} textAlign="center">
        <Alert status="error" borderRadius="md" mb={6}>
          <AlertIcon />
          <Text>Catalog not found. It may have been deleted or you don't have access.</Text>
        </Alert>
        <Button 
          mt={4} 
          colorScheme="blue" 
          onClick={() => navigate('/app/catalogs')}
          size="md"
        >
          Back to Catalogs
        </Button>
      </Box>
    );
  }

  // Format dates for the information tooltip
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      maxW="container.xl"
      mx="auto"
      px={{ base: 4, md: 8 }}
      py={8}
    >
      {/* Header Section */}
      <VStack spacing={6} align="stretch" mb={8}>
        <Button
          leftIcon={<FaChevronLeft />}
          variant="ghost"
          onClick={handleBack}
          alignSelf="flex-start"
          color="var(--ink-grey)"
          fontFamily="Inter"
          _hover={{ 
            bg: "var(--highlight)",
            color: "var(--rich-black)"
          }}
        >
          Back to Catalogs
        </Button>

        {/* Header with Editable Title, Info Icon, and Refresh Icon */}
        <Box>
          <Flex align="center" mb={1}>
            {!catalog.isSystem ? (
              <Editable
                value={nameValue}
                onChange={(value) => setNameValue(value)}
                onSubmit={handleUpdateName}
                onCancel={handleCancelNameEdit}
                placeholder="Catalog Name"
                isPreviewFocusable={true}
                submitOnBlur={false}
                fontSize={{ base: "2xl", md: "3xl" }}
                fontFamily="Space Grotesk"
                color="var(--rich-black)"
                mr={3}
              >
                <HStack>
                  <EditablePreview 
                    _hover={{
                      bg: "var(--highlight)",
                      borderRadius: "md",
                      px: 2
                    }}
                  />
                  <EditableInput />
                  <EditableControls onCancel={handleCancelNameEdit} />
                </HStack>
              </Editable>
            ) : (
              <Heading 
                as="h1" 
                fontSize={{ base: "2xl", md: "3xl" }}
                fontFamily="Space Grotesk"
                color="var(--rich-black)"
                mr={3}
              >
                {catalog.name}
              </Heading>
            )}
            
            {/* Info Icon with Tooltip */}
            <Popover trigger="hover" placement="bottom" strategy="fixed" offset={[0, 8]}>
              <PopoverTrigger>
                <IconButton
                  icon={<FaInfoCircle />}
                  color="var(--ink-grey)" 
                  boxSize={5}
                  cursor="pointer"
                  mx={2}
                  variant="ghost"
                  aria-label="Catalog information"
                  size="sm"
                  _hover={{ color: "var(--warm-brown)" }}
                />
              </PopoverTrigger>
              <PopoverContent 
                width="220px" 
                p={3} 
                bg="rgba(255, 255, 255, 0.95)"
                backdropFilter="blur(5px)"
                boxShadow="md"
                border="1px solid var(--shadow)"
                zIndex={4}
              >
                <PopoverArrow bg="white" />
                <PopoverBody p={0}>
                  <VStack align="stretch" spacing={2}>
                    <Flex justify="space-between">
                      <Text fontFamily="Inter" fontSize="sm" color="var(--ink-grey)">Items:</Text>
                      <Text fontFamily="Space Grotesk" fontSize="sm" fontWeight="medium">{catalogNFTs.length} artifacts</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontFamily="Inter" fontSize="sm" color="var(--ink-grey)">Created:</Text>
                      <Text fontFamily="Space Grotesk" fontSize="sm" fontWeight="medium">{formatDate(catalog.createdAt)}</Text>
                    </Flex>
                    <Flex justify="space-between">
                      <Text fontFamily="Inter" fontSize="sm" color="var(--ink-grey)">Last Updated:</Text>
                      <Text fontFamily="Space Grotesk" fontSize="sm" fontWeight="medium">{formatDate(catalog.updatedAt)}</Text>
                    </Flex>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
            
            {/* Refresh Icon */}
            <IconButton
              icon={<FaSync />}
              isLoading={isRefreshing || isLoading}
              onClick={handleRefresh}
              size="sm"
              aria-label="Refresh catalog"
              variant="ghost"
              color="var(--ink-grey)"
              _hover={{ color: "var(--warm-brown)" }}
            />
          </Flex>
          
          {/* Editable Description Section */}
          {!catalog.isSystem && (
            <Box 
              mt={2} 
              ml={1}
              onMouseEnter={() => !isEditingDescription && setIsEditingDescription(true)}
              onMouseLeave={() => !isEditingDescription && setIsEditingDescription(false)}
            >
              {descriptionValue ? (
                <Editable
                  value={descriptionValue}
                  onChange={(value) => setDescriptionValue(value)}
                  onSubmit={handleUpdateDescription}
                  placeholder="Add description..."
                  isPreviewFocusable={true}
                  width="100%"
                >
                  <Flex align="center">
                    <EditablePreview
                      fontSize="md"
                      fontFamily="Fraunces"
                      color="var(--ink-grey)"
                      py={2}
                      minH="32px"
                      width="100%"
                      _hover={{
                        bg: "var(--highlight)",
                        borderRadius: "md",
                        px: 2,
                        mx: -2
                      }}
                    />
                    <EditableInput
                      fontSize="md"
                      fontFamily="Fraunces"
                      px={2}
                    />
                    <EditableControls onCancel={handleCancelDescriptionEdit} />
                    
                    {isEditingDescription && !descriptionValue && (
                      <HStack ml={2} opacity={0.7}>
                        <Icon as={FaPencilAlt} boxSize={3} color="var(--ink-grey)" />
                        <Text fontSize="sm" color="var(--ink-grey)" fontFamily="Inter">
                          Add Description
                        </Text>
                      </HStack>
                    )}
                  </Flex>
                </Editable>
              ) : (
                <Editable
                  placeholder="Add description..."
                  onSubmit={handleUpdateDescription}
                  onChange={(value) => setDescriptionValue(value)}
                  isPreviewFocusable={true}
                  width="100%"
                >
                  <Flex 
                    align="center"
                    minH="32px"
                    py={2}
                    opacity={isEditingDescription ? 1 : 0}
                    transition="opacity 0.2s"
                    _hover={{ opacity: 1 }}
                  >
                    <EditablePreview
                      fontSize="md"
                      fontFamily="Fraunces"
                      color="var(--ink-grey)"
                      opacity={0.7}
                      width="auto"
                    />
                    <EditableInput
                      fontSize="md"
                      fontFamily="Fraunces"
                      px={2}
                    />
                    <EditableControls onCancel={handleCancelDescriptionEdit} />
                  </Flex>
                </Editable>
              )}
            </Box>
          )}
        </Box>

        {/* Library Controls */}
        <LibraryControls
          wallets={availableWallets}
          networks={availableNetworks}
          contracts={availableContracts}
          mediaTypes={['Image', 'Video', 'Audio', '3D']}
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          isSelectMode={isSelectMode}
          onSelectModeChange={setIsSelectMode}
          onClearSelections={handleClearSelections}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />
        
        {isSelectMode && selectedNFTs.length > 0 && (
          <HStack justifyContent="flex-end">
            <Button
              onClick={handleRemoveSelectedNFTs}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Remove {selectedNFTs.length} selected artifacts
            </Button>
          </HStack>
        )}
      </VStack>

      {/* Error Alert */}
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <Text fontSize="sm" fontFamily="Inter">{error}</Text>
          <Button 
            size="sm" 
            ml="auto" 
            onClick={handleRefresh}
            isLoading={isRefreshing}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Loading Progress */}
      {(isLoading || isRefreshing) && (
        <Box mb={6}>
          <Progress 
            value={loadingProgress} 
            size="xs" 
            colorScheme="blue" 
            isAnimated
            hasStripe
            borderRadius="full"
          />
          <Text 
            fontSize="xs" 
            color="var(--ink-grey)" 
            textAlign="center" 
            mt={1}
            fontFamily="Inter"
          >
            {isRefreshing ? "Refreshing catalog..." : "Loading artifacts..."} {loadingProgress}%
          </Text>
        </Box>
      )}
      
      {/* Content Section */}
      <Box>
        {isLoading && catalogNFTs.length === 0 ? (
          <SimpleGrid columns={gridColumns} spacing={4}>
            {Array(8).fill(0).map((_, i) => (
              <Skeleton
                key={i}
                height="280px"
                borderRadius="md"
              />
            ))}
          </SimpleGrid>
        ) : viewMode === VIEW_MODES.LIST ? (
          <VStack spacing={2} align="stretch">
            {filteredNFTs.map((nft, index) => (
              <ListViewItem
                key={`${nft.contract?.address}-${nft.id?.tokenId}-${index}`}
                nft={{
                  ...nft,
                  // Transform IPFS URLs if needed
                  media: nft.media?.map(media => ({
                    ...media,
                    gateway: transformIpfsUrl(media.gateway)
                  }))
                }}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                onClick={() => handleNFTClick(nft)}
                isSelectMode={isSelectMode}
                isLastItem={index === filteredNFTs.length - 1}
              />
            ))}
          </VStack>
        ) : (
          <SimpleGrid 
            columns={gridColumns}
            spacing={4}
          >
            {filteredNFTs.map((nft, index) => (
              <NFTCard
                key={`${nft.contract?.address}-${nft.id?.tokenId}-${index}`}
                nft={{
                  ...nft,
                  // Transform IPFS URLs if needed
                  media: nft.media?.map(media => ({
                    ...media,
                    gateway: transformIpfsUrl(media.gateway)
                  }))
                }}
                isSelected={selectedNFTs.some(selected => 
                  selected.id?.tokenId === nft.id?.tokenId &&
                  selected.contract?.address === nft.contract?.address
                )}
                onSelect={() => handleNFTSelect(nft)}
                onMarkAsSpam={() => handleSpamToggle(nft)}
                isSpamFolder={catalog.id === 'spam'}
                isSelectMode={isSelectMode}
                onClick={isSelectMode ? () => handleNFTSelect(nft) : () => handleNFTClick(nft)}
                catalogType={catalog.id === 'spam' ? 'spam' : 'user'}
              />
            ))}
          </SimpleGrid>
        )}

        {!isLoading && !isRefreshing && filteredNFTs.length === 0 && (
          <Box 
            textAlign="center" 
            py={12}
            color="var(--ink-grey)"
          >
            <Text 
              fontFamily="Fraunces" 
              fontSize="lg"
            >
              {searchTerm 
                ? `No artifacts matching "${searchTerm}"`
                : "No artifacts found in this catalog"
              }
            </Text>
            {(!searchTerm && !error) && (
              <Button
                mt={4}
                size="sm"
                onClick={handleRefresh}
                leftIcon={<FaSync />}
                colorScheme="blue"
                variant="outline"
              >
                Refresh Catalog
              </Button>
            )}
          </Box>
        )}
      </Box>
    </MotionBox>
  );
};

export default CatalogViewPage;