import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initFirebaseAdminApp } from '@/lib/firebase-admin-config';
import { cookies } from 'next/headers';

async function getTokens() {
  const session = cookies().get('session')?.value;
  if (!session) {
    return null;
  }
  return JSON.parse(session);
}

export async function getAuthenticatedAppForUser() {
  const tokens = await getTokens();

  if (!tokens) {
    throw new Error('No tokens found. User is not authenticated.');
  }
  
  const app = initFirebaseAdminApp();
  
  return {
    app,
    auth: getAuth(app),
    firestore: getFirestore(app),
  };
}