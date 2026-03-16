// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAZ-HEbjGAy6gKPXxFcrdNwKypVk2NXv2A",
  authDomain: "mlmbooster.firebaseapp.com",
  projectId: "mlmbooster",
  storageBucket: "mlmbooster.firebasestorage.app",
  messagingSenderId: "649090963301",
  appId: "1:649090963301:web:83247d75d046e6fb46b38c",
  measurementId: "G-C3FTH3Q87N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);