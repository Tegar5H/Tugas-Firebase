
import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { firebaseConfig } from "./config";

const appName = "firebase-frameworks";

function getAdminApp() {
  if (getApps().some((app) => app.name === appName)) {
    return getApp(appName);
  }
  
  if (process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
     return initializeApp({
      credential: {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY as string).replace(/\\n/g, '\n')
      }
    }, appName);
  }

  return initializeApp(undefined, appName);
}


export function initializeFirebase() {
  const app = getAdminApp();
  return {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}
