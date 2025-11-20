import React from 'react';
import { Award, ChevronRight } from 'lucide-react';
import { Feedback } from '../types';

interface AnalysisMiniCardProps {
  feedback: Feedback;
  onOpen: () => void;
}

export const AnalysisMiniCard: React.FC<AnalysisMiniCardProps> = ({ feedback, onOpen }) => {
  const correction = feedback.corrections && feedback.corrections.length > 0 ? feedback.corrections[0] : undefined;
  const tip = feedback.suggestions && feedback.suggestions.length > 0 ? feedback.suggestions[0] : undefined;
  const praise = feedback.praise || '';
  const correctionText = correction ? `Correção: ${correction}` : 'Nenhuma correção necessária.';
  const tipText = tip ? `💡 ${tip}` : '';

  return (
    <div className="md:hidden mt-2 w-[90%] max-w-[90%] mx-auto bg-white border border-slate-200 rounded-xl shadow-sm p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-700">
          <Award className="w-4 h-4 text-[#6A5AE0]" />
          <span className="text-xs font-semibold">Instant Analysis</span>
        </div>
        <span className={`text-sm font-bold ${feedback.proficiencyScore > 80 ? 'text-green-600' : feedback.proficiencyScore > 60 ? 'text-yellow-600' : 'text-red-600'}`}>{feedback.proficiencyScore}%</span>
      </div>
      <div className="space-y-1">
        {praise && <div className="text-xs text-slate-700 truncate">{praise}</div>}
        <div className="text-xs text-slate-700 truncate">{correctionText}</div>
        {tipText && <div className="text-xs text-slate-700 truncate">{tipText}</div>}
      </div>
      <button onClick={onOpen} className="w-full flex items-center justify-center gap-1 text-[#FFFFFF] bg-[#6A5AE0] hover:brightness-110 rounded-lg px-3 py-2 text-xs">
        View full analysis <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};
