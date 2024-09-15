import React from 'react';
import { Box, VStack, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { FaHome, FaBookOpen, FaUser } from 'react-icons/fa';

const MenuModal = ({ onNavigate, currentPage }) => {
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const textColor = useColorModeValue('gray.100', 'gray.100');
  const hoverColor = useColorModeValue('gray.700', 'gray.700');
  const activeColor = useColorModeValue('gray.700', 'gray.700');

  const menuItems = [
    { name: 'Home', icon: FaHome, path: 'home' },
    { name: 'Library', icon: FaBookOpen, path: 'library' },
    { name: 'Profile', icon: FaUser, path: 'profile' },
  ];

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width="200px"
      bg={bgColor}
      p={4}
      zIndex={1000}
      color={textColor}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={8}>Alix</Text>
      <VStack spacing={2} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            variant="ghost"
            justifyContent="flex-start"
            leftIcon={<item.icon />}
            bg={currentPage === item.path ? activeColor : 'transparent'}
            _hover={{ bg: hoverColor }}
            w="100%"
            borderRadius="md"
            py={3}
          >
            {item.name}
          </Button>
        ))}
      </VStack>
    </Box>
  );
};

export default MenuModal;