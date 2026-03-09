// Mock Firebase implementation for functional demo
// In a real scenario, this would import from 'firebase/app' and 'firebase/auth'

export const auth = {
  currentUser: JSON.parse(localStorage.getItem('mock_user') || 'null'),
};

const notifyAuthListeners = () => {
  // Simple observer pattern simulation
  const user = auth.currentUser;
  (window as any).__authListeners?.forEach((cb: any) => cb(user));
};

export const onAuthStateChanged = (authObj: any, callback: (user: any) => void) => {
  if (!(window as any).__authListeners) {
    (window as any).__authListeners = [];
  }
  (window as any).__authListeners.push(callback);
  
  // Initial call
  callback(auth.currentUser);
  
  return () => {
    (window as any).__authListeners = (window as any).__authListeners.filter((cb: any) => cb !== callback);
  };
};

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  // Mock login
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
        // Simple mock validation
        if(email.includes('error')) {
            reject(new Error('Mock invalid credential error'));
            return;
        }

        const user = { 
            email, 
            uid: 'mock-uid-' + Date.now(),
            displayName: email.split('@')[0],
            photoURL: null 
        };
        auth.currentUser = user;
        localStorage.setItem('mock_user', JSON.stringify(user));
        notifyAuthListeners();
        resolve();
    }, 800);
  });
};

export const createUserWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
    // Mock signup
    return new Promise<void>((resolve) => {
      setTimeout(() => {
          const user = { 
              email, 
              uid: 'mock-uid-' + Date.now(), 
              displayName: email.split('@')[0],
              photoURL: null
          };
          auth.currentUser = user;
          localStorage.setItem('mock_user', JSON.stringify(user));
          notifyAuthListeners();
          resolve();
      }, 1000);
    });
};

export const signInWithGoogle = async () => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            const user = {
                email: 'google_user@example.com',
                uid: 'mock-google-uid',
                displayName: 'Google User',
                photoURL: 'https://picsum.photos/200'
            };
            auth.currentUser = user;
            localStorage.setItem('mock_user', JSON.stringify(user));
            notifyAuthListeners();
            resolve();
        }, 1000);
    });
};

export const logout = async () => {
    return new Promise<void>((resolve) => {
        auth.currentUser = null;
        localStorage.removeItem('mock_user');
        notifyAuthListeners();
        resolve();
    });
};

export const updateProfile = async (user: any, updates: { displayName?: string, photoURL?: string }) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            if (auth.currentUser) {
                auth.currentUser = { ...auth.currentUser, ...updates };
                localStorage.setItem('mock_user', JSON.stringify(auth.currentUser));
                notifyAuthListeners();
            }
            resolve();
        }, 500);
    });
};

export const updateEmail = async (user: any, newEmail: string) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            if (auth.currentUser) {
                auth.currentUser = { ...auth.currentUser, email: newEmail };
                localStorage.setItem('mock_user', JSON.stringify(auth.currentUser));
                notifyAuthListeners();
            }
            resolve();
        }, 500);
    });
};

export const updatePassword = async (user: any, newPass: string) => {
    return new Promise<void>((resolve) => {
        setTimeout(() => {
            resolve(); // Mock success
        }, 500);
    });
};