import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import "remixicon/fonts/remixicon.css";
import { UserProvider } from './context/UserContext.jsx';
import { OwnerProvider } from './context/OwnerContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CsrfProvider } from './context/CsrfContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <CsrfProvider>
        <UserProvider>
          <OwnerProvider>
            <WishlistProvider>
              <App />
            </WishlistProvider>
          </OwnerProvider>
        </UserProvider>
      </CsrfProvider>
    </ThemeProvider>
  </React.StrictMode>,
);