import React, { useState, useEffect } from 'react';
import { X, Save, Key } from 'lucide-react';
import { ApiKeys, Provider } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSaveKeys: (keys: ApiKeys) => void;
  currentProvider: Provider;
  onSetProvider: (p: Provider) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  onSaveKeys,
  currentProvider,
  onSetProvider,
}) => {
  const [localKeys, setLocalKeys] = useState<ApiKeys>(apiKeys);

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);

  if (!isOpen) return null;

  const handleChange = (key: keyof ApiKeys, value: string) => {
    setLocalKeys(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSaveKeys(localKeys);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Active Provider</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(Provider).map((prov) => (
                <button
                  key={prov}
                  onClick={() => onSetProvider(prov)}
                  className={`px-4 py-2 rounded-lg border text-left transition-all ${
                    currentProvider === prov
                      ? 'bg-primary/10 border-primary text-primary font-semibold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">API Keys</h3>
            <p className="text-xs text-slate-500">Keys are stored locally in your browser.</p>
            
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Gemini API Key (Google)</label>
              <input
                type="password"
                value={localKeys.gemini || ''}
                onChange={(e) => handleChange('gemini', e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Groq API Key (Free/Fast)</label>
              <input
                type="password"
                value={localKeys.groq || ''}
                onChange={(e) => handleChange('groq', e.target.value)}
                placeholder="gsk_..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={localKeys.openai || ''}
                onChange={(e) => handleChange('openai', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">DeepSeek API Key</label>
              <input
                type="password"
                value={localKeys.deepseek || ''}
                onChange={(e) => handleChange('deepseek', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

        </div>

        <div className="p-6 border-t bg-slate-50 rounded-b-2xl">
          <button
            onClick={handleSave}
            className="w-full flex justify-center items-center gap-2 bg-primary hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary/30"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};