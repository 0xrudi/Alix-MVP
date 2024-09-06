import React from 'react';
import ReactDOM from 'react-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import App from './App';
import './index.css';

import { Buffer } from 'buffer';
window.Buffer = Buffer;

ReactDOM.render(
  <React.StrictMode>
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
      }}
    >
      <App />
    </PrivyProvider>
  </React.StrictMode>,
  document.getElementById('root')
);