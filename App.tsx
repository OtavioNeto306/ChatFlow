import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings,
  LayoutDashboard,
  Languages,
  LogOut,
  Menu,
  X,
  MessageCircle,
  PlayCircle
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Components
import { ChatInterface } from './components/ChatInterface';
import { FeedbackPanel } from './components/FeedbackPanel';
import { SettingsModal } from './components/SettingsModal';
import { ProgressDashboard } from './components/ProgressDashboard';
import { CorrectionModal } from './components/CorrectionModal';

// Logic/Types
import { sendMessageToAI, getTopicSuggestions, sendCorrectionToAI } from './services/aiService';
import {
  AppState,
  Message,
  Provider,
  Language,
  ApiKeys,
  LearningGoal,
  TopicSuggestion
} from './types';
import { INITIAL_GOALS, LANGUAGE_FLAGS } from './constants';
import { supabase } from './services/supabaseClient';
import { LoginForm } from './components/Auth/LoginForm';
import { CreateAccount } from './components/Auth/CreateAccount';
import { AuthCallback } from './components/Auth/AuthCallback';
import { Routes, Route, Navigate } from 'react-router-dom';

const App: React.FC = () => {
  // --- State Management ---
  const [language, setLanguage] = useState<Language>(Language.SPANISH);
  const [nativeLanguage, setNativeLanguage] = useState<Language>(Language.PORTUGUESE);
  const [provider, setProvider] = useState<Provider>(Provider.GEMINI);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<TopicSuggestion[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // UI Toggles
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProgressOpen, setIsProgressOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [originalToCorrect, setOriginalToCorrect] = useState<string>('');

  // --- Initialization ---
  useEffect(() => {
    // Load from local storage
    const storedKeys = localStorage.getItem('lingua_apiKeys');
    if (storedKeys) setApiKeys(JSON.parse(storedKeys));

    const storedProvider = localStorage.getItem('lingua_provider');
    if (storedProvider) setProvider(storedProvider as Provider);

    const storedNative = localStorage.getItem('lingua_nativeLanguage');
    if (storedNative) setNativeLanguage(storedNative as Language);

    // Initialize Goals
    setGoals(INITIAL_GOALS.map(text => ({ id: uuidv4(), text, completed: false })));

    // Check if first time, show settings
    if (!storedKeys) setIsSettingsOpen(true);
  }, []);

  const [sessionAvailable, setSessionAvailable] = useState<boolean>(false);

  useEffect(() => {
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionAvailable(!!data.session);
    };
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionAvailable(!!session);
    });
    initSession();
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  // --- Helpers ---
  const saveApiKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('lingua_apiKeys', JSON.stringify(keys));
  };

  const saveProvider = (p: Provider) => {
    setProvider(p);
    localStorage.setItem('lingua_provider', p);
  };

  const handleNativeLanguageChange = (lang: Language) => {
    setNativeLanguage(lang);
    localStorage.setItem('lingua_nativeLanguage', lang);
  };

  // --- Progress Calculation ---
  const progress = useMemo(() => {
    const userMsgs = messages.filter(m => m.role === 'user');
    const userMsgsWithScore = userMsgs.filter(m => m.feedback?.proficiencyScore);
    const totalScore = userMsgsWithScore.reduce((acc, curr) => acc + (curr.feedback?.proficiencyScore || 0), 0);

    return {
      totalMessages: messages.length,
      averageProficiency: userMsgsWithScore.length ? totalScore / userMsgsWithScore.length : 0,
      vocabularyCount: Math.min(userMsgs.reduce((acc, m) => acc + m.content.split(' ').length, 0), 5000), // Simple mock word count accumulator
      sessionsCompleted: Math.floor(userMsgs.length / 10) + 1 // Mock session count
    };
  }, [messages]);

  // --- Topic Suggestions ---
  const fetchTopics = async () => {
    if (!apiKeys[provider.split(' ')[0].toLowerCase() as keyof ApiKeys]) return;

    try {
      const proficiency = progress.averageProficiency > 75 ? 'Advanced' : progress.averageProficiency > 40 ? 'Intermediate' : 'Beginner';
      const response = await getTopicSuggestions(
        language,
        nativeLanguage,
        proficiency,
        messages,
        provider,
        apiKeys
      );
      setSuggestedTopics(response.topics);
    } catch (error) {
      console.error("Failed to fetch topics", error);
    }
  };

  useEffect(() => {
    if (messages.length === 0 && Object.keys(apiKeys).length > 0) {
      fetchTopics();
    }
  }, [messages.length, language, nativeLanguage, provider, apiKeys]);

  // --- Handlers ---

  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const activeGoals = goals.filter(g => !g.completed).map(g => g.text);

      // Pass conversation history + new message
      const history = [...messages, newUserMsg];

      const aiResponse = await sendMessageToAI(
        history,
        language,
        nativeLanguage,
        activeGoals,
        provider,
        apiKeys
      );

      // Update the user message with the feedback received
      setMessages(prev => prev.map(m => {
        if (m.id === newUserMsg.id) {
          return { ...m, feedback: aiResponse.feedback };
        }
        return m;
      }));

      // Add AI Response
      const newAiMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: aiResponse.reply,
        translation: aiResponse.translation,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);

    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Failed to get response"}. Please check your API Key.`);
      // Remove the failed user message or mark as error (omitted for brevity)
    } finally {
      setIsTyping(false);
    }
  };

  const openCorrection = () => {
    const lastUser = messages.slice().reverse().find(m => m.role === 'user');
    if (!lastUser) return;
    setOriginalToCorrect(lastUser.content);
    setIsCorrectionOpen(true);
  };

  (window as any).triggerCorrection = openCorrection;

  const handleSubmitCorrection = async (corrected: string) => {
    setIsCorrectionOpen(false);
    setIsTyping(true);
    const lastIndex = (() => { for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].role === 'user') return i } return -1 })();
    if (lastIndex < 0) { setIsTyping(false); return; }
    const lastUser = messages[lastIndex];
    try {
      const correction = await sendCorrectionToAI(lastUser.content, corrected, language, nativeLanguage, provider, apiKeys);
      const mergedFeedback = { ...(lastUser.feedback || {}), ...(correction.feedback || {}), correctionReview: correction.feedback?.correctionReview };
      setMessages(prev => prev.map((m, i) => i === lastIndex ? { ...m, originalContent: m.content, content: corrected, editReason: 'user_correction', timestamp: Date.now(), feedback: mergedFeedback } : m));
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Falha na correção');
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to start a new conversation?")) {
      setMessages([]);
      setSuggestedTopics([]); // Clear topics to trigger refresh
    }
  };

  // --- Goal Handlers ---
  const addGoal = (text: string) => setGoals(prev => [...prev, { id: uuidv4(), text, completed: false }]);
  const toggleGoal = (id: string) => setGoals(prev => prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g));
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  // --- Render ---
  if (!sessionAvailable) {
    return (
      <Routes>
        <Route path="/login" element={<LoginForm locale={'pt-BR'} onAuthenticated={() => setSessionAvailable(true)} />} />
        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-slate-50">

      {/* Mobile Header */}
      <div className="md:hidden h-16 bg-white border-b flex items-center justify-between px-4 shrink-0">
        <div className="font-bold text-primary flex items-center gap-2">
          <img src="https://res.cloudinary.com/ddp0dj208/image/upload/v1763602068/noolaspeak_v8ayqx.webp" alt="NoolaSpeak" className="w-7 h-7 rounded" />
          NoolaSpeak
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation (Desktop) & Mobile Menu */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col justify-between
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-8 text-indigo-400">
            <img src="https://res.cloudinary.com/ddp0dj208/image/upload/v1763602068/noolaspeak_v8ayqx.webp" alt="NoolaSpeak" className="w-9 h-9 rounded" />
            NoolaSpeak
          </h1>

          <div className="space-y-6">

            {/* Native Language Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> I Speak (Native)
              </label>
              <div className="relative">
                <select
                  value={nativeLanguage}
                  onChange={(e) => handleNativeLanguageChange(e.target.value as Language)}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {Object.values(Language).map((lang) => (
                    <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang]} {lang}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Learning Language Selector */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Languages className="w-3 h-3" /> I'm Learning
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full appearance-none bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                >
                  {Object.values(Language).map((lang) => (
                    <option key={lang} value={lang}>{LANGUAGE_FLAGS[lang]} {lang}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-px bg-slate-800 my-2"></div>

            {/* Navigation Items */}
            <nav className="space-y-2">
              <button
                onClick={() => { setIsProgressOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>My Progress</span>
              </button>

              <button
                onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
              >
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>

              <a
                href="https://youtu.be/npYJtDtYMBg"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-left"
              >
                <PlayCircle className="w-5 h-5" />
                <span>Tutorial</span>
              </a>

              <button
                onClick={async () => { await supabase.auth.signOut(); setMessages([]); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-900/20 text-red-400 hover:text-red-300 transition-colors text-left mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            Powered by <span className="font-semibold text-slate-400">{provider.split(' ')[0]}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

        {/* Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 h-full p-2 md:p-4">
          <ChatInterface
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            currentLanguage={language}
            suggestedTopics={suggestedTopics}
            onTopicSelect={(topic) => handleSendMessage(topic)}
            onCorrectLastMessage={openCorrection}
          />
        </div>

        {/* Feedback Column (Hidden on small mobile) */}
        <div className="hidden lg:block w-80 xl:w-96 h-full p-4 pl-0 border-l-0">
          <FeedbackPanel
            lastFeedbackMessage={messages.slice().reverse().find(m => m.role === 'user' && m.feedback)}
            goals={goals}
            onAddGoal={addGoal}
            onToggleGoal={toggleGoal}
            onDeleteGoal={deleteGoal}
          />
        </div>

      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKeys={apiKeys}
        onSaveKeys={saveApiKeys}
        currentProvider={provider}
        onSetProvider={saveProvider}
      />

      <CorrectionModal
        open={isCorrectionOpen}
        originalText={originalToCorrect}
        onClose={() => setIsCorrectionOpen(false)}
        onSubmit={handleSubmitCorrection}
      />

      <ProgressDashboard
        isOpen={isProgressOpen}
        onClose={() => setIsProgressOpen(false)}
        progress={progress}
        messages={messages}
      />

    </div>
  );
};

export default App;
