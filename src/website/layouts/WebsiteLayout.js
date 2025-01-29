import React from 'react';
import { Outlet } from 'react-router-dom';
import WebsiteNavigation from '../components/WebsiteNavigation';
import WebsiteFooter from '../components/WebsiteFooter';

const WebsiteLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4]">
      <WebsiteNavigation />
      <main className="flex-grow">
        <Outlet />
      </main>
      <WebsiteFooter />
    </div>
  );
};

export default WebsiteLayout;