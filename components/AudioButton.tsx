import React from 'react';
import { Volume2 } from 'lucide-react';
import { speakText } from '../utils/speech';

interface AudioButtonProps {
  text: string;
  lang: string;
  className?: string;
}

export const AudioButton: React.FC<AudioButtonProps> = ({ text, lang, className }) => {
  const [playing, setPlaying] = React.useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleClick = () => {
    if (!supported) return;
    if (playing) {
      window.speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utter = speakText(text, lang);
    if (!utter) return;
    utter.onstart = () => setPlaying(true);
    utter.onend = () => setPlaying(false);
    utter.onerror = () => setPlaying(false);
  };

  if (!supported) {
    return (
      <button
        className={`p-1.5 bg-white rounded-full shadow-sm text-slate-300 cursor-not-allowed ${className || ''}`}
        aria-disabled
        title="Text-to-speech não suportado"
      >
        <Volume2 className="w-4 h-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 bg-white rounded-full shadow-sm transition-all ${playing ? 'text-primary animate-pulse' : 'text-slate-400 hover:text-primary'} ${className || ''}`}
      title={playing ? 'Parar áudio' : 'Ouvir mensagem'}
      aria-pressed={playing}
    >
      <Volume2 className="w-4 h-4" />
    </button>
  );
};

