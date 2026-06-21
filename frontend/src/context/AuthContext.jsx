import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Will be useful when real firebase connects

  useEffect(() => {
    // For now we mock the auth state resolving quickly
    // const unsubscribe = onAuthStateChanged(auth, (usr) => {
    //   setUser(usr);
    //   setLoading(false);
    // });
    // return unsubscribe;
    
    setTimeout(() => {
        setLoading(false);
    }, 500);
  }, []);

  const loginGuest = async () => {
     try {
        // Mocking login for UI display
        setUser({ uid: "guest_123", isAnonymous: true });
        // await signInAnonymously(auth);
     } catch (error) {
        console.error(error);
     }
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginGuest }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
