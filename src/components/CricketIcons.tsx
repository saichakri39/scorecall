import React from 'react';

export function BatIcon({ className = "w-5 h-5", strokeWidth = 2.5 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {/* Handle */}
      <path d="M4 20L8 16" />
      <path d="M3 21L5 19" />
      {/* Grip wraps */}
      <path d="M5.5 18.5L7 17" />
      {/* Blade */}
      <path d="M7.5 15.5L16.5 6.5C18 5 20 5 21 6C22 7 22 9 20.5 10.5L11.5 19.5L7.5 15.5Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M14 9L18 13" />
    </svg>
  );
}

export function StumpsIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      {/* Bails */}
      <rect x="4" y="3" width="7" height="2" rx="0.5" />
      <rect x="13" y="3" width="7" height="2" rx="0.5" />
      {/* 3 Stumps */}
      <rect x="5" y="5" width="2" height="16" rx="0.5" />
      <rect x="11" y="5" width="2" height="16" rx="0.5" />
      <rect x="17" y="5" width="2" height="16" rx="0.5" />
      {/* Ground chalk line */}
      <rect x="2" y="20" width="20" height="2" rx="1" />
    </svg>
  );
}

export function TapeBallIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" fill="currentColor" fillOpacity="0.1" />
      {/* Crossed tape strip across tennis ball */}
      <path d="M5.5 8.5C9 10 14 10 18.5 8.5" strokeWidth="2.5" stroke="#D32F1E" strokeLinecap="round" />
      <path d="M5.5 15.5C9 14 14 14 18.5 15.5" strokeWidth="2.5" stroke="#D32F1E" strokeLinecap="round" />
      <path d="M12 3C10.5 7.5 10.5 16.5 12 21" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
  );
}

export function MicIcon({ className = "w-6 h-6", isRecording = false }: { className?: string; isRecording?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" fill={isRecording ? "#D32F1E" : "currentColor"} fillOpacity={isRecording ? "1" : "0.2"} />
      <path d="M5 10C5 13.866 8.134 17 12 17C15.866 17 19 13.866 19 10" />
      <line x1="12" y1="17" x2="12" y2="21" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  );
}

export function UndoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9H15C18.3137 9 21 11.6863 21 15C21 18.3137 18.3137 21 15 21H8" />
      <path d="M7 5L3 9L7 13" />
    </svg>
  );
}

export function SwapIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4M7 4L3 8M7 4L11 8" />
      <path d="M17 8V20M17 20L21 16M17 20L13 16" />
    </svg>
  );
}

export function BoundaryIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function CheckThickIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CloseThickIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SpeakerIcon({ className = "w-5 h-5", isMuted = false }: { className?: string; isMuted?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" fillOpacity="0.2" />
      {isMuted ? (
        <>
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </>
      ) : (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      )}
    </svg>
  );
}

export function SunIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" fill="currentColor" fillOpacity="0.2" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
