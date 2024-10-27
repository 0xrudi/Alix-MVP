import React from 'react';
import {
  Box,
  VStack,
  Text,
  IconButton,
  Icon,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { FaFolder, FaEdit, FaTrash } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { selectCatalogsInFolder } from '../redux/slices/folderSlice';
import { StyledCard } from '../styles/commonStyles';
import { cardSizes } from '../constants/sizes';

const FolderCard = ({ folder, onView, onEdit, onDelete, cardSize = "md" }) => {
  const catalogIds = useSelector(state => selectCatalogsInFolder(state, folder.id));
  const folderColor = useColorModeValue('blue.400', 'blue.600');
  
  // Define size mappings
  const sizes = {
    sm: {
      icon: '1.5rem',
      fontSize: 'sm',
      padding: 2,
      width: '150px', // Base width for small cards
      spacing: 0.5,
    },
    md: {
      icon: '2rem',
      fontSize: 'md',
      padding: 3,
      width: '200px', // Base width for medium cards
      spacing: 1,
    },
    lg: {
      icon: '3rem',
      fontSize: 'lg',
      padding: 4,
      width: '250px', // Base width for large cards
      spacing: 2,
    }
  };
  
  return (
    <StyledCard 
      onClick={onView}
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
      {/* Action buttons container */}
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
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
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
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          padding={1}
          minW="auto"
          height="auto"
        />
      </Flex>
  
      {/* Main content */}
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
          {catalogIds.length} {catalogIds.length === 1 ? 'Catalog' : 'Catalogs'}
        </Text>
      </VStack>
    </StyledCard>
  );
};


export default FolderCard;
