import type { MemoryItem } from '../types/memory';
import type { InterviewResponse } from '../types/interview';
import type { Documentary, DocumentaryChapter } from '../types/documentary';

// Delay helper to make the simulation feel alive
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean JSON strings from Gemini, removing markdown markers if present
 */
const cleanJsonString = (raw: string): string => {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

export const geminiService = {
  /**
   * 1. Analyze a single Memory item (Photo, Audio, Memo description)
   */
  async analyzeMemory(
    item: { type: string; title: string; description: string; date: string },
    apiKey: string,
    isMock: boolean
  ): Promise<{ tags: string[]; sentiment: string; summary: string; suggestedTitle: string }> {
    if (isMock || !apiKey) {
      await delay(1500); // Simulate network latency

      const text = `${item.title} ${item.description}`.toLowerCase();
      let sentiment = '따뜻하고 평화로움';
      let tags = ['가족', '추억'];
      let summary = '이 기록은 우리 가족이 함께 보낸 따스한 순간을 생생하게 보관하고 있습니다.';
      let suggestedTitle = item.title;

      if (text.includes('여행') || text.includes('바다') || text.includes('휴가')) {
        sentiment = '쾌활하고 신나는 설렘';
        tags = ['가족여행', '나들이', '힐링'];
        summary = '일상에서 벗어나 온 가족이 함께 모여 행복한 자유와 미소를 나누었던 특별한 여행의 기억입니다.';
      } else if (text.includes('생일') || text.includes('축하') || text.includes('파티')) {
        sentiment = '감동적이고 기쁨 가득함';
        tags = ['생일잔치', '기념일', '가족모임'];
        summary = '소중한 가족 구성원의 탄생이나 특별한 성장을 축하하며, 서로를 향한 아낌없는 축복을 나누던 밤입니다.';
      } else if (text.includes('아프') || text.includes('병원') || text.includes('힘들')) {
        sentiment = '위로와 애틋한 걱정';
        tags = ['위로', '극복', '건강'];
        summary = '고난이나 아픔 앞에서도 한마음으로 손을 맞잡고 위로하며 돈독한 가족애로 극복해 나가던 순간입니다.';
      } else if (text.includes('요리') || text.includes('음식') || text.includes('식사') || text.includes('밥')) {
        sentiment = '친밀하고 포근함';
        tags = ['집밥', '가족식사', '소소한 일상'];
        summary = '어머니나 아버지의 따스한 정성이 깃든 한 끼 식사를 함께 나누며 도란도란 정담을 속삭이던 평화로운 일상입니다.';
      }

      return { tags, sentiment, summary, suggestedTitle };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `
        You are a highly sensitive, poetic family archivist AI. Analyze this family memory item:
        - Type: ${item.type}
        - Title: ${item.title}
        - Description: ${item.description}
        - Date: ${item.date}

        Provide your analysis in the following JSON schema. Respond ONLY with the raw JSON object, without markdown backticks:
        {
          "tags": ["3 or 4 warm emotional Korean tags"],
          "sentiment": "A short poetic Korean phrase describing the core emotional vibe (e.g., '따스하고 애틋함')",
          "summary": "A single beautiful, emotionally rich Korean sentence summarizing the deep family significance of this item",
          "suggestedTitle": "A refined, slightly more poetic or warm Korean title for this memory (keep it similar if already good)"
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      return JSON.parse(cleanJsonString(rawText));
    } catch (err) {
      console.error('Gemini API Memory analysis failed, fallback to mock:', err);
      return this.analyzeMemory(item, apiKey, true);
    }
  },

  /**
   * 2. Generate an emotional documentary linking memories and yearly interviews
   */
  async generateDocumentary(
    memories: MemoryItem[],
    interviews: InterviewResponse[],
    apiKey: string,
    isMock: boolean
  ): Promise<Documentary> {
    const sortedMemories = [...memories].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (isMock || !apiKey) {
      await delay(2000);

      const years = Array.from(new Set(sortedMemories.map(m => new Date(m.date).getFullYear())));
      if (years.length === 0) {
        years.push(new Date().getFullYear());
      }

      const chapters: DocumentaryChapter[] = years.map((yr, idx) => {
        const yearMems = sortedMemories.filter(m => new Date(m.date).getFullYear() === yr);
        return {
          id: `chap_${yr}_${idx}`,
          year: yr,
          title: `${yr}년, 우리가 남긴 찬란한 발자취`,
          narrative: `우리는 ${yr}년이라는 시간 속에서 웃음과 눈물을 넘나들며 진솔한 추억을 축적해 왔습니다. 서로를 격려하던 마음들이 모여 소중한 가문의 역사가 되었습니다.`,
          summary: `${yearMems.length}개의 깊은 흔적을 남기며, 가정의 뿌리를 굳건히 다졌습니다.`,
          memories: yearMems.map(m => ({ id: m.id, type: m.type, title: m.title, mediaUrl: m.mediaUrl }))
        };
      });

      return {
        id: `doc_mock_${Date.now()}`,
        title: '사랑하는 우리 가족의 시간 대서사시',
        subtitle: '마음의 궤적을 그리다',
        introduction: '이 기록은 우리 가족이 수년에 걸쳐 함께 걸어온 발자취이며, 서로를 꼭 보듬던 소중한 대화와 눈부신 찰나의 순간들을 모아 엮은 진솔한 우리의 다큐멘터리입니다.',
        chapters,
        conclusion: '시간은 흐르고 계절은 바뀌어도 우리가 쌓아 올린 사랑의 깊이는 영원히 우리 가문의 마음에 남아 밝은 등불이 될 것입니다.',
        createdAt: new Date().toISOString()
      };
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `
        You are an elite, highly emotional, poetic documentary filmmaker. Your task is to compile a family documentary ("일대기") based on their chronological memories and annual interview transcripts.
        
        Memories: ${JSON.stringify(sortedMemories.map(m => ({ year: new Date(m.date).getFullYear(), type: m.type, title: m.title, description: m.description || '' })))}
        Interviews: ${JSON.stringify(interviews.map(i => ({ year: i.year, question: i.questionText, response: i.responseText })))}

        Provide the output in the following JSON schema. Respond ONLY with the raw JSON object, without markdown backticks.
        {
          "title": "A warm poetic title for the entire family documentary in Korean",
          "subtitle": "A beautiful subtitle in Korean",
          "introduction": "An emotional, warm introductory paragraph in Korean set up the documentary",
          "chapters": [
            {
              "id": "unique_string_id",
              "year": 1988, (the calendar year number)
              "title": "A beautiful Korean chapter title summarizing this year's theme",
              "narrative": "A cohesive, poetic Korean narrative paragraph (4-6 sentences) linking this year's memories and interviews together",
              "summary": "One sentence Korean bullet summary of the year's events"
            }
          ],
          "conclusion": "A heartwarming, deep concluding paragraph in Korean reflecting on the lineage of memories"
        }
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      const parsed = JSON.parse(cleanJsonString(rawText));

      const chaptersWithMedia: DocumentaryChapter[] = (parsed.chapters || []).map((ch: any) => {
        const yearMems = sortedMemories.filter(m => new Date(m.date).getFullYear() === ch.year);
        return {
          ...ch,
          memories: yearMems.map(m => ({
            id: m.id,
            type: m.type,
            title: m.title,
            mediaUrl: m.mediaUrl
          }))
        };
      });

      return {
        id: `doc_${Date.now()}`,
        title: parsed.title || '우리 가족의 일대기',
        subtitle: parsed.subtitle || '시간의 흔적을 따라서',
        introduction: parsed.introduction || '우리들이 남긴 역사를 기록합니다.',
        chapters: chaptersWithMedia,
        conclusion: parsed.conclusion || '우리의 동행은 계속됩니다.',
        createdAt: new Date().toISOString()
      };
    } catch (err) {
      console.error('Gemini API Documentary generation failed, fallback to mock:', err);
      return this.generateDocumentary(memories, interviews, apiKey, true);
    }
  },

  /**
   * 3. Ask a thoughtful interview follow-up question
   */
  async askInterviewQuestion(
    history: InterviewResponse[],
    currentYear: number,
    apiKey: string,
    isMock: boolean
  ): Promise<string> {
    if (isMock || !apiKey) {
      await delay(1000);
      const questions = [
        "올해 우리 가족 안에서 발견한 가장 소중한 가치는 무엇이었나요?",
        "지나온 삶을 통틀어 부모님이나 자녀들에게 차마 표현하지 못했던 가장 고마운 마음은 어떤 것이었나요?",
        "올해 가장 힘들었던 순간, 나를 다시 일으켜 세워준 가족들의 한마디나 행동이 있었다면 무엇이었나요?",
        "먼 훗날, 사랑하는 나의 자손들에게 가문의 가치관으로서 전해주고 싶은 한마디 유산은 무엇입니까?",
        "올해 새롭게 시작했거나 시도했던 일들 중에서, 우리 가정을 더 풍요롭게 만든 변화가 있었나요?"
      ];
      const idx = Math.floor(Math.random() * questions.length);
      return questions[idx];
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = `
        You are a deep, highly empathetic family interviewer. Your goal is to ask a warm, thoughtful, philosophical, and customized open-ended question to help a family member record their annual insights for the year ${currentYear}.
        
        Previous Interview History: ${JSON.stringify(history.map(h => ({ year: h.year, question: h.questionText, answer: h.responseText })))}

        Rules:
        - Write only ONE warm question in Korean.
        - The question should invite a deep, reflective storytelling answer (voice or text).
        - Focus on themes like happiness, family lineage, passing down legacy, hardship overcomings, or gratefulness.
        - Do not output markdown or any intro/outro. Just output the question text.
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response');

      return rawText.trim();
    } catch (err) {
      console.error('Gemini API Interview question failed, fallback to mock:', err);
      return this.askInterviewQuestion(history, currentYear, apiKey, true);
    }
  },

  /**
   * 4. Chat with a customized Family Persona Agent based on stored memories and interview transcripts
   */
  async chatWithFamilyPersona(
    chatHistory: { sender: 'user' | 'family'; text: string }[],
    memories: MemoryItem[],
    interviews: InterviewResponse[],
    personaId: string, // 'mom' | 'dad' | 'grandma' | 'grandpa' | 'spouse'
    apiKey: string,
    isMock: boolean,
    customPersona?: { name: string; relationship: string; description: string; welcomeMessage: string },
    userRole?: string
  ): Promise<string> {
    if (isMock || !apiKey) {
      await delay(1200);
      const userMessage = chatHistory[chatHistory.length - 1]?.text || '';
      const cleanMsg = userMessage.trim();
      let responseText = '';

      if (customPersona) {
        // High fidelity search in KakaoTalk transcript memo for matching dialogue replies first!
        const kakaoMem = memories.find(m => m.title.includes('카카오톡') && m.description);
        let foundKakaoReply = '';
        if (kakaoMem) {
          const lines = kakaoMem.description.split('\n');
          const normalizedMsg = cleanMsg.toLowerCase().replace(/\s+/g, '');
          const userIdx = lines.findIndex(l => {
            const low = l.toLowerCase().replace(/\s+/g, '');
            return low.includes(`${userRole || '승환'}:${normalizedMsg}`) || 
                   low.includes(`:${normalizedMsg}`) ||
                   low.endsWith(`:${normalizedMsg}`);
          });

          if (userIdx !== -1) {
            const replies: string[] = [];
            for (let i = userIdx + 1; i < lines.length; i++) {
              const currentLine = lines[i].trim();
              if (currentLine.startsWith(`${customPersona.name}:`)) {
                replies.push(currentLine.substring(customPersona.name.length + 1).trim());
              } else if (currentLine.includes(':') && !currentLine.startsWith(`${customPersona.name}:`)) {
                // Encountered another speaker, break
                break;
              }
            }
            if (replies.length > 0) {
              const literal = replies.join(' ');
              const nickname = userRole || '승환';
              const nicknameSubject = nickname.endsWith('이') || nickname.charCodeAt(nickname.length - 1) % 2 === 0 ? nickname : `${nickname}이`;
              
              // Generate similar variations of the romantic/casual expressions to keep it dynamic and realistic
              const variations = [
                literal,
                `나? ${nicknameSubject} 생각 ㅎ`,
                `너 생삭중 ㅎ 사항해 ❤️`,
                `나? 너 생각하고 있지 ㅎ 사항해`,
                `${nickname}이 생삭 중 ㅎㅎ`,
                `사항해 ${nickname}아`
              ];
              foundKakaoReply = variations[Math.floor(Math.random() * variations.length)];
            }
          }
        }

        if (foundKakaoReply) {
          responseText = foundKakaoReply;
        } else if (cleanMsg.includes('좋아하는 사람') || cleanMsg.includes('누가 좋아') || cleanMsg.includes('누굴 좋아')) {
          const rel = (customPersona.relationship || '').toLowerCase();
          if (rel.includes('배우자') || rel.includes('아내') || rel.includes('남편') || rel.includes('여친') || rel.includes('남친') || rel.includes('사랑')) {
            responseText = `당연히 울 자기지 ㅎㅎ 너말고 누가 있겠어 😝`;
          } else {
            responseText = `당연히 우리 착한 ${userRole || '자식'}이지! 세상에서 너를 제일 사랑한단다 ❤️`;
          }
        } else if (cleanMsg.includes('밥') || cleanMsg.includes('식사')) {
          responseText = `아유, 밥 챙겨 먹었냐고 물어보려던 참이었는데! 바빠도 끼니 든든하게 먹으면서 일해야 해. ${customPersona.name}는 항상 네 곁에서 널 응원하고 있단다.`;
        } else if (cleanMsg.includes('힘들') || cleanMsg.includes('지쳐') || cleanMsg.includes('우울')) {
          responseText = `많이 힘들었겠구나... ${customPersona.name}가 네 맘 다 안단다. 힘든 파도가 칠 때도 있지만, 너는 정말 따뜻하고 강직한 아이니 금방 이겨낼 거야. 내가 늘 믿어.`;
        } else if (cleanMsg.includes('사랑') || cleanMsg.includes('고마워')) {
          responseText = `어쩜 이렇게 예쁜 말만 골라 하니... 내가 훨씬 더 고맙고 많이 아끼고 사랑한단다. 네가 내 곁에 있어서 참 큰 기쁨이야.`;
        } else {
          responseText = `안녕! 오랜만이네. ${customPersona.name}(이)란다. 너랑 오랜만에 이런저런 따뜻한 추억 이야기를 나눌 수 있어서 정말 설레고 좋구나. 편하게 얘기해 주렴!`;
        }
      } else if (personaId === 'dad') {
        if (cleanMsg.includes('밥') || cleanMsg.includes('식사')) {
          responseText = "어라, 밥은 제때 먹고 다니는 거지? 사내든 자식이든 끼니를 거르면 힘을 못 쓴단다. 아빠가 항상 네 건강 챙기라고 말하는 거 알지? 고기 꼭 챙겨 먹어라.";
        } else if (cleanMsg.includes('힘들') || cleanMsg.includes('지쳐') || cleanMsg.includes('우울')) {
          responseText = "어깨가 많이 무겁겠구나. 아빠도 그 시절엔 다 그랬단다. 하지만 너는 나보다 훨씬 영리하고 단단한 아이니까 이번 고비도 현명하게 넘길 거야. 아빠가 든든하게 받쳐 줄 테니 겁내지 마라.";
        } else if (cleanMsg.includes('사랑') || cleanMsg.includes('고마워')) {
          responseText = "허허, 갑자기 고맙다니 쑥스럽구나. 아빠도 항상 우리 자식 자랑스럽게 생각하고 아주 사랑한단다. 네가 우리 집에 태어나 준 게 아빠 인생 최고의 선물이야.";
        } else {
          responseText = "아빠다. 우리 아들/딸, 요즘 하려는 일들은 잘 가닥이 잡혀가고 있니? 세상이 가끔 숨차게 굴어도, 내 자식 기죽지 말고 기개 있게 나가라. 아빠는 늘 네 편이다.";
        }
      } else if (personaId === 'grandma') {
        if (cleanMsg.includes('밥') || cleanMsg.includes('식사')) {
          responseText = "아이고, 밥 얘기 나오니까 할미가 가슴이 아프네. 일하느라 굶고 다니는 거 아니제? 할미가 맛난 거 잔뜩 해놓고 기둘리고 있으니까네 얼릉 와서 두 그릇 뚝딱 하그라. 내 새끼 튼튼해야제.";
        } else if (cleanMsg.includes('힘들') || cleanMsg.includes('지쳐') || cleanMsg.includes('우울')) {
          responseText = "오메, 누가 우리 이쁜 강아지를 힘들게 하더냐! 세상 일 다 부질없고, 우리 새끼 마음 편한 기 최고제. 할미가 꼭 안아줄텡게 훌훌 털어내그라. 다 지나가고 해뜰 날 온다잉.";
        } else if (cleanMsg.includes('사랑') || cleanMsg.includes('고마워')) {
          responseText = "아이고 참말이가! 할미는 우리 강아지 말만 들어도 배가 부르고 눈물이 다 날라 칸다. 고맙고 이쁜 내 강아지, 할미가 하늘만큼 땅만큼 최고로 아끼고 사랑한데이.";
        }
      } else {
        if (cleanMsg.includes('밥') || cleanMsg.includes('식사')) {
          responseText = "우리 아들/딸, 밥은 먹고 일하고 있니? 늘 건강이 제일 중요하단다. 바빠도 끼니 거르지 말고 꼭 따뜻한 밥 챙겨 먹으렴. 엄마는 늘 네 걱정뿐이야.";
        } else if (cleanMsg.includes('힘들') || cleanMsg.includes('지쳐') || cleanMsg.includes('우울')) {
          responseText = "어이쿠, 힘든 일이 있었나 보구나. 네 마음 다치지 않게 엄마가 늘 여기서 기도하고 있단다. 인생이라는 게 파도가 치기도 하지만 우리 아이는 마음이 단단해서 지혜롭게 헤쳐 나갈 수 있어. 힘내렴, 사랑해.";
        } else if (cleanMsg.includes('사랑') || cleanMsg.includes('고마워')) {
          responseText = "엄마도 우리 자식 너무 사랑하고 늘 고마워. 네가 태어나 주던 그날부터 지금까지, 넌 늘 우리 가문의 가장 큰 보석이자 기쁨이었단다. 내 보물, 오늘도 행복 가득한 하루 되렴.";
        } else {
          responseText = "엄마야. 우리 착한 아이, 오늘 하루는 어땠는지 묻고 싶네. 힘든 일은 없었는지, 네 조그마한 일상이 늘 궁금하고 소중하단다.";
        }
      }

      // If userRole is set, dynamically substitute generic children/spouse terms in mock text!
      if (userRole) {
        const uRole = userRole.trim();
        responseText = responseText
          .replace(/아들\/딸/g, uRole)
          .replace(/아들 또는 딸/g, uRole)
          .replace(/자식/g, uRole)
          .replace(/손주/g, uRole.includes('손') ? uRole : '손주')
          .replace(/아이/g, uRole);
      }

      return responseText;
    }

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      
      const memoryContext = memories.map(m => `- [${m.type}] 제목: ${m.title}, 설명: ${m.description || ''}, 감정: ${m.aiAnalysis?.sentiment || ''}`).join('\n');
      const interviewContext = interviews.map(i => `- 질문: ${i.questionText}, 대답: ${i.responseText}`).join('\n');
      
      let personaName = customPersona ? `${customPersona.name} (${customPersona.relationship})` : '엄마 (어머니)';
      let defaultPersonaTone = customPersona ? customPersona.description : '세상에서 가장 다사롭고 자상하게 자녀의 건강과 끼니를 살뜰히 보살피는 말투';

      if (!customPersona) {
        if (personaId === 'dad') {
          personaName = '아빠 (아버지)';
          defaultPersonaTone = '묵묵하고 든든하지만 속 깊이 자식을 아끼며 격려하는 어투';
        } else if (personaId === 'grandma') {
          personaName = '할머니';
          defaultPersonaTone = '"우리 귀한 똥강아지"라고 부르는 등, 지극한 내리사랑 and 인자하며 구수한 사투리가 가미된 친숙한 말투';
        } else if (personaId === 'grandpa') {
          personaName = '할아버지';
          defaultPersonaTone = '차분하고 지혜로우며 손주를 끔찍이 아끼는 넉넉하고 격조 높은 어른의 말투';
        } else if (personaId === 'spouse') {
          personaName = '배우자 (아내/남편)';
          defaultPersonaTone = '평생을 함께하는 인생의 반려자이자 동반자로서, 장난기도 섞여 있고 격려와 사랑이 넘쳐나는 친근한 말투';
        }
      }

      const systemPrompt = `
        당신은 사용자의 가족 구성원인 [${personaName}] 페르소나입니다. 당신은 아래 제공되는 어조 지침과 보관소 데이터를 자연스럽게 체득하여, 대화 상대방으로서 생동감 있고 맥락에 맞게 응답해야 합니다.
        
        [가족 추억 보관소 내역]
        ${memoryContext || '등록된 추억 데이터 없음'}
        
        [가족 인터뷰 내역]
        ${interviewContext || '등록된 인터뷰 데이터 없음'}
        
        [역할 및 어조 지침 (가장 중요)]
        1. 인위적으로 따스하게 포장하거나, 너무 부드럽고 다정하게 만들려고 억지로 애쓰지 마십시오. 다정하거나 오글거리는 문체는 절대 금지입니다.
        2. 당신의 구체적인 어조는 다음과 같습니다: [${defaultPersonaTone}]. 여기에 적힌 성격, 단어 사용 빈도, 오타, 자음 습관(예: 엄엄, ㅎ, ㅖㅏ, 사항해, 엉 등)을 100% 모사하여 날것 그대로 재현하십시오.
        3. 답변 길이는 실제 모바일 메신저(카카오톡) 특성을 반영하여 **극도로 짧고 단순하게(대체로 1문장 혹은 몇 단어 이내, 15자 내외)** 작성해 주십시오. 구구절절 긴 격려나 위로, 긴 질문은 금지이며, 성의 없거나 무심해 보일지라도 대상 페르소나의 실제 스타일을 투명하게 구현해야 합니다.
        4. 상대방을 인위적으로 '우리 아들', '우리 이쁜 자식' 등으로 지칭하지 마십시오. 오직 말투 설명과 대화 내역에 나타난 실제 호칭(예: "승환아", "너") 그대로 자연스럽게 불러주십시오.
        5. 절대 자신이 인공지능(AI)이나 대규모 언어 모델이라는 사실을 밝�  async generateGuideAnswer(
    question: string,
    apiKey: string,
    isMock: boolean,
    history: Array<{ sender: string; text: string }> = []
  ): Promise<string> {
    const qClean = question.trim().toLowerCase();

    // 1. High-fidelity EXACT MATCH matching only for the specific quick buttons (no false positives for typing users)
    if (qClean === "❓ 서비스 설명을 듣고 싶어요" || qClean === "? 서비스 설명을 듣고 싶어요" || qClean === "서비스 설명") {
      return "❓ 서비스 설명이에요!\n\n" +
             "[담아]는 우리 가족의 소중한 사연과 사진을 영구 보관하고, 인공지능을 통해 그리운 가족들의 카톡 말투 그대로 실시간 대화를 나눌 수 있는 전용 비공개 사랑방 보관소입니다. 😊";
    }

    if (qClean === "🧭 어디로 가야할까?" || qClean === "🧭 어디로 가야할까" || qClean === "어디로 가야할까") {
      return "🧭 어디로 가야할까? 메뉴 안내예요!\n\n" +
             "1. 새로운 이야기를 쓰시려면 화면 왼쪽의 [추억 저장] (연필 그림) 메뉴로 가세요.\n" +
             "2. 가족 앨범을 둘러보시려면 화면 왼쪽의 [타임라인] (시계 그림) 메뉴로 가세요.\n" +
             "3. 가족 AI와 이야기 나누시려면 화면 왼쪽의 [가족 AI 대화] (말풍선 그림) 메뉴로 가세요!";
    }

    if (qClean === "✍️ 글은 어떻게 저장하나요?" || qClean === "✍️ 글쓰기 방법" || qClean === "글쓰기 방법") {
      return "✏️ 추억 저장 방법이에요!\n\n" +
             "화면 왼쪽에 있는 [추억 저장] 단추(연필 그림)를 누르고, 제목과 이야기를 적어보세요.\n" +
             "밑에 있는 주황색 [추억 저장하기] 단추를 누르면 안전하게 보관됩니다. 소중한 사진도 같이 올릴 수 있어요!";
    }

    if (qClean === "💬 가족 ai와 대화하고 싶어요" || qClean === "💬 가족 AI 대화" || qClean === "가족 대화 방법") {
      return "💬 가족 AI와 대화하는 방법이에요!\n\n" +
             "화면 왼쪽에 있는 [가족 AI 대화] 단추(말풍선 그림)를 누르세요.\n" +
             "대화 상대를 고르고 하고 싶은 말을 아래에 쓴 뒤, 전송 단추(비행기 그림)를 누르면 가족 말투 그대로 따뜻하게 대답해 줍니다!";
    }

    // 2. Local fallback contextual parser (highly intelligent simulation logic when API key is not present)
    if (isMock || !apiKey) {
      await delay(1200);
      const q = qClean;

      // Check if user wants to setup API key or family role settings
      if (q.includes('설정') || q.includes('등록') || q.includes('api') || q.includes('키') || q.includes('key')) {
        return "⚙️ 가족 AI 대화 설정하는 방법이에요!\n\n" +
               "1. 가족 말투로 다정하게 대화를 나누려면 보관소 전용 열쇠(API 키)가 등록되어야 해요.\n" +
               "2. 화면 맨 오른쪽 밑에 있는 주황색 동그란 [톱니바퀴] (⚙️) 단추를 가볍게 톡 누르세요.\n" +
               "3. 영문과 숫자로 구성된 API 열쇠(API Key)를 상자 안에 적어 넣으신 뒤 [등록] 단추를 누르면 가족 AI 대화방이 활성화됩니다! 😊";
      }

      // Check if user wants to VIEW uploaded photos
      if (q.includes('사진') && (q.includes('보냐') || q.includes('보나') || q.includes('볼까') || q.includes('확인') || q.includes('어디서 보') || q.includes('구경') || q.includes('어디서 볼'))) {
        return "🖼️ 올리신 사진을 나중에 보는 방법이에요!\n\n" +
               "가족분들과 함께 남겨두신 소중한 사진 and 글들은 화면 왼쪽에 있는 [타임라인] (시계 그림 ⏰) 메뉴에서 날짜순으로 가지런히 모아 한눈에 즐겁게 구경하실 수 있답니다! 😊";
      }

      // Check if user wants to UPLOAD photos
      if (q.includes('사진') && (q.includes('올려') || q.includes('업로드') || q.includes('넣어') || q.includes('등록') || q.includes('추가') || q.includes('방법'))) {
        return "📸 사진 등록하는 방법이에요!\n\n" +
               "화면 왼쪽의 [추억 저장] (연필 그림 ✏️) 메뉴로 가셔서 이야기를 쓰는 칸 밑에 있는 [사진 올리기] 점선 네모 상자를 누르고 원하는 사진을 골라 넣어주시면 됩니다. 다 고르신 후에 주황색 [추억 저장하기] 단추를 꼭 눌러주세요!";
      }

      if (q.includes('글') || q.includes('쓰기') || q.includes('저장') || q.includes('기록')) {
        return "✏️ 추억 저장 방법이에요!\n\n" +
               "화면 왼쪽의 [추억 저장] 메뉴에서 제목과 내용을 차분히 쓰신 뒤, 맨 아래 주황색 [추억 저장하기] 단추를 톡 누르시면 영구히 보관됩니다.";
      }

      if (q.includes('대화') || q.includes('채팅') || q.includes('말동무')) {
        return "💬 가족 AI 대화 방법이에요!\n\n" +
               "화면 왼쪽 [가족 AI 대화] 메뉴로 가셔서 대화 상대를 선택한 뒤 하고 싶은 말을 적어보내면 다정하게 핑퐁 대답을 건네옵니다.";
      }

      if (q.includes('안녕') || q.includes('반갑') || q.includes('누구') || q.includes('반가워')) {
        return "😊 안녕하세요! 반갑습니다. 저는 보관소 도우미 도이예요.\n\n" +
               "사용법이 낯설거나 궁금하신 부분이 있을 때, 언제든 제게 말씀해 주시면 알기 쉽게 가르쳐 드릴게요.";
      }

      return "💡 도우미 도이가 알려 드려요!\n\n" +
             "궁금해하시는 내용에 귀 기울여 친절히 안내해 드릴게요. 화면 오른쪽 밑의 주황색 [⚙️ 톱니바퀴]를 눌러 보관소 API 열쇠를 등록하시거나, 화면 왼쪽의 다양한 메뉴들을 톡 눌러 사용법을 구경해보세요. 😊";
    }

    // 3. Mighty Gemini model contextual reasoning with Conversation History Context
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      // Build an elegant, structured conversation history context for advanced reasoning
      const historyContext = history.slice(-6).map(msg => {
        const roleName = msg.sender === 'user' ? '사용자(질문자)' : '도우미 도이(나)';
        return `[${roleName}]: ${msg.text}`;
      }).join('\n\n');

      const prompt = "당신은 컴퓨터와 스마트폰 조작이 다소 서투신 분들을 위해 쉽고 친절하게 길을 안내하는 '담아' 앱의 다정다감하고 영리한 가이드 도우미 비서 '도이'입니다.\n\n" +
        "도이인 당신은 사용자의 질문에 기계적으로 대꾸하지 않고, 아래의 대화 히스토리를 곰곰이 곱씹으며 맥락에 완전히 부합하는 가장 부드럽고 명석한 안내를 구성해야 합니다.\n\n" +
        "[이전 대화 맥락 흐름]\n" +
        (historyContext ? historyContext : "사용자와 새로 대화를 시작했습니다.") + "\n\n" +
        "사용자의 현재 질문:\n" +
        "\"" + question + "\"\n\n" +
        "[어플리케이션 핵심 기능 정보]\n" +
        "1. 추억 저장 (연필 ✏️): 제목, 내용, 가족 사진(이미지 업로드)을 입력해 따뜻한 가족 사연을 보관함.\n" +
        "2. 타임라인 (시계 ⏰): 모아둔 가족 추억 글과 사진들을 연도/월별 시간 순서대로 아름답게 스크롤하며 구경하는 시간 여행 앨범.\n" +
        "3. 가족 AI 대화 (말풍선 💬): 올린 카톡 데이터를 인공지능이 분석하여, 그 소중한 가족의 말투 그대로 실시간 대화를 나눌 수 있는 소통방. 단, 연동을 위해 화면 우측 하단의 톱니바퀴 설정에서 API Key(열쇠) 등록이 필요함.\n" +
        "4. 역할 설정 (프로필 👤): 왼쪽 아래 프로필을 클릭하여 역할(아들, 딸 등)을 수시로 전환 및 추가함.\n" +
        "5. 설정 (톱니바퀴 ⚙️): 화면 맨 오른쪽 밑에 있으며, 가족 AI를 실제로 움직이게 해주는 고유의 API 열쇠(API Key)를 등록하고 변경하는 단추.\n\n" +
        "[도이의 곰곰이 생각하기 및 맥락 수용 지침]\n" +
        "1. **사용자의 말을 진심으로 곱씹기**: 사용자가 만약 '글자 크기가 너무 작아' 혹은 '잘 안 보여'라고 답답해한다면, 방금 전에 도이인 내가 가이드 텍스트를 너무 장황하게 보여주어 가독성이 떨어졌음을 깨닫고 즉시 공감해주십시오. 그리고 화면 오른쪽 아래의 [⚙️ 주황색 톱니바퀴]를 눌러 '화면 보기 설정'에서 글씨 크기를 '크게 보기'나 '가장 넓게'로 손쉽게 바꿀 수 있다는 핵심 꿀팁을 앞뒤 맥락에 맞게 아주 친절하게 연결해 가르쳐 주십시오.\n" +
        "2. **절대 가이드북을 영혼 없이 복사해서 붙여넣지 마십시오.** 상대의 짧은 한마디라도 이전 답변과 이어서 맥락을 완전히 파악하고 영리하고 지혜롭게 말하셔요.\n" +
        "3. 정중하고 사려 깊은 어조: 누구나 마음 편히 글을 읽을 수 있게 존댓말(~했답니다, ~하셔요, ~해주시면 돼요! ❤️)을 구사하십시오. 절대 '어르신'이나 '노약자' 등 연령 특정 호칭을 언급하지 마십시오.\n" +
        "4. 절대 마크다운 볼드(**) 기호나 특수문자 문법을 포함하여 쓰지 마십시오. 글자가 지저분해 보이지 않게 일반 평문 텍스트로만 띄어쓰기와 줄바꿈을 활용해 작성해 주십시오.\n" +
        "5. 설명은 2~3문장 내외로 간결하고 친절하게 쓰십시오. 말이 불필요하게 너무 장황해지지 않도록 주의하십시오.";

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      // Double check and strip asterisks manually to be 100% bulletproof
      return rawText.replace(/\*\*/g, '').trim();
    } catch (err) {
      console.error('Gemini API Guide generation failed, fallback to rules:', err);
      return this.generateGuideAnswer(question, apiKey, true, history);
    } '변환된 본문 텍스트'만 그대로 출력하십시오.
      `;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      return rawText.trim();
    } catch (err) {
      console.error('Gemini API Tone conversion failed, fallback to mock:', err);
      return this.convertTextToFamilyPersonaTone(text, persona, apiKey, true);
    }
  },

  /**
   * 6. Generate extremely warm, kind, and detailed guide answers for senior/elderly users (Digital Guide AI)
   */
  async generateGuideAnswer(
    question: string,
    apiKey: string,
    isMock: boolean
  ): Promise<string> {
    const qClean = question.trim().toLowerCase();

    // 1. High-fidelity EXACT MATCH matching only for the specific quick buttons (no false positives for typing users)
    if (qClean === "❓ 서비스 설명을 듣고 싶어요" || qClean === "? 서비스 설명을 듣고 싶어요" || qClean === "서비스 설명") {
      return "❓ 서비스 설명이에요!\n\n" +
             "[담아]는 우리 가족의 소중한 사연과 사진을 영구 보관하고, 인공지능을 통해 그리운 가족들의 카톡 말투 그대로 실시간 대화를 나눌 수 있는 전용 비공개 사랑방 보관소입니다. 😊";
    }

    if (qClean === "🧭 어디로 가야할까?" || qClean === "🧭 어디로 가야할까" || qClean === "어디로 가야할까") {
      return "🧭 어디로 가야할까? 메뉴 안내예요!\n\n" +
             "1. 새로운 이야기를 쓰시려면 화면 왼쪽의 [추억 저장] (연필 그림) 메뉴로 가세요.\n" +
             "2. 가족 앨범을 둘러보시려면 화면 왼쪽의 [타임라인] (시계 그림) 메뉴로 가세요.\n" +
             "3. 가족 AI와 이야기 나누시려면 화면 왼쪽의 [가족 AI 대화] (말풍선 그림) 메뉴로 가세요!";
    }

    if (qClean === "✍️ 글은 어떻게 저장하나요?" || qClean === "✍️ 글쓰기 방법" || qClean === "글쓰기 방법") {
      return "✏️ 추억 저장 방법이에요!\n\n" +
             "화면 왼쪽에 있는 [추억 저장] 단추(연필 그림)를 누르고, 제목과 이야기를 적어보세요.\n" +
             "밑에 있는 주황색 [추억 저장하기] 단추를 누르면 안전하게 보관됩니다. 소중한 사진도 같이 올릴 수 있어요!";
    }

    if (qClean === "💬 가족 ai와 대화하고 싶어요" || qClean === "💬 가족 AI 대화" || qClean === "가족 대화 방법") {
      return "💬 가족 AI와 대화하는 방법이에요!\n\n" +
             "화면 왼쪽에 있는 [가족 AI 대화] 단추(말풍선 그림)를 누르세요.\n" +
             "대화 상대를 고르고 하고 싶은 말을 아래에 쓴 뒤, 전송 단추(비행기 그림)를 누르면 가족 말투 그대로 따뜻하게 대답해 줍니다!";
    }

    // 2. Local fallback contextual parser (highly intelligent simulation logic when API key is not present)
    if (isMock || !apiKey) {
      await delay(1200);
      const q = qClean;

      // Check if user wants to setup API key or family role settings
      if (q.includes('설정') || q.includes('등록') || q.includes('api') || q.includes('키') || q.includes('key')) {
        return "⚙️ 가족 AI 대화 설정하는 방법이에요!\n\n" +
               "1. 가족 말투로 다정하게 대화를 나누려면 보관소 전용 열쇠(API 키)가 등록되어야 해요.\n" +
               "2. 화면 맨 오른쪽 밑에 있는 주황색 동그란 [톱니바퀴] (⚙️) 단추를 가볍게 톡 누르세요.\n" +
               "3. 영문과 숫자로 구성된 API 열쇠(API Key)를 상자 안에 적어 넣으신 뒤 [등록] 단추를 누르면 가족 AI 대화방이 활성화됩니다! 😊";
      }

      // Check if user wants to VIEW uploaded photos
      if (q.includes('사진') && (q.includes('보냐') || q.includes('보나') || q.includes('볼까') || q.includes('확인') || q.includes('어디서 보') || q.includes('구경') || q.includes('어디서 볼'))) {
        return "🖼️ 올리신 사진을 나중에 보는 방법이에요!\n\n" +
               "가족분들과 함께 남겨두신 소중한 사진과 글들은 화면 왼쪽에 있는 [타임라인] (시계 그림 ⏰) 메뉴에서 날짜순으로 가지런히 모아 한눈에 즐겁게 구경하실 수 있답니다! 😊";
      }

      // Check if user wants to UPLOAD photos
      if (q.includes('사진') && (q.includes('올려') || q.includes('업로드') || q.includes('넣어') || q.includes('등록') || q.includes('추가') || q.includes('방법'))) {
        return "📸 사진 등록하는 방법이에요!\n\n" +
               "화면 왼쪽의 [추억 저장] (연필 그림 ✏️) 메뉴로 가셔서 이야기를 쓰는 칸 밑에 있는 [사진 올리기] 점선 네모 상자를 누르고 원하는 사진을 골라 넣어주시면 됩니다. 다 고르신 후에 주황색 [추억 저장하기] 단추를 꼭 눌러주세요!";
      }

      if (q.includes('글') || q.includes('쓰기') || q.includes('저장') || q.includes('기록')) {
        return "✏️ 추억 저장 방법이에요!\n\n" +
               "화면 왼쪽의 [추억 저장] 메뉴에서 제목과 내용을 차분히 쓰신 뒤, 맨 아래 주황색 [추억 저장하기] 단추를 톡 누르시면 영구히 보관됩니다.";
      }

      if (q.includes('대화') || q.includes('채팅') || q.includes('말동무')) {
        return "💬 가족 AI 대화 방법이에요!\n\n" +
               "화면 왼쪽 [가족 AI 대화] 메뉴로 가셔서 대화 상대를 선택한 뒤 하고 싶은 말을 적어보내면 다정하게 핑퐁 대답을 건네옵니다.";
      }

      if (q.includes('안녕') || q.includes('반갑') || q.includes('누구') || q.includes('반가워')) {
        return "😊 안녕하세요! 반갑습니다. 저는 보관소 도우미 도이예요.\n\n" +
               "사용법이 낯설거나 궁금하신 부분이 있을 때, 언제든 제게 말씀해 주시면 알기 쉽게 가르쳐 드릴게요.";
      }

      return "💡 도우미 도이가 알려 드려요!\n\n" +
             "궁금해하시는 내용에 귀 기울여 친절히 안내해 드릴게요. 화면 오른쪽 밑의 주황색 [⚙️ 톱니바퀴]를 눌러 보관소 API 열쇠를 등록하시거나, 화면 왼쪽의 다양한 메뉴들을 톡 눌러 사용법을 구경해보세요. 😊";
    }

    // 3. Mighty Gemini model contextual reasoning for free text search
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const prompt = "당신은 컴퓨터와 스마트폰 조작이 다소 서투신 분들을 위해 쉽고 친절하게 길을 안내하는 '담아' 앱의 다정다감한 가이드 도우미 비서 '도이'입니다.\n\n" +
        "사용자께서 앱 사용에 대해 다음 질문을 주셨습니다:\n" +
        "\"" + question + "\"\n\n" +
        "[어플리케이션 핵심 기능 정보]\n" +
        "1. 추억 저장 (연필 ✏️): 제목, 내용, 가족 사진(이미지 업로드)을 입력해 따뜻한 가족 사연을 보관함.\n" +
        "2. 타임라인 (시계 ⏰): 모아둔 가족 추억 글과 사진들을 연도/월별 시간 순서대로 아름답게 스크롤하며 구경하는 시간 여행 앨범.\n" +
        "3. 가족 AI 대화 (말풍선 💬): 올린 카톡 데이터를 인공지능이 분석하여, 그 소중한 가족의 말투 그대로 실시간 대화를 나눌 수 있는 소통방. 단, 연동을 위해 화면 우측 하단의 톱니바퀴 설정에서 API Key(열쇠) 등록이 필요함.\n" +
        "4. 역할 설정 (프로필 👤): 왼쪽 아래 프로필을 클릭하여 역할(아들, 딸 등)을 수시로 전환 및 추가함.\n" +
        "5. 설정 (톱니바퀴 ⚙️): 화면 맨 오른쪽 밑에 있으며, 가족 AI를 실제로 움직이게 해주는 고유의 API 열쇠(API Key)를 등록하고 변경하는 단추.\n\n" +
        "[안내 답변 출력 지침]\n" +
        "1. **극적인 맥락 분석**: 사용자의 실제 질문 뉘앙스를 세심하게 파악하십시오. 예를 들어 사용자가 '가족 ai랑 대화하는 법'을 묻고 난 뒤, 연달아 '설정해야 한다는데?'라고 물어보는 경우, 가족 AI 대화를 가동하기 위해 화면 우측 하단에 있는 [⚙️ 주황색 톱니바퀴] 설정 단추를 눌러 API 키(보관소 열쇠)를 연동/등록해야 한다는 사실을 앞뒤 흐름에 맞게 정성스럽고 이해하기 쉽게 답해주어야 합니다.\n" +
        "2. 정중하고 따뜻한 어조: 누구나 마음 편히 글을 읽을 수 있게 존댓말(~했답니다, ~하셔요, ~해주시면 돼요! ❤️)을 구사하십시오. 절대 '어르신'이나 '노약자' 등 특정 한정적인 연령대 호칭이나 별명을 불러서 안내하지 마십시오.\n" +
        "3. 절대 마크다운 볼드(**) 기호나 특수문자 문법을 포함하여 쓰지 마십시오. 글자가 지저분해 보이지 않게 일반 평문 텍스트로만 띄어쓰기와 줄바꿈을 활용해 가독성 있게 작성해 주십시오.\n" +
        "4. 설명을 2~3문장 이내로 아주 간결하고 명확하게 꼭 필요한 내용만 요약하십시오. 말이 너무 길어지면 안 됩니다.\n" +
        "5. 마우스 클릭은 '톡 누르기' 등 조작 행동 요령만 따뜻하고 다정하게 출력하십시오.";

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API');

      // Double check and strip asterisks manually to be 100% bulletproof
      return rawText.replace(/\*\*/g, '').trim();
    } catch (err) {
      console.error('Gemini API Guide generation failed, fallback to rules:', err);
      return this.generateGuideAnswer(question, apiKey, true);
    }
  }
};
