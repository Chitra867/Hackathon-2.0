import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const Layout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-[#f8f4eb]">
    <Navbar />
    <main className="flex-1 min-w-0">
      <Outlet />
    </main>
    <Footer />
  </div>
);
