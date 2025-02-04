import React from 'react';
import { Outlet } from 'react-router-dom';
import { ChakraProvider } from "@chakra-ui/react";
import theme from '../../app/styles';
import WebsiteNavigation from '../components/WebsiteNavigation';

const WebsiteLayout = () => {
  return (
    <ChakraProvider theme={theme}>
      <div className="min-h-screen flex flex-col">
        <WebsiteNavigation />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </ChakraProvider>
  );
};

export default WebsiteLayout;