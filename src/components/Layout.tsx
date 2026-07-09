import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Upload, Clock, BookOpen, MessageSquare, Settings, LogIn, LogOut, User, Sparkles, Trash2, X, Send } from 'lucide-react';
import { useMemoryStorage } from '../hooks/useMemoryStorage';
import { geminiService } from '../services/gemini';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logOut, settings, familyPersonas, addFamilyPersona, deleteFamilyPersona } = useMemoryStorage();

  const [currentUserRole, setCurrentUserRole] = React.useState<string | null>(() => {
    return localStorage.getItem('dama_current_user_role');
  });

  // 👵👴 Digital Guide AI Floating Widget States for Seniors
  const [isGuideOpen, setIsGuideOpen] = React.useState(false);
  const [guideInput, setGuideInput] = React.useState('');
  const [isGuideLoading, setIsGuideLoading] = React.useState(false);
  const [guideMessages, setGuideMessages] = React.useState([
    {
      sender: 'assistant',
      text: "안녕하세요! 반갑습니다. 저는 가족 보관소 도우미 '도이'예요. 😊\n\n보관소를 이용하시다가 궁금하거나 조작법이 낯설 때는 언제든 제게 말씀해 주세요!\n\n아래의 자주 하시는 질문 단추를 톡 누르시거나, 맨 밑에 궁금한 내용을 써서 보내주시면 친절하게 가르쳐 드릴게요."
    }
  ]);

  const guideEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (guideEndRef.current) {
      guideEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [guideMessages, isGuideOpen]);

  const handleGuideSend = async (textToSend: string) => {
    if (!textToSend.trim() || isGuideLoading) return;

    const userMsg = textToSend.trim();
    setGuideMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setGuideInput('');
    setIsGuideLoading(true);

    try {
      const apiKey = localStorage.getItem('dama_gemini_api_key') || '';
      const isMock = !apiKey;
      
      const answer = await geminiService.generateGuideAnswer(userMsg, apiKey, isMock);
      setGuideMessages(prev => [...prev, { sender: 'assistant', text: answer }]);
    } catch (err) {
      console.error(err);
      setGuideMessages(prev => [...prev, { sender: 'assistant', text: "잠시 인터넷 연결이 원활하지 않은 것 같아요. 잠시 후에 다시 한 번 편하게 질문해 주시면 친절히 알려 드릴게요! 🥺" }]);
    } finally {
      setIsGuideLoading(false);
    }
  };
  const [showRolePortal, setShowRolePortal] = React.useState(false);
  const [newRoleName, setNewRoleName] = React.useState('');
  const [newRoleRel, setNewRoleRel] = React.useState('');
  const [newRoleWelcome, setNewRoleWelcome] = React.useState('');
  const [isCustomMode, setIsCustomMode] = React.useState(false);

  // Automatically trigger role selection modal if logged in but role is empty
  React.useEffect(() => {
    if (currentUser && !currentUserRole) {
      setShowRolePortal(true);
    } else {
      setShowRolePortal(false);
    }
  }, [currentUser, currentUserRole]);

  // Sync event listener for local changes
  React.useEffect(() => {
    const handleRoleChange = () => {
      setCurrentUserRole(localStorage.getItem('dama_current_user_role'));
    };
    window.addEventListener('dama-user-role-changed', handleRoleChange);
    return () => {
      window.removeEventListener('dama-user-role-changed', handleRoleChange);
    };
  }, []);

  const handleSelectRole = (role: string) => {
    localStorage.setItem('dama_current_user_role', role);
    setCurrentUserRole(role);
    setShowRolePortal(false);
    setIsCustomMode(false);
    setNewRoleName('');
    setNewRoleRel('');
    setNewRoleWelcome('');
    
    // Broadcast storage change event to keep other tabs/contexts updated
    window.dispatchEvent(new Event('dama-user-role-changed'));
  };

  const handleCustomRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleRel.trim() || !newRoleWelcome.trim()) return;

    const colors = ['rose', 'indigo', 'amber', 'emerald', 'violet', 'orange'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newPersona = {
      id: `p_${Date.now()}`,
      name: newRoleName.trim(),
      relationship: newRoleRel.trim(),
      description: `${newRoleName.trim()}의 따뜻하고 맑은 대표 말투`,
      welcomeMessage: newRoleWelcome.trim(),
      avatarColor: randomColor,
      createdAt: new Date().toISOString()
    };

    addFamilyPersona(newPersona);
    handleSelectRole(newPersona.name);
  };

  const navItems = [
    { path: '/', label: '홈', icon: Home },
    { path: '/upload', label: '추억 저장', icon: Upload },
    { path: '/timeline', label: '타임라인', icon: Clock },
    { path: '/documentary', label: '가족 다큐', icon: BookOpen },
    { path: '/interview', label: '가족 AI 대화', icon: MessageSquare },
    { path: '/settings', label: '설정', icon: Settings },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Senior-friendly dynamic font scaling effect
  React.useEffect(() => {
    const size = settings.fontSize || 'large';
    if (size === 'huge') {
      document.documentElement.style.fontSize = '19px';
    } else if (size === 'normal') {
      document.documentElement.style.fontSize = '15px';
    } else {
      document.documentElement.style.fontSize = '17px'; // Cozy default
    }
  }, [settings.fontSize]);

  return (
    <div className="min-h-screen bg-apple-gray-50 flex flex-col md:flex-row">
      {/* Desktop Left Glass Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-effect border-r border-apple-gray-100 h-screen sticky top-0 px-4 py-6 z-20">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 px-3 py-2 mb-8 group">
          <img src="/logo.svg" alt="담아 로고" className="w-10 h-10 object-contain transition-transform group-hover:scale-105" />
          <div>
            <h1 className="text-lg font-bold tracking-tight leading-none text-apple-gray-800">담아</h1>
            <span className="text-xs text-apple-gray-300 font-medium tracking-wide">따뜻한 가족 추억 보존소</span>
          </div>
        </Link>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                  active
                    ? 'bg-apple-blue text-white shadow-md shadow-apple-blue/15 scale-[1.02]'
                    : 'text-apple-gray-300 hover:text-apple-gray-800 hover:bg-apple-gray-100/50'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-105' : 'group-hover:scale-105'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop User Profile Footer */}
        <div className="pt-4 border-t border-apple-gray-100/50">
          {currentUser ? (
            <div className="flex flex-col gap-2.5">
              {/* Merged Profile & Active Role Card */}
              <div 
                onClick={() => setShowRolePortal(true)}
                className="mx-0.5 px-3 py-3 bg-gradient-to-r from-apple-blue/5 to-indigo-500/5 border border-apple-blue/10 hover:border-apple-blue/30 rounded-2xl flex items-center justify-between group shadow-sm cursor-pointer transition-all active:scale-[0.98] relative"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Dynamic character circle avatar based on current user role */}
                  {currentUserRole ? (() => {
                    const matched = familyPersonas.find(p => p.name === currentUserRole);
                    const colorThemes = [
                      { id: 'rose', bg: 'bg-rose-100 text-rose-700', border: 'border-rose-100' },
                      { id: 'indigo', bg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-100' },
                      { id: 'amber', bg: 'bg-amber-100 text-amber-800', border: 'border-amber-100' },
                      { id: 'emerald', bg: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100' },
                      { id: 'violet', bg: 'bg-violet-100 text-violet-700', border: 'border-violet-100' },
                      { id: 'orange', bg: 'bg-orange-100 text-orange-800', border: 'border-orange-100' }
                    ];
                    const theme = matched ? (colorThemes.find(t => t.id === matched.avatarColor) || colorThemes[0]) : colorThemes[1];
                    const initialChar = currentUserRole.charAt(0);
                    return (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-[11px] leading-none shrink-0 border shadow-inner ${theme.bg} ${theme.border}`}>
                        {initialChar}
                      </div>
                    );
                  })() : (
                    <div className="w-8 h-8 rounded-full bg-apple-blue flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                      {currentUser.email ? currentUser.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] text-apple-blue font-bold tracking-tight block leading-none mb-0.5 truncate">
                      {currentUserRole ? `나의 역할: ${currentUserRole}` : '접속 역할 선택'}
                    </span>
                    <span className="text-[11px] font-bold text-apple-gray-800 block truncate leading-none">
                      {currentUser.email}
                    </span>
                  </div>
                </div>

                <div 
                  className="p-1 rounded-lg group-hover:bg-apple-blue/10 text-apple-blue/80 group-hover:text-apple-blue transition-all shrink-0"
                  title="접속 역할 변경"
                >
                  <User className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={logOut}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-apple-gray-100/50 hover:bg-red-50 hover:border-red-100 text-apple-gray-300 hover:text-red-500 rounded-xl text-[10px] font-bold transition-all duration-300"
              >
                <LogOut className="w-3 h-3" />
                보관소 닫기 (로그아웃)
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/auth')}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-3 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl text-xs font-bold shadow-sm shadow-apple-blue/10 transition-all duration-300 hover:scale-[1.01]"
            >
              <LogIn className="w-3.5 h-3.5" />
              보관소 로그인 & 동기화
            </button>
          )}

          <div className="px-2.5 text-[10px] text-apple-gray-300 font-medium opacity-80 leading-normal">
            <p>© 2026 담아 · 추억을 온전히 담다</p>
          </div>
        </div>
      </aside>

      {/* Mobile Top Glass Header */}
      <header className="md:hidden glass-effect border-b border-apple-gray-100/30 sticky top-0 px-4 py-3 flex items-center justify-between z-20">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="담아 로고" className="w-8 h-8 object-contain" />
          <span className="text-base font-extrabold tracking-tight text-apple-gray-800">담아</span>
        </Link>
        
        {currentUser ? (
          <div className="flex items-center gap-2">
            {currentUserRole && (
              <button
                onClick={() => setShowRolePortal(true)}
                className="flex items-center gap-1 text-[10px] font-bold text-apple-blue px-2.5 py-1 rounded-full bg-apple-blue/10 border border-apple-blue/5 transition-transform active:scale-95"
              >
                <span>역할: {currentUserRole}</span>
              </button>
            )}
            <span className="text-[9px] bg-apple-blue/10 text-apple-blue px-2 py-0.5 rounded-full font-bold">
              {currentUser.email?.split('@')[0]}
            </span>
            <button
              onClick={logOut}
              className="p-1 text-apple-gray-300 hover:text-red-500 transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1 text-[11px] font-bold text-apple-blue px-3 py-1.5 rounded-xl bg-apple-blue/10"
          >
            <LogIn className="w-3 h-3" />
            로그인
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <div className="flex-1 px-4 py-6 md:p-8 lg:p-10 max-w-5xl mx-auto w-full animate-fade-in">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Glass Tab Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-effect border-t border-apple-gray-100/40 px-2 py-2 flex justify-around items-center z-20 shadow-lg shadow-black/5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
                active
                  ? 'text-apple-blue scale-105 font-semibold'
                  : 'text-apple-gray-300'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Gorgeous Glassmorphic Role Selection Portal */}
      {showRolePortal && (
        <div className="fixed inset-0 bg-apple-gray-950/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[32px] max-w-md w-full p-8 relative flex flex-col items-center text-center overflow-hidden animate-scale-up">
            {/* Background soft glowing blur spheres */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-apple-blue/20 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl -z-10" />
            
            <div className="w-16 h-16 rounded-[22px] bg-gradient-to-tr from-apple-blue to-indigo-500 flex items-center justify-center text-white mb-6 shadow-lg shadow-apple-blue/20">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>

            <h2 className="text-2xl font-black text-apple-gray-800 tracking-tight mb-2">
              가족 보관소에 오신 것을 환영합니다!
            </h2>
            <p className="text-sm text-apple-gray-400 leading-relaxed max-w-xs mb-8">
              여기는 우리 가족의 소중한 기록을 모으는 공용 공간입니다. 오늘 당신은 어떤 역할로 글을 쓰고 이야기를 나누시겠습니까?
            </p>

            {!isCustomMode ? (
              <div className="flex flex-col gap-3.5 w-full mb-4 max-h-[320px] overflow-y-auto pr-1">
                {familyPersonas.map((p) => {
                  const colorThemes = [
                    { id: 'rose', bg: 'bg-rose-100 text-rose-700', border: 'border-rose-100' },
                    { id: 'indigo', bg: 'bg-indigo-100 text-indigo-700', border: 'border-indigo-100' },
                    { id: 'amber', bg: 'bg-amber-100 text-amber-800', border: 'border-amber-100' },
                    { id: 'emerald', bg: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100' },
                    { id: 'violet', bg: 'bg-violet-100 text-violet-700', border: 'border-violet-100' },
                    { id: 'orange', bg: 'bg-orange-100 text-orange-800', border: 'border-orange-100' }
                  ];
                  const theme = colorThemes.find(t => t.id === p.avatarColor) || colorThemes[0];
                  const initialChar = p.name ? p.name.charAt(0) : '가';

                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectRole(p.name)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-apple-blue border border-apple-gray-100 hover:border-apple-blue rounded-[20px] text-left transition-all duration-300 hover:scale-[1.01] shadow-sm active:scale-95 cursor-pointer group/btn"
                    >
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {/* Round Character Avatar */}
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm leading-none shrink-0 border transition-colors ${theme.bg} ${theme.border} group-hover/btn:bg-white group-hover/btn:text-apple-blue group-hover/btn:border-white/20`}>
                          {initialChar}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-extrabold text-apple-gray-800 group-hover/btn:text-white truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-apple-gray-50 text-apple-gray-400 font-bold group-hover/btn:bg-white/15 group-hover/btn:text-white shrink-0">
                              {p.relationship}
                            </span>
                          </div>
                          <p className="text-[11px] text-apple-gray-400 group-hover/btn:text-white/80 line-clamp-1 leading-tight font-medium">
                            {p.description}
                          </p>
                        </div>
                      </div>

                      {/* Delete Button (Visible on Hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`'${p.name}' 역할을 정말 삭제하시겠습니까?`)) {
                            deleteFamilyPersona(p.id);
                          }
                        }}
                        className="p-2 rounded-xl hover:bg-red-500/10 text-apple-gray-300 hover:text-red-500 hover:group-hover/btn:text-white hover:group-hover/btn:bg-white/10 transition-all shrink-0 ml-2"
                        title="역할 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setIsCustomMode(true)}
                  className="flex items-center justify-center gap-2 py-4 bg-apple-blue/5 hover:bg-apple-blue border border-apple-blue/10 hover:border-apple-blue rounded-[20px] transition-all duration-300 hover:scale-[1.01] shadow-sm active:scale-95 text-center text-xs font-bold text-apple-blue hover:text-white"
                >
                  <span>새로운 가족 역할 등록하기</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomRoleSubmit} className="w-full space-y-4 mb-4 text-left animate-fade-in">
                <h3 className="text-base font-black text-apple-gray-800 text-center mb-1">
                  신규 가족 역할 등록
                </h3>
                <p className="text-[11px] text-apple-gray-400 text-center mb-4 leading-normal">
                  새로 추가한 역할은 보관소에 영구 등록되며, AI 말동무(대화)와 말투 학습이 자동으로 적용됩니다.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-apple-gray-300 uppercase tracking-wider block">역할 이름 (예: 첫째 딸, 삼촌, 이모)</label>
                  <input
                    type="text"
                    required
                    placeholder="예) 첫째 딸"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="w-full px-4 py-3 border border-apple-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-gray-50/50 outline-none transition-all"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-apple-gray-300 uppercase tracking-wider block">실제 가족 관계 (예: 딸, 조카, 배우자)</label>
                  <input
                    type="text"
                    required
                    placeholder="예) 딸"
                    value={newRoleRel}
                    onChange={(e) => setNewRoleRel(e.target.value)}
                    className="w-full px-4 py-3 border border-apple-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-gray-50/50 outline-none transition-all"
                    maxLength={10}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-apple-gray-300 uppercase tracking-wider block">첫 인사 및 평소 시그니처 말투 한마디</label>
                  <input
                    type="text"
                    required
                    placeholder="예) 어구 우리 귀한 딸 왔는가! 밥은 먹었어?"
                    value={newRoleWelcome}
                    onChange={(e) => setNewRoleWelcome(e.target.value)}
                    className="w-full px-4 py-3 border border-apple-gray-100 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue bg-apple-gray-50/50 outline-none transition-all"
                    maxLength={50}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomMode(false);
                      setNewRoleName('');
                      setNewRoleRel('');
                      setNewRoleWelcome('');
                    }}
                    className="flex-1 px-4 py-3.5 border border-apple-gray-100 text-apple-gray-400 rounded-xl text-xs font-bold transition-all hover:bg-apple-gray-50 text-center cursor-pointer"
                  >
                    이전으로
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3.5 bg-apple-blue text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-apple-blue/15 hover:bg-apple-blue-light text-center cursor-pointer"
                  >
                    등록 및 선택
                  </button>
                </div>
              </form>
            )}

            {currentUserRole && (
              <button
                onClick={() => {
                  setShowRolePortal(false);
                  setIsCustomMode(false);
                }}
                className="text-xs text-apple-gray-400 hover:text-apple-gray-800 transition-colors mt-4 block underline underline-offset-4"
              >
                현재 역할 그대로 유지하기 ({currentUserRole})
              </button>
            )}
          </div>
        </div>
      )}

      {/* 👵👴 Floating Senior Guide AI Assistant Widget */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
        {/* Guide Popup Window */}
        {isGuideOpen && (
          <div className="w-[380px] sm:w-[410px] h-[570px] bg-white rounded-[28px] border border-apple-gray-100 shadow-2xl overflow-hidden flex flex-col mb-4 animate-scale-up text-left">
            {/* Window Header - Cozy Clay Orange Theme */}
            <div className="px-6 py-5 bg-apple-blue text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧸</span>
                <div>
                  <h3 className="text-sm font-black tracking-tight">
                    도우미 도이
                  </h3>
                  <span className="text-[10.5px] text-white/85 font-extrabold">쉽게 설명해 드리는 친근한 가이드 AI</span>
                </div>
              </div>
              <button 
                onClick={() => setIsGuideOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 transition-all text-white/90 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Area with larger, high-contrast text for seniors */}
            <div className="flex-1 overflow-y-auto p-5 bg-[#FAF9F6] space-y-4">
              {guideMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-[13.5px] font-extrabold leading-relaxed shadow-sm whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-apple-blue text-white rounded-br-none'
                      : 'bg-white border border-apple-gray-100/60 text-apple-gray-800 rounded-bl-none tracking-wide'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {isGuideLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-2.5 bg-white border border-apple-gray-100/40 rounded-2xl rounded-bl-none text-xs font-bold text-apple-gray-400 flex items-center gap-1.5 shadow-sm animate-pulse">
                    <span>도이가 골똘히 생각하는 중</span>
                    <span className="flex gap-0.5 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-apple-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={guideEndRef} />
            </div>

            {/* Quick Helper Button Row (For ease of senior use - cleanly styled) */}
            <div className="px-5 py-3.5 bg-white border-t border-apple-gray-100/50 flex flex-col gap-2">
              <span className="text-[10px] font-black text-apple-gray-300 pl-0.5">💡 물어보고 싶으신 단추를 톡 누르시면 도이가 가르쳐 드릴게요!</span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide shrink-0">
                <button
                  onClick={() => handleGuideSend("❓ 서비스 설명을 듣고 싶어요")}
                  disabled={isGuideLoading}
                  className="px-3.5 py-2.5 bg-apple-blue/5 hover:bg-apple-blue border border-apple-blue/10 hover:border-apple-blue rounded-xl text-[11px] font-extrabold text-apple-blue hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-sm"
                >
                  ❓ 서비스 설명
                </button>
                <button
                  onClick={() => handleGuideSend("🧭 어디로 가야할까?")}
                  disabled={isGuideLoading}
                  className="px-3.5 py-2.5 bg-apple-blue/5 hover:bg-apple-blue border border-apple-blue/10 hover:border-apple-blue rounded-xl text-[11px] font-extrabold text-apple-blue hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-sm"
                >
                  🧭 어디로 가야할까?
                </button>
                <button
                  onClick={() => handleGuideSend("✍️ 글은 어떻게 저장하나요?")}
                  disabled={isGuideLoading}
                  className="px-3.5 py-2.5 bg-apple-blue/5 hover:bg-apple-blue border border-apple-blue/10 hover:border-apple-blue rounded-xl text-[11px] font-extrabold text-apple-blue hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-sm"
                >
                  ✍️ 글쓰기 방법
                </button>
                <button
                  onClick={() => handleGuideSend("💬 가족 AI와 대화하고 싶어요")}
                  disabled={isGuideLoading}
                  className="px-3.5 py-2.5 bg-apple-blue/5 hover:bg-apple-blue border border-apple-blue/10 hover:border-apple-blue rounded-xl text-[11px] font-extrabold text-apple-blue hover:text-white transition-all whitespace-nowrap cursor-pointer shadow-sm"
                >
                  💬 가족 대화 방법
                </button>
              </div>
            </div>

            {/* Input Form Footer with larger padding */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGuideSend(guideInput);
              }}
              className="p-4 border-t border-apple-gray-100 bg-white flex items-center gap-3 shrink-0"
            >
              <input
                type="text"
                value={guideInput}
                onChange={(e) => setGuideInput(e.target.value)}
                disabled={isGuideLoading}
                placeholder="도움말 검색 또는 도이에게 여쭤보기..."
                className="flex-1 px-4 py-3.5 text-xs bg-apple-gray-50 focus:bg-white border border-apple-gray-100 focus:border-apple-blue rounded-2xl focus:outline-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-semibold"
              />
              <button
                type="submit"
                disabled={isGuideLoading || !guideInput.trim()}
                className="p-3.5 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95 disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Guide Persona Action Button - Expanded size, Teddy bear emoji 🧸 */}
        <button
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className={`w-18 h-18 rounded-full bg-apple-blue border border-white/20 hover:bg-apple-blue-light shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 flex flex-col items-center justify-center text-white cursor-pointer relative group animate-float-up ${isGuideOpen ? 'rotate-6' : ''}`}
        >
          <span className="text-2xl leading-none">🧸</span>
          <span className="text-[10px] font-black text-white/95 uppercase tracking-wider block mt-1 leading-none">AI 도우미</span>
          
          {/* Tooltip bubble helper text - Adjusted spacing */}
          {!isGuideOpen && (
            <div className="absolute right-22 bg-apple-gray-800 text-white text-[10.5px] font-extrabold px-3.5 py-2.5 rounded-xl rounded-tr-none shadow-lg transition-all opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 duration-300 whitespace-nowrap pointer-events-none border border-apple-gray-700/50">
              누르시면 사용 방법을 쉽고 친절하게 알려 드려요! 😊
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
