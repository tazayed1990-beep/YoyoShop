// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDzM-fYMOsxqEJ5yhT2cfqDwRLRX9RCdNQ",
  authDomain: "yoyo-shop-90c24.firebaseapp.com",
  projectId: "yoyo-shop-90c24",
  storageBucket: "yoyo-shop-90c24.appspot.com",
  messagingSenderId: "590085992760",
  appId: "1:590085992760:web:39fe307ab0233b724091cd",
  measurementId: "G-L2BC412R0L"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
