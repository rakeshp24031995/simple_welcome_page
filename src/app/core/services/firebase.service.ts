import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  deleteDoc,
  addDoc,
  Timestamp
} from 'firebase/firestore';
import { environment } from '../../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private app: FirebaseApp;
  private auth: Auth;
  private firestore: Firestore;
  
  private authStateSubject = new BehaviorSubject<FirebaseUser | null>(null);
  public authState$ = this.authStateSubject.asObservable();

  constructor() {
    try {
      // Validate Firebase configuration
      if (!environment.firebase.apiKey || !environment.firebase.projectId) {
        console.error('Firebase configuration missing:', {
          hasApiKey: !!environment.firebase.apiKey,
          hasProjectId: !!environment.firebase.projectId
        });
        throw new Error('Firebase configuration is incomplete');
      }
      
      console.log('Initializing Firebase with project:', environment.firebase.projectId);
      
      // Initialize Firebase
      this.app = initializeApp(environment.firebase);
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      
      console.log('Firebase initialized successfully');
      
      // Listen to auth state changes
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          console.log('User authenticated:', user.email);
        } else {
          console.log('User signed out');
        }
        this.authStateSubject.next(user);
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw error;
    }
  }

  // Authentication Methods
  async signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
    return userCredential.user;
  }

  async createUserWithEmail(email: string, password: string, displayName: string): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    await updateProfile(userCredential.user, { displayName });
    return userCredential.user;
  }

  async signOutUser(): Promise<void> {
    await signOut(this.auth);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // Firestore Methods
  async createDocument(collectionName: string, docId: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  async addDocument(collectionName: string, data: any): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, collectionName), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return docRef.id;
  }

  async getDocument(collectionName: string, docId: string): Promise<any> {
    const docRef = doc(this.firestore, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Document not found');
    }
  }

  async getCollection(collectionName: string, orderByField?: string): Promise<any[]> {
    let q;
    if (orderByField) {
      q = query(collection(this.firestore, collectionName), orderBy(orderByField, 'desc'));
    } else {
      q = query(collection(this.firestore, collectionName));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getCollectionWhere(collectionName: string, field: string, operator: any, value: any): Promise<any[]> {
    const q = query(collection(this.firestore, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updateDocument(collectionName: string, docId: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async deleteDocument(collectionName: string, docId: string): Promise<void> {
    const docRef = doc(this.firestore, collectionName, docId);
    await deleteDoc(docRef);
  }

  // Helper method to convert Firestore Timestamp to Date
  convertTimestamp(timestamp: any): Date {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate();
    }
    return new Date(timestamp);
  }

  // Get current authenticated user
  getCurrentUser(): FirebaseUser | null {
    return this.auth.currentUser;
  }

  // Get Auth instance for OTP service
  getAuth(): Auth {
    return this.auth;
  }

  // Query documents with condition
  async queryDocuments(collectionName: string, field: string, operator: any, value: any): Promise<any[]> {
    const q = query(collection(this.firestore, collectionName), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}