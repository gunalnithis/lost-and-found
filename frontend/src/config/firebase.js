import { initializeApp, getApps } from "firebase/app";
import { getAuth, FacebookAuthProvider, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const hasRequiredFirebaseConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

let auth = null;
let googleProvider = null;
let facebookProvider = null;

if (hasRequiredFirebaseConfig) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);

  googleProvider = new GoogleAuthProvider();
  facebookProvider = new FacebookAuthProvider();

  googleProvider.setCustomParameters({ prompt: "select_account" });
}

export { auth, googleProvider, facebookProvider, hasRequiredFirebaseConfig };
