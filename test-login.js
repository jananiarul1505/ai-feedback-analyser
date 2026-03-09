import { auth, signInWithGoogle, onAuthStateChanged } from './services/firebase.ts';

onAuthStateChanged(auth, (user) => {
    console.log("Auth changed:", user?.email);
});

console.log("Calling Google login");
signInWithGoogle().then(() => {
    console.log("Login done, user is:", auth.currentUser?.email);
});
