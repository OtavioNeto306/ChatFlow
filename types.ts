export enum Provider {
  GEMINI = 'Gemini (Google)',
  GROQ = 'Groq (Llama/Mixtral)',
  OPENAI = 'OpenAI (GPT-4o/Mini)',
  DEEPSEEK = 'DeepSeek',
}

export enum Language {
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  ITALIAN = 'Italian',
  JAPANESE = 'Japanese',
  PORTUGUESE = 'Portuguese',
  CHINESE = 'Mandarin Chinese',
  ENGLISH = 'English',
}

export interface Feedback {
  corrections: string[];
  praise: string;
  suggestions: string[];
  proficiencyScore: number; // 0-100
  detectedErrors: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  timestamp: number;
  feedback?: Feedback;
}

export interface LearningGoal {
  id: string;
  text: string;
  completed: boolean;
}

export interface UserProgress {
  totalMessages: number;
  averageProficiency: number;
  vocabularyCount: number; // Mocked estimate
  sessionsCompleted: number;
}

export interface ApiKeys {
  gemini?: string;
  groq?: string;
  openai?: string;
  deepseek?: string;
}

export interface AppState {
  language: Language;
  nativeLanguage: Language;
  provider: Provider;
  apiKeys: ApiKeys;
  messages: Message[];
  goals: LearningGoal[];
  progress: UserProgress;
  isLoading: boolean;
  showSettings: boolean;
  showProgress: boolean;
}