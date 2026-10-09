import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AppLayout: React.FC = () => {
  return (
    <div className="d-flex" style={{ height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1" style={{ minWidth: 0 }}>
        <Topbar />
        <div
          className="flex-grow-1"
          style={{ overflowY: 'auto', backgroundColor: 'var(--bg)' }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
};
