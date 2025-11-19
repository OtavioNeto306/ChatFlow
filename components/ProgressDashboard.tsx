import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend 
} from 'recharts';
import { UserProgress, Message } from '../types';
import { X, TrendingUp, BookOpen, Clock } from 'lucide-react';

interface ProgressDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  progress: UserProgress;
  messages: Message[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ isOpen, onClose, progress, messages }) => {
  if (!isOpen) return null;

  // Transform messages into chart data
  // Filter user messages that have feedback scores
  const scoreData = messages
    .filter(m => m.role === 'user' && m.feedback)
    .map((m, idx) => ({
      name: `Msg ${idx + 1}`,
      score: m.feedback?.proficiencyScore || 0,
    })).slice(-20); // Last 20 interactions

  // Mock vocabulary growth (just linear for demo based on msg count)
  const vocabData = [
    { name: 'Session 1', words: 10 },
    { name: 'Session 2', words: 25 },
    { name: 'Session 3', words: 45 },
    { name: 'Current', words: progress.vocabularyCount },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-secondary" />
            Learning Progress
          </h2>
          <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-700">Avg. Proficiency</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{progress.averageProficiency.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 mt-1">Based on recent messages</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-500 rounded-lg text-white">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-700">Vocabulary</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{progress.vocabularyCount}</p>
              <p className="text-xs text-slate-500 mt-1">Unique words used</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500 rounded-lg text-white">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-slate-700">Sessions</h3>
              </div>
              <p className="text-3xl font-bold text-slate-900">{progress.sessionsCompleted}</p>
              <p className="text-xs text-slate-500 mt-1">Total learning sessions</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Proficiency Trend</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#4f46e5" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Vocabulary Growth</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={vocabData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip cursor={{fill: '#f1f5f9'}} />
                    <Bar dataKey="words" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Recent Activity Log */}
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Learning Journal (Recent)</h3>
            <div className="space-y-3">
              {scoreData.slice().reverse().slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">Practice Interaction {scoreData.length - i}</span>
                  <span className={`font-medium px-2 py-1 rounded ${
                    item.score > 80 ? 'bg-green-100 text-green-700' : 
                    item.score > 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    Score: {item.score}
                  </span>
                </div>
              ))}
              {scoreData.length === 0 && <p className="text-slate-500 italic">No interactions yet.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};