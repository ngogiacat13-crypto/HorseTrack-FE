import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/* Logged-in frame: 64px top bar across, labelled sidebar on the left, scrolling content on the right.
   New pages wrap their content in <div className="ht ht-page">; older pages render as before. */
export const AppLayout: React.FC = () => (
  <div className="ht ht-app ht-app--nav ht-app--fixed">
    <Topbar />
    <Sidebar />
    <div className="ht-app__scroll">
      <Outlet />
    </div>
  </div>
);
