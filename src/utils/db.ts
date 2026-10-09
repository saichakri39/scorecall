/**
 * IndexedDB storage layer for Tappa Gully Cricket Scorer.
 * Persistent offline storage for:
 * - Current ongoing match state (auto-saved after every single ball)
 * - Finished match history
 * - Evaluation logs for project accuracy report (transcript, parsed JSON, ground truth)
 * - Story evaluation logs (style, verification pass result, manual ratings)
 */

import { MatchState } from '../types/cricket';

export interface EvalRecord {
  id: string;
  timestamp: number;
  transcript: string;
  model: string; // 'claude-haiku-5-5' | 'offline-rule-based'
  parsedJson: string;
  groundTruthText: string;
  isCorrect?: boolean;
}

export interface StoryEvalRecord {
  id: string;
  timestamp: number;
  matchName: string;
  style: string;
  storyText: string;
  verificationStatus: 'checked' | 'needs_review';
  checkedFactsSummary: string;
  manualRating?: number; // 1 to 5 stars
  notes?: string;
}

const DB_NAME = 'tappa_gully_cricket_db';
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;

      if (!db.objectStoreNames.contains('active_match')) {
        db.createObjectStore('active_match', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('matches_history')) {
        db.createObjectStore('matches_history', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('eval_logs')) {
        db.createObjectStore('eval_logs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('story_evals')) {
        db.createObjectStore('story_evals', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

// 1. Current Match State
export async function saveActiveMatch(state: MatchState): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('active_match', 'readwrite');
    const store = tx.objectStore('active_match');
    store.put({ id: 'current_match', state, updatedAt: Date.now() });
  } catch (err) {
    try {
      localStorage.setItem('tappa_active_match_backup', JSON.stringify(state));
    } catch {}
  }
}

export async function getActiveMatch(): Promise<MatchState | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('active_match', 'readonly');
      const store = tx.objectStore('active_match');
      const req = store.get('current_match');
      req.onsuccess = () => {
        if (req.result && req.result.state) {
          resolve(req.result.state);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    try {
      const backup = localStorage.getItem('tappa_active_match_backup');
      return backup ? JSON.parse(backup) : null;
    } catch {
      return null;
    }
  }
}

// 2. Matches History
export async function saveMatchToHistory(state: MatchState): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('matches_history', 'readwrite');
    const store = tx.objectStore('matches_history');
    const record = {
      id: `match_${Date.now()}`,
      matchName: state.matchName,
      battingTeam: state.battingTeam,
      bowlingTeam: state.bowlingTeam,
      score: state.score,
      wickets: state.wickets,
      overs: `${state.oversCompleted}.${state.ballsInCurrentOver}`,
      date: new Date().toLocaleDateString(),
      fullState: state,
    };
    store.put(record);
  } catch (e) {
    console.error('Failed to save match history to IDB', e);
  }
}

export async function getMatchHistory(): Promise<any[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('matches_history', 'readonly');
      const store = tx.objectStore('matches_history');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// 3. Evaluation Logs (Voice Parser)
export async function logEvaluation(record: Omit<EvalRecord, 'id' | 'timestamp'>): Promise<string> {
  const id = `eval_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const item: EvalRecord = {
    ...record,
    id,
    timestamp: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction('eval_logs', 'readwrite');
    const store = tx.objectStore('eval_logs');
    store.put(item);
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem('tappa_eval_logs_backup') || '[]');
      existing.push(item);
      localStorage.setItem('tappa_eval_logs_backup', JSON.stringify(existing));
    } catch {}
  }
  return id;
}

export async function getEvaluationLogs(): Promise<EvalRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('eval_logs', 'readonly');
      const store = tx.objectStore('eval_logs');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a: any, b: any) => b.timestamp - a.timestamp));
      req.onerror = () => resolve([]);
    });
  } catch {
    try {
      return JSON.parse(localStorage.getItem('tappa_eval_logs_backup') || '[]');
    } catch {
      return [];
    }
  }
}

export async function updateEvaluationRecord(id: string, groundTruth: string, isCorrect?: boolean): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('eval_logs', 'readwrite');
    const store = tx.objectStore('eval_logs');
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        const updated = {
          ...req.result,
          groundTruthText: groundTruth,
          isCorrect: isCorrect !== undefined ? isCorrect : req.result.isCorrect,
        };
        store.put(updated);
      }
    };
  } catch {}
}

export async function exportEvaluationCSV(): Promise<string> {
  const logs = await getEvaluationLogs();
  const headers = ['ID', 'Timestamp', 'Spoken Transcript', 'Parser Engine', 'Parsed JSON Events', 'Ground Truth Events', 'Marked Correct'];
  const rows = logs.map(l => [
    l.id,
    new Date(l.timestamp).toISOString(),
    `"${l.transcript.replace(/"/g, '""')}"`,
    l.model,
    `"${l.parsedJson.replace(/"/g, '""')}"`,
    `"${(l.groundTruthText || '').replace(/"/g, '""')}"`,
    l.isCorrect === true ? 'TRUE' : l.isCorrect === false ? 'FALSE' : 'UNMARKED',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

// 4. Story Evaluations (Story Generator)
export async function logStoryEvaluation(record: Omit<StoryEvalRecord, 'id' | 'timestamp'>): Promise<string> {
  const id = `story_eval_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const item: StoryEvalRecord = {
    ...record,
    id,
    timestamp: Date.now(),
  };

  try {
    const db = await openDB();
    const tx = db.transaction('story_evals', 'readwrite');
    const store = tx.objectStore('story_evals');
    store.put(item);
  } catch {
    try {
      const existing = JSON.parse(localStorage.getItem('tappa_story_evals_backup') || '[]');
      existing.push(item);
      localStorage.setItem('tappa_story_evals_backup', JSON.stringify(existing));
    } catch {}
  }
  return id;
}

export async function getStoryEvaluations(): Promise<StoryEvalRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction('story_evals', 'readonly');
      const store = tx.objectStore('story_evals');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result || []).sort((a: any, b: any) => b.timestamp - a.timestamp));
      req.onerror = () => resolve([]);
    });
  } catch {
    try {
      return JSON.parse(localStorage.getItem('tappa_story_evals_backup') || '[]');
    } catch {
      return [];
    }
  }
}

export async function updateStoryRating(id: string, rating: number, notes?: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('story_evals', 'readwrite');
    const store = tx.objectStore('story_evals');
    const req = store.get(id);
    req.onsuccess = () => {
      if (req.result) {
        const updated = {
          ...req.result,
          manualRating: rating,
          notes: notes !== undefined ? notes : req.result.notes,
        };
        store.put(updated);
      }
    };
  } catch {}
}

export async function exportStoryEvaluationsCSV(): Promise<string> {
  const stories = await getStoryEvaluations();
  const headers = ['ID', 'Timestamp', 'Match Name', 'Story Style', 'Verification Status', 'Verified Facts Summary', 'Generated Story Text', 'Manual Rating (1-5)', 'Notes'];
  const rows = stories.map(s => [
    s.id,
    new Date(s.timestamp).toISOString(),
    `"${(s.matchName || '').replace(/"/g, '""')}"`,
    s.style,
    s.verificationStatus,
    `"${(s.checkedFactsSummary || '').replace(/"/g, '""')}"`,
    `"${(s.storyText || '').replace(/"/g, '""')}"`,
    s.manualRating || 'UNRATED',
    `"${(s.notes || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
