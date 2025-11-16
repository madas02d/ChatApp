// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD24L_vJ9WxMWLLcItkUs0QBqWrQKuSrZM",
  authDomain: "chatapp-2be9c.firebaseapp.com",
  projectId: "chatapp-2be9c",
  storageBucket: "chatapp-2be9c.appspot.com",
  messagingSenderId: "218116445618",
  appId: "1:218116445618:web:a79a6e7c0b816028d900ab",
  measurementId: "G-D00ZV3N6W8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Export the services
export { auth, storage };