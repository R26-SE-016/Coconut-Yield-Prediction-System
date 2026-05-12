import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCrqDXBMiOYx3EltN2C1iWZ6JE65sfj8YQ",
  authDomain: "cococastai.firebaseapp.com",
  projectId: "cococastai",
  storageBucket: "cococastai.firebasestorage.app",
  messagingSenderId: "984368469928",
  appId: "1:984368469928:web:91043d161367751062af9d",
  measurementId: "G-B8H1Z7E39L"
};

const app = initializeApp(firebaseConfig);
let analytics;
// Ensure analytics only runs in the browser
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

const database = getDatabase(app);

export { app, analytics, database };
