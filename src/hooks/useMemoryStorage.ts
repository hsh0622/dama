import { useState, useEffect, useCallback } from 'react';
import type { MemoryItem } from '../types/memory';
import type { InterviewResponse } from '../types/interview';
import type { Documentary } from '../types/documentary';
import { storageService } from '../services/storage';
import type { AppSettings } from '../services/storage';
import { mediaDb } from '../utils/file';
import { auth, db, isFirebaseConfigured } from '../services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query
} from 'firebase/firestore';

export interface FamilyPersona {
  id: string;
  name: string;
  relationship: string;
  description: string;
  welcomeMessage: string;
  avatarColor?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  isSimulated: boolean;
}
const objectUrlCache = new Map<string, string>();

export const useMemoryStorage = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [interviews, setInterviews] = useState<InterviewResponse[]>([]);
  const [documentary, setDocumentary] = useState<Documentary | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ geminiApiKey: '', isMockMode: true });
  const [loading, setLoading] = useState(true);
  const [familyPersonas, setFamilyPersonas] = useState<FamilyPersona[]>([]);

  // Synchronize family personas from localStorage (cross-session & cross-tab)
  useEffect(() => {
    const key = currentUser
      ? `family_personas_${currentUser.uid || currentUser.email}`
      : `family_personas_guest`;
    const saved = localStorage.getItem(key);
    if (saved) {
      setFamilyPersonas(JSON.parse(saved));
    } else {
      // Set beautifully customized initial default personas for the user
      const defaults: FamilyPersona[] = [
        {
          id: 'persona_1',
          name: '엄마',
          relationship: '어머니',
          description: '자녀의 건강과 끼니를 늘 살갑게 물어보는 다정한 말투',
          welcomeMessage: '엄마야. 우리 착한 아이, 오늘 하루는 어땠는지 묻고 싶네. 힘든 일은 없었는지, 네 조그마한 일상이 늘 궁금하고 소중하단다.',
          avatarColor: 'rose',
          createdAt: new Date().toISOString()
        },
        {
          id: 'persona_2',
          name: '아빠',
          relationship: '아버지',
          description: '묵묵히 격려해 주는 신뢰와 든든함 가득한 말투',
          welcomeMessage: '아빠다. 우리 아들/딸, 요즘 하려는 일들은 잘 가닥이 잡혀가고 있니? 힘들고 무거울 땐 언제든 아빠한테 기대도 좋단다.',
          avatarColor: 'indigo',
          createdAt: new Date().toISOString()
        },
        {
          id: 'persona_3',
          name: '할머니',
          relationship: '할머니',
          description: '"우리 귀한 똥강아지 왔나" 하고 정겹게 반겨주시는 옛 말투',
          welcomeMessage: '아이고, 우리 귀한 똥강아지 왔는가! 밥은 굶고 다니지 않는제? 할미는 맨날 니 건강하고 잘 묵는 생각만 하고 산단다.',
          avatarColor: 'amber',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(key, JSON.stringify(defaults));
      setFamilyPersonas(defaults);
    }
  }, [currentUser]);

  const savePersonas = useCallback((list: FamilyPersona[]) => {
    const key = currentUser
      ? `family_personas_${currentUser.uid || currentUser.email}`
      : `family_personas_guest`;
    localStorage.setItem(key, JSON.stringify(list));
    setFamilyPersonas(list);
    window.dispatchEvent(new Event('dama-personas-sync'));
  }, [currentUser]);

  // Listener for cross-tab persona sync
  useEffect(() => {
    const handleSync = () => {
      const key = currentUser
        ? `family_personas_${currentUser.uid || currentUser.email}`
        : `family_personas_guest`;
      const saved = localStorage.getItem(key);
      if (saved) setFamilyPersonas(JSON.parse(saved));
    };
    window.addEventListener('dama-personas-sync', handleSync);
    return () => window.removeEventListener('dama-personas-sync', handleSync);
  }, [currentUser]);

  const addFamilyPersona = useCallback((persona: FamilyPersona) => {
    const key = currentUser
      ? `family_personas_${currentUser.uid || currentUser.email}`
      : `family_personas_guest`;
    const list = JSON.parse(localStorage.getItem(key) || '[]') as FamilyPersona[];
    list.push(persona);
    savePersonas(list);
  }, [currentUser, savePersonas]);

  const updateFamilyPersona = useCallback((id: string, updated: Partial<FamilyPersona>) => {
    const key = currentUser
      ? `family_personas_${currentUser.uid || currentUser.email}`
      : `family_personas_guest`;
    let list = JSON.parse(localStorage.getItem(key) || '[]') as FamilyPersona[];
    list = list.map(p => p.id === id ? { ...p, ...updated } : p);
    savePersonas(list);
  }, [currentUser, savePersonas]);

  const deleteFamilyPersona = useCallback((id: string) => {
    const key = currentUser
      ? `family_personas_${currentUser.uid || currentUser.email}`
      : `family_personas_guest`;
    let list = JSON.parse(localStorage.getItem(key) || '[]') as FamilyPersona[];
    list = list.filter(p => p.id !== id);
    savePersonas(list);
  }, [currentUser, savePersonas]);

  // Asynchronously resolve stored IndexedDB media blobs (like videos or photos) to URL object strings
  // and dynamically purge old robotic AI summary remnants from previous sessions
  useEffect(() => {
    let active = true;
    
    const resolveMedia = async () => {
      let changed = false;
      const resolved = await Promise.all(memories.map(async (item) => {
        let currentItem = { ...item };
        
        // Dynamically purge old, robotic AI summary texts from previous uploads
        if (
          currentItem.aiAnalysis &&
          currentItem.aiAnalysis.summary &&
          (currentItem.aiAnalysis.summary.includes('기록을 바탕으로') ||
           currentItem.aiAnalysis.summary.includes('요약해 보았습니다'))
        ) {
          changed = true;
          currentItem.aiAnalysis = {
            ...currentItem.aiAnalysis,
            summary: currentItem.description
              ? `소중하게 적어주신 "${currentItem.description.slice(0, 35)}${currentItem.description.length > 35 ? '...' : ''}" 이야기가 들려주는 그 시절의 아늑한 온기와 발자취가 전해옵니다.`
              : '가장 포근하고 빛나던 한때의 흔적입니다. 마음 깊은 곳에 놓인 따스했던 웃음소리와 소중한 추억의 공기가 은은하게 피어오릅니다.'
          };
        }

        const storedFile = await mediaDb.get(currentItem.id);
        if (storedFile) {
          let objectUrl = objectUrlCache.get(currentItem.id);
          if (!objectUrl) {
            objectUrl = URL.createObjectURL(storedFile);
            objectUrlCache.set(currentItem.id, objectUrl);
          }
          if (currentItem.mediaUrl !== objectUrl) {
            changed = true;
            currentItem.mediaUrl = objectUrl;
          }
        }
        return currentItem;
      }));
      
      if (active && changed) {
        setMemories(resolved);
      }
    };
    
    if (memories.length > 0) {
      resolveMedia();
    }
    return () => {
      active = false;
    };
  }, [memories]);

  // Load static settings (resides locally)
  useEffect(() => {
    const sets = storageService.getSettings();
    setSettings(sets);
  }, []);

  // Listen to settings sync event to update settings across other instances of this hook reactively
  useEffect(() => {
    const handleSettingsSync = () => {
      const sets = storageService.getSettings();
      setSettings(sets);
    };
    window.addEventListener('dama-settings-sync', handleSettingsSync);
    return () => {
      window.removeEventListener('dama-settings-sync', handleSettingsSync);
    };
  }, []);

  // Sync user session state (Firebase Auth + Simulated Offline Auth)
  useEffect(() => {
    setLoading(true);

    const checkSimulatedUser = () => {
      const simUserRaw = localStorage.getItem('dama_simulated_user');
      if (simUserRaw) {
        try {
          const parsed = JSON.parse(simUserRaw);
          setCurrentUser({
            uid: `sim_${parsed.email}`,
            email: parsed.email,
            isSimulated: true,
          });
        } catch (e) {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };

    let unsubscribeFirebase = () => {};

    if (isFirebaseConfigured) {
      // Real Firebase session listener
      unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            isSimulated: false,
          });
        } else {
          // If logged out from Firebase, check if local simulated session is active
          checkSimulatedUser();
        }
      });
    } else {
      // Simulated only session listener
      checkSimulatedUser();
    }

    // Listen to custom session events
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'dama_simulated_user') {
        checkSimulatedUser();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      unsubscribeFirebase();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Sync Memories, Interviews, Documentary depending on active session state
  useEffect(() => {
    if (loading && !currentUser) {
      // Loading auth state initially
    }

    setLoading(true);

    if (!currentUser) {
      // --- Guest/Sandbox Offline Mode ---
      const guestMems = storageService.getMemories();
      const guestInts = storageService.getInterviews();
      const guestDoc = storageService.getDocumentary();
      
      setMemories(guestMems);
      setInterviews(guestInts);
      setDocumentary(guestDoc);
      setLoading(false);
      return;
    }

    if (currentUser.isSimulated) {
      // --- Simulated User Segmented Storage Mode ---
      const loadSimulatedData = () => {
        const memsKey = `dama_sim_mems_${currentUser.email}`;
        const intsKey = `dama_sim_ints_${currentUser.email}`;
        const docKey = `dama_sim_doc_${currentUser.email}`;

        const memsRaw = localStorage.getItem(memsKey);
        const intsRaw = localStorage.getItem(intsKey);
        const docRaw = localStorage.getItem(docKey);

        const mems = memsRaw ? JSON.parse(memsRaw) : [];
        const ints = intsRaw ? JSON.parse(intsRaw) : [];
        const doc = docRaw ? JSON.parse(docRaw) : null;

        setMemories(mems);
        setInterviews(ints);
        setDocumentary(doc);
        setLoading(false);
      };

      loadSimulatedData();

      // Simple handler for storage sync
      const syncHandler = () => {
        loadSimulatedData();
      };
      window.addEventListener('dama-sim-sync', syncHandler);
      return () => {
        window.removeEventListener('dama-sim-sync', syncHandler);
      };
    }

    // --- Real Firebase Firestore Live Sync Mode ---
    // 1. Live Sync Memories
    const memQuery = query(collection(db, 'users', currentUser.uid, 'memories'));
    const unsubMemories = onSnapshot(memQuery, (snapshot) => {
      const list: MemoryItem[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as MemoryItem);
      });
      // Sort chronologically by date
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMemories(list);
    }, (err) => console.error('Firestore Memories Sync Error:', err));

    // 2. Live Sync Interviews
    const intQuery = query(collection(db, 'users', currentUser.uid, 'interviews'));
    const unsubInterviews = onSnapshot(intQuery, (snapshot) => {
      const list: InterviewResponse[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as InterviewResponse);
      });
      // Sort chronologically
      list.sort((a, b) => new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime());
      setInterviews(list);
    }, (err) => console.error('Firestore Interviews Sync Error:', err));

    // 3. Live Sync Documentary
    const docRef = doc(db, 'users', currentUser.uid, 'documentary', 'current');
    const unsubDoc = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setDocumentary(snapshot.data() as Documentary);
      } else {
        setDocumentary(null);
      }
      setLoading(false);
    }, (err) => {
      console.error('Firestore Documentary Sync Error:', err);
      setLoading(false);
    });

    return () => {
      unsubMemories();
      unsubInterviews();
      unsubDoc();
    };
  }, [currentUser]);

  // Helper helper to trigger local storage/simulation manual dispatch events
  const dispatchSimSync = () => {
    window.dispatchEvent(new Event('dama-sim-sync'));
  };

  // --- Actions ---

  const addMemory = useCallback(async (memory: MemoryItem) => {
    if (!currentUser) {
      // Guest
      storageService.addMemory(memory);
      setMemories(prev => [...prev, memory]);
      return;
    }

    if (currentUser.isSimulated) {
      // Simulated User
      const key = `dama_sim_mems_${currentUser.email}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]') as MemoryItem[];
      list.push(memory);
      localStorage.setItem(key, JSON.stringify(list));
      setMemories(list);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'memories', memory.id), memory);
    } catch (e) {
      console.error('Failed to add memory to Firestore:', e);
    }
  }, [currentUser]);

  const updateMemory = useCallback(async (id: string, updated: Partial<MemoryItem>) => {
    if (!currentUser) {
      storageService.updateMemory(id, updated);
      setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_mems_${currentUser.email}`;
      let list = JSON.parse(localStorage.getItem(key) || '[]') as MemoryItem[];
      list = list.map(m => m.id === id ? { ...m, ...updated } : m);
      localStorage.setItem(key, JSON.stringify(list));
      setMemories(list);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      const currentMem = memories.find(m => m.id === id);
      if (currentMem) {
        const fullMem = { ...currentMem, ...updated };
        await setDoc(doc(db, 'users', currentUser.uid, 'memories', id), fullMem);
      }
    } catch (e) {
      console.error('Failed to update memory in Firestore:', e);
    }
  }, [currentUser, memories]);

  const deleteMemory = useCallback(async (id: string) => {
    // Clean up IndexedDB and cached object URLs
    await mediaDb.delete(id);
    const cachedUrl = objectUrlCache.get(id);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      objectUrlCache.delete(id);
    }

    if (!currentUser) {
      storageService.deleteMemory(id);
      setMemories(prev => prev.filter(m => m.id !== id));
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_mems_${currentUser.email}`;
      let list = JSON.parse(localStorage.getItem(key) || '[]') as MemoryItem[];
      list = list.filter(m => m.id !== id);
      localStorage.setItem(key, JSON.stringify(list));
      setMemories(list);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'memories', id));
    } catch (e) {
      console.error('Failed to delete memory from Firestore:', e);
    }
  }, [currentUser]);

  const addInterviewResponse = useCallback(async (response: InterviewResponse) => {
    if (!currentUser) {
      storageService.addInterviewResponse(response);
      setInterviews(prev => [...prev, response]);
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_ints_${currentUser.email}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]') as InterviewResponse[];
      list.push(response);
      localStorage.setItem(key, JSON.stringify(list));
      setInterviews(list);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'interviews', response.id), response);
    } catch (e) {
      console.error('Failed to add interview response to Firestore:', e);
    }
  }, [currentUser]);

  const deleteInterviewResponse = useCallback(async (id: string) => {
    if (!currentUser) {
      storageService.deleteInterviewResponse(id);
      setInterviews(prev => prev.filter(i => i.id !== id));
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_ints_${currentUser.email}`;
      let list = JSON.parse(localStorage.getItem(key) || '[]') as InterviewResponse[];
      list = list.filter(i => i.id !== id);
      localStorage.setItem(key, JSON.stringify(list));
      setInterviews(list);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'interviews', id));
    } catch (e) {
      console.error('Failed to delete interview from Firestore:', e);
    }
  }, [currentUser]);

  const saveDocumentary = useCallback(async (docu: Documentary) => {
    if (!currentUser) {
      storageService.saveDocumentary(docu);
      setDocumentary(docu);
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_doc_${currentUser.email}`;
      localStorage.setItem(key, JSON.stringify(docu));
      setDocumentary(docu);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'documentary', 'current'), docu);
    } catch (e) {
      console.error('Failed to save documentary to Firestore:', e);
    }
  }, [currentUser]);

  const deleteDocumentary = useCallback(async () => {
    if (!currentUser) {
      storageService.deleteDocumentary();
      setDocumentary(null);
      return;
    }

    if (currentUser.isSimulated) {
      const key = `dama_sim_doc_${currentUser.email}`;
      localStorage.removeItem(key);
      setDocumentary(null);
      dispatchSimSync();
      return;
    }

    // Firestore Real
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'documentary', 'current'));
    } catch (e) {
      console.error('Failed to delete documentary from Firestore:', e);
    }
  }, [currentUser]);

  const updateSettings = useCallback((newSettings: AppSettings) => {
    storageService.saveSettings(newSettings);
    setSettings(newSettings);
    window.dispatchEvent(new Event('dama-settings-sync'));
  }, []);

  const resetAllData = useCallback(() => {
    if (!currentUser) {
      storageService.resetAllData();
      const guestMems = storageService.getMemories();
      const guestInts = storageService.getInterviews();
      const guestDoc = storageService.getDocumentary();
      setMemories(guestMems);
      setInterviews(guestInts);
      setDocumentary(guestDoc);
      return;
    }

    if (currentUser.isSimulated) {
      const memsKey = `dama_sim_mems_${currentUser.email}`;
      const intsKey = `dama_sim_ints_${currentUser.email}`;
      const docKey = `dama_sim_doc_${currentUser.email}`;
      
      localStorage.removeItem(memsKey);
      localStorage.removeItem(intsKey);
      localStorage.removeItem(docKey);
      
      setMemories([]);
      setInterviews([]);
      setDocumentary(null);
      dispatchSimSync();
      return;
    }

    // Real Firebase - for safety, let user know they must delete items individually or clear subcollections.
    // We will clear state arrays which Firestore listeners will soon pick up.
    alert('온라인 클라우드 데이터는 보관함 개별 삭제 및 관리를 권장합니다.');
  }, [currentUser]);

  const logOut = useCallback(async () => {
    if (currentUser?.isSimulated) {
      localStorage.removeItem('dama_simulated_user');
      setCurrentUser(null);
      // Custom storage event for local updates
      window.dispatchEvent(new Event('storage'));
    } else if (isFirebaseConfigured) {
      try {
        await signOut(auth);
        setCurrentUser(null);
      } catch (e) {
        console.error('Failed to log out:', e);
      }
    }
  }, [currentUser]);

  return {
    currentUser,
    memories,
    interviews,
    documentary,
    settings,
    loading,
    familyPersonas,
    addMemory,
    updateMemory,
    deleteMemory,
    addInterviewResponse,
    deleteInterviewResponse,
    saveDocumentary,
    deleteDocumentary,
    updateSettings,
    resetAllData,
    logOut,
    addFamilyPersona,
    updateFamilyPersona,
    deleteFamilyPersona
  };
};
export default useMemoryStorage;
