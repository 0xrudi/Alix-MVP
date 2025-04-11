// src/redux/ReduxStoreProvider.js
import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { useServices } from '../services/service-provider';
import { enhanceStoreWithSupabase, getStore } from './store';
import { registerGlobalServices } from './middleware/supabaseMiddleware';
import { logger } from '../utils/logger';

/**
 * Redux store provider that enhances the store with Supabase services
 * This component should be a child of ServiceProvider to ensure
 * services are available before the Redux store is configured
 */
const ReduxStoreProvider = ({ children }) => {
  // Get services from the ServiceProvider
  const services = useServices();
  
  // Enhance the store with services when they become available
  useEffect(() => {
    if (services) {
      logger.log('Enhancing Redux store with services', {
        hasServices: !!services,
        serviceKeys: Object.keys(services)
      });
      
      // Enhance the store with Supabase middleware
      enhanceStoreWithSupabase(services);
      
      // Register services globally as a fallback
      registerGlobalServices(services);
    }
  }, [services]);
  
  // Get the current store (enhanced if services are available)
  const store = getStore();
  
  return <Provider store={store}>{children}</Provider>;
};

export default ReduxStoreProvider;