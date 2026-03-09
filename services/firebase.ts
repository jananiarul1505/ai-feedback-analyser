import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as logout,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app;
let authInstance: any = null;

try {
  // Only initialize if config is provided
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'MISSING_API_KEY') {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } else {
    console.warn("Firebase config is missing. Please set VITE_FIREBASE_* environment variables.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

// Fallback/Mock behavior if Firebase is not configured (prevents complete app crash)
const mockAuth = {
  currentUser: JSON.parse(localStorage.getItem('mock_user') || 'null'),
};

const notifyAuthListeners = () => {
  const user = mockAuth.currentUser;
  (window as any).__authListeners?.forEach((cb: any) => cb(user));
};

export const auth = authInstance || mockAuth;

const onAuthStateChangedWrapper = (authObj: any, callback: (user: any) => void) => {
  if (authInstance) {
    return onAuthStateChanged(authInstance, callback);
  }
  
  if (!(window as any).__authListeners) {
    (window as any).__authListeners = [];
  }
  (window as any).__authListeners.push(callback);
  callback(mockAuth.currentUser);
  return () => {
    (window as any).__authListeners = (window as any).__authListeners.filter((cb: any) => cb !== callback);
  };
};

const signInWithEmailAndPasswordWrapper = async (authObj: any, email: string, pass: string) => {
  if (authInstance) {
    return signInWithEmailAndPassword(authInstance, email, pass);
  }
  return new Promise<void>((resolve) => {
    const user = { email, uid: 'mock-uid-' + Date.now(), displayName: email.split('@')[0], photoURL: null };
    mockAuth.currentUser = user;
    localStorage.setItem('mock_user', JSON.stringify(user));
    notifyAuthListeners();
    resolve();
  });
};

const createUserWithEmailAndPasswordWrapper = async (authObj: any, email: string, pass: string) => {
  if (authInstance) {
    return createUserWithEmailAndPassword(authInstance, email, pass);
  }
  return new Promise<void>((resolve) => {
    const user = { email, uid: 'mock-uid-' + Date.now(), displayName: email.split('@')[0], photoURL: null };
    mockAuth.currentUser = user;
    localStorage.setItem('mock_user', JSON.stringify(user));
    notifyAuthListeners();
    resolve();
  });
};

const signInWithGoogleWrapper = async () => {
  if (authInstance) {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider);
  }
  return new Promise<void>((resolve) => {
    const user = {
        email: 'google_user@example.com',
        uid: 'mock-google-uid',
        displayName: 'Google User',
        photoURL: 'https://picsum.photos/200'
    };
    mockAuth.currentUser = user;
    localStorage.setItem('mock_user', JSON.stringify(user));
    notifyAuthListeners();
    resolve();
  });
};

const logoutWrapper = async () => {
  if (authInstance) {
    return logout(authInstance);
  }
  return new Promise<void>((resolve) => {
    mockAuth.currentUser = null;
    localStorage.removeItem('mock_user');
    notifyAuthListeners();
    resolve();
  });
};

const updateProfileWrapper = async (user: any, updates: { displayName?: string, photoURL?: string }) => {
  if (authInstance) {
    return updateProfile(user, updates);
  }
  if (mockAuth.currentUser) {
      mockAuth.currentUser = { ...mockAuth.currentUser, ...updates };
      localStorage.setItem('mock_user', JSON.stringify(mockAuth.currentUser));
      notifyAuthListeners();
  }
};

const updateEmailWrapper = async (user: any, newEmail: string) => {
  if (authInstance) {
    return updateEmail(user, newEmail);
  }
  if (mockAuth.currentUser) {
      mockAuth.currentUser = { ...mockAuth.currentUser, email: newEmail };
      localStorage.setItem('mock_user', JSON.stringify(mockAuth.currentUser));
      notifyAuthListeners();
  }
};

const updatePasswordWrapper = async (user: any, newPass: string) => {
  if (authInstance) {
    return updatePassword(user, newPass);
  }
};

export {
  onAuthStateChangedWrapper as onAuthStateChanged,
  signInWithEmailAndPasswordWrapper as signInWithEmailAndPassword,
  createUserWithEmailAndPasswordWrapper as createUserWithEmailAndPassword,
  signInWithGoogleWrapper as signInWithGoogle,
  logoutWrapper as logout,
  updateProfileWrapper as updateProfile,
  updateEmailWrapper as updateEmail,
  updatePasswordWrapper as updatePassword
};
