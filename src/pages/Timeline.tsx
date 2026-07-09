import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMemoryStorage } from "../hooks/useMemoryStorage";
import {
  Clock,
  Filter,
  Trash2,
  Edit3,
  Image,
  Video,
  Mic,
  FileText,
  Search,
  Heart,
  AlertCircle,
  X,
  Calendar,
  FileText as DescIcon,
  Check,
  Loader2,
} from "lucide-react";
import type { MemoryItem, MemoryType } from "../types/memory";
import { geminiService } from "../services/gemini";

export const Timeline: React.FC = () => {
  const { memories, deleteMemory, updateMemory, settings } = useMemoryStorage();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  // Edit Modal States
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editDesc, setEditDescription] = useState("");

  // Extract all unique years available in memories
  const availableYears = useMemo(() => {
    const years = memories.map((m) =>
      new Date(m.date).getFullYear().toString(),
    );
    return Array.from(new Set(years)).sort((a, b) => b.localeCompare(a));
  }, [memories]);

  // Sort memories chronologically (Oldest first for narrative, or Newest first for timeline?
  // Usually, a feed-like timeline is Newest first so the latest is at the top, or chronological.
  // Let's sort Newest first so the user sees their recent uploads first, but with a beautiful vertical line.)
  const filteredSortedMemories = useMemo(() => {
    return memories
      .filter((item) => {
        const matchesType =
          selectedType === "all" || item.type === selectedType;
        const matchesYear =
          selectedYear === "all" ||
          new Date(item.date).getFullYear().toString() === selectedYear;
        const matchesSearch =
          searchQuery.trim() === "" ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.aiAnalysis?.tags?.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase()),
          );

        return matchesType && matchesYear && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memories, selectedType, selectedYear, searchQuery]);

  // Handle Edit Action
  const openEditModal = (item: MemoryItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDate(item.date);
    setEditDescription(item.description);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    if (!editTitle.trim()) {
      alert("제목을 입력해 주세요.");
      return;
    }

    updateMemory(editingItem.id, {
      title: editTitle,
      date: editDate,
      description: editDesc,
    });

    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("이 소중한 추억을 영구적으로 삭제하시겠습니까?")) {
      deleteMemory(id);
    }
  };

  const handleAnalyze = async (item: MemoryItem) => {
    try {
      setAnalyzingId(item.id);
      const result = await geminiService.analyzeMemory(
        {
          type: item.type,
          title: item.title,
          description: item.description,
          date: item.date,
        },
        settings.geminiApiKey,
        settings.isMockMode,
      );
      updateMemory(item.id, {
        aiAnalysis: { ...result, analyzedAt: new Date().toISOString() },
      });
    } catch (err) {
      console.error(err);
      alert("추억 해석 중 오류가 발생했습니다.");
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-float-up max-w-4xl mx-auto">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-apple-gray-800">
          추억 타임라인
        </h2>
        <p className="text-sm text-apple-gray-300 mt-1">
          시간을 거슬러 올라가 가족의 발자취와 소중한 인생 이야기를 둘러보세요.
        </p>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-3xl p-5 border border-apple-gray-100/40 shadow-apple-card space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-apple-gray-300 absolute left-4 top-3.5" />
            <input
              type="text"
              placeholder="제목, 내용 또는 태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all duration-300 text-xs"
            />
          </div>

          {/* Segmented Select Filters */}
          <div className="flex flex-wrap gap-2.5">
            {/* Type Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-apple-gray-50 border border-apple-gray-100 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-apple-gray-300" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-xs font-semibold text-apple-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="all">모든 종류</option>
                <option value="photo">📷 사진</option>
                <option value="video">🎥 영상</option>
                <option value="audio">🎙️ 음성</option>
                <option value="memo">📝 글 / 메모</option>
              </select>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-apple-gray-50 border border-apple-gray-100 rounded-2xl">
              <Calendar className="w-3.5 h-3.5 text-apple-gray-300" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-xs font-semibold text-apple-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="all">모든 연도</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}년
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Timeline View */}
      {filteredSortedMemories.length > 0 ? (
        <div className="relative pl-6 md:pl-28 space-y-12">
          {/* Vertical central path line */}
          <div className="absolute left-[29px] md:left-24 top-2 bottom-2 w-0.5 timeline-line z-0" />

          {filteredSortedMemories.map((item) => {
            const dateObj = new Date(item.date);
            const displayYear = dateObj.getFullYear();
            const displayMonthDay = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;

            return (
              <div
                key={item.id}
                className="relative flex flex-col md:flex-row gap-6 animate-fade-in z-10 group"
              >
                {/* Floating Date Indicators (Only on desktop, nice left sidebar) */}
                <div className="hidden md:block absolute -left-28 top-3 text-right w-20">
                  <span className="block text-lg font-extrabold text-apple-gray-800 leading-none">
                    {displayYear}
                  </span>
                  <span className="block text-[11px] font-bold text-apple-gray-300 mt-1 uppercase tracking-wider">
                    {displayMonthDay}
                  </span>
                </div>
                {/* Timeline Card */}
                <div className="flex-1 bg-white rounded-3xl p-5 md:p-6 border border-apple-gray-100/40 shadow-apple-card hover:shadow-apple-card-hover group-hover:scale-[1.01] transition-all duration-500 space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      {/* Date details for mobile view */}
                      <div className="md:hidden flex items-center gap-1.5 text-[10px] font-bold text-apple-gray-300">
                        <span>{item.date.replace(/-/g, ".")}</span>
                        <span>•</span>
                        <span className="uppercase">{item.type}</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-apple-gray-800 leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    {/* Action buttons (Edit & Delete) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 hover:bg-apple-gray-100 rounded-xl text-apple-gray-300 hover:text-apple-gray-800 transition-colors"
                        title="추억 수정"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 hover:bg-red-50 rounded-xl text-apple-gray-300 hover:text-red-500 transition-colors"
                        title="추억 삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Media Preview */}
                  {item.mediaUrl && (
                    <div className="rounded-2xl overflow-hidden border border-apple-gray-100 max-h-80 shadow-inner bg-apple-gray-50 flex items-center justify-center">
                      {item.type === "photo" && (
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                      {item.type === "video" && (
                        <div className="relative w-full aspect-video flex items-center justify-center bg-black group-media rounded-2xl overflow-hidden">
                          {item.mediaUrl &&
                          !item.mediaUrl.includes("unsplash.com") ? (
                            <video
                              src={item.mediaUrl}
                              controls
                              className="w-full h-full object-contain"
                              playsInline
                            />
                          ) : (
                            <>
                              <img
                                src={
                                  item.mediaUrl ||
                                  "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800"
                                }
                                alt="Video thumbnail"
                                className="absolute inset-0 w-full h-full object-cover opacity-60"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                  <Video className="w-5 h-5 text-apple-blue fill-apple-blue/10" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      {item.type === "audio" && (
                        <div className="w-full p-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-apple-green/10 text-apple-green flex items-center justify-center">
                            <Mic className="w-4.5 h-4.5" />
                          </div>
                          <audio
                            src={item.mediaUrl}
                            controls
                            className="flex-1 h-9 rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Narrative text */}
                  <p className="text-xs md:text-sm text-apple-gray-300 leading-relaxed font-medium whitespace-pre-line">
                    {item.description}
                  </p>

                  {/* AI Analysis Metadata (Pills and Summaries) */}
                  {item.aiAnalysis ? (
                    <div className="pt-4 border-t border-apple-gray-100 flex flex-col gap-2.5 bg-apple-blue/[0.01]">
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] bg-apple-blue/10 text-apple-blue px-2.5 py-0.5 rounded-full font-bold">
                          감정: {item.aiAnalysis.sentiment}
                        </span>
                        {item.aiAnalysis.tags?.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-apple-gray-50 border border-apple-gray-100 px-2 py-0.5 rounded-full text-apple-gray-300 font-bold"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-apple-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-apple-gray-300 font-semibold">
                        아직 깊이를 들여다보지 않은 고요한 기록입니다.
                      </span>
                      <button
                        onClick={() => handleAnalyze(item)}
                        disabled={analyzingId !== null}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-apple-blue/5 hover:bg-apple-blue/10 text-apple-blue rounded-xl text-[10px] font-bold transition-all duration-300 disabled:opacity-50"
                      >
                        {analyzingId === item.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            추억 해석 중...
                          </>
                        ) : (
                          <>
                            <Heart className="w-3 h-3" />
                            추억 정리하기
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State Screen
        <div className="bg-white rounded-3xl p-12 text-center border border-apple-gray-100/40 shadow-apple-card max-w-lg mx-auto space-y-4 animate-fade-in">
          <AlertCircle className="w-12 h-12 text-apple-gray-300 mx-auto stroke-[1.2]" />
          <div>
            <h3 className="text-lg font-bold text-apple-gray-800">
              해당 조건의 추억이 없습니다
            </h3>
            <p className="text-xs text-apple-gray-300 mt-1 max-w-xs mx-auto">
              필터 조건을 변경하거나, 우측 상단의 [추억 저장] 탭을 눌러 가족의
              첫 번째 따뜻한 이야기를 기록해 보세요.
            </p>
          </div>
        </div>
      )}

      {/* Edit Form Modal (Floating Overlay) */}
      {editingItem &&
        createPortal(
          <div className="fixed inset-0 bg-apple-gray-950/40 backdrop-blur-md flex items-center justify-center px-4 z-[9999] animate-fade-in">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] space-y-5 animate-float-up text-apple-gray-800">
              <div className="flex justify-between items-center pb-2 border-b border-apple-gray-50">
                <h3 className="text-lg font-bold text-apple-gray-800">
                  추억 기록 수정
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-1 hover:bg-apple-gray-50 rounded-xl text-apple-gray-300 hover:text-apple-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-bold text-apple-gray-300">
                    <Clock className="w-3.5 h-3.5" />
                    제목
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-bold text-apple-gray-300">
                    <Calendar className="w-3.5 h-3.5" />
                    추억 발생 날짜
                  </label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-bold text-apple-gray-300">
                    <DescIcon className="w-3.5 h-3.5" />
                    묘사 기록
                  </label>
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 rounded-2xl border border-apple-gray-100 bg-apple-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 focus:border-apple-blue transition-all text-xs leading-relaxed font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 py-3 border border-apple-gray-100 hover:bg-apple-gray-50 rounded-2xl text-xs font-semibold text-apple-gray-300 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-apple-blue hover:bg-apple-blue-light text-white rounded-2xl text-xs font-bold shadow-md shadow-apple-blue/15 transition-all flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4" />
                    변경 사항 저장
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};
export default Timeline;
