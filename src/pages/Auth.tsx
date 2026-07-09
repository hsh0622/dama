import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, isFirebaseConfigured } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { Key, Mail, Loader2, ArrowRight } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/');
      } else if (!isFirebaseConfigured) {
        // If simulation mode and local login token exists
        const simulatedUser = localStorage.getItem('dama_simulated_user');
        if (simulatedUser) {
          navigate('/');
        }
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해 주세요.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자리 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      if (isFirebaseConfigured) {
        // Real Firebase Auth
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      } else {
        // Local Simulation Mode (Offline Sandbox Auth)
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Network delay
        
        if (isLogin) {
          const registeredUsersRaw = localStorage.getItem('dama_simulated_users') || '[]';
          const registeredUsers = JSON.parse(registeredUsersRaw) as Array<{ email: string; pass: string }>;
          const match = registeredUsers.find(u => u.email === email && u.pass === password);
          
          if (!match && email === 'test@example.com' && password === '123456') {
            // Default test user
            localStorage.setItem('dama_simulated_user', JSON.stringify({ email }));
          } else if (!match) {
            throw new Error('이메일 혹은 비밀번호가 일치하지 않습니다.');
          } else {
            localStorage.setItem('dama_simulated_user', JSON.stringify({ email }));
          }
        } else {
          // Register in simulation list
          const registeredUsersRaw = localStorage.getItem('dama_simulated_users') || '[]';
          const registeredUsers = JSON.parse(registeredUsersRaw) as Array<{ email: string; pass: string }>;
          
          if (registeredUsers.some(u => u.email === email)) {
            throw new Error('이미 사용 중인 이메일 주소입니다.');
          }
          
          registeredUsers.push({ email, pass: password });
          localStorage.setItem('dama_simulated_users', JSON.stringify(registeredUsers));
          localStorage.setItem('dama_simulated_user', JSON.stringify({ email }));
        }
        
        // Force refresh layout and state
        window.dispatchEvent(new Event('storage'));
        navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = '인증에 실패했습니다. 다시 시도해 주세요.';
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errMsg = '이메일 혹은 비밀번호가 정확하지 않습니다.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = '이미 사용 중인 이메일 주소입니다.';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = '유효하지 않은 이메일 형식입니다.';
      } else if (err.message) {
        errMsg = err.message;
      }
      
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-apple-gray-50 flex items-center justify-center p-4 md:p-6 select-none">
      {/* Dynamic decorative backdrop glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-apple-blue/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md bg-white rounded-3xl p-6 md:p-8 shadow-apple-card border border-apple-gray-100/40 space-y-8 animate-float-up">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <img src="/logo.svg" alt="담아 로고" className="w-14 h-14 object-contain mx-auto transition-transform hover:scale-105" />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-apple-gray-800">추억을 온전히 담아내다</h1>
            <p className="text-xs text-apple-gray-300 mt-1 font-medium leading-relaxed">
              가족의 흩어진 역사와 기억의 조각들을 <br />
              시간의 흐름으로 이어 붙여 아름다운 한 편의 책으로 완성합니다.
            </p>
          </div>
        </div>

        {/* Tab Selectors */}
        <div className="flex bg-apple-gray-50 p-1 rounded-2xl border border-apple-gray-100/60">
          <button
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              isLogin 
                ? 'bg-white text-apple-gray-800 shadow-sm font-extrabold' 
                : 'text-apple-gray-300 hover:text-apple-gray-800'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              !isLogin 
                ? 'bg-white text-apple-gray-800 shadow-sm font-extrabold' 
                : 'text-apple-gray-300 hover:text-apple-gray-800'
            }`}
          >
            가족 아카이브 새로 열기
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-xs font-semibold text-red-500 leading-normal animate-fade-in">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-apple-gray-300 uppercase tracking-wide">이메일 주소</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-300" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="family@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-apple-gray-300 uppercase tracking-wide">비밀번호</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-apple-gray-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-apple-blue hover:bg-apple-blue-light text-white text-sm font-semibold rounded-2xl shadow-md shadow-apple-blue/15 transition-all duration-300 hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? '로그인하기' : '보관소 생성 및 동기화 시작'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Local Demo Fallback Notice */}
        {!isFirebaseConfigured && (
          <div className="pt-2">
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-[10px] text-amber-800 leading-normal text-center font-medium">
              💡 <strong>데모 환경 안내:</strong> 현재 Firebase 인증 자격 증명이 주입되지 않아, 자체 **로컬 모의 보관소 인증**으로 매끄럽게 가입/로그인하여 체험해 볼 수 있습니다. (테스트용: <code className="bg-white/80 px-1 py-0.5 rounded">test@example.com</code> / <code className="bg-white/80 px-1 py-0.5 rounded">123456</code>)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Auth;
