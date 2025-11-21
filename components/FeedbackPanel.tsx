import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Award, Target, Plus, Trash2, ChevronRight } from 'lucide-react';
import { Message, LearningGoal } from '../types';

interface FeedbackPanelProps {
  lastFeedbackMessage?: Message;
  goals: LearningGoal[];
  onAddGoal: (text: string) => void;
  onToggleGoal: (id: string) => void;
  onDeleteGoal: (id: string) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  lastFeedbackMessage,
  goals,
  onAddGoal,
  onToggleGoal,
  onDeleteGoal
}) => {
  const [newGoalText, setNewGoalText] = useState('');

  const feedback = lastFeedbackMessage?.feedback;

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalText.trim()) {
      onAddGoal(newGoalText.trim());
      setNewGoalText('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Section 1: Real-time Analysis */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Instant Analysis
          </h3>
        </div>

        <div className="p-5 overflow-y-auto space-y-6">
          {feedback ? (
            <>
              {/* Score */}
              <div className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-xl shadow-lg shadow-slate-200">
                <span className="text-sm font-medium text-slate-300">Message Proficiency</span>
                <span className={`text-2xl font-bold ${
                  feedback.proficiencyScore > 80 ? 'text-green-400' : 
                  feedback.proficiencyScore > 60 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {feedback.proficiencyScore || 'N/A'}%
                </span>
              </div>

              {feedback.correctionReview && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2">Correção da última resposta</h4>
                  <div className="text-sm text-indigo-900">
                    <div><span className="font-semibold">Original:</span> {feedback.correctionReview.original}</div>
                    <div><span className="font-semibold">Corrigida:</span> {feedback.correctionReview.corrected}</div>
                    <div className="mt-1"><span className="font-semibold">Explicação:</span> {feedback.correctionReview.explanation}</div>
                    <div className="mt-1"><span className="font-semibold">Frase correta:</span> {feedback.correctionReview.finalCorrectSentence}</div>
                  </div>
                </div>
              )}

              {/* Praise */}
              {feedback.praise && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
                   <h4 className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Great Job
                   </h4>
                   <p className="text-sm text-green-800">{feedback.praise}</p>
                </div>
              )}

              {/* Corrections */}
              {feedback.corrections && feedback.corrections.length > 0 && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                   <h4 className="text-xs font-bold text-red-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Corrections
                   </h4>
                   <ul className="space-y-2">
                      {feedback.corrections.map((c, i) => (
                        <li key={i} className="text-sm text-red-700 flex gap-2 items-start">
                          <span className="mt-1.5 w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0"></span>
                          {c}
                        </li>
                      ))}
                   </ul>
                </div>
              )}

              {/* Suggestions */}
              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                   <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-2">
                    Native Tips
                   </h4>
                   <ul className="space-y-2">
                      {feedback.suggestions.map((s, i) => (
                        <li key={i} className="text-sm text-blue-700 italic">"{s}"</li>
                      ))}
                   </ul>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p>Send a message to receive live grammar feedback.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Goals */}
      <div className="border-t bg-slate-50 h-[40%] flex flex-col min-h-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Learning Goals
          </h3>
          <span className="text-xs bg-white border px-2 py-1 rounded-full text-slate-500">
            {goals.filter(g => g.completed).length}/{goals.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-1">
            {goals.map(goal => (
              <li key={goal.id} className="group flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors">
                <button 
                  onClick={() => onToggleGoal(goal.id)}
                  className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    goal.completed ? 'bg-primary border-primary text-white' : 'border-slate-300 text-transparent hover:border-primary'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <span className={`text-sm flex-1 ${goal.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                  {goal.text}
                </span>
                <button 
                  onClick={() => onDeleteGoal(goal.id)}
                  className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={handleAddGoal} className="p-3 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="Add new goal..."
              className="flex-1 text-sm border-none bg-slate-100 rounded-lg px-3 focus:ring-2 focus:ring-primary/50 outline-none"
            />
            <button 
              type="submit"
              className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};