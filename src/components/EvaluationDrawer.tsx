import React, { useState, useEffect } from 'react';
import {
  EvalRecord,
  getEvaluationLogs,
  updateEvaluationRecord,
  exportEvaluationCSV,
  StoryEvalRecord,
  getStoryEvaluations,
  updateStoryRating,
  exportStoryEvaluationsCSV,
} from '../utils/db';
import { CloseThickIcon } from './CricketIcons';

interface EvaluationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EvaluationDrawer: React.FC<EvaluationDrawerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'story'>('voice');
  const [voiceLogs, setVoiceLogs] = useState<EvalRecord[]>([]);
  const [storyLogs, setStoryLogs] = useState<StoryEvalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAllLogs();
    }
  }, [isOpen]);

  const loadAllLogs = async () => {
    setLoading(true);
    const [vData, sData] = await Promise.all([getEvaluationLogs(), getStoryEvaluations()]);
    setVoiceLogs(vData);
    setStoryLogs(sData);
    setLoading(false);
  };

  const handleUpdateGroundTruth = async (id: string, text: string, isCorrect?: boolean) => {
    await updateEvaluationRecord(id, text, isCorrect);
    setVoiceLogs(prev => prev.map(l => (l.id === id ? { ...l, groundTruthText: text, isCorrect } : l)));
  };

  const handleUpdateStoryRating = async (id: string, rating: number, notes?: string) => {
    await updateStoryRating(id, rating, notes);
    setStoryLogs(prev => prev.map(s => (s.id === id ? { ...s, manualRating: rating, notes: notes ?? s.notes } : s)));
  };

  const handleDownloadVoiceCSV = async () => {
    const csvContent = await exportEvaluationCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scorecall_voice_evaluations_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadStoryCSV = async () => {
    const csvContent = await exportStoryEvaluationsCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scorecall_story_evaluations_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-[#FAF7F0] border-4 border-[#191C18] rounded-xl flex flex-col max-h-[92vh] shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#191C18] text-[#F3EFE6] px-4 py-3 flex items-center justify-between border-b-2 border-[#191C18] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-[#FFB800] rounded-xs" />
              <h2 className="font-display text-2xl tracking-wide uppercase">Evaluation & Accuracy Lab</h2>
            </div>
            <p className="text-[11px] text-[#A69E8E]">
              Benchmark Voice Parsing & Story Generation for your project report
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white press-action">
            <CloseThickIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 bg-[#EAE4D5] border-b-2 border-[#191C18] flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-1.5 rounded-md font-display text-base tracking-wide border-2 border-[#191C18] press-action flex items-center justify-center gap-1.5 ${
              activeTab === 'voice' ? 'bg-[#D32F1E] text-white shadow-xs' : 'bg-white text-[#191C18]'
            }`}
          >
            <span>VOICE PARSER ({voiceLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className={`flex-1 py-1.5 rounded-md font-display text-base tracking-wide border-2 border-[#191C18] press-action flex items-center justify-center gap-1.5 ${
              activeTab === 'story' ? 'bg-[#191C18] text-white shadow-xs' : 'bg-white text-[#191C18]'
            }`}
          >
            <span>STORY GENERATOR ({storyLogs.length})</span>
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          {loading ? (
            <p className="text-gray-500 italic">Loading datasets from IndexedDB...</p>
          ) : activeTab === 'voice' ? (
            /* Voice Parser Evaluations */
            voiceLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-white border border-[#D5CEBC] rounded-lg">
                <p className="font-bold">No voice inputs logged yet.</p>
                <p className="text-[11px] mt-1">Speak into the mic or tap sample prompts on Live Scoring to populate.</p>
              </div>
            ) : (
              voiceLogs.map((log) => (
                <div key={log.id} className="bg-white border-2 border-[#191C18] rounded-lg p-3 space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.model === 'claude-haiku-5-5' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {log.model}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Transcript:</span>
                    <p className="font-bold text-sm text-[#191C18]">"{log.transcript}"</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Parsed JSON:</span>
                    <pre className="bg-[#F4EFE6] p-1.5 rounded border border-[#D8D0C0] text-[10px] font-mono overflow-x-auto text-[#191C18]">
                      {log.parsedJson}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#8F170C] block">Ground Truth:</span>
                    <input
                      type="text"
                      defaultValue={log.groundTruthText}
                      onBlur={(e) => handleUpdateGroundTruth(log.id, e.target.value, log.isCorrect)}
                      placeholder="Expected events..."
                      className="w-full bg-[#FAF7F0] border border-[#191C18] rounded px-2 py-1 text-xs text-[#191C18]"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-gray-600">Accuracy:</span>
                    <button
                      onClick={() => handleUpdateGroundTruth(log.id, log.groundTruthText, true)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold press-action ${
                        log.isCorrect === true ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 border'
                      }`}
                    >
                      ✓ Correct
                    </button>
                    <button
                      onClick={() => handleUpdateGroundTruth(log.id, log.groundTruthText, false)}
                      className={`px-2.5 py-0.5 rounded text-[11px] font-bold press-action ${
                        log.isCorrect === false ? 'bg-rose-600 text-white' : 'bg-gray-100 text-gray-600 border'
                      }`}
                    >
                      ✗ Error
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            /* Story Generator Evaluations */
            storyLogs.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-white border border-[#D5CEBC] rounded-lg">
                <p className="font-bold">No match stories logged yet.</p>
                <p className="text-[11px] mt-1">Open Match Summary & tap "Generate Match Story" to benchmark stories.</p>
              </div>
            ) : (
              storyLogs.map((story) => (
                <div key={story.id} className="bg-white border-2 border-[#191C18] rounded-lg p-3 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono text-gray-500">{new Date(story.timestamp).toLocaleTimeString()}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-[#EAE4D5] rounded text-[10px] font-bold uppercase">
                        {story.style.replace('_', ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        story.verificationStatus === 'checked' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {story.verificationStatus === 'checked' ? '✓ Checked' : '⚠ Review'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Generated Story:</span>
                    <p className="font-medium text-xs text-[#191C18] bg-[#F9F6EE] p-2 rounded border border-[#E0D8C8] leading-relaxed">
                      "{story.storyText}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block">Verification Summary:</span>
                    <p className="text-[11px] font-mono text-[#554E41]">{story.checkedFactsSummary}</p>
                  </div>

                  {/* Manual Rating Field (1-5 Stars) */}
                  <div className="pt-1 border-t border-[#ECE5D8] flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#191C18]">Manual Quality Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleUpdateStoryRating(story.id, star)}
                          className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs press-action ${
                            (story.manualRating || 0) >= star
                              ? 'bg-[#FFB800] text-[#191C18] border border-[#D99B00]'
                              : 'bg-gray-100 text-gray-400 border border-gray-200'
                          }`}
                        >
                          {star}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-[#EAE3D4] border-t-2 border-[#191C18] flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-gray-600">
            {activeTab === 'voice' ? `${voiceLogs.length} voice records` : `${storyLogs.length} story records`}
          </span>
          <div className="flex items-center gap-2">
            {activeTab === 'voice' ? (
              <button
                onClick={handleDownloadVoiceCSV}
                disabled={voiceLogs.length === 0}
                className="px-3.5 py-2 bg-[#191C18] text-white rounded-lg text-xs font-bold press-action shadow-xs"
              >
                Export Voice CSV
              </button>
            ) : (
              <button
                onClick={handleDownloadStoryCSV}
                disabled={storyLogs.length === 0}
                className="px-3.5 py-2 bg-[#191C18] text-white rounded-lg text-xs font-bold press-action shadow-xs"
              >
                Export Story CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-2 bg-white border border-[#191C18] rounded-lg text-xs font-bold press-action"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
