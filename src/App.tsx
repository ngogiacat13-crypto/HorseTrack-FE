import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './styles/tokens.css';
import './styles/ht.css';
import './styles/trainer.css';
import './styles/vet.css';
import './styles/groom.css';
import './styles/owner.css';
import './styles/landing.css';
import { AuthProvider } from './auth/AuthContext';
import { ToastProvider } from './components/ui/Ht';
import { AppRoutes } from './routers';

const App: React.FC = () => (
  <AuthProvider>
    <ToastProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ToastProvider>
  </AuthProvider>
);

export default App;
