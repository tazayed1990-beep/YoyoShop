import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useTranslation } from '../hooks/useTranslation';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'password' | 'magiclink'>('password');
  const { login, sendLoginLink } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError(t('invalid_credentials'));
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await sendLoginLink(email);
      setMessage('Check your email for the sign-in link!');
    } catch (err: any) {
      setError(err.message || 'Failed to send link. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMethod = () => {
    setAuthMethod(prev => prev === 'password' ? 'magiclink' : 'password');
    setError('');
    setMessage('');
    setPassword('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">{t('sign_in_to_yoyo_shop')}</h1>
        <form className="mt-8 space-y-6" onSubmit={authMethod === 'password' ? handlePasswordSubmit : handleMagicLinkSubmit}>
          <Input
            label={t('email_address')}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
          />
          {authMethod === 'password' && (
            <Input
              label={t('password')}
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          )}

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {message && <p className="text-sm text-green-500 text-center">{message}</p>}
          
          <Button type="submit" className="w-full" disabled={loading || !email}>
            {loading 
              ? (authMethod === 'password' ? t('signing_in') : 'Sending link...')
              : (authMethod === 'password' ? t('sign_in') : 'Send Sign-In Link')
            }
          </Button>

          <div className="text-sm text-center">
            <button
                type="button"
                onClick={toggleAuthMethod}
                className="font-medium text-primary-600 hover:underline dark:text-primary-500"
            >
                {authMethod === 'password' ? 'Or sign in with a magic link' : 'Or sign in with password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
