import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChakraProvider, Box } from "@chakra-ui/react";
import MenuModal from '../MenuModal';
import { AppProvider } from '../../../context/app/AppContext';
import theme from '../../styles';
import { ServiceProvider } from '../../../services/service-provider';

const AppLayout = () => {
  const location = useLocation();
  const showMenu = location.pathname !== '/app';

  return (
    <ServiceProvider>
      <ChakraProvider theme={theme}>
        <AppProvider>
          <Box display="flex" minHeight="100vh">
            {/* Menu Components */}
            {showMenu && <MenuModal />}
            
            {/* Main Content */}
            <Box
              flex={1}
              marginLeft={{ base: 0, md: showMenu ? "200px" : 0 }}
              marginBottom={{ base: "60px", md: 0 }}
              width={{ base: "100%", md: `calc(100% - ${showMenu ? "200px" : "0px"})` }}
            >
              <Box 
                maxWidth="1200px"
                mx="auto"
                p={{ base: 3, md: 6 }}
                width="100%"
              >
                <Outlet />
              </Box>
            </Box>
          </Box>
        </AppProvider>
      </ChakraProvider>
    </ServiceProvider>
  );
};

export default AppLayout;