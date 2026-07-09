import React, { useState, useEffect, useRef } from 'react';
import { useMemoryStorage } from '../hooks/useMemoryStorage';
import { geminiService } from '../services/gemini';
import { Send, Trash2, BrainCircuit, Smile } from 'lucide-react';

interface DynamicPersona {
  id: string;
  name: string;
  relation: string;
  keywords: string[];
  description: string;
  color: string;
  badgeColor: string;
  welcomeMessage: string;
  count: number;
}

export const Interview: React.FC = () => {
  const { memories, interviews, settings, familyPersonas } = useMemoryStorage();

  // Chatbot Persona State
  const [activePersonaId, setActivePersonaId] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'family'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    return localStorage.getItem('dama_current_user_role') || '자녀 (아들/딸)';
  });

  useEffect(() => {
    const handleRoleChange = () => {
      setCurrentUserRole(localStorage.getItem('dama_current_user_role') || '자녀 (아들/딸)');
    };
    window.addEventListener('dama-user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('dama-user-role-changed', handleRoleChange);
    };
  }, []);

  // Auto-scroll ref for chat
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get active family personas based on custom settings config + count memories mapped to them
  const getPersonasWithCounts = (): (DynamicPersona & { original?: any })[] => {
    const textCorpus = [
      ...memories.map(m => `${m.title} ${m.description || ''}`),
      ...interviews.map(i => `${i.questionText} ${i.responseText || ''}`)
    ].join(' ').toLowerCase();

    return familyPersonas.map(persona => {
      // Find matches where explicitly assigned
      const explicitMems = memories.filter(m => m.personaId === persona.id);
      
      // Fallback matching using name & relationship keywords
      const keywords = [persona.name, persona.relationship];
      let matchCount = explicitMems.length;

      keywords.forEach(kw => {
        if (!kw || kw.length < 2) return;
        const regex = new RegExp(kw, 'g');
        const matches = textCorpus.match(regex);
        if (matches) matchCount += matches.length;
      });

      // Default beautiful visual themes based on custom avatarColor
      let colorClass = 'from-pink-500/10 to-rose-500/10 border-rose-100 text-rose-600';
      let badgeClass = 'bg-rose-100 text-rose-700';

      if (persona.avatarColor === 'indigo') {
        colorClass = 'from-blue-500/10 to-indigo-500/10 border-indigo-100 text-indigo-600';
        badgeClass = 'bg-indigo-100 text-indigo-700';
      } else if (persona.avatarColor === 'amber') {
        colorClass = 'from-amber-500/10 to-orange-500/10 border-amber-100 text-amber-600';
        badgeClass = 'bg-amber-100 text-amber-700';
      } else if (persona.avatarColor === 'emerald') {
        colorClass = 'from-emerald-500/10 to-teal-500/10 border-emerald-100 text-emerald-600';
        badgeClass = 'bg-emerald-100 text-emerald-700';
      } else if (persona.avatarColor === 'violet') {
        colorClass = 'from-violet-500/10 to-purple-500/10 border-purple-100 text-purple-600';
        badgeClass = 'bg-purple-100 text-purple-700';
      } else if (persona.avatarColor === 'orange') {
        colorClass = 'from-orange-500/10 to-amber-500/10 border-orange-100 text-orange-700';
        badgeClass = 'bg-orange-100 text-orange-800';
      }

      return {
        id: persona.id,
        name: persona.name,
        relation: persona.relationship,
        keywords: [persona.name],
        description: persona.description,
        color: colorClass,
        badgeColor: badgeClass,
        welcomeMessage: persona.welcomeMessage,
        count: matchCount,
        original: persona
      };
    });
  };

  const dynamicPersonas = getPersonasWithCounts().filter(persona => {
    if (!currentUserRole) return true;
    
    const userRoleClean = currentUserRole.trim().toLowerCase();
    const personaNameClean = persona.name.trim().toLowerCase();
    const personaRelClean = (persona.relation || '').trim().toLowerCase();
    
    // Exclude if name or relationship matches/contains user role
    if (personaNameClean === userRoleClean) return false;
    if (personaRelClean === userRoleClean) return false;
    if (userRoleClean.includes(personaNameClean) || personaNameClean.includes(userRoleClean)) return false;
    if (userRoleClean.includes(personaRelClean) || personaRelClean.includes(userRoleClean)) return false;
    
    return true;
  });

  // Automatically select the first detected dynamic persona if none is active
  useEffect(() => {
    if (dynamicPersonas.length > 0) {
      if (!activePersonaId || !dynamicPersonas.some(p => p.id === activePersonaId)) {
        setActivePersonaId(dynamicPersonas[0].id);
      }
    } else {
      setActivePersonaId('');
    }
  }, [familyPersonas]);

  // Load and save chat history dynamically for the selected persona
  useEffect(() => {
    if (!activePersonaId) {
      setChatHistory([]);
      return;
    }
    const saved = localStorage.getItem(`family_chat_history_${activePersonaId}`);
    if (saved) {
      setChatHistory(JSON.parse(saved));
    } else {
      const activePersona = getPersonasWithCounts().find(p => p.id === activePersonaId);
      const welcome = activePersona?.welcomeMessage || '반갑습니다. 당신의 소중한 사연 속 흔적을 토대로 형성된 대화 파트너입니다.';
      setChatHistory([{ sender: 'family', text: welcome }]);
    }
  }, [activePersonaId]);

  // Persist chat history on change (skip on initial load)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (activePersonaId && chatHistory.length > 0) {
      localStorage.setItem(`family_chat_history_${activePersonaId}`, JSON.stringify(chatHistory));
    }
  }, [chatHistory, activePersonaId]);

  // Scroll to bottom whenever chatHistory or loading state changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isChatLoading]);



  // Send chatbot chat message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activePersonaId) return;

    const userText = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { sender: 'user', text: userText }]);
    setIsChatLoading(true);

    try {
      const activePersona = getPersonasWithCounts().find(p => p.id === activePersonaId);
      
      // Filter memories explicitly mapped to this persona, or mentioning their name
      const filteredMemories = memories.filter(m => 
        m.personaId === activePersonaId || 
        (activePersona ? (m.title + ' ' + m.description).includes(activePersona.name) : false)
      );

      // Filter interviews containing persona's name or relationship
      const filteredInterviews = interviews.filter(i => 
        activePersona ? (
          (i.questionText + ' ' + i.responseText).includes(activePersona.name) ||
          (i.questionText + ' ' + i.responseText).includes(activePersona.relation)
        ) : false
      );

      const updatedHistory = [...chatHistory, { sender: 'user', text: userText } as const];
      const response = await geminiService.chatWithFamilyPersona(
        updatedHistory,
        filteredMemories,
        filteredInterviews,
        activePersonaId,
        settings.geminiApiKey,
        settings.isMockMode,
        activePersona?.original,
        currentUserRole
      );
      setChatHistory(prev => [...prev, { sender: 'family', text: response }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: 'family', text: '잠시 소중한 날들의 조각을 고르느라 마음의 여유가 안 났나 보구나. 다시 차근히 이야기해 줄 수 있겠니?' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('선택된 가족 페르소나와의 대화 기록을 초기화하시겠습니까?')) {
      const activePersona = getPersonasWithCounts().find(p => p.id === activePersonaId);
      const welcome = activePersona?.welcomeMessage || '대화가 초기화되었습니다.';
      setChatHistory([{ sender: 'family', text: welcome }]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-float-up pb-10">
      {/* Page Title */}
      <div className="text-center md:text-left space-y-1">
        <h2 className="text-3xl font-bold tracking-tight text-apple-gray-800">가족 소울 AI 대화방</h2>
        <p className="text-sm text-apple-gray-300">
          가족들의 실제 말투 습관과 고유한 언어 지문을 반영한 AI 페르소나와 실시간으로 따뜻한 이야기를 주고받는 교감 소통방입니다.
        </p>
      </div>
      <div className="w-full animate-fade-in">
          {/* Interactive Chat Interface */}
          <div className="w-full flex flex-col h-[650px] bg-white rounded-3xl border border-apple-gray-100/40 shadow-apple-card overflow-hidden">
            {dynamicPersonas.length > 0 ? (
              <>
                {/* Persona Selector Row */}
                <div className="px-6 py-4 border-b border-apple-gray-100 bg-white flex flex-col gap-2">
                  <span className="text-[10px] font-extrabold text-apple-gray-300 uppercase tracking-wider">대화 상대 선택 (내가 쓴 글에서 자동 식별됨):</span>
                  <div className="relative w-full max-w-xs">
                    <select
                      disabled={isChatLoading}
                      value={activePersonaId}
                      onChange={(e) => {
                        if (isChatLoading) return;
                        setActivePersonaId(e.target.value);
                      }}
                      className="w-full pl-4.5 pr-10 py-3.5 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 text-xs font-bold text-apple-gray-800 appearance-none focus:outline-none focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue/40 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {dynamicPersonas.map((persona) => (
                        <option key={persona.id} value={persona.id} className="font-bold text-apple-gray-800">
                          {persona.name}
                        </option>
                      ))}
                    </select>
                    {/* Elegant custom dropdown arrow */}
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-apple-gray-300">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chat Room Status Header */}
                <div className="px-6 py-3 border-b border-apple-gray-100 flex items-center justify-between bg-apple-gray-50/50">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-apple-green animate-pulse" />
                    <span className="text-[10px] text-apple-gray-300 font-bold">
                      {dynamicPersonas.find(p => p.id === activePersonaId)?.name}님과 대화 중
                    </span>
                  </div>

                  <button
                    onClick={handleClearChat}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold text-apple-gray-300 hover:text-red-500 hover:bg-red-50 border border-apple-gray-100 bg-white transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    대화 초기화
                  </button>
                </div>

                {/* Chat Message Box Container */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAF9F6]">
                  {chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                    >
                      <div className="flex flex-col max-w-[80%] space-y-1">
                        <div className="flex items-center gap-1.5 px-1">
                          {msg.sender === 'family' ? (
                            <>
                              <Smile className="w-3 h-3 text-[#7C5938]" />
                              <span className="text-[10px] font-extrabold text-[#7C5938]">
                                {dynamicPersonas.find(p => p.id === activePersonaId)?.name}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-apple-gray-300 text-right w-full">나</span>
                          )}
                        </div>
                        <div
                          className={`px-4.5 py-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${
                            msg.sender === 'user'
                              ? 'bg-apple-blue text-white rounded-tr-none font-bold'
                              : 'bg-white border border-[#E9DAC1]/50 text-apple-gray-800 rounded-tl-none font-medium'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="flex flex-col max-w-[80%] space-y-1">
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[10px] font-extrabold text-[#7C5938]">
                            {dynamicPersonas.find(p => p.id === activePersonaId)?.name}
                          </span>
                        </div>
                        <div className="px-4 py-2.5 bg-white border border-[#E9DAC1]/50 text-apple-gray-300 text-xs font-semibold rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-sm">
                          <span>입력 중</span>
                          <span className="flex gap-0.5 pt-1.5">
                            <span className="w-1 h-1 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1 h-1 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1 h-1 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input form footer */}
                <form onSubmit={handleSendChatMessage} className="p-4 border-t border-apple-gray-100 bg-white flex items-center gap-3">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    placeholder={`${dynamicPersonas.find(p => p.id === activePersonaId)?.name}님에게 따뜻하게 말을 걸어보세요...`}
                    className="flex-1 px-4 py-3 text-xs bg-apple-gray-50 focus:bg-white border border-apple-gray-100 focus:border-apple-blue rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-semibold"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="p-3.5 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl transition-all shadow-md shadow-apple-blue/15 hover:scale-105 active:scale-95 disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              /* EMPTY PERSONAS GUIDING STATE */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-apple-gray-50 text-center space-y-6">
                <div className="w-16 h-16 bg-apple-blue/10 rounded-full flex items-center justify-center animate-pulse">
                  <BrainCircuit className="w-8 h-8 text-apple-blue" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h4 className="text-base font-extrabold text-apple-gray-800">소울 AI 대화 상대가 아직 없습니다</h4>
                  <p className="text-xs leading-relaxed text-apple-gray-300 font-medium">
                    본 시스템은 정적인 목업 대화가 아닙니다. **사용자님이 직접 남기신 글들을 실시간 추적하여** 실제 글 속에 존재하는 소중한 인물들을 이 자리에 AI 상대방으로 탄생시킵니다.
                  </p>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-apple-gray-100/50 text-left max-w-lg space-y-3.5 shadow-sm">
                  <span className="text-[10px] font-extrabold text-apple-blue uppercase tracking-wider block">💡 나만의 AI 상대 만드는 방법:</span>
                  <p className="text-[11px] leading-relaxed text-apple-gray-800 font-bold">
                    `추억 저장` 메뉴에 가셔서 일기글, 메모 혹은 사진 설명에 가족 명칭(엄마, 아빠, 할머니, 배우자 등)이 들어간 사연을 한 줄만 작성해 주세요.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-apple-gray-50/50 rounded-2xl border border-apple-gray-100/40">
                      <span className="text-[10px] font-extrabold text-rose-500 block">어머니 식별 예시</span>
                      <p className="text-[9.5px] text-apple-gray-300 font-semibold mt-1">"오늘 어머니가 만들어주시던 김치찌개가 문득 그리워졌다."</p>
                    </div>
                    <div className="p-3.5 bg-apple-gray-50/50 rounded-2xl border border-apple-gray-100/40">
                      <span className="text-[10px] font-extrabold text-indigo-500 block">아버지 식별 예시</span>
                      <p className="text-[9.5px] text-apple-gray-300 font-semibold mt-1">"우리 아버지는 묵묵히 내 어깨를 다독여 주시던 분이었다."</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default Interview;
