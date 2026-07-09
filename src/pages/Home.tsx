import React from 'react';
import { Link } from 'react-router-dom';
import { useMemoryStorage } from '../hooks/useMemoryStorage';
import { Heart, Plus, BookOpen, Clock, ArrowRight, Mic, Video, FileText } from 'lucide-react';

export const Home: React.FC = () => {
  const { memories, documentary } = useMemoryStorage();

  // Calculate stats
  const totalMemories = memories.length;
  
  const yearsCovered = Array.from(new Set(
    memories.map(m => new Date(m.date).getFullYear())
  )).sort();

  const totalYears = yearsCovered.length;
  const activeYearRange = totalYears > 0 
    ? `${yearsCovered[0]} - ${yearsCovered[yearsCovered.length - 1]}` 
    : '기록 없음';

  const lastMemory = memories.length > 0 
    ? [...memories].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  return (
    <div className="space-y-8 md:space-y-10 animate-float-up">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-6 md:p-8 lg:p-10 border border-apple-gray-100/40 shadow-apple-card flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Soft elegant background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-tr from-apple-blue/5 to-brand-accent/5 rounded-full blur-3xl -z-10" />

        <div className="space-y-4 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-blue/10 text-apple-blue text-xs font-semibold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5 text-brand-accent" />
            온기를 이어 붙이는 가족 추억 다큐멘터리
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-apple-gray-800 leading-tight">
            시간 속에 흩어진 우리 가족의 <br className="hidden sm:inline" />
            모든 순간을 하나의 이야기로.
          </h2>
          <p className="text-sm md:text-base text-apple-gray-300 leading-relaxed font-medium">
            담아는 부모님과 우리 가족의 소중한 사진, 영상, 음성, 메모 기록을 모아 시간순으로 서정적이고 감동적인 일대기 다큐멘터리를 곱게 직조해 주는 아늑한 가족 기록 공간입니다.
          </p>
        </div>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
          <Link
            to="/upload"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-apple-blue hover:bg-apple-blue-light text-white text-sm font-semibold rounded-2xl shadow-md shadow-apple-blue/15 transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            새로운 추억 추가
          </Link>
          <Link
            to="/documentary"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 bg-apple-gray-800 hover:bg-apple-gray-800/90 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 text-brand-accent" />
            다큐멘터리 감상
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[
          { label: '전체 기억 보관', value: `${totalMemories}개`, sub: '사진, 음성, 메모', icon: Heart, color: 'text-red-500 bg-red-50' },
          { label: '기록된 기간', value: activeYearRange, sub: `${totalYears}개 연도 커버`, icon: Clock, color: 'text-apple-blue bg-apple-blue/10' },
          { label: '다큐멘터리 챕터', value: documentary ? `${documentary.chapters.length}개` : '미생성', sub: documentary ? '스토리 연결 완료' : '제작 대기 중', icon: BookOpen, color: 'text-apple-green bg-apple-green/10' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-3xl p-5 border border-apple-gray-100/40 shadow-apple-card space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-apple-gray-300 tracking-tight uppercase">{stat.label}</span>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-extrabold text-apple-gray-800 tracking-tight leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] text-apple-gray-300 font-medium mt-1">
                  {stat.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Two-column Content Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Quick Actions Panel */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-apple-gray-100/40 shadow-apple-card space-y-5">
          <h3 className="text-base font-bold text-apple-gray-800">빠른 추억 기록하기</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { title: '사진 / 영상 저장', desc: '소중한 찰나를 이미지로 기록', path: '/upload', activeTab: 'photo', color: 'border-l-4 border-apple-blue' },
              { title: '음성 추억 녹음', desc: '따뜻한 목소리 그대로 저장', path: '/upload', activeTab: 'audio', color: 'border-l-4 border-apple-green' },
              { title: '손편지 / 메모 작성', desc: '마음이 깃든 텍스트 메모', path: '/upload', activeTab: 'memo', color: 'border-l-4 border-brand-accent' },
              { title: '가족 AI 대화방', desc: '가족의 말투를 닮은 소울 AI와 대화하기', path: '/interview', color: 'border-l-4 border-red-400' }
            ].map((act, i) => (
              <Link
                key={i}
                to={act.path}
                state={act.activeTab ? { activeTab: act.activeTab } : undefined}
                className={`group flex items-center justify-between p-4 bg-apple-gray-50 hover:bg-apple-gray-100/50 rounded-2xl border border-apple-gray-100/40 transition-all duration-300 ${act.color} hover:scale-[1.01]`}
              >
                <div>
                  <h4 className="text-sm font-bold text-apple-gray-800 group-hover:text-apple-blue transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-apple-gray-300 font-medium mt-0.5">{act.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-apple-gray-300 group-hover:text-apple-blue group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Memory Highlights */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-apple-gray-100/40 shadow-apple-card flex flex-col justify-between space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-apple-gray-800">최근에 기록된 순간</h3>
            <Link to="/timeline" className="text-xs font-semibold text-apple-blue flex items-center gap-1 hover:underline">
              모든 타임라인 보기
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {lastMemory ? (
            <div className="flex flex-col sm:flex-row gap-5 items-start bg-apple-gray-50/50 rounded-2xl p-4 border border-apple-gray-100/30">
              {lastMemory.type === 'photo' && lastMemory.mediaUrl ? (
                <img
                  src={lastMemory.mediaUrl}
                  alt={lastMemory.title}
                  className="w-full sm:w-40 h-40 sm:h-32 object-cover rounded-2xl shadow-sm border border-apple-gray-100"
                />
              ) : lastMemory.type === 'video' && lastMemory.mediaUrl ? (
                <div className="relative w-full sm:w-40 h-32 rounded-2xl overflow-hidden border border-apple-gray-100 shadow-sm bg-apple-gray-800 flex items-center justify-center">
                  <video src={lastMemory.mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" muted />
                  <Video className="w-8 h-8 text-white relative z-10 drop-shadow-md" />
                </div>
              ) : lastMemory.type === 'audio' ? (
                <div className="w-full sm:w-40 h-32 rounded-2xl bg-gradient-to-tr from-apple-blue/5 to-brand-accent/10 border border-apple-gray-100 flex flex-col items-center justify-center text-apple-blue shadow-inner gap-2 p-3 select-none">
                  <div className="w-10 h-10 rounded-full bg-apple-blue/10 flex items-center justify-center animate-pulse-slow">
                    <Mic className="w-5 h-5 text-apple-blue" />
                  </div>
                  <span className="text-[10px] font-bold text-apple-blue bg-apple-blue/5 px-2.5 py-0.5 rounded-full">음성 추억</span>
                </div>
              ) : (
                <div className="w-full sm:w-40 h-32 rounded-2xl bg-gradient-to-tr from-brand-light to-white border border-apple-gray-100 flex flex-col items-center justify-center text-brand-primary shadow-inner gap-2 p-3 select-none">
                  <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-primary bg-brand-light/50 px-2.5 py-0.5 rounded-full">친필 메모</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-apple-blue/10 text-apple-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {lastMemory.type}
                  </span>
                  <span className="text-[11px] text-apple-gray-300 font-semibold">{lastMemory.date}</span>
                </div>
                <h4 className="text-base font-bold text-apple-gray-800">{lastMemory.title}</h4>
                <p className="text-xs text-apple-gray-300 font-medium line-clamp-3 leading-relaxed">
                  {lastMemory.description}
                </p>
                {lastMemory.aiAnalysis?.tags && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {lastMemory.aiAnalysis.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] bg-white border border-apple-gray-100 px-2 py-0.5 rounded-full text-apple-gray-300 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-apple-gray-300">
              <Clock className="w-12 h-12 stroke-[1.2] opacity-40 mb-3 text-apple-blue" />
              <p className="text-sm font-semibold">아직 저장된 추억이 없습니다</p>
              <p className="text-xs mt-1 max-w-sm">첫 번째 소중한 기록(사진, 목소리, 손글씨 메모 등)을 저장하여 가족 이야기를 채워나가 보세요.</p>
            </div>
          )}

          {/* Quick Guide */}
          <div className="pt-3 border-t border-apple-gray-50 flex items-center justify-between text-xs text-apple-gray-300 font-medium leading-normal">
            <span>💡 <strong>Tip</strong>: 사진에 설명을 자세히 적을수록 가족 다큐멘터리 묘사가 더욱 감동적으로 완성됩니다!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Home;
