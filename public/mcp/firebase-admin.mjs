import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function serviceAccountFromEnv() {
  const raw = String(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    return parsed;
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON não contém um JSON válido: ${error.message}`);
  }
}

export function getAdminFirestore(config) {
  const existing = getApps()[0];
  if (existing) return getFirestore(existing);

  const serviceAccount = serviceAccountFromEnv();
  const app = initializeApp({
    credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
    ...(config.projectId ? { projectId: config.projectId } : {}),
  });
  return getFirestore(app);
}
