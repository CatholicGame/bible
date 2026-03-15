import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB6Zzp-JR5rngyrlU0YW1ORI2wm6B0LlWs",
  authDomain: "catholicquizz-a15d0.firebaseapp.com",
  databaseURL: "https://catholicquizz-a15d0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "catholicquizz-a15d0",
  storageBucket: "catholicquizz-a15d0.firebasestorage.app",
  messagingSenderId: "417071319468",
  appId: "1:417071319468:web:be8317b6b7cc38d5fb5209",
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);
export default app;
