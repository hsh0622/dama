import type { MemoryItem } from '../types/memory';
import type { InterviewResponse } from '../types/interview';
import type { Documentary } from '../types/documentary';

const MEMORIES_KEY = 'memory_capsule_memories';
const INTERVIEWS_KEY = 'memory_capsule_interviews';
const DOCUMENTARY_KEY = 'memory_capsule_documentary';
const SETTINGS_KEY = 'memory_capsule_settings';

export interface AppSettings {
  geminiApiKey: string;
  isMockMode: boolean;
  fontSize?: 'normal' | 'large' | 'huge';
}

// Beautiful initial default memories to showcase the app's capability and automatically generate personas
const DEFAULT_MEMORIES: MemoryItem[] = [
  {
    id: 'mem_1',
    type: 'photo',
    title: '엄마가 차려준 따뜻한 생일상',
    description: '올해 내 생일에 엄마가 아침 일찍 일어나서 끓여주신 소고기 미역국과 직접 조려주신 달콤한 조기조림. 반찬 하나하나에 엄마의 사랑과 정성이 듬뿍 담겨 있어서 미역국 한 그릇을 남김없이 싹 비웠다.',
    date: '2026-03-12',
    mediaUrl: '',
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      tags: ['엄마', '생일', '집밥', '정성'],
      sentiment: '따뜻함',
      summary: '어머니의 아늑한 온기가 고스란히 담긴 따스한 밥상의 추억입니다.',
      suggestedTitle: '엄마가 차려준 따뜻한 생일상',
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: 'mem_2',
    type: 'photo',
    title: '아빠와의 남해 안면도 낚시',
    description: "아빠와 단둘이 떠났던 남해 안면도 낚시. 아빠는 바다를 바라보며 잔잔히 말씀하셨다. '세상 파도가 칠 때는 잠시 낚싯대를 걷고 숨을 고르며 바다를 봐라.' 아빠의 그 깊은 뒷모습과 든든한 가르침을 영원히 기억하고 싶다.",
    date: '2025-09-18',
    mediaUrl: '',
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      tags: ['아빠', '낚시', '바다', '조언'],
      sentiment: '신뢰',
      summary: '언제나 든든한 등대처럼 나를 지탱해 주시던 아버지의 묵직한 사랑입니다.',
      suggestedTitle: '아빠와의 남해 안면도 낚시',
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: 'mem_3',
    type: 'audio',
    title: '할머니의 포근한 품과 시골집 옛날이야기',
    description: "시골집 앞마당 평상에 둘러앉아 들려주셨던 할머니의 옛이야기. 할머니는 투박한 거친 손으로 내 머리를 쓰다듬으며 항상 '우리 이쁜 똥강아지'라고 불러 주셨다. 그 시골집 마당의 풀 냄새와 할머니의 따뜻했던 눈빛을 그리며.",
    date: '2024-07-21',
    mediaUrl: '',
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      tags: ['할머니', '이야기', '시골집', '사랑'],
      sentiment: '그리움',
      summary: '지극한 내리사랑으로 안아주시던 정겨운 할머니의 목소리 흔적입니다.',
      suggestedTitle: '할머니의 포근한 품과 옛날이야기',
      analyzedAt: new Date().toISOString()
    }
  },
  {
    id: 'mem_4',
    type: 'memo',
    title: '아내와 함께 걸었던 낙산공원 성곽길',
    description: '따스한 가을바람을 느끼며 아내와 손을 꼭 잡고 걸었던 성곽길 야경. 평생을 나란히 한 곳을 바라보며 동행하자며 아내가 살포시 내 어깨에 기댔을 때, 온 세상이 별빛으로 가득 찬 듯했다. 내 영원한 동반자이자 연인.',
    date: '2025-10-05',
    mediaUrl: '',
    createdAt: new Date().toISOString(),
    aiAnalysis: {
      tags: ['아내', '배우자', '야경', '산책'],
      sentiment: '사랑',
      summary: '평생을 동반하는 반려자와 속삭였던 아득하고 설레는 가을 저녁 산책길입니다.',
      suggestedTitle: '아내와 함께 걸었던 낙산공원 성곽길',
      analyzedAt: new Date().toISOString()
    }
  }
];

const DEFAULT_INTERVIEWS: InterviewResponse[] = [
  {
    id: 'int_1',
    questionId: 'q_1',
    questionText: '인생에서 가장 든든하고 고마웠던 아버지만의 가르침은 무엇인가요?',
    year: 2025,
    responseType: 'text',
    responseText: '늘 조용하셨던 아빠였지만, 제가 중요한 선택을 앞두고 고민할 때마다 제 어깨를 가볍게 도닥여 주시며 "네 소신껏 해라, 아빠는 늘 네 선택을 응원한다"고 하셨습니다. 그 아빠의 한마디가 제 평생의 나침반이 되었고 큰 안도감을 줍니다.',
    answeredAt: new Date().toISOString()
  },
  {
    id: 'int_2',
    questionId: 'q_2',
    questionText: '가장 잊을 수 없는 어머니와의 따뜻한 부엌 속 기억이 있다면 들려주세요.',
    year: 2026,
    responseType: 'text',
    responseText: '겨울 방학 아침 늦잠을 자고 일어났을 때, 부엌에서 된장찌개 냄새를 은은하게 지피며 나를 보며 "밥 먹자, 우리 애기" 하고 환하게 웃으시던 엄마의 얼굴입니다. 엄마가 차려주신 맛있는 김이 모락모락 나던 밥상은 아직도 제 마음을 가장 포근하게 어루만지는 고향 같습니다.',
    answeredAt: new Date().toISOString()
  }
];

export const storageService = {
  // --- App Settings ---
  getSettings(): AppSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!raw) {
      const initialSettings: AppSettings = {
        geminiApiKey: envKey,
        isMockMode: !envKey,
        fontSize: 'large',
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
      return initialSettings;
    }
    
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.fontSize) {
        parsed.fontSize = 'large';
      }
      if (envKey && !parsed.geminiApiKey) {
        parsed.geminiApiKey = envKey;
      }
      return parsed;
    } catch (e) {
      const initialSettings: AppSettings = {
        geminiApiKey: envKey,
        isMockMode: !envKey,
        fontSize: 'large',
      };
      return initialSettings;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // --- Memories ---
  getMemories(): MemoryItem[] {
    const raw = localStorage.getItem(MEMORIES_KEY);
    if (!raw || JSON.parse(raw).length === 0) {
      localStorage.setItem(MEMORIES_KEY, JSON.stringify(DEFAULT_MEMORIES));
      return DEFAULT_MEMORIES;
    }
    return JSON.parse(raw);
  },

  saveMemories(memories: MemoryItem[]): void {
    localStorage.setItem(MEMORIES_KEY, JSON.stringify(memories));
  },

  addMemory(memory: MemoryItem): void {
    const list = this.getMemories();
    list.push(memory);
    this.saveMemories(list);
  },

  updateMemory(id: string, updated: Partial<MemoryItem>): void {
    const list = this.getMemories();
    const index = list.findIndex(m => m.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updated };
      this.saveMemories(list);
    }
  },

  deleteMemory(id: string): void {
    const list = this.getMemories();
    const filtered = list.filter(m => m.id !== id);
    this.saveMemories(filtered);
  },

  // --- Interviews ---
  getInterviews(): InterviewResponse[] {
    const raw = localStorage.getItem(INTERVIEWS_KEY);
    if (!raw || JSON.parse(raw).length === 0) {
      localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(DEFAULT_INTERVIEWS));
      return DEFAULT_INTERVIEWS;
    }
    return JSON.parse(raw);
  },

  saveInterviews(interviews: InterviewResponse[]): void {
    localStorage.setItem(INTERVIEWS_KEY, JSON.stringify(interviews));
  },

  addInterviewResponse(response: InterviewResponse): void {
    const list = this.getInterviews();
    list.push(response);
    this.saveInterviews(list);
  },

  deleteInterviewResponse(id: string): void {
    const list = this.getInterviews();
    const filtered = list.filter(i => i.id !== id);
    this.saveInterviews(filtered);
  },

  // --- Documentary ---
  getDocumentary(): Documentary | null {
    const raw = localStorage.getItem(DOCUMENTARY_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  saveDocumentary(doc: Documentary): void {
    localStorage.setItem(DOCUMENTARY_KEY, JSON.stringify(doc));
  },

  deleteDocumentary(): void {
    localStorage.removeItem(DOCUMENTARY_KEY);
  },

  // --- Global Utilities ---
  resetAllData(): void {
    localStorage.removeItem(MEMORIES_KEY);
    localStorage.removeItem(INTERVIEWS_KEY);
    localStorage.removeItem(DOCUMENTARY_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    // Reload keys and defaults
    this.getSettings();
    this.getMemories();
    this.getInterviews();
  }
};

export default storageService;
