'use client';

import React from 'react';

interface AWAEssayEditorProps {
  value: string;
  onChange: (val: string) => void;
  promptText: string;
}

export const AWAEssayEditor: React.FC<AWAEssayEditorProps> = ({ value, onChange, promptText }) => {
  const wordCount = value && value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value ? value.length : 0;

  return (
    <div className="space-y-4">
      {/* Essay Prompt Box */}
      <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-5">
        <h3 className="font-bold text-xs uppercase text-amber-700 tracking-wider mb-2">Analyze an Issue Prompt</h3>
        <p className="text-base font-serif text-slate-800 leading-relaxed italic whitespace-pre-wrap">
          "{promptText || 'Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take.'}"
        </p>
      </div>

      {/* Editor Container */}
      <div className="border border-slate-300 rounded-xl bg-white shadow-sm overflow-hidden">
        {/* Editor Toolbar & Counter */}
        <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span className="font-bold tracking-wide">Essay Response Editor</span>
          <div className="flex items-center gap-4">
            <span className="bg-white px-3 py-1 border border-slate-300 rounded-md font-mono text-slate-800">Words: <strong className="text-pink-600">{wordCount}</strong></span>
            <span className="bg-white px-3 py-1 border border-slate-300 rounded-md font-mono text-slate-800">Chars: <strong className="text-pink-600">{charCount}</strong></span>
          </div>
        </div>

        {/* Textarea matching ETS specifications */}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type your essay response here..."
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          className="w-full h-96 p-5 text-sm font-mono text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20 resize-y leading-relaxed"
        />
      </div>
    </div>
  );
};

export default AWAEssayEditor;
