import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMemoryStorage } from '../hooks/useMemoryStorage';
import { AudioRecorder } from '../components/AudioRecorder';
import { compressImage, mediaDb } from '../utils/file';
import { Image, Video, Mic, FileText, Calendar, Heading, FileText as DescIcon, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import type { MemoryItem, MemoryType } from '../types/memory';

export const MemoryUpload: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addMemory, familyPersonas } = useMemoryStorage();

  // Determine starting tab from router state (if accessed from Home dashboard)
  const stateTab = location.state?.activeTab as MemoryType | undefined;

  // Form states
  const [activeTab, setActiveTab] = useState<MemoryType>(stateTab || 'photo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [audioBase64, setAudioBase64] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runAiAnalysis, setRunAiAnalysis] = useState(true);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');

  // Pre-select active persona based on currently logged-in user role
  useEffect(() => {
    const activeRoleName = localStorage.getItem('dama_current_user_role');
    if (activeRoleName && familyPersonas.length > 0) {
      const activePersona = familyPersonas.find(p => p.name === activeRoleName);
      if (activePersona) {
        setSelectedPersonaId(activePersona.id);
      }
    }
  }, [familyPersonas]);

  // Handle Tab Switch
  const handleTabChange = (tab: MemoryType) => {
    setActiveTab(tab);
    setMediaFile(null);
    setMediaUrl('');
    setAudioBase64('');
  };

  // Image Upload handler
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSubmitting(true);
      setMediaFile(file);
      // Compress immediately to protect LocalStorage quota
      const base64 = await compressImage(file, 800, 800, 0.7);
      setMediaUrl(base64);
    } catch (err) {
      console.error(err);
      alert('이미지 압축 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Video Upload Handler
  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMediaFile(file);
    // Create an object URL for instant, high-performance local preview!
    const objectUrl = URL.createObjectURL(file);
    setMediaUrl(objectUrl);
  };

  // Audio Recorder callback
  const handleAudioComplete = (base64: string) => {
    setAudioBase64(base64);
    setMediaUrl(base64);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해 주세요.');
      return;
    }

    if (activeTab === 'photo' && !mediaUrl) {
      alert('사진을 업로드해 주세요.');
      return;
    }
    if (activeTab === 'video' && !mediaFile) {
      alert('영상을 업로드해 주세요.');
      return;
    }
    if (activeTab === 'audio' && !audioBase64) {
      alert('음성을 녹음해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      // AI Analysis simulation or actual call (Milestone 4 will integrate live API)
      let aiAnalysisResult = undefined;

      if (runAiAnalysis) {
        // Quick local mock analysis
        const tags = [activeTab, ...title.split(' ').filter(w => w.length > 1)];
        aiAnalysisResult = {
          tags: tags.slice(0, 4),
          sentiment: '행복하고 따뜻함',
          summary: description 
            ? `소중하게 적어주신 "${description.slice(0, 35)}${description.length > 35 ? '...' : ''}" 이야기가 들려주는 그 시절의 아늑한 온기와 발자취가 전해옵니다.`
            : '가장 포근하고 빛나던 한때의 흔적입니다. 마음 깊은 곳에 놓인 따스했던 웃음소리와 소중한 추억의 공기가 은은하게 피어오릅니다.',
          suggestedTitle: `${new Date(date).getFullYear()}년의 소중한 순간`,
          analyzedAt: new Date().toISOString()
        };
      }

      const memoryId = `m_${Date.now()}`;

      const newMemory: MemoryItem = {
        id: memoryId,
        type: activeTab,
        title,
        description,
        date,
        mediaUrl: activeTab === 'video' ? '' : (mediaUrl || ''),
        fileName: mediaFile?.name,
        fileSize: mediaFile?.size,
        aiAnalysis: aiAnalysisResult,
        personaId: selectedPersonaId || undefined,
        createdAt: new Date().toISOString()
      };

      if (mediaFile) {
        await mediaDb.set(memoryId, mediaFile);
      }

      addMemory(newMemory);

      // Smooth feedback
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/timeline');
      }, 800);

    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-float-up">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-apple-gray-800">소중한 추억 저장</h2>
        <p className="text-sm text-apple-gray-300 mt-1">
          기억하고 싶은 부모님과 우리 가족의 사진, 영상, 음성, 짧은 글을 안전하게 보관하세요.
        </p>
      </div>

      {/* Premium Elegant Guide Card */}
      <div className="bg-brand-light p-4.5 rounded-2xl border border-apple-gray-100/30 text-xs text-brand-primary leading-relaxed flex items-start gap-3 select-none">
        <span className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-3 h-3 text-brand-primary" />
        </span>
        <p className="font-medium">
          부모님의 빛바랜 앨범 속 사진을 골라 여기에 담아보세요. 글을 적기 편치 않으실 땐 <strong>[음성 녹음]</strong> 버튼을 누르고 그때의 추억을 편안하게 목소리로 들려주시는 것도 대단히 소중한 기록이 됩니다.
        </p>
      </div>

      {/* Memory Type Navigation Tabs (Apple Segmented Style) */}
      <div className="bg-apple-gray-100 p-1.5 rounded-2xl flex items-center justify-between w-full shadow-inner border border-apple-gray-100/40">
        {[
          { id: 'photo', label: '사진', icon: Image },
          { id: 'video', label: '영상', icon: Video },
          { id: 'audio', label: '음성 녹음', icon: Mic },
          { id: 'memo', label: '글 / 메모', icon: FileText }
        ].map((tab) => {
          const TabIcon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id as MemoryType)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                active
                  ? 'bg-white text-apple-blue shadow-sm scale-[1.02]'
                  : 'text-apple-gray-300 hover:text-apple-gray-800'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Core Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-apple-card border border-apple-gray-100/40 space-y-6">
        
        {/* Memory Content Box based on Tab */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-apple-gray-300 uppercase tracking-wider mb-2">
            {activeTab === 'photo' && '사진 파일 등록'}
            {activeTab === 'video' && '동영상 파일 등록'}
            {activeTab === 'audio' && '목소리 녹음하기'}
            {activeTab === 'memo' && '기억할 내용 적기'}
          </label>

          {activeTab === 'photo' && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-apple-gray-100 hover:border-apple-blue/50 rounded-2xl p-6 text-center transition-colors relative cursor-pointer group bg-apple-gray-50/50">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {mediaUrl ? (
                <div className="relative w-full max-h-64 rounded-xl overflow-hidden shadow-sm">
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover max-h-64" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                    새로운 사진 업로드
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Image className="w-10 h-10 text-apple-gray-300 mx-auto stroke-[1.2] group-hover:text-apple-blue transition-colors" />
                  <p className="text-sm font-semibold text-apple-gray-800">이곳을 눌러 사진 업로드</p>
                  <p className="text-xs text-apple-gray-300 font-medium">JPEG, PNG 형식 지원 (보관용 고품질 자동압축)</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'video' && (
            <div className="border border-apple-gray-100 rounded-2xl p-5 bg-apple-gray-50/50 space-y-4">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-apple-gray-100 hover:border-apple-blue/50 rounded-xl p-6 text-center transition-colors relative cursor-pointer group">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-2">
                  <Video className="w-10 h-10 text-apple-gray-300 mx-auto stroke-[1.2] group-hover:text-apple-blue transition-colors" />
                  <p className="text-sm font-semibold text-apple-gray-800">동영상 파일 등록하기</p>
                  {mediaFile ? (
                    <p className="text-xs text-apple-green font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {mediaFile.name} 선택됨
                    </p>
                  ) : (
                    <p className="text-xs text-apple-gray-300 font-medium">MP4, MOV 등 주요 영상 지원</p>
                  )}
                </div>
              </div>
              <div className="text-[11px] leading-normal text-apple-blue bg-apple-blue/5 border border-apple-blue/10 p-3.5 rounded-xl font-medium">
                🛡️ <strong>LocalStorage 용량 보호 안내:</strong> 브라우저 보안 및 5MB 용량 한계 규정에 따라, 비디오 본문은 기기 성능 보존을 위해 메타데이터 분석용 가상 경로로 변환 처리됩니다. 실서비스 배포 시 클라우드 스트리밍과 자동 연결됩니다.
              </div>
            </div>
          )}

          {activeTab === 'audio' && (
            <AudioRecorder onRecordingComplete={handleAudioComplete} />
          )}

          {activeTab === 'memo' && (
            <div className="flex items-center justify-center p-6 bg-apple-gray-50 border border-apple-gray-100/50 rounded-2xl">
              <div className="text-center space-y-2 text-apple-gray-300">
                <FileText className="w-12 h-12 stroke-[1.2] mx-auto text-brand-accent animate-pulse" />
                <p className="text-xs font-semibold">아래의 설명 상자에 추억하고 싶은 소중한 내용을 그대로 적어주세요.</p>
                <p className="text-[10px]">엄마의 말 한마디, 할아버지의 옛이야기 등 모든 기록이 역사가 됩니다.</p>
              </div>
            </div>
          )}
        </div>

        {/* Common Meta Inputs */}
        <div className="space-y-4 pt-2 border-t border-apple-gray-50">
          
          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-apple-gray-300 uppercase tracking-wider">
              <Heading className="w-3.5 h-3.5" />
              추억 제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예) 부모님과 함께 떠난 양평 단풍 여행"
              className="w-full px-4 py-3 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-sm font-semibold"
            />
          </div>


          {/* Date & Date Selector */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-apple-gray-300 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5" />
              추억 발생 날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-sm font-semibold"
            />
          </div>

          {/* Description Content Input */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-apple-gray-300 uppercase tracking-wider">
              <DescIcon className="w-3.5 h-3.5" />
              그날의 기록 및 묘사
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="여기에 그날 있었던 특별한 일, 대화, 나누었던 기분 등을 적어두세요. 입력해 주신 따뜻한 기억은 연대기 이야기를 더욱 감동적으로 풀어내는 뼈대가 됩니다."
              className="w-full px-4 py-3 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-sm leading-relaxed"
            />
          </div>
        </div>
        {/* 추억 자동 요약 설정 */}
        <div className="flex items-center justify-between p-4 bg-apple-blue/5 border border-apple-blue/10 rounded-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-apple-blue/10 flex items-center justify-center text-apple-blue">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-apple-gray-800 block">따뜻한 이야기 및 기억 한 줄 요약 자동 정리</span>
              <span className="text-[10px] text-apple-gray-300 font-medium">추억 속의 잔잔한 정조 분위기, 중요 키워드, 서정적인 요약 문구를 정밀하게 정리합니다.</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRunAiAnalysis(!runAiAnalysis)}
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 outline-none ${
              runAiAnalysis ? 'bg-apple-blue' : 'bg-apple-gray-100'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-300 ${
                runAiAnalysis ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Submit & Cancel Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex-1 py-3.5 border border-apple-gray-100 hover:bg-apple-gray-50 rounded-2xl text-xs font-semibold text-apple-gray-300 transition-all duration-300"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl text-xs font-bold shadow-md shadow-apple-blue/15 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '보관함에 저장하기'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
export default MemoryUpload;
