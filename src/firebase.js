// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKWQJX_LA2Aq2qwqrh35RSFP5MwvYNFE8",
  authDomain: "spotme-bd660.firebaseapp.com",
  databaseURL: "https://spotme-bd660-default-rtdb.firebaseio.com",
  projectId: "spotme-bd660",
  storageBucket: "spotme-bd660.firebasestorage.app",
  messagingSenderId: "608686898570",
  appId: "1:608686898570:web:1a38e638e5c7ab4e6b1c73",
  measurementId: "G-97Z3DBEKLK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);