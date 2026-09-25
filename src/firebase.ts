import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDoc,
  getDocs,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ContactConfig, DemandForm, MeetingAppointment } from './types';

// Provided Firebase credentials for Beeginning 4 you
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDVXVS2FzKaGZcn3IALp5av6WDZaN_2vsc",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "beegining4you.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "beegining4you",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "beegining4you.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "14993501241",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:14993501241:web:f8697fb01d54f99864b1e8",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MQNEB7WND8"
};

// Initialize Firebase App (singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Collection References
export const SETTINGS_COLLECTION = 'settings';
export const CONTACT_CONFIG_DOC = 'contact_config';
export const DEMANDS_COLLECTION = 'demands';
export const APPOINTMENTS_COLLECTION = 'appointments';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Client is offline or establishing connection.');
    }
  }
}
if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedFields(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// -------------------------------------------------------------
// 1. Contact Configuration in Firestore
// -------------------------------------------------------------
export async function fetchContactConfigFromFirestore(): Promise<ContactConfig | null> {
  const path = `${SETTINGS_COLLECTION}/${CONTACT_CONFIG_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ContactConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveContactConfigToFirestore(config: ContactConfig): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${CONTACT_CONFIG_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC);
    const sanitized = removeUndefinedFields(config);
    await setDoc(docRef, {
      ...sanitized,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log('[Firestore] Configuração de canais e disponibilidade salva na nuvem com sucesso.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeContactConfigFromFirestore(
  onUpdate: (config: ContactConfig) => void
): () => void {
  const path = `${SETTINGS_COLLECTION}/${CONTACT_CONFIG_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ContactConfig;
        onUpdate(data);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return () => {};
  }
}

// -------------------------------------------------------------
// 2. Demands (Forms / Diagnósticos) in Firestore
// -------------------------------------------------------------
export async function fetchDemandsFromFirestore(): Promise<DemandForm[]> {
  try {
    const colRef = collection(db, DEMANDS_COLLECTION);
    const snap = await getDocs(colRef);
    const items: DemandForm[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as DemandForm);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DEMANDS_COLLECTION);
    return [];
  }
}

export async function saveDemandToFirestore(demand: DemandForm): Promise<void> {
  const path = `${DEMANDS_COLLECTION}/${demand.id}`;
  try {
    const docRef = doc(db, DEMANDS_COLLECTION, demand.id);
    const sanitized = removeUndefinedFields(demand);
    await setDoc(docRef, {
      ...sanitized,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDemandFromFirestore(id: string): Promise<void> {
  const path = `${DEMANDS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, DEMANDS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeDemandsFromFirestore(
  onUpdate: (demands: DemandForm[]) => void
): () => void {
  try {
    const colRef = collection(db, DEMANDS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const items: DemandForm[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as DemandForm);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, DEMANDS_COLLECTION);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, DEMANDS_COLLECTION);
    return () => {};
  }
}

// -------------------------------------------------------------
// 3. Appointments (Reuniões Google Meet) in Firestore
// -------------------------------------------------------------
export async function fetchAppointmentsFromFirestore(): Promise<MeetingAppointment[]> {
  try {
    const colRef = collection(db, APPOINTMENTS_COLLECTION);
    const snap = await getDocs(colRef);
    const items: MeetingAppointment[] = [];
    snap.forEach((docSnap) => {
      items.push(docSnap.data() as MeetingAppointment);
    });
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPOINTMENTS_COLLECTION);
    return [];
  }
}

export async function saveAppointmentToFirestore(appointment: MeetingAppointment): Promise<void> {
  const path = `${APPOINTMENTS_COLLECTION}/${appointment.id}`;
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
    const sanitized = removeUndefinedFields(appointment);
    await setDoc(docRef, {
      ...sanitized,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  const path = `${APPOINTMENTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeAppointmentsFromFirestore(
  onUpdate: (appointments: MeetingAppointment[]) => void
): () => void {
  try {
    const colRef = collection(db, APPOINTMENTS_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const items: MeetingAppointment[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as MeetingAppointment);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, APPOINTMENTS_COLLECTION);
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, APPOINTMENTS_COLLECTION);
    return () => {};
  }
}

// -------------------------------------------------------------
// 4. Firebase Storage for Images (Profile / Brand Photo)
// -------------------------------------------------------------
export async function uploadProfilePhotoToStorage(file: File): Promise<string> {
  const uploadTask = async () => {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `profile_photo_${Date.now()}.${ext}`;
    const storageRef = ref(storage, `profile_photos/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    return await getDownloadURL(uploadResult.ref);
  };

  // Timeout after 3.5s so client never hangs if Firebase Storage bucket is unavailable
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Firebase Storage timeout')), 3500)
  );

  return Promise.race([uploadTask(), timeoutPromise]);
}
