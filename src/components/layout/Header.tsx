
import type { FC } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useTranslation } from '../../hooks/useTranslation';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md p-4 flex justify-between items-center">
      <div className="flex items-center">
        <button
          className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none md:hidden me-4"
          onClick={onMenuClick}
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden sm:block text-xl font-semibold text-gray-700 dark:text-gray-200">
            {t('welcome_user', { name: user?.name || 'User' })}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-end hidden sm:block">
            <div className="font-medium dark:text-white">{user?.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</div>
        </div>
        <Button onClick={handleLogout} variant="danger" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:me-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden md:inline">{t('logout')}</span>
        </Button>
      </div>
    </header>
  );
};

export default Header;
