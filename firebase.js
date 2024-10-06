// Import the functions you need from the SDKs you need
const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
require('dotenv').config(); // Menggunakan require untuk dotenv

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: process.env.firebase,
    authDomain: "radya-personal.firebaseapp.com",
    projectId: "radya-personal",
    storageBucket: "radya-personal.appspot.com",
    messagingSenderId: "343479055201",
    appId: "1:343479055201:web:de8e8b1c1fbf1dccd5cb20",
    measurementId: "G-FHG2BSP40Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export the db instance
module.exports = { db };
