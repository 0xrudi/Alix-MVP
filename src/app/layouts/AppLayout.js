import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ChakraProvider, Box } from "@chakra-ui/react";
import MenuModal from '../components/MenuModal';
import { AppProvider } from '../context/AppContext';
import theme from '../styles';

const AppLayout = () => {
  const location = useLocation();
  const showMenu = location.pathname !== '/app';

  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <Box>
          {showMenu && <MenuModal />}
          <Box 
            marginLeft={{ base: 0, md: showMenu ? "200px" : "0" }}
            marginBottom={{ base: "60px", md: 0 }}
            // Remove unnecessary padding
            p={{ base: 0, md: 8 }}
            width="100%"
            maxWidth="100%"
            overflowX="hidden"
          >
            <Box 
              maxWidth={{ base: "100%", md: "1200px" }}
              mx="auto"
              px={{ base: 4, md: 6 }}
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      </AppProvider>
    </ChakraProvider>
  );
};

export default AppLayout;
