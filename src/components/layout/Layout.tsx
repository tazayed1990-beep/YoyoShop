
import { useState } from 'react';
import type { FC, ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout: FC<{ children: ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;