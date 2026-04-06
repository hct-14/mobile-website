import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, User, db, getDoc, setDoc, doc } from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isLoginModalOpen: false,
  setLoginModalOpen: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create initial profile
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || 'Khách hàng',
              email: currentUser.email || '',
              role: (currentUser.email === 'thanhpiosoft@gmail.com' || currentUser.email === 'vuthily111102@gmail.com' || currentUser.email === 'admin@gmail.com') ? 'admin' : 'customer',
              createdAt: new Date().toISOString()
            } as any;
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const isAdmin = profile?.role === 'admin' || user?.email === 'thanhpiosoft@gmail.com' || user?.email === 'vuthily111102@gmail.com' || user?.email === 'admin@gmail.com';

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, isLoginModalOpen, setLoginModalOpen }}>
      {children}
    </AuthContext.Provider>
  );
};
