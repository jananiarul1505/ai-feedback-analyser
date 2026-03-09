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
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== 'MISSING_API_KEY') {
    app = initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } else {
    console.error("Firebase config is missing. Please set VITE_FIREBASE_* environment variables.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export const auth = authInstance;

const signInWithGoogle = async () => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  const provider = new GoogleAuthProvider();
  return signInWithPopup(authInstance, provider);
};

const signInWithEmailAndPasswordWrapper = async (authObj: any, email: string, pass: string) => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return signInWithEmailAndPassword(authInstance, email, pass);
};

const createUserWithEmailAndPasswordWrapper = async (authObj: any, email: string, pass: string) => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return createUserWithEmailAndPassword(authInstance, email, pass);
};

const logoutWrapper = async () => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return logout(authInstance);
};

const updateProfileWrapper = async (user: any, updates: { displayName?: string, photoURL?: string }) => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return updateProfile(user, updates);
};

const updateEmailWrapper = async (user: any, newEmail: string) => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return updateEmail(user, newEmail);
};

const updatePasswordWrapper = async (user: any, newPass: string) => {
  if (!authInstance) throw new Error("Firebase Auth is not initialized.");
  return updatePassword(user, newPass);
};

export {
  onAuthStateChanged,
  signInWithEmailAndPasswordWrapper as signInWithEmailAndPassword,
  createUserWithEmailAndPasswordWrapper as createUserWithEmailAndPassword,
  signInWithGoogle,
  logoutWrapper as logout,
  updateProfileWrapper as updateProfile,
  updateEmailWrapper as updateEmail,
  updatePasswordWrapper as updatePassword
};
