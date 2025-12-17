import { initializeApp, getApps, App } from 'firebase-admin/app';

const FIREBASE_ADMIN_APP_NAME = 'firebase-frameworks';

export function initFirebaseAdminApp(): App {
  const apps = getApps();
  const existingApp = apps.find(app => app.name === FIREBASE_ADMIN_APP_NAME);

  if (existingApp) {
    return existingApp;
  }

  // Set GOOGLE_APPLICATION_CREDENTIALS
  process.env.GOOGLE_APPLICATION_CREDENTIALS = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH;

  return initializeApp(
    {
       credential: {
         projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
         clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
         privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY as string).replace(/\\n/g, '\n')
       }
    },
    FIREBASE_ADMIN_APP_NAME
  );
}
