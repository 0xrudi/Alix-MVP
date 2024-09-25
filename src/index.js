import './polyfills';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import './global.css';
import './global';

ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('root')
  );