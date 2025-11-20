import React from 'react';
import { X, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { Feedback } from '../types';

interface AnalysisModalProps {
  open: boolean;
  feedback?: Feedback;
  onClose: () => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ open, feedback, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Award className="w-5 h-5 text-[#6A5AE0]" />
            Instant Analysis
          </div>
          <button onClick={onClose} className="text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 space-y-4">
          {feedback && (
            <>
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-sm">Message Proficiency</span>
                <span className={`text-2xl font-bold ${feedback.proficiencyScore > 80 ? 'text-green-400' : feedback.proficiencyScore > 60 ? 'text-yellow-400' : 'text-red-400'}`}>{feedback.proficiencyScore}%</span>
              </div>
              {feedback.praise && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1 flex items-center gap-1"><CheckCircle className="w-3 h-3" />Great Job</div>
                  <p className="text-sm text-green-800">{feedback.praise}</p>
                </div>
              )}
              {feedback.corrections && feedback.corrections.length > 0 && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Corrections</div>
                  <ul className="space-y-2">
                    {feedback.corrections.map((c, i) => (
                      <li key={i} className="text-sm text-red-700">{c}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <div className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Native Tips</div>
                  <ul className="space-y-2">
                    {feedback.suggestions.map((s, i) => (
                      <li key={i} className="text-sm text-indigo-800 italic">{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.detectedErrors && feedback.detectedErrors.length > 0 && (
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Detected Errors</div>
                  <ul className="space-y-2">
                    {feedback.detectedErrors.map((e, i) => (
                      <li key={i} className="text-sm text-slate-700">{e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

