import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMemoryStorage } from '../hooks/useMemoryStorage';
import { geminiService } from '../services/gemini';
import { Loader2, Play, Pause, BookOpen, Trash2, FileText, Mic, Image as ImageIcon, Video, Heart, ArrowLeft, Download, RotateCw, X } from 'lucide-react';

export const AIDocumentary: React.FC = () => {
  const { memories, interviews, documentary, saveDocumentary, deleteDocumentary, settings } = useMemoryStorage();
  
  const [isGenerating, setIsSubmitting] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number | null>(null); // For cinematic reading overlay
  const [isPlaying, setIsPlaying] = useState(false); // Play/pause state for automatic slideshow
  const [generationPhase, setGenerationPhase] = useState<string>('');
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null); // Premium Overlay Video Player

  interface PresentationSlide {
    type: 'cover' | 'chapter_intro' | 'memory' | 'conclusion';
    title?: string;
    subtitle?: string;
    introduction?: string;
    conclusion?: string;
    year?: number | string;
    narrative?: string;
    summary?: string;
    memory?: {
      id: string;
      title: string;
      type: 'photo' | 'video' | 'audio' | 'memo';
      mediaUrl?: string;
    };
  }

  // Flatten the documentary chapters and their memories into a flat slideshow list
  const presentationSlides = React.useMemo(() => {
    if (!documentary) return [];
    
    const slides: PresentationSlide[] = [];
    
    // 1. Cover
    slides.push({
      type: 'cover',
      title: documentary.title,
      subtitle: documentary.subtitle,
      introduction: documentary.introduction,
    });
    
    // 2. Chapters & Memories
    documentary.chapters.forEach((chapter) => {
      // Intro page for this chapter
      slides.push({
        type: 'chapter_intro',
        year: chapter.year,
        title: chapter.title,
        narrative: chapter.narrative,
        summary: chapter.summary,
      });
      
      // Separate slide for each memory in this chapter!
      chapter.memories.forEach((mem) => {
        slides.push({
          type: 'memory',
          year: chapter.year,
          memory: mem,
        });
      });
    });
    
    // 3. Conclusion
    slides.push({
      type: 'conclusion',
      conclusion: documentary.conclusion,
    });
    
    return slides;
  }, [documentary]);

  // Auto scroll to top on cinematic change
  useEffect(() => {
    if (activeSlideIndex !== null) {
      window.scrollTo(0, 0);
    }
  }, [activeSlideIndex]);

  // Automatic slideshow transition effect (4 seconds for snappier and engaging cinematic tempo)
  useEffect(() => {
    if (activeSlideIndex === null || !isPlaying || presentationSlides.length === 0) return;

    const timer = setInterval(() => {
      setActiveSlideIndex(prev => {
        if (prev === null) return 0;
        if (prev === presentationSlides.length - 1) {
          // Slide deck complete: Automatically close the cinema presentation view
          setIsPlaying(false);
          return null;
        }
        return prev + 1;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [activeSlideIndex, isPlaying, presentationSlides]);

  // Keyboard navigation for PDF slide deck
  useEffect(() => {
    if (activeSlideIndex === null || presentationSlides.length === 0) return;
    
    const maxPages = presentationSlides.length;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setActiveSlideIndex(prev => (prev !== null && prev < maxPages - 1) ? prev + 1 : 0);
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        setActiveSlideIndex(prev => (prev !== null && prev > 0) ? prev - 1 : prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setActiveSlideIndex(null);
        setIsPlaying(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSlideIndex, presentationSlides]);

  const handleGenerateDoc = async () => {
    if (memories.length === 0) {
      alert('다큐멘터리를 만들려면 최소한 하나 이상의 추억 기록이 보관함에 들어있어야 합니다.');
      return;
    }

    // Filter out KakaoTalk chats and raw instant-messenger data from the documentary creation source
    const filteredMemories = memories.filter(item => {
      const isKakaotalkText = (text: string): boolean => {
        if (!text) return false;
        const lowercase = text.toLowerCase();
        
        // 1. Keyword check for KakaoTalk & messenger patterns
        if (
          lowercase.includes('카카오톡') || 
          lowercase.includes('카톡') || 
          lowercase.includes('kakaotalk') || 
          lowercase.includes('kakao')
        ) {
          return true;
        }
        
        // 2. Chat history standard bracket timestamp check (e.g., [엄마] [오전 10:11])
        if (/\[[^\]]+\]\s*\[오[전후]\s*\d+:\d+\]/.test(text)) {
          return true;
        }
        
        return false;
      };

      if (isKakaotalkText(item.title)) return false;
      if (isKakaotalkText(item.description)) return false;
      if (item.aiAnalysis?.tags?.some(tag => {
        const t = tag.toLowerCase();
        return t.includes('카톡') || t.includes('카카오톡') || t.includes('kakaotalk');
      })) {
        return false;
      }

      return true;
    });

    if (filteredMemories.length === 0) {
      alert('카카오톡 대화방 데이터 등을 제외한 결과, 다큐멘터리(영화) 연대기로 엮을 따뜻한 추억 조각(사진, 녹음 목소리, 자전 메모 등)이 보관함에 존재하지 않습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Beautiful phase transitions during loading
      setGenerationPhase('1단계: 보관소 내부의 사진, 음성 기록, 메모 선별 중...');
      await new Promise(r => setTimeout(r, 1800));
      
      setGenerationPhase('2단계: 지난 수십 년간 축적된 조각들의 타임라인 정렬 중...');
      await new Promise(r => setTimeout(r, 1800));

      setGenerationPhase('3단계: 추억 조각들의 서정적인 연결 고리 및 장별 내러티브 편찬 중...');
      
      const docResult = await geminiService.generateDocumentary(
        filteredMemories,
        interviews,
        settings.geminiApiKey,
        settings.isMockMode
      );

      saveDocumentary(docResult);
    } catch (err) {
      console.error(err);
      alert('다큐멘터리 연대기 편찬 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
      setGenerationPhase('');
    }
  };

  const handleDeleteDoc = () => {
    if (window.confirm('작성된 가족 다큐멘터리를 서재에서 지우시겠습니까? (보관된 원본 추억들은 안전하게 유지됩니다)')) {
      deleteDocumentary();
    }
  };

  // Printable layout
  const handlePrint = () => {
    window.print();
  };

  // Find cover image from memories (prefer photo memory)
  const coverImage = memories.find(m => m.type === 'photo')?.mediaUrl || 
                     'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=1200';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-float-up pb-10">
      
      {/* Cinematic Reading Overlay (Slideshow Mode) */}
      {activeSlideIndex !== null && documentary && createPortal(
        <div className="fixed inset-0 bg-[#020202] z-[9999] flex flex-col justify-center items-center p-4 md:p-8 print:hidden select-none overflow-hidden cinematic-vignette">
          {/* Custom Emotional Nostalgia Animations */}
          <style>{`
            @keyframes memory-recall {
              0% {
                opacity: 0;
                transform: scale(0.99) translateY(10px);
                filter: blur(5px);
              }
              100% {
                opacity: 1;
                transform: scale(1) translateY(0);
                filter: blur(0);
              }
            }
            @keyframes projector-beam {
              0%, 100% { opacity: 0.12; }
              50% { opacity: 0.18; }
            }
            @keyframes ken-burns-soft {
              0% { transform: scale(1); }
              100% { transform: scale(1.04); }
            }
            @keyframes text-reveal-poetic {
              0% { opacity: 0; transform: translateY(8px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes film-grain-shake {
              0%, 100% { opacity: 0.94; }
              50% { opacity: 1; }
              25%, 75% { opacity: 0.96; }
            }
            .animate-memory-slide {
              animation: memory-recall 1.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .projector-lens-beam {
              background: radial-gradient(circle at center, rgba(255, 253, 245, 0.03) 0%, transparent 70%);
              animation: projector-beam 12s ease-in-out infinite;
            }
            .animate-ken-burns-soft {
              animation: ken-burns-soft 14s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite alternate;
            }
            .animate-poetic-text {
              animation: text-reveal-poetic 1.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .film-grain-overlay {
              background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/1900/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.02'/%3E%3C/svg%3E");
            }
            .animate-flicker-soft {
              animation: film-grain-shake 0.25s infinite;
            }
            .cinematic-vignette {
              box-shadow: inset 0 0 160px rgba(0,0,0,1);
            }
          `}</style>

          {/* Quiet Film Grain Overlay */}
          <div className="absolute inset-0 pointer-events-none film-grain-overlay animate-flicker-soft z-50 opacity-80" />

          {/* Gentle Projector Light Source */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 projector-lens-beam" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full bg-amber-500/[0.01] blur-[150px]" />
          </div>

          {(() => {
            // Warm Ambient Projection (Extremely subtle backlighting based on image colors)
            const currentSlide = presentationSlides[activeSlideIndex];
            if (!currentSlide) return null;
            let ambientImgUrl = '';
            if (currentSlide.type === 'cover') ambientImgUrl = coverImage;
            else if (currentSlide.type === 'memory' && currentSlide.memory?.mediaUrl) ambientImgUrl = currentSlide.memory.mediaUrl;
            
            if (!ambientImgUrl) return null;
            return (
              <div 
                className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-10 transition-all duration-[2500ms]"
                style={{
                  backgroundImage: `url(${ambientImgUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(180px) grayscale(0.2)'
                }}
              />
            );
          })()}

          <div className="w-full max-w-4xl flex flex-col gap-6 max-h-[96vh] justify-center items-center relative z-10 font-serif">
            
            {/* Slideshow Top Floating HUD Bar (Quiet and Minimalist) */}
            <div className="flex items-center justify-between text-neutral-450 px-6 py-3 w-full border-b border-white/[0.04] shrink-0">
              <button
                onClick={() => {
                  setActiveSlideIndex(null);
                  setIsPlaying(false);
                }}
                className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                상영 종료 (ESC)
              </button>
              
              <div className="text-xs text-neutral-400 font-medium tracking-wide">
                {activeSlideIndex + 1} / {presentationSlides.length}
              </div>
            </div>

            {/* Cinema Main Stage - Deep Pure Black/Charcoal Backdrop */}
            <div key={activeSlideIndex} className="w-full md:aspect-[16/9] bg-neutral-950/60 rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.9)] border border-white/[0.05] overflow-hidden flex flex-col p-8 md:p-14 justify-center relative animate-memory-slide text-neutral-300 shrink-0">
              
              {/* Quiet, Single-Tone Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/[0.03] overflow-hidden">
                <div 
                  key={`${activeSlideIndex}-${isPlaying}`}
                  className="h-full bg-neutral-100/30 transition-all"
                  style={{
                    width: isPlaying ? '105%' : '0%',
                    transitionDuration: isPlaying ? '4000ms' : '0ms',
                    transitionTimingFunction: 'linear'
                  }}
                />
              </div>

              {(() => {
                const currentSlide = presentationSlides[activeSlideIndex];
                if (!currentSlide) return null;

                if (currentSlide.type === 'cover') {
                  const displayIntro = currentSlide.introduction && currentSlide.introduction.length > 130 
                    ? currentSlide.introduction.slice(0, 130) + '...' 
                    : currentSlide.introduction;

                  return (
                    // Slide 1: Cover and Intro
                    <div className="space-y-6 text-center max-w-2xl mx-auto my-auto animate-poetic-text flex flex-col items-center">
                      <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-normal text-neutral-100 tracking-tight leading-tight">
                          {currentSlide.title}
                        </h1>
                        <p className="text-sm text-neutral-400 italic font-light tracking-wide">
                          {currentSlide.subtitle}
                        </p>
                      </div>
                      <div className="h-[1px] w-12 bg-neutral-700/40" />
                      <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto font-light whitespace-pre-line text-center max-h-[26vh] overflow-y-auto pr-1">
                        {displayIntro}
                      </p>
                    </div>
                  );
                }

                if (currentSlide.type === 'conclusion') {
                  const displayConcl = currentSlide.conclusion && currentSlide.conclusion.length > 130 
                    ? currentSlide.conclusion.slice(0, 130) + '...' 
                    : currentSlide.conclusion;

                  return (
                    // Slide Last: Conclusion
                    <div className="space-y-6 text-center max-w-2xl mx-auto my-auto animate-poetic-text flex flex-col items-center">
                      <h3 className="text-2xl md:text-3xl font-normal text-neutral-100 tracking-tight">에필로그 : 우리들의 연대기</h3>
                      <div className="h-[1px] w-12 bg-neutral-700/40" />
                      <p className="text-xs md:text-sm text-neutral-450 leading-relaxed max-w-lg mx-auto font-light whitespace-pre-line text-center max-h-[26vh] overflow-y-auto pr-1">
                        {displayConcl}
                      </p>
                    </div>
                  );
                }

                if (currentSlide.type === 'chapter_intro') {
                  const displayNarrative = currentSlide.narrative && currentSlide.narrative.length > 100 
                    ? currentSlide.narrative.slice(0, 100) + '...' 
                    : currentSlide.narrative;

                  return (
                    // Slide Chapter Intro
                    <div className="space-y-6 text-center max-w-2xl mx-auto my-auto animate-poetic-text flex flex-col items-center">
                      <span className="text-5xl md:text-6xl font-light text-neutral-300 block leading-none select-none tracking-wide">
                        {currentSlide.year}
                      </span>
                      <h2 className="text-xl md:text-2xl font-normal text-neutral-200 leading-snug">
                        {currentSlide.title}
                      </h2>
                      <div className="h-[1px] w-12 bg-neutral-700/40" />
                      <p className="text-xs md:text-sm text-neutral-400 leading-relaxed font-light text-center whitespace-pre-line max-h-[24vh] overflow-y-auto pr-1 max-w-xl">
                        {displayNarrative}
                      </p>
                      <div className="text-[11px] text-neutral-450 italic mt-2">
                        “ {currentSlide.summary} ”
                      </div>
                    </div>
                  );
                }

                if (currentSlide.type === 'memory' && currentSlide.memory) {
                  const item = currentSlide.memory;
                  const fullMem = memories.find(m => m.id === item.id);
                  const descText = fullMem?.description || '';
                  const sentiment = fullMem?.aiAnalysis?.sentiment || '온화함';
                  const mediaUrl = fullMem?.mediaUrl || item.mediaUrl || '';

                  const displayDesc = descText && descText.length > 90 
                    ? descText.slice(0, 90) + '...' 
                    : descText;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center my-auto animate-poetic-text h-full min-h-0 overflow-hidden py-1">
                      
                      {/* Left Column: Quiet Visual/Media Container */}
                      <div className="w-full h-full min-h-0 flex flex-col justify-center items-center">
                        {item.type === 'photo' && mediaUrl && (
                          <div className="w-full max-h-[46vh] rounded-lg overflow-hidden bg-neutral-900/10 flex items-center justify-center p-0.5 shadow-2xl border border-white/[0.03]">
                            {/* Smooth, Subtle Zoom-in Ken Burns effect */}
                            <div className="w-full h-full overflow-hidden rounded">
                              <img 
                                src={mediaUrl} 
                                alt={item.title} 
                                className="max-w-full max-h-[42vh] object-contain rounded animate-ken-burns-soft" 
                              />
                            </div>
                          </div>
                        )}

                        {item.type === 'video' && (
                          <div className="w-full max-h-[44vh] rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-2xl border border-white/[0.03] relative aspect-video">
                            {mediaUrl && !mediaUrl.includes('unsplash.com') ? (
                              <video
                                src={mediaUrl}
                                controls
                                autoPlay
                                className="w-full h-full object-contain max-h-[44vh] rounded z-10"
                              />
                            ) : (
                              <>
                                <img src={mediaUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800'} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                                <div className="relative z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl cursor-pointer hover:scale-105 transition-transform">
                                  <Play className="w-5 h-5 fill-white" />
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {item.type === 'audio' && (
                          <div className="w-full bg-neutral-900/20 border border-white/[0.04] rounded-xl p-5 flex flex-col gap-4 shadow-xl max-w-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-neutral-350 shrink-0">
                                <Mic className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-neutral-200">목소리 기록</h4>
                                <span className="text-[10px] text-neutral-450 block">그 시절의 고유한 목소리</span>
                              </div>
                            </div>
                            <div className="bg-neutral-950/40 rounded-lg p-3 border border-white/[0.04] space-y-2">
                              {mediaUrl && (
                                <audio src={mediaUrl} controls autoPlay className="w-full h-8 rounded accent-neutral-400" />
                              )}
                            </div>
                          </div>
                        )}

                        {item.type === 'memo' && (
                          <div className="w-full bg-neutral-900/10 border border-white/[0.03] rounded-xl p-6 flex flex-col gap-3 items-center text-center max-w-sm">
                            <div className="w-10 h-10 rounded-xl bg-neutral-900/50 border border-white/[0.04] flex items-center justify-center text-neutral-300 shadow-lg">
                              <FileText className="w-5 h-5" />
                            </div>
                            <h4 className="text-sm font-medium text-neutral-200">{item.title}</h4>
                          </div>
                        )}
                      </div>

                      {/* Right Column: Literary Narrative Details */}
                      <div className="space-y-4 text-left flex flex-col justify-center min-h-0 overflow-y-auto pr-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[11px] text-neutral-450">
                            <span>{currentSlide.year}년</span>
                            <span>·</span>
                            <span>{sentiment}</span>
                          </div>
                          <h3 className="text-xl md:text-2xl font-normal text-neutral-100 tracking-tight">
                            {item.title}
                          </h3>
                        </div>

                        {descText && (
                          <p className="text-xs md:text-sm text-neutral-350 leading-relaxed font-light italic pl-4 border-l border-neutral-700/60 pr-2">
                            “ {displayDesc} ”
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return null;
              })()}
            </div>

            {/* Floating Navigation Controls (Quiet and Neutral tone) */}
            <div className="flex items-center justify-between gap-6 max-w-lg w-full px-5 py-2.5 bg-neutral-950/40 backdrop-blur-md rounded-full border border-white/[0.04] shadow-2xl shrink-0">
              <button
                disabled={activeSlideIndex === 0}
                onClick={() => setActiveSlideIndex(prev => prev !== null ? prev - 1 : 0)}
                className="text-xs text-neutral-400 hover:text-neutral-200 font-medium disabled:opacity-10 transition-colors shrink-0 px-2 py-1"
              >
                이전
              </button>
              
              <div className="flex items-center gap-4.5">
                {/* Play / Pause Toggle Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-neutral-400 hover:text-neutral-200 transition-all shrink-0 p-1"
                  title={isPlaying ? "일시정지" : "재생"}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                </button>

                {/* Subliminal minimalist pagination dots */}
                <div className="flex gap-2 justify-center shrink">
                  {Array.from({ length: presentationSlides.length }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlideIndex(i)}
                      className={`h-1 rounded-full transition-all shrink-0 ${
                        activeSlideIndex === i ? 'w-4 bg-neutral-200' : 'w-1 bg-neutral-750 hover:bg-neutral-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                disabled={activeSlideIndex === presentationSlides.length - 1}
                onClick={() => setActiveSlideIndex(prev => prev !== null ? prev + 1 : 0)}
                className="text-xs text-neutral-200 hover:text-white font-medium disabled:opacity-10 transition-colors shrink-0 px-2 py-1"
              >
                다음
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Main Base Page Area */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-apple-gray-800">가족 추억 다큐멘터리</h2>
        <p className="text-sm text-apple-gray-300 mt-1">
          보관소에 흩어진 시간의 조각들을 정교하게 이어 정성스럽게 편집된 한 권의 가족 연대기처럼 묶어 줍니다.
        </p>
      </div>

      {/* Generating Loading screen */}
      {isGenerating ? (
        <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-apple-gray-100/40 shadow-apple-card space-y-6 max-w-xl mx-auto">
          {/* Pulsing visual container */}
          <div className="w-24 h-24 rounded-full bg-apple-blue/5 border border-apple-blue/10 flex items-center justify-center mx-auto animate-pulse-slow">
            <Loader2 className="w-10 h-10 text-apple-blue animate-spin" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-apple-gray-800">가족 연대기 편찬 중</h3>
            <p className="text-xs text-apple-gray-300 font-semibold uppercase tracking-wider animate-pulse">
              {generationPhase}
            </p>
          </div>

          <div className="p-4 bg-apple-gray-50 rounded-2xl border border-apple-gray-100/50 text-[11px] leading-relaxed text-apple-gray-300 font-semibold text-left">
            💡 이 공간은 가상 복제나 가상의 대화를 나누는 기술적 가공을 추구하지 않습니다. 오직 가족이 정성껏 올린 진실된 실제 기록과 목소리 고백만을 뼈대로 삼아, 그 시절의 분위기와 가족사를 시간의 연대순으로 소박하고 정밀하게 엮는 진솔한 추억 문집입니다.
          </div>
        </div>
      ) : documentary ? (
        // Finished Documentary Screen
        <div className="space-y-8">
          
          {/* Action Header bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-apple-gray-100 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveSlideIndex(0);
                  setIsPlaying(true); // Automatically starts slideshow playback
                }}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl text-xs font-bold shadow-md shadow-apple-blue/15 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-white" />
                프레젠테이션 극장 모드
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-4.5 py-2.5 bg-white border border-apple-gray-100 hover:bg-apple-gray-50 rounded-2xl text-xs font-semibold text-apple-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                인쇄 및 PDF 다운로드
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleGenerateDoc}
                className="flex items-center gap-1.5 px-3 py-2 bg-neutral-50 hover:bg-neutral-100 border border-apple-gray-100 rounded-2xl text-xs font-bold text-apple-gray-800 transition-colors"
                title="새로 업로드된 추억들을 수집해 다큐를 다시 갱신합니다."
              >
                <RotateCw className="w-3.5 h-3.5" />
                새 추억으로 갱신
              </button>
              
              <button
                onClick={handleDeleteDoc}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 rounded-2xl text-xs font-bold text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                서재에서 다큐 삭제
              </button>
            </div>
          </div>

          {/* Documentary Book Cover */}
          <div className="relative overflow-hidden h-80 rounded-3xl border border-apple-gray-100 shadow-lg flex items-end">
            <div className="absolute inset-0 bg-cover bg-center -z-10 transition-transform duration-1000 hover:scale-105" style={{ backgroundImage: `url(${coverImage})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div className="p-6 md:p-10 space-y-2 text-white">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                <Heart className="w-3 h-3 fill-white/10" /> FAMILY DOCUMENTARY
              </span>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight leading-none">
                {documentary.title}
              </h1>
              <p className="text-xs md:text-sm text-white/70 font-semibold">
                {documentary.subtitle}
              </p>
            </div>
          </div>

          {/* Printable Book Layout Wrapper */}
          <div className="bg-white rounded-3xl p-6 md:p-10 border border-apple-gray-100/40 shadow-apple-card space-y-10 print:p-0 print:border-none print:shadow-none">
            
            {/* Intro */}
            <div className="space-y-4 max-w-2xl">
              <h2 className="text-xl font-extrabold text-apple-gray-800 border-b border-apple-gray-50 pb-2">서문</h2>
              <p className="text-xs md:text-sm text-apple-gray-300 leading-relaxed font-semibold whitespace-pre-line text-justify">
                {documentary.introduction}
              </p>
            </div>

            {/* Chapters */}
            <div className="space-y-12 pt-4">
              {documentary.chapters.map((ch, idx) => (
                <div key={ch.id} className="space-y-5 relative pl-4 md:pl-8 border-l-2 border-apple-blue/15">
                  <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-apple-blue border-4 border-white shadow-sm" />
                  
                  {/* Chapter Year */}
                  <div className="space-y-1">
                    <span className="text-2xl font-black text-apple-blue leading-none block">{ch.year}년</span>
                    <h3 className="text-base md:text-lg font-bold text-apple-gray-800">
                      제 {idx + 1}장: {ch.title}
                    </h3>
                  </div>

                  {/* Narration Text */}
                  <p className="text-xs md:text-sm text-apple-gray-300 leading-relaxed font-semibold whitespace-pre-line text-justify max-w-3xl">
                    {ch.narrative}
                  </p>

                  <p className="text-[11px] font-bold text-[#6D5D4E] bg-amber-50/40 border border-amber-200/40 p-3 rounded-xl max-w-xl">
                    📜 그때의 마음 조각 : {ch.summary}
                  </p>

                  {/* Chapter Media Attachments */}
                  {ch.memories.length > 0 && (
                    <div className="space-y-3 pt-3">
                      <label className="block text-[10px] font-bold text-amber-800/80 tracking-wide">
                        🕒 그 시절 보관소에 간직된 마음과 사연 조각들:
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ch.memories.map((item) => {
                          const fullMem = memories.find(m => m.id === item.id);
                          const descText = fullMem?.description || '';
                          const sentiment = fullMem?.aiAnalysis?.sentiment || '온화함';
                          const mediaUrl = fullMem?.mediaUrl || item.mediaUrl || '';
                          return (
                            <div key={item.id} className="bg-apple-gray-50 border border-apple-gray-100/40 rounded-2xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                              {/* Title & Badge */}
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="p-1.5 rounded-lg bg-white border border-apple-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                    {item.type === 'photo' && <ImageIcon className="w-3.5 h-3.5 text-apple-blue" />}
                                    {item.type === 'video' && <Video className="w-3.5 h-3.5 text-purple-500" />}
                                    {item.type === 'audio' && <Mic className="w-3.5 h-3.5 text-apple-green" />}
                                    {item.type === 'memo' && <FileText className="w-3.5 h-3.5 text-brand-accent" />}
                                  </span>
                                  <div>
                                    <h4 className="text-xs font-bold text-apple-gray-800 line-clamp-1">{item.title}</h4>
                                    <span className="text-[9px] text-apple-gray-300 font-medium block">{fullMem?.date || ch.year}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-bold text-[#7C5938] bg-[#F7EFE5] border border-[#E9DAC1]/50 px-2.5 py-0.5 rounded-full shrink-0">
                                  💝 마음 결 : {sentiment}
                                </span>
                              </div>

                              {/* Preview Media */}
                              {mediaUrl && item.type === 'photo' && (
                                <div className="relative rounded-xl overflow-hidden shadow-sm max-h-36">
                                  <img src={mediaUrl} alt={item.title} className="w-full h-36 object-contain bg-apple-gray-50/50" />
                                </div>
                              )}

                              {item.type === 'audio' && (
                                <div className="bg-white rounded-xl p-3 border border-apple-gray-100/40 flex flex-col gap-3 shadow-inner">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-apple-green/10 flex items-center justify-center text-apple-green animate-pulse-slow shrink-0">
                                      <Mic className="w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex justify-between items-center text-[10px] pb-1">
                                        <span className="font-bold text-apple-gray-800">목소리 녹음본</span>
                                        <span className="text-apple-gray-300">보관 완료</span>
                                      </div>
                                      <div className="flex items-end gap-[1.5px] h-3.5 pt-0.5">
                                        {[30, 80, 50, 90, 40, 70, 60, 20, 80, 50, 30, 60].map((h, i) => (
                                          <div key={i} className="flex-1 bg-apple-green/30 rounded-full" style={{ height: `${h}%` }} />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  {mediaUrl && (
                                    <audio src={mediaUrl} controls className="w-full h-8 rounded-lg accent-apple-green" />
                                  )}
                                </div>
                              )}

                              {item.type === 'video' && (
                                <div 
                                  onClick={() => mediaUrl && !mediaUrl.includes('unsplash.com') && setActiveVideoUrl(mediaUrl)}
                                  className="relative rounded-xl overflow-hidden shadow-sm max-h-28 flex items-center justify-center bg-black w-28 h-20 shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                                >
                                  {mediaUrl && !mediaUrl.includes('unsplash.com') ? (
                                    <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" muted playsInline />
                                  ) : (
                                    <img src={mediaUrl || 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800'} alt="Video thumbnail" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                                  )}
                                  <div className="relative z-10 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                                    <Play className="w-4 h-4 fill-white" />
                                  </div>
                                </div>
                              )}

                              {/* Description & Summary */}
                              <div className="space-y-1.5">
                                {descText && (
                                  <p className="text-[11px] text-apple-gray-300 leading-relaxed font-semibold italic pl-2 border-l border-apple-gray-200">
                                    "{descText.slice(0, 100)}{descText.length > 100 ? '...' : ''}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conclusion */}
            <div className="space-y-4 max-w-2xl pt-6 border-t border-apple-gray-50">
              <h2 className="text-xl font-extrabold text-apple-gray-800 pb-1">맺음말</h2>
              <p className="text-xs md:text-sm text-apple-gray-300 leading-relaxed font-semibold whitespace-pre-line text-justify">
                {documentary.conclusion}
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Empty State: Need to generate first
        <div className="bg-white rounded-3xl p-10 md:p-14 text-center border border-apple-gray-100/40 shadow-apple-card max-w-lg mx-auto space-y-6">
          <BookOpen className="w-14 h-14 text-apple-blue mx-auto stroke-[1.2] animate-pulse-slow" />
          
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-apple-gray-800">편찬된 다큐멘터리가 서재에 비어 있습니다</h3>
            <p className="text-xs text-apple-gray-300 max-w-xs mx-auto leading-relaxed">
              보관함 속의 추억들이 연대순으로 곱게 다듬어져 감동적인 인생 시나리오처럼 한 권의 다큐멘터리 문집으로 직조됩니다.
            </p>
          </div>

          <button
            onClick={handleGenerateDoc}
            className="px-6 py-3 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl text-xs font-bold shadow-md shadow-apple-blue/15 transition-all hover:scale-[1.02]"
          >
            가족 다큐멘터리 편찬하기
          </button>
        </div>
      )}

      {/* Immersive Cinematic Video Player Overlay Modal */}
      {activeVideoUrl && (
        createPortal(
          <div 
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[10000] flex items-center justify-center p-4 md:p-10 animate-fade-in"
            onClick={() => setActiveVideoUrl(null)}
          >
            <div className="absolute top-6 right-6 z-50">
              <button 
                onClick={() => setActiveVideoUrl(null)}
                className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-colors shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div 
              className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10 animate-scale-up"
              onClick={(e) => e.stopPropagation()}
            >
              <video 
                src={activeVideoUrl} 
                controls 
                autoPlay 
                className="w-full h-full object-contain"
                playsInline
              />
            </div>
          </div>,
          document.body
        )
      )}
    </div>
  );
};
export default AIDocumentary;
