import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import "remixicon/fonts/remixicon.css";
import { UserProvider } from './context/UserContext.jsx'; // Import UserProvider
import { OwnerProvider } from './context/OwnerContext.jsx'; // Import OwnerProvider
import { ThemeProvider } from './context/ThemeContext.jsx'; // Import ThemeProvider

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider> {/* ThemeProvider should be at a high level */}
      <UserProvider>
        <OwnerProvider>
          <App />
        </OwnerProvider>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>,
);