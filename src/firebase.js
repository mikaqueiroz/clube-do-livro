import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCcGXvLtS4ezkbz5icw3Bpt-WB0h8nyOsE",
  authDomain: "clube-do-livro-df494.firebaseapp.com",
  projectId: "clube-do-livro-df494",
  storageBucket: "clube-do-livro-df494.firebasestorage.app",
  messagingSenderId: "727013098031",
  appId: "1:727013098031:web:859516465d2238ba1abcda"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);