import React from 'react';
import {
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { FaFolder, FaEdit, FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { StyledCard } from '../styles/commonStyles';
import { cardSizes } from '../constants/sizes';
import { logger } from '../utils/logger';
import { selectCatalogsInFolder } from '../redux/slices/folderSlice';

const FolderCard = ({ folder, onView, onEdit, onDelete, cardSize = "md" }) => {
  const catalogCount = useSelector(state => selectCatalogsInFolder(state, folder.id)).length;

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit && typeof onEdit === 'function') {
      logger.log('Editing folder:', { folderId: folder.id });
      onEdit(folder);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete && typeof onDelete === 'function') {
      logger.log('Deleting folder:', { folderId: folder.id });
      onDelete(folder.id);
    }
  };

  const handleView = () => {
    if (onView && typeof onView === 'function') {
      logger.log('Viewing folder:', { folderId: folder.id });
      onView(folder);
    }
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
      bg="white"
      boxShadow="0 2px 4px rgba(47, 47, 47, 0.05)"
      borderColor="var(--shadow)"
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
          color="var(--ink-grey)"
          onClick={handleEdit}
          mr={1}
          padding={1}
          minW="auto"
          height="auto"
          _hover={{ color: "var(--warm-brown)" }}
        />
        <IconButton
          icon={<FaTrash />}
          aria-label="Delete folder"
          size="sm"
          variant="ghost"
          color="var(--ink-grey)"
          onClick={handleDelete}
          padding={1}
          minW="auto"
          height="auto"
          _hover={{ color: "red.500" }}
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
          color="var(--warm-brown)"
        />
        <Text 
          fontSize={cardSizes[cardSize].fontSize}
          fontFamily="Space Grotesk"
          color="var(--rich-black)"
          textAlign="center"
          noOfLines={2}
        >
          {folder.name}
        </Text>
        <Text 
          fontSize="sm" 
          fontFamily="Fraunces"
          color="var(--ink-grey)"
        >
          {catalogCount} {catalogCount === 1 ? 'Catalog' : 'Catalogs'}
        </Text>
      </VStack>
    </StyledCard>
  );
};

export default FolderCard;