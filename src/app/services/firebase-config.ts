import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyAA7WmoDxeoIjNegg1ADl3di7YR45GPk-U',
  authDomain: 'zebron-2b49f.firebaseapp.com',
  projectId: 'zebron-2b49f',
  storageBucket: 'zebron-2b49f.firebasestorage.app',
  messagingSenderId: '427124681171',
  appId: '1:427124681171:web:d05865aff76fee589a2726',
  measurementId: 'G-PWD4V2RJCY'
};

export const firebaseApp = initializeApp(firebaseConfig);

export const firebaseAuth = getAuth(firebaseApp);

export const firestore = getFirestore(firebaseApp);

export const firebaseFunctions = getFunctions(firebaseApp);

export const firebaseStorage = getStorage(firebaseApp);