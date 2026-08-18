import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { initializeApp } from 'firebase/app';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAA7WmoDxeoIjNegg1ADl3di7YR45GPk-U",
  authDomain: "zebron-2b49f.firebaseapp.com",
  projectId: "zebron-2b49f",
  storageBucket: "zebron-2b49f.firebasestorage.app",
  messagingSenderId: "427124681171",
  appId: "1:427124681171:web:d05865aff76fee589a2726",
  measurementId: "G-PWD4V2RJCY"
};

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAA7WmoDxeoIjNegg1ADl3di7YR45GPk-U",
  authDomain: "zebron-2b49f.firebaseapp.com",
  projectId: "zebron-2b49f",
  storageBucket: "zebron-2b49f.firebasestorage.app",
  messagingSenderId: "427124681171",
  appId: "1:427124681171:web:d05865aff76fee589a2726",
  measurementId: "G-PWD4V2RJCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

@Injectable({
  providedIn: 'root',
})
export class FirebaseConfig {

  
  
}
