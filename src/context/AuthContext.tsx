import { createContext, useState, useEffect, type FC, type ReactNode } from 'react';
import { auth } from '../services/firebase';
import api from '../services/api';
import { User } from '../types';
import firebase from 'firebase/compat/app';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  firebaseUser: firebase.User | null;
  login: (email: string, password: string) => Promise<void>;
  sendLoginLink: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Effect to handle sign-in when the user clicks the email link and returns to the app
  useEffect(() => {
    if (auth.isSignInWithEmailLink(window.location.href)) {
      setLoading(true);
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // User opened the link on a different device. To prevent session fixation
        // attacks, prompt the user to provide the email again.
        email = window.prompt('Please provide your email for confirmation');
      }
      // If email is available, sign the user in
      if (email) {
        auth.signInWithEmailLink(email, window.location.href)
          .catch((error) => {
            console.error("Failed to sign in with email link", error);
            alert(`Error signing in: ${error.message}`);
            setLoading(false);
          })
          .finally(() => {
            window.localStorage.removeItem('emailForSignIn');
            // The onAuthStateChanged listener will handle setting user state and turning off loading
          });
      } else {
        // No email provided
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in, get their profile from Firestore
        try {
          const userProfile = await api.getUserProfile(fbUser.uid);
          if (userProfile) {
            setUser(userProfile);
          } else {
            // This can happen if the user exists in Auth but not in Firestore DB
            console.error("User profile not found in Firestore. Logging out.");
            await auth.signOut();
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user profile", error);
          await auth.signOut();
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged will handle setting the user state
  };
  
  const sendLoginLink = async (email: string) => {
    const actionCodeSettings = {
      // URL to redirect back to. The domain must be whitelisted in the Firebase Console.
      url: 'https://yoyo-shop-tiy6.vercel.app', 
      handleCodeInApp: true,
    };
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);
    // Save the email locally so you don't have to ask the user for it again
    // if they open the link on the same device.
    window.localStorage.setItem('emailForSignIn', email);
  };

  const logout = async () => {
    await auth.signOut();
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, firebaseUser, login, sendLoginLink, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
