import React from 'react';
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaFolder, FaEdit, FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { StyledCard } from '../styles/commonStyles';
import { cardSizes } from '../constants/sizes';
import { logger } from '../utils/logger';
import { selectFolderRelationships } from '../redux/slices/folderSlice';

const FolderCard = ({ folder, onView, onEdit, onDelete, cardSize = "md" }) => {
  const folderColor = useColorModeValue('blue.400', 'blue.600');
  const relationships = useSelector(selectFolderRelationships);
  const catalogCount = relationships[folder.id]?.size || folder.catalogIds?.length || 0;

  const handleEdit = (e) => {
    e.stopPropagation();
    logger.log('Editing folder:', { folderId: folder.id });
    onEdit();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    logger.log('Deleting folder:', { folderId: folder.id, catalogCount });
    onDelete();
  };

  const handleView = () => {
    logger.log('Viewing folder:', { folderId: folder.id });
    onView();
  };

  return (
    <StyledCard 
      onClick={handleView}
      role="button"
      cursor="pointer"
      transition="transform 0.2s"
      _hover={{ 
        transform: 'translateY(-4px)',
        '& .action-buttons': { opacity: 1 }
      }}
      position="relative"
      p={cardSizes[cardSize].padding}
      width={cardSizes[cardSize].width}
      maxW="100%"
    >
      <Flex 
        position="absolute"
        top={1}
        right={1}
        className="action-buttons"
        opacity={0}
        transition="opacity 0.2s"
        zIndex={2}
      >
        <IconButton
          icon={<FaEdit />}
          aria-label="Edit folder"
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={handleEdit}
          mr={1}
          padding={1}
          minW="auto"
          height="auto"
        />
        <IconButton
          icon={<FaTrash />}
          aria-label="Delete folder"
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={handleDelete}
          padding={1}
          minW="auto"
          height="auto"
        />
      </Flex>
  
      <VStack 
        spacing={cardSizes[cardSize].spacing} 
        align="center"
        my={cardSizes[cardSize].marginY}
      >
        <Icon 
          as={FaFolder} 
          boxSize={cardSizes[cardSize].icon}
          color={folderColor} 
        />
        <Text 
          fontSize={cardSizes[cardSize].fontSize}
          fontWeight="bold"
          textAlign="center"
          noOfLines={2}
        >
          {folder.name}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {catalogCount} {catalogCount === 1 ? 'Catalog' : 'Catalogs'}
        </Text>
      </VStack>
    </StyledCard>
  );
};

export default FolderCard;