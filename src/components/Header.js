import React from 'react';
import { Button } from '@/components/ui/button';

const Header = ({ onNavigate }) => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">Artifact Management Platform</h1>
        <nav>
          <Button variant="ghost" onClick={() => onNavigate('gallery')}>Gallery</Button>
          <Button variant="ghost" onClick={() => onNavigate('create')}>Create Artifact</Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;