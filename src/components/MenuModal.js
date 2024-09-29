import React from 'react';
import { Box, VStack, Button, Text, useColorModeValue } from "@chakra-ui/react";
import { FaHome, FaBookOpen, FaUser, FaCog } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';

const MenuModal = () => {
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const hoverColor = useColorModeValue('gray.200', 'gray.700');
  const activeColor = useColorModeValue('blue.500', 'blue.300');

  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: 'Home', icon: FaHome, path: '/home' },
    { name: 'Library', icon: FaBookOpen, path: '/library' },
    { name: 'Profile', icon: FaUser, path: '/profile' },
    { name: 'Admin', icon: FaCog, path: '/admin' },
  ];

  const handleNavigate = (path) => {
    navigate(path);
  };

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
      <Text 
        fontSize="2xl" 
        fontWeight="bold" 
        mb={8} 
        display={{ base: "none", md: "block" }}
        cursor="pointer"
        onClick={() => navigate('/')}
      >
        Alix
      </Text>
      <VStack spacing={2} align="stretch">
        {menuItems.map((item) => (
          <Button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            variant="ghost"
            justifyContent={{ base: "center", md: "flex-start" }}
            leftIcon={<item.icon />}
            color={location.pathname === item.path ? activeColor : textColor}
            bg={location.pathname === item.path ? hoverColor : 'transparent'}
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