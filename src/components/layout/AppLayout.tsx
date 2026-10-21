import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => (
  <div className="ht ht-app ht-app--nav ht-app--fixed">
    <Topbar />
    <Sidebar />
    <div className="ht-app__scroll">
      <Outlet />
    </div>
  </div>
);
