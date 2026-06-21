import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Note: Replace these with your actual Firebase project settings later in Phase 5
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "ai-mixologist-b4ruch.firebaseapp.com",
  projectId: "ai-mixologist-b4ruch",
  storageBucket: "ai-mixologist-b4ruch.appspot.com",
  messagingSenderId: "PLACEHOLDER",
  appId: "PLACEHOLDER"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
