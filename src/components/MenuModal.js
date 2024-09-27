import React from 'react';
import { Box, VStack, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { FaHome, FaBookOpen, FaUser, FaCog } from 'react-icons/fa';

const MenuModal = ({ onNavigate, currentPage }) => {
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const hoverColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.300');

  const menuItems = [
    { name: 'Home', icon: FaHome, path: 'home' },
    { name: 'Library', icon: FaBookOpen, path: 'library' },
    { name: 'Profile', icon: FaUser, path: 'profile' },
    { name: 'Admin', icon: FaCog, path: 'admin' },
  ];

  return (
    <Box
      position="fixed"
      left={0}
      top={0}
      bottom={0}
      width={{ base: "60px", md: "200px" }}
      bg={bgColor}
      p={4}
      zIndex={1000}
      color={textColor}
    >
      <Text fontSize="2xl" fontWeight="bold" mb={8} display={{ base: "none", md: "block" }}>Alix</Text>
      <VStack spacing={2} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            onClick={() => onNavigate(item.path)}
            variant="ghost"
            justifyContent={{ base: "center", md: "flex-start" }}
            leftIcon={<item.icon />}
            color={currentPage === item.path ? activeColor : textColor}
            bg={currentPage === item.path ? hoverColor : 'transparent'}
            _hover={{ bg: hoverColor }}
            w="100%"
            borderRadius="md"
            py={3}
          >
            <Text display={{ base: "none", md: "block" }}>{item.name}</Text>
          </Button>
        ))}
      </VStack>
    </Box>
  );
};

export default MenuModal;