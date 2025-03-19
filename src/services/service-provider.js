// src/services/service-provider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { 
  UserService, 
  WalletService, 
  ArtifactService, 
  CatalogService, 
  FolderService 
} from './index';
import { logger } from '../utils/logger';

// Create service instances
const userService = new UserService(supabase);
const walletService = new WalletService(supabase);
const artifactService = new ArtifactService(supabase);
const catalogService = new CatalogService(supabase);
const folderService = new FolderService(supabase);

const ServicesContext = createContext(undefined);

export const ServiceProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial user session
    const initializeSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (error) {
        logger.error('Error getting session:', error);
        setLoading(false);
      }
    };

    initializeSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    userService,
    walletService,
    artifactService,
    catalogService,
    folderService
  };

  return (
    <ServicesContext.Provider value={value}>
      {children}
    </ServicesContext.Provider>
  );
};

export const useServices = () => {
  const context = useContext(ServicesContext);
  if (context === undefined) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};