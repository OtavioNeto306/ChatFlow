import React, { useEffect, useRef } from 'react';
import { Send, Mic, RefreshCw } from 'lucide-react';
import { Message, TopicSuggestion, Feedback } from '../types';
import { AudioButton } from './AudioButton';
import { LANGUAGE_VOICE_CODES } from '../constants';
import { AnalysisMiniCard } from './AnalysisMiniCard';
import { AnalysisModal } from './AnalysisModal';

interface ChatInterfaceProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (text: string) => void;
  currentLanguage: string;
  suggestedTopics?: TopicSuggestion[];
  onTopicSelect?: (topic: string) => void;
  onCorrectLastMessage?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isTyping,
  onSendMessage,
  currentLanguage,
  suggestedTopics = [],
  onTopicSelect,
  onCorrectLastMessage
}) => {
  const [input, setInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const voiceCode = LANGUAGE_VOICE_CODES[(currentLanguage as any)] || 'en-US';
  const [analysisOpen, setAnalysisOpen] = React.useState(false);
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | undefined>(undefined);
  const lastUserIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) { if (messages[i].role === 'user') return i }
    return -1
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* Header for Chat Area */}
      <div className="p-4 border-b bg-white/80 backdrop-blur z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-sm font-medium text-slate-600">Tutor Active</span>
        </div>
        <div className="text-xs text-slate-400">
          {currentLanguage} Conversation
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50 relative">
        {messages.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8 opacity-50">
            <div>
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Start Practicing!</h3>
              <p className="text-slate-500 mt-2 max-w-xs mx-auto">
                Say "Hello" in {currentLanguage} to begin your session. The AI will analyze your grammar and syntax.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`w-full flex flex-col gap-2 md:gap-3 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] md:max-w-[70%] p-4 rounded-2xl shadow-sm relative group ${msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                }`}
            >
              <p className="leading-relaxed text-[15px]">{msg.content}</p>

              {msg.translation && (
                <p className={`text-xs mt-2 pt-2 border-t ${msg.role === 'user' ? 'border-indigo-400/30 text-indigo-100' : 'border-slate-100 text-slate-400'
                  }`}>
                  {msg.translation}
                </p>
              )}

              {msg.role === 'assistant' && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all">
                  <AudioButton text={msg.content} lang={voiceCode} />
                </div>
              )}
            </div>
            {msg.role === 'assistant' && (() => {
              const prev = [...messages].slice(0, idx).reverse().find(m => m.role === 'user' && m.feedback);
              if (!prev || !prev.feedback) return null;
              return (
                <AnalysisMiniCard
                  feedback={prev.feedback}
                  onOpen={() => { setSelectedFeedback(prev.feedback); setAnalysisOpen(true); }}
                />
              );
            })()}
            {msg.role === 'user' && idx === lastUserIndex && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCorrectLastMessage?.()}
                  className="px-3 py-1.5 bg-primary text-white rounded-full text-xs"
                >
                  Corrigir
                </button>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
              <div className="w-2 h-2 bg-slate-400 rounded-full typing-dot"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Topics */}
      {suggestedTopics.length > 0 && !isTyping && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2 no-scrollbar">
          {suggestedTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => onTopicSelect?.(topic.label)}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-sm rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors whitespace-nowrap shadow-sm group relative"
              title={topic.description}
            >
              {topic.label}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Type in ${currentLanguage}...`}
            className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-3.5 bg-primary text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
      <AnalysisModal open={analysisOpen} feedback={selectedFeedback} onClose={() => setAnalysisOpen(false)} />
    </div>
  );
};
