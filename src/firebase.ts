import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ContactConfig, DemandForm, MeetingAppointment } from './types';

// Provided Firebase credentials
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

// -------------------------------------------------------------
// 1. Contact Configuration in Firestore
// -------------------------------------------------------------
export async function saveContactConfigToFirestore(config: ContactConfig): Promise<void> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC);
    await setDoc(docRef, {
      ...config,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Could not save contact config to Firestore:', error);
  }
}

export function subscribeContactConfigFromFirestore(
  onUpdate: (config: ContactConfig) => void
): () => void {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, CONTACT_CONFIG_DOC);
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as ContactConfig;
        onUpdate(data);
      }
    }, (error) => {
      console.warn('[Firebase] Snapshot error for contact config:', error);
    });
  } catch (error) {
    console.warn('[Firebase] Error setting up contact config listener:', error);
    return () => {};
  }
}

// -------------------------------------------------------------
// 2. Demands (Forms / Diagnósticos) in Firestore
// -------------------------------------------------------------
export async function saveDemandToFirestore(demand: DemandForm): Promise<void> {
  try {
    const docRef = doc(db, DEMANDS_COLLECTION, demand.id);
    await setDoc(docRef, {
      ...demand,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Could not save demand to Firestore:', error);
  }
}

export async function deleteDemandFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, DEMANDS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('[Firebase] Could not delete demand from Firestore:', error);
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
      console.warn('[Firebase] Snapshot error for demands:', error);
    });
  } catch (error) {
    console.warn('[Firebase] Error setting up demands listener:', error);
    return () => {};
  }
}

// -------------------------------------------------------------
// 3. Appointments (Reuniões Google Meet) in Firestore
// -------------------------------------------------------------
export async function saveAppointmentToFirestore(appointment: MeetingAppointment): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, appointment.id);
    await setDoc(docRef, {
      ...appointment,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    console.warn('[Firebase] Could not save appointment to Firestore:', error);
  }
}

export async function deleteAppointmentFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, APPOINTMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn('[Firebase] Could not delete appointment from Firestore:', error);
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
      console.warn('[Firebase] Snapshot error for appointments:', error);
    });
  } catch (error) {
    console.warn('[Firebase] Error setting up appointments listener:', error);
    return () => {};
  }
}

// -------------------------------------------------------------
// 4. Firebase Storage for Images (Profile / Brand Photo)
// -------------------------------------------------------------
export async function uploadProfilePhotoToStorage(file: File): Promise<string> {
  try {
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `profile_photo_${Date.now()}.${ext}`;
    const storageRef = ref(storage, `profile_photos/${filename}`);
    const uploadResult = await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg'
    });
    const downloadUrl = await getDownloadURL(uploadResult.ref);
    return downloadUrl;
  } catch (error) {
    console.error('[Firebase Storage] Upload error:', error);
    throw error;
  }
}
