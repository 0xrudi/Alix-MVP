import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { AuthProvider } from './context/auth/AuthContext';
import store from './app/redux/store';
import RootRouter from './RootRouter';
import './index.css';

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <BrowserRouter>
          <RootRouter />
        </BrowserRouter>
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);