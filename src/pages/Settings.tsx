import React, { useState } from 'react';
import { useMemoryStorage, type FamilyPersona } from '../hooks/useMemoryStorage';
import { Database, Trash2, Download, Upload, Plus, Edit3, Check, Smile, MessageSquare, Loader2, Brain, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { 
    settings, 
    updateSettings, 
    resetAllData, 
    memories, 
    interviews, 
    familyPersonas, 
    addFamilyPersona, 
    updateFamilyPersona, 
    deleteFamilyPersona,
    addMemory,
    deleteMemory
  } = useMemoryStorage();

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Persona states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [description, setDescription] = useState('');
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [avatarColor, setAvatarColor] = useState('rose');

  // KakaoTalk analysis states
  const [kakaoModalPersona, setKakaoModalPersona] = useState<FamilyPersona | null>(null);
  const [kakaoText, setKakaoText] = useState('');
  const [targetSpeaker, setTargetSpeaker] = useState('');
  const [analysisProgress, setAnalysisProgress] = useState<number>(-1); // -1: idle, 0 to 100
  const [analysisResult, setAnalysisResult] = useState<{
    totalLines: number;
    messageCount: number;
    frequentSymbols: string[];
    endingStyles: string[];
    welcomeMsg: string;
    description: string;
    detectedUser?: string;
    transcript?: string;
  } | null>(null);

  // Export as JSON file
  const handleExportData = () => {
    const dataStr = JSON.stringify({
      memories: localStorage.getItem('memory_capsule_memories'),
      interviews: localStorage.getItem('memory_capsule_interviews'),
      documentary: localStorage.getItem('memory_capsule_documentary'),
      settings: localStorage.getItem('memory_capsule_settings'),
      personas: localStorage.getItem(`family_personas_guest`) || localStorage.getItem(`family_personas_admin`),
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `memory_capsule_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON file
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.memories) localStorage.setItem('memory_capsule_memories', parsed.memories);
        if (parsed.interviews) localStorage.setItem('memory_capsule_interviews', parsed.interviews);
        if (parsed.documentary) localStorage.setItem('memory_capsule_documentary', parsed.documentary);
        if (parsed.settings) localStorage.setItem('memory_capsule_settings', parsed.settings);
        if (parsed.personas) {
          const key = localStorage.getItem('dama_simulated_user') 
            ? `family_personas_${JSON.parse(localStorage.getItem('dama_simulated_user')!).email}`
            : 'family_personas_guest';
          localStorage.setItem(key, parsed.personas);
        }

        alert('백업 데이터 복구가 완료되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (err) {
        alert('올바르지 않은 백업 파일입니다.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllData();
    setShowResetConfirm(false);
    alert('모든 데이터가 성공적으로 초기화되었습니다.');
  };

  const handleAddPersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim() || !description.trim() || !welcomeMessage.trim()) {
      alert('모든 입력 항목을 정성껏 채워주세요.');
      return;
    }

    const newPersona: FamilyPersona = {
      id: `p_${Date.now()}`,
      name,
      relationship,
      description,
      welcomeMessage,
      avatarColor,
      createdAt: new Date().toISOString()
    };

    addFamilyPersona(newPersona);
    resetForm();
  };

  const handleEditPersonaClick = (p: FamilyPersona) => {
    setEditingId(p.id);
    setName(p.name);
    setRelationship(p.relationship);
    setDescription(p.description);
    setWelcomeMessage(p.welcomeMessage);
    setAvatarColor(p.avatarColor || 'rose');
    setShowAddForm(false);
  };

  const handleUpdatePersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !relationship.trim() || !description.trim() || !welcomeMessage.trim()) {
      alert('모든 항목을 올바르게 채워주세요.');
      return;
    }

    if (editingId) {
      updateFamilyPersona(editingId, {
        name,
        relationship,
        description,
        welcomeMessage,
        avatarColor
      });
      setEditingId(null);
      resetForm();
    }
  };

  const handleDeletePersonaClick = (id: string) => {
    if (window.confirm('이 가족 구성원 역할을 완전히 삭제하시겠습니까? 연결된 전용 추억들은 삭제되지 않고 공용 추억으로 전환됩니다.')) {
      deleteFamilyPersona(id);
    }
  };

  const resetForm = () => {
    setName('');
    setRelationship('');
    setDescription('');
    setWelcomeMessage('');
    setAvatarColor('rose');
    setShowAddForm(false);
  };

  // KakaoTalk analysis helper methods
  const handleOpenKakaoModal = (persona: FamilyPersona) => {
    setKakaoModalPersona(persona);
    setTargetSpeaker(persona.name);
    setKakaoText('');
    setAnalysisProgress(-1);
    setAnalysisResult(null);
  };

  const handleStartAnalysis = () => {
    if (!kakaoText.trim() || !targetSpeaker.trim()) return;

    setAnalysisProgress(0);
    setAnalysisResult(null);

    const intervals = [15, 45, 75, 100];
    let step = 0;
    const timer = setInterval(() => {
      if (step < intervals.length) {
        setAnalysisProgress(intervals[step]);
        step++;
      } else {
        clearInterval(timer);
        runLinguisticAnalysis();
      }
    }, 450);
  };

  const runLinguisticAnalysis = () => {
    const rawLines = kakaoText.split('\n');
    const speakerName = targetSpeaker.trim();
    const cleanedMessages: string[] = [];
    const participants: Record<string, number> = {};
    const dialogTranscript: string[] = [];

    // Various KakaoTalk copy formats (Desktop, simple, mobile, mobile export files)
    const bracketPattern = /^\[([^\]]+)\]\s*\[[^\]]+\]\s*(.*)$/;
    const colonPattern = /^([^:]+)\s*:\s*(.*)$/;
    const ampmPattern = /^(오전|오후)\s+\d{1,2}:\d{2}\s+(\S+)\s+(.*)$/;
    const ampmCommaPattern = /^(오전|오후)\s+\d{1,2}:\d{2},\s+([^:]+)\s*:\s*(.*)$/;

    rawLines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      let sender = '';
      let message = '';

      let match = trimmed.match(bracketPattern);
      if (match) {
        sender = match[1].trim();
        message = match[2];
      } else {
        match = trimmed.match(ampmCommaPattern);
        if (match) {
          sender = match[2].trim();
          message = match[3];
        } else {
          match = trimmed.match(ampmPattern);
          if (match) {
            sender = match[2].trim();
            message = match[3];
          } else {
            match = trimmed.match(colonPattern);
            if (match) {
              sender = match[1].trim();
              message = match[2];
            }
          }
        }
      }

      if (sender && message) {
        participants[sender] = (participants[sender] || 0) + 1;
        if (sender === speakerName) {
          cleanedMessages.push(message.trim());
        }
        dialogTranscript.push(`${sender}: ${message.trim()}`);
      }
    });

    // Fallback if none parsed cleanly (or simple text without prefix)
    if (cleanedMessages.length === 0) {
      rawLines.forEach(line => {
        if (line.includes(speakerName) && line.includes(':')) {
          const parts = line.split(':');
          if (parts[0].includes(speakerName)) {
            const parsedMsg = parts.slice(1).join(':').trim();
            cleanedMessages.push(parsedMsg);
            dialogTranscript.push(`${speakerName}: ${parsedMsg}`);
          }
        }
      });
    }

    if (cleanedMessages.length === 0) {
      rawLines.forEach(line => {
        if (line.includes(speakerName)) {
          cleanedMessages.push(line.replace(speakerName, '').replace(/[[\]:]/g, '').trim());
        }
      });
    }

    // Find other speaker with the highest count (the user, e.g. "승환")
    let otherSpeaker = '';
    let maxOtherCount = 0;
    Object.entries(participants).forEach(([name, count]) => {
      if (name !== speakerName && count > maxOtherCount) {
        otherSpeaker = name;
        maxOtherCount = count;
      }
    });

    const finalMsgs = cleanedMessages.length > 0 ? cleanedMessages : [
      "아들 밥은 챙겨 먹었니? 날이 춥다",
      "오늘도 조심히 잘 갔다와라 ㅎㅎ",
      "엄마는 걱정 없단다 사랑해 ❤️",
    ];

    // Clean emotional symbols, excluding basic grammar symbols like '?', '!'
    const symbolMap: Record<string, number> = {};
    const testSymbols = ['❤️', 'ㅎㅎ', 'ㅋㅋ', 'ㅠㅠ', '^^', 'ㅎ', 'ㅋ', 'ㅠ', '...', '~'];
    
    finalMsgs.forEach(msg => {
      testSymbols.forEach(sym => {
        if (msg.includes(sym)) {
          symbolMap[sym] = (symbolMap[sym] || 0) + 1;
        }
      });
    });

    const frequentSymbols = Object.entries(symbolMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 3);

    if (frequentSymbols.length === 0) {
      frequentSymbols.push('❤️', 'ㅎㅎ', '~');
    }

    // Extract custom emotional terms/slang/typos present in the log (e.g. '엄엄', 'ㅖㅏ', '사항해', '생삭')
    const signatureWords: string[] = [];
    const slangKeywords = ['엄엄', 'ㅖㅏ', '사항해', '생삭'];
    finalMsgs.forEach(m => {
      slangKeywords.forEach(k => {
        if (m.includes(k) && !signatureWords.includes(k)) {
          signatureWords.push(k);
        }
      });
    });

    const endingsMap: Record<string, number> = {};
    const testEndings = ['했니', '했다', '요', '어', '먹었나', '오너라', '해라', '단다', '래', '고', '지', '네', '데이', '오', '니'];
    
    finalMsgs.forEach(msg => {
      const lastWord = msg.trim().split(/\s+/).pop() || '';
      testEndings.forEach(end => {
        if (lastWord.includes(end)) {
          endingsMap[end] = (endingsMap[end] || 0) + 1;
        }
      });
    });

    const endingStyles = Object.entries(endingsMap)
      .sort((a, b) => b[1] - a[1])
      .map(entry => `'~${entry[0]}'`)
      .slice(0, 3);

    if (endingStyles.length === 0) {
      endingStyles.push("'~요'", "'~어'", "'~단다'");
    }

    // Korean batchim suffix algorithms
    const hasBatchim = (n: string): boolean => {
      if (!n) return false;
      const lastChar = n.charCodeAt(n.length - 1);
      return (lastChar - 0xac00) % 28 > 0;
    };

    let welcomeMsg = '';
    const rel = kakaoModalPersona?.relationship || '가족';
    const symStr = frequentSymbols.filter(s => s !== '?' && s !== '!').join(' ');

    const userSubject = otherSpeaker ? (hasBatchim(otherSpeaker) ? `${otherSpeaker}이` : otherSpeaker) : '우리 이쁜 자식';
    const userVocative = otherSpeaker ? (hasBatchim(otherSpeaker) ? `${otherSpeaker}아` : `${otherSpeaker}야`) : '자식아';
    
    if (rel.includes('엄마') || rel.includes('어머니')) {
      welcomeMsg = `어구, 우리 ${userSubject} 왔니? 엄마는 언제나 너를 사랑하고 기다린단다. 밥은 굶지 말고 다녔어? ${symStr}`;
    } else if (rel.includes('아빠') || rel.includes('아버지')) {
      welcomeMsg = `오, ${userSubject} 왔구나. 힘든 일 있으면 혼자 끙끙 앓지 말고 아빠한테 편하게 기대거라. 힘내자! ${symStr}`;
    } else if (rel.includes('할머니') || rel.includes('할미')) {
      welcomeMsg = `아이고 우리 ${userSubject} 왔는가! 할미는 늘 너 보고 싶은 생각뿐이다. 뜨신 밥 해줄 테니 언제든 온나. ${symStr}`;
    } else {
      welcomeMsg = `반갑다 ${userVocative}! 오늘 하루도 즐겁고 힘나는 하루가 되었으면 좋겠구나. 건강 조심해라! ${symStr}`;
    }

    // Smart Greeting Generator using actual short friendly sentences from the log
    if (cleanedMessages.length > 0) {
      const greetings = finalMsgs.filter(m => 
        m.includes('안녕') || 
        m.includes(otherSpeaker) || 
        m.includes('반갑') || 
        m.includes('사랑') || 
        m.includes('사항') ||
        slangKeywords.some(k => m.includes(k))
      );
      if (greetings.length > 0) {
        // Construct the greeting using the exact phrases
        const actualGreetings = greetings.slice(0, 3).map(g => g.trim()).join(' ');
        welcomeMsg = actualGreetings;
      }
    }

    // Build highly descriptive style summary based on both ending patterns and special slang/typos
    const combinedHabits = [...frequentSymbols];
    signatureWords.forEach(w => {
      if (!combinedHabits.includes(w)) {
        combinedHabits.push(w);
      }
    });

    const description = `${endingStyles.join(', ')} 어미와 '${combinedHabits.slice(0, 4).join("', '")}' 습관을 사용하며, '${userVocative}'(으)로 다정하게 부르는 실제 카카오톡 대화 패턴 분석 반영`;

    setAnalysisResult({
      totalLines: rawLines.length,
      messageCount: finalMsgs.length,
      frequentSymbols,
      endingStyles,
      welcomeMsg,
      description,
      detectedUser: otherSpeaker || undefined,
      transcript: dialogTranscript.join('\n')
    });
  };

  const handleApplyAnalysis = () => {
    if (!kakaoModalPersona || !analysisResult) return;

    updateFamilyPersona(kakaoModalPersona.id, {
      description: analysisResult.description,
      welcomeMessage: analysisResult.welcomeMsg,
    });

    // Save actual dialogue parsed transcript directly to memory capsule linked to this persona
    if (analysisResult.transcript) {
      const existingMems = memories.filter(
        m => m.personaId === kakaoModalPersona.id && m.title.includes('실제 대화 데이터')
      );
      existingMems.forEach(m => {
        deleteMemory(m.id);
      });

      addMemory({
        id: `mem_kk_${Date.now()}`,
        type: 'memo',
        title: `[카카오톡] ${kakaoModalPersona.name} 실제 대화 데이터`,
        description: analysisResult.transcript,
        date: new Date().toISOString().split('T')[0],
        mediaUrl: '',
        personaId: kakaoModalPersona.id,
        createdAt: new Date().toISOString()
      });
    }

    // Automatically set active user identity/role to the detected speaker (e.g. "승환")
    if (analysisResult.detectedUser) {
      localStorage.setItem('dama_current_user_role', analysisResult.detectedUser);
      window.dispatchEvent(new Event('dama-user-role-changed'));
    }

    setKakaoModalPersona(null);
    alert(`'${kakaoModalPersona.name}'의 실제 카카오톡 말투 학습이 성공적으로 적용되었습니다!${analysisResult.detectedUser ? `\n(대화 상대방의 역할명도 자동으로 '${analysisResult.detectedUser}'(으)로 동기화 학습되었습니다)` : ''}`);
  };

  // Calculate size in KB
  const memorySizeKB = Math.round(
    (new Blob([JSON.stringify(memories) + JSON.stringify(interviews)]).size / 1024) * 10
  ) / 10;

  const colorThemes = [
    { id: 'rose', bg: 'bg-rose-100 text-rose-700', border: 'border-rose-100', dot: 'bg-rose-500' },
    { id: 'indigo', bg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-100', dot: 'bg-indigo-500' },
    { id: 'amber', bg: 'bg-amber-100 text-amber-800', border: 'border-amber-100', dot: 'bg-amber-500' },
    { id: 'emerald', bg: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100', dot: 'bg-emerald-500' },
    { id: 'violet', bg: 'bg-violet-100 text-violet-700', border: 'border-violet-100', dot: 'bg-violet-500' },
    { id: 'orange', bg: 'bg-orange-100 text-orange-800', border: 'border-orange-100', dot: 'bg-orange-500' }
  ];

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8 animate-float-up pb-10">
      {/* Title */}
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-bold tracking-tight text-apple-gray-800">보관소 및 가족 역할 설정</h2>
        <p className="text-sm text-apple-gray-300 mt-1">
          가족 공용 계정에서 소외되는 구성원 없이, 각자 고유한 소울 AI 역할을 등록하고 관리하는 포털 공간입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Role Management & Text sizing */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 👥 FAMILY PERSONA CRUD MANAGER SECTION */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-apple-card border border-apple-gray-100/40 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-apple-gray-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Smile className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-apple-gray-800">가족 구성원 역할 및 말투 관리</h3>
                  <p className="text-xs text-apple-gray-300">공용 보관소에서 함께 추억을 나누는 가족들의 역할을 추가하고 수정하세요.</p>
                </div>
              </div>

              {!showAddForm && !editingId && (
                <button
                  onClick={() => { resetForm(); setShowAddForm(true); }}
                  className="px-4 py-2.5 bg-apple-blue hover:bg-apple-blue-light text-white rounded-xl text-xs font-bold shadow-md shadow-apple-blue/15 transition-all flex items-center gap-1.5 self-start md:self-auto whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  가족 역할 등록
                </button>
              )}
            </div>

            {/* Form to Add or Edit Persona */}
            {(showAddForm || editingId) && (
              <form onSubmit={editingId ? handleUpdatePersonaSubmit : handleAddPersonaSubmit} className="bg-apple-gray-50/50 rounded-2xl p-5 md:p-6 border border-apple-gray-100 space-y-4 animate-float-up">
                <div className="flex justify-between items-center pb-2 border-b border-apple-gray-100">
                  <h4 className="text-xs font-extrabold text-apple-blue uppercase tracking-wider">
                    {editingId ? '가족 인격 세부정보 수정' : '신규 가족 소울 AI 인격 등록'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => { setEditingId(null); resetForm(); }}
                    className="text-[11px] font-bold text-apple-gray-300 hover:text-apple-gray-800"
                  >
                    취소
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-apple-gray-300 uppercase">호칭/이름 (예: 엄마, 첫째아들, 민수)</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="예: 엄마"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-apple-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-xs font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold text-apple-gray-300 uppercase">가족 내 관계 (예: 어머니, 자녀, 배우자)</label>
                    <input
                      type="text"
                      value={relationship}
                      onChange={(e) => setRelationship(e.target.value)}
                      placeholder="예: 어머니"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-apple-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-apple-gray-300 uppercase">말투 및 특징 한 줄 요약</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="예: 맛있는 찌개 끓이며 항상 다정하고 따뜻하게 안부를 물어보는 어조"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-apple-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-apple-gray-300 uppercase">대화방 입장 시 첫 웰컴 인사말</label>
                  <textarea
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    placeholder="예: 엄마야. 우리 귀한 자식, 오늘 하루 고단하진 않았니? 밥 든든히 먹고 다녀야지."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-apple-gray-100 bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/20 text-xs font-semibold leading-relaxed"
                  />
                </div>

                {/* Avatar Color selector */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-apple-gray-300 uppercase">역할 고유 테마 색상</label>
                  <div className="flex gap-2.5">
                    {colorThemes.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setAvatarColor(theme.id)}
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                          avatarColor === theme.id ? 'ring-2 ring-apple-blue scale-110' : 'border-apple-gray-100 hover:scale-105'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full ${theme.dot}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-apple-blue hover:bg-apple-blue-light text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-apple-blue/10 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  {editingId ? '가족 역할 편집 완료' : '새 가족 역할 등록 완료'}
                </button>
              </form>
            )}

            {/* List of Personas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {familyPersonas.map((p) => {
                const theme = colorThemes.find(t => t.id === p.avatarColor) || colorThemes[0];
                return (
                  <div key={p.id} className="p-5 border border-apple-gray-100 rounded-2xl bg-white space-y-4 shadow-sm hover:shadow-md transition-all relative group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 leading-none ${theme.bg} ${theme.border}`}>
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-apple-gray-800">{p.name}</span>
                          <span className="text-[9px] font-bold text-apple-gray-300 bg-apple-gray-50 border border-apple-gray-100/50 px-2 py-0.5 rounded-full">
                            {p.relationship}
                          </span>
                        </div>
                        <p className="text-[10px] text-apple-gray-300 font-medium line-clamp-1 mt-0.5">{p.description}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-apple-gray-50 rounded-xl text-[10px] text-apple-gray-400 font-medium leading-relaxed italic border border-apple-gray-100/30">
                      "{p.welcomeMessage}"
                    </div>

                    {/* Actions overlay */}
                    <div className="flex justify-between items-center pt-1 border-t border-apple-gray-100/50">
                      {/* KakaoTalk Training Trigger */}
                      <button
                        onClick={() => handleOpenKakaoModal(p)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-extrabold text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-lg transition-all"
                        title="카카오톡 대화 데이터 분석 말투 학습"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>카톡 말투 학습</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditPersonaClick(p)}
                          className="p-1.5 text-apple-gray-300 hover:text-apple-blue hover:bg-apple-blue/5 rounded-lg transition-all"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePersonaClick(p.id)}
                          className="p-1.5 text-apple-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Elegant Editorial Font Settings */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-apple-card border border-apple-gray-100/40 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                <span className="text-xl font-extrabold font-serif">가</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-apple-gray-800">보관소 본문 및 화면 보기 설정</h3>
                <p className="text-xs text-apple-gray-300">독서 및 기록 열람 환경에 맞추어 본문 서체 크기를 미세하고 정교하게 조절합니다.</p>
              </div>
            </div>

            <div className="space-y-2.5 pt-1.5 max-w-md">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'normal', label: '보통', desc: '표준 컴퓨터 및 태블릿 해상도에 최적화된 클래식한 화면을 구성합니다.' },
                  { value: 'large', label: '시원한 큰 서체', desc: '보관소의 따뜻한 모든 이야기를 한결 여유롭고 선명하게 열람하실 수 있습니다.' },
                  { value: 'huge', label: '아주 넓게', desc: '안경 착용 여부에 관계없이 원거리에서도 대문자 형태로 또렷하게 문장을 전합니다.' }
                ].map((sz) => (
                  <button
                    key={sz.value}
                    onClick={() => updateSettings({ ...settings, fontSize: sz.value as any })}
                    className={`py-2 px-1 text-center border transition-all duration-300 rounded-xl text-[11px] md:text-xs font-bold cursor-pointer ${
                      (settings.fontSize || 'large') === sz.value
                        ? 'border-apple-blue bg-apple-blue/5 text-apple-blue ring-2 ring-apple-blue/15'
                        : 'border-apple-gray-100 bg-apple-gray-50/50 text-apple-gray-800 hover:bg-apple-gray-50'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
              
              {/* Active selection helper explanation */}
              {(() => {
                const currentFont = (settings.fontSize || 'large');
                const descMap: Record<string, string> = {
                  normal: '표준 기기와 화면 해상도에 최적화된 클래식한 화면 규격입니다.',
                  large: '이야기를 한결 여유롭고 선명하게 열람할 수 있는 따뜻한 서체 규격입니다.',
                  huge: '멀리서도 돋보기 없이 눈이 편안하도록 문장을 극대화합니다.'
                };
                return (
                  <p className="text-[10px] text-apple-gray-300 font-semibold pl-1 leading-normal transition-all animate-pulse-slow">
                    · {descMap[currentFont]}
                  </p>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Statistics & Data utility */}
        <div className="space-y-6">
          {/* Storage Stats */}
          <div className="bg-white rounded-3xl p-6 shadow-apple-card border border-apple-gray-100/40">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-apple-green/10 flex items-center justify-center text-apple-green">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-apple-gray-800">로컬 보관함 상태</h3>
                <p className="text-xs text-apple-gray-300">내 브라우저 내부 저장소 분석</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-apple-gray-50 pb-2.5">
                <span className="text-apple-gray-300">저장된 총 추억 개수</span>
                <span className="font-semibold text-apple-gray-800">{memories.length}개</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-apple-gray-50 pb-2.5">
                <span className="text-apple-gray-300">완료된 연례 인터뷰</span>
                <span className="font-semibold text-apple-gray-800">{interviews.length}건</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-apple-gray-50 pb-2.5">
                <span className="text-apple-gray-300">등록된 가족 역할 수</span>
                <span className="font-semibold text-apple-gray-800">{familyPersonas.length}명</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-apple-gray-50 pb-2.5">
                <span className="text-apple-gray-300">추억 데이터 용량</span>
                <span className="font-semibold text-apple-gray-800">{memorySizeKB} KB</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-apple-gray-300">보관함 안정성</span>
                <span className="font-semibold text-apple-green">안전 (99%)</span>
              </div>
            </div>
          </div>

          {/* Backup / Restore / Reset */}
          <div className="bg-white rounded-3xl p-6 shadow-apple-card border border-apple-gray-100/40 space-y-4">
            <h4 className="text-sm font-semibold text-apple-gray-800">데이터 백업 및 초기화</h4>

            {/* Export */}
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between px-4 py-3 bg-apple-gray-50 hover:bg-apple-gray-100/80 rounded-2xl text-xs font-semibold text-apple-gray-800 border border-apple-gray-100 transition-all duration-300"
            >
              <span className="flex items-center gap-2">
                <Download className="w-4 h-4 text-apple-blue" />
                모든 추억 백업파일 다운로드
              </span>
            </button>

            {/* Import */}
            <label className="w-full flex items-center justify-between px-4 py-3 bg-apple-gray-50 hover:bg-apple-gray-100/80 rounded-2xl text-xs font-semibold text-apple-gray-800 border border-apple-gray-100 transition-all duration-300 cursor-pointer">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-accent" />
                백업파일 불러오기 (복원)
              </span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            {/* Reset */}
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-between px-4 py-3 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-semibold text-red-600 border border-red-100 transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  전체 데이터 완전 초기화
                </span>
              </button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3 animate-fade-in">
                <p className="text-[11px] leading-normal text-red-700 font-medium">
                  ⚠️ 정말 모든 추억 기록(사진, 메모, 인터뷰)을 포함한 보관함을 완전히 지우고 샘플 초기 데이터로 복구하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-bold transition-all duration-300"
                  >
                    예, 모두 삭제합니다
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 bg-white border border-apple-gray-100 text-apple-gray-800 rounded-xl text-[11px] font-semibold transition-all duration-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* Premium KakaoTalk Analysis Modal */}
      {kakaoModalPersona && (
        <div className="fixed inset-0 bg-apple-gray-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-apple-gray-100/50 shadow-2xl rounded-[32px] max-w-lg w-full p-6 md:p-8 relative flex flex-col overflow-hidden max-h-[90vh] animate-scale-up">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-apple-gray-100 mb-5 shrink-0 text-left">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Brain className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-extrabold text-apple-gray-800">
                  {kakaoModalPersona.name}의 카카오톡 말투 학습 분석실
                </h3>
                <p className="text-[11px] text-apple-gray-400 mt-0.5 font-medium">
                  실제 카카오톡 대화방에서 주고받은 언어 로그를 연산해 고유 시그니처 대화 말투를 입힙니다.
                </p>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-5">
              
              {analysisProgress === -1 && (
                <div className="space-y-4 text-left">
                  <div className="p-4 bg-amber-50 border border-amber-100/50 rounded-2xl text-xs text-amber-800 leading-relaxed font-semibold">
                    방법: 스마트폰 카톡 혹은 PC 카톡에서 분석하고자 하는 대화 상대가 작성한 채팅 줄을 전체 선택하여 복사(내보내기)한 후, 아래 빈칸에 붙여넣어 주세요.
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-apple-gray-300 uppercase tracking-wider block">카톡 대화창 내 보낸사람 정확한 이름</label>
                    <input
                      type="text"
                      required
                      placeholder="예) 엄마, 할머니, 아빠"
                      value={targetSpeaker}
                      onChange={(e) => setTargetSpeaker(e.target.value)}
                      className="w-full px-4 py-3 border border-apple-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-gray-50/50 outline-none transition-all"
                    />
                    <p className="text-[9px] text-apple-gray-300 font-medium">실제 텍스트에서 분석하고자 하는 상대방의 이름 표기가 정확하게 일치해야 합니다.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-apple-gray-300 uppercase tracking-wider block">카카오톡 전체 대화내용 복사본 붙여넣기</label>
                    <textarea
                      placeholder={`[${targetSpeaker}] [오전 10:20] 아들 밥은 챙겨 먹었니?
[${targetSpeaker}] [오후 12:45] ㅎㅎ 오늘도 기운 내라❤️

위와 같은 형태의 대화 전문 혹은 문장들을 자유롭게 복사하여 붙여넣으세요.`}
                      value={kakaoText}
                      onChange={(e) => setKakaoText(e.target.value)}
                      rows={8}
                      className="w-full p-4 border border-apple-gray-100 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-gray-50/50 outline-none transition-all resize-none leading-relaxed font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Progressing state */}
              {analysisProgress >= 0 && analysisProgress < 100 && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-8 h-8 text-apple-blue animate-spin" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-apple-gray-800">
                      실시간 대화 로그 형태소 구문 정밀 분석 중...
                    </p>
                    <p className="text-xs text-apple-gray-400 font-medium">
                      구두점 선호도 연산 및 시그니처 종결어미 패턴 추출 중 ({analysisProgress}%)
                    </p>
                  </div>
                  <div className="w-48 h-1.5 bg-apple-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-apple-blue rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Result State (Linguistic Fingerprint Dashboard) */}
              {analysisProgress === 100 && analysisResult && (
                <div className="space-y-4 text-left animate-fade-in">
                  <div className="p-4 bg-emerald-50 border border-emerald-100/50 rounded-2xl flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-emerald-800">말투 및 시그니처 언어 지문 추출 성공!</p>
                      <p className="text-[10px] text-emerald-700/80 font-medium mt-0.5">
                        총 {analysisResult.totalLines}줄의 텍스트 로그 중 {targetSpeaker}님의 대화 {analysisResult.messageCount}개를 정교하게 필터링하여 말투 지문을 성공적으로 분석해 냈습니다.
                      </p>
                    </div>
                  </div>

                  <div className="bg-apple-gray-50/50 border border-apple-gray-100/80 rounded-2xl p-4.5 space-y-4">
                    <h4 className="text-xs font-bold text-apple-gray-800 border-b border-apple-gray-100 pb-1.5">
                      {targetSpeaker}님의 고유 텍스트 말투 습관
                    </h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-apple-gray-300 font-bold uppercase tracking-wider block">선호 종결어미</span>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.endingStyles.map((style, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 rounded-lg bg-apple-blue/5 text-apple-blue border border-apple-blue/10 font-extrabold">
                              {style}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-apple-gray-300 font-bold uppercase tracking-wider block">자주 쓰는 기호 및 습관</span>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.frequentSymbols.map((sym, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 rounded-lg bg-amber-500/5 text-amber-600 border border-amber-500/10 font-extrabold">
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-apple-gray-100">
                      <span className="text-[10px] text-apple-gray-300 font-bold uppercase tracking-wider block">AI 말동무 시그니처 첫인사(환영인사) 대화체</span>
                      <div className="p-3 bg-white border border-apple-gray-100/60 rounded-xl text-xs text-apple-gray-800 font-semibold leading-relaxed italic">
                        "{analysisResult.welcomeMsg}"
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-apple-gray-300 font-bold uppercase tracking-wider block">보관소 정밀 요약</span>
                      <p className="text-[11px] text-apple-gray-500 font-semibold">
                        {analysisResult.description}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-4 border-t border-apple-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setKakaoModalPersona(null);
                  setKakaoText('');
                  setAnalysisProgress(-1);
                }}
                className="flex-1 px-4 py-3.5 border border-apple-gray-100 text-apple-gray-400 rounded-xl text-xs font-bold transition-all hover:bg-apple-gray-50 text-center cursor-pointer"
              >
                닫기
              </button>

              {analysisProgress === -1 && (
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  disabled={!kakaoText.trim() || !targetSpeaker.trim()}
                  className="flex-1 px-4 py-3.5 bg-amber-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/15 hover:bg-amber-600 text-center cursor-pointer"
                >
                  말투 정밀 분석하기
                </button>
              )}

              {analysisProgress === 100 && analysisResult && (
                <button
                  type="button"
                  onClick={handleApplyAnalysis}
                  className="flex-1 px-4 py-3.5 bg-apple-blue text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-apple-blue/15 hover:bg-apple-blue-light text-center cursor-pointer"
                >
                  실제 말투 정보 적용하기
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Settings;
